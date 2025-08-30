const express = require('express');
const ReservationModel = require('../models/Reservation');
const ClientModel = require('../models/Client');
const { validateReservationData, validateClientData } = require('../middleware/auth');
const { executeQuery } = require('../../config/database');
const TelegramService = require('../services/TelegramService');
const EmailService = require('../services/EmailService');
const crypto = require('crypto');
const router = express.Router();

// Créer une nouvelle réservation (avec création de client si nécessaire)
router.post('/', validateClientData, validateReservationData, async (req, res) => {
    try {
        console.log('Received reservation data:', req.body);
        
        const {
            // Données client
            nom, prenom, email, telephone, date_naissance, adresse, notes,
            // Données réservation
            service_id, service_variant_id, package_id, date_reservation, heure_debut, notes_client,
            // Session ID pour conversion de brouillon
            session_id
        } = req.body;

        console.log('Extracted data:', {
            nom, prenom, email, telephone, service_id, date_reservation, heure_debut
        });

        // Check if the client exists by phone + name combination OR by email
        let client = null;
        if (telephone && nom && prenom) {
            client = await executeQuery(
                'SELECT * FROM clients WHERE (telephone = ? AND nom = ? AND prenom = ?) OR email = ?',
                [telephone, nom, prenom, email]
            );
        } else if (email) {
            // Fallback to email-only check if phone/name not provided
            client = await executeQuery(
                'SELECT * FROM clients WHERE email = ?',
                [email]
            );
        }
        
        let client_id;

        if (client && client.length > 0) {
            client_id = client[0].id;
            console.log('Existing client found:', client_id);
            // Update client information if needed
            await ClientModel.updateClient(client_id, {
                nom, prenom, email, telephone, date_naissance, adresse, notes
            });
        } else {
            console.log('Creating new client...');
            // Create a new client
            client_id = await ClientModel.createClient({
                nom, prenom, email, telephone, date_naissance, adresse, notes
            });
            console.log('New client created:', client_id);
        }

        // Récupérer les détails du service pour calculer le prix et la durée
        const service = await executeQuery('SELECT prix, duree FROM services WHERE id = ?', [service_id]);
        if (!service.length) {
            console.error('Service not found:', service_id);
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        console.log('Service found:', service[0]);

        let prix_service = service[0].prix;
        let duree_service = service[0].duree;

        // Si une variante est sélectionnée, utiliser son prix
        if (service_variant_id) {
            const variant = await executeQuery('SELECT prix FROM service_variants WHERE id = ?', [service_variant_id]);
            if (variant.length) {
                prix_service = variant[0].prix;
            }
        }

        // Calculer l'heure de fin
        const [heures, minutes] = heure_debut.split(':');
        const debutDate = new Date();
        debutDate.setHours(parseInt(heures), parseInt(minutes), 0);
        debutDate.setMinutes(debutDate.getMinutes() + duree_service);
        const heure_fin = debutDate.toTimeString().slice(0, 5);

        console.log('Calculated end time:', heure_fin);

        // Validation: ensure end time is different from start time
        if (heure_fin === heure_debut) {
            console.error('Invalid time calculation: end time equals start time');
            return res.status(400).json({ 
                message: 'Erreur de calcul d\'horaire. Veuillez contacter l\'administration.' 
            });
        }

        // Vérifier la disponibilité du créneau
        const isAvailable = await ReservationModel.checkAvailability(
            date_reservation, heure_debut, heure_fin
        );

        if (!isAvailable) {
            console.error('Time slot not available');
            return res.status(400).json({ 
                message: 'Ce créneau n\'est pas disponible. Veuillez choisir un autre horaire.' 
            });
        }

        console.log('Time slot available, checking for existing draft...');

        let reservationId;
        let convertedFromDraft = false;

        // Check if there's an existing draft for this session
        if (session_id) {
            const existingDraft = await executeQuery(
                'SELECT id FROM reservations WHERE session_id = ? AND statut = "draft"',
                [session_id]
            );

            if (existingDraft.length > 0) {
                console.log('Found existing draft, converting to final reservation...');
                
                // Update the draft to become a final reservation
                await executeQuery(`
                    UPDATE reservations 
                    SET client_id = ?,
                        statut = 'en_attente',
                        reservation_status = 'reserved',
                        prix_service = ?,
                        prix_final = ?,
                        session_id = NULL,
                        date_modification = NOW()
                    WHERE id = ?
                `, [client_id, prix_service, prix_service, existingDraft[0].id]);
                
                reservationId = existingDraft[0].id;
                convertedFromDraft = true;
                console.log('Draft converted to final reservation:', reservationId);
            }
        }

        // If no draft was converted, create a new reservation
        if (!reservationId) {
            console.log('Creating new reservation...');
            // Créer la réservation avec status 'reserved' (réelle réservation)
            reservationId = await ReservationModel.createReservation({
                client_id,
                service_id,
                service_variant_id,
                package_id,
                date_reservation,
                heure_debut,
                heure_fin,
                notes_client,
                prix_service,
                prix_addons: 0,
                prix_final: prix_service,
                statut: 'en_attente',
                reservation_status: 'reserved',
                // Add client information
                client_nom: nom,
                client_prenom: prenom,
                client_telephone: telephone,
                client_email: email,
                session_id: null
            });
        }

        console.log('Reservation created:', reservationId);

        // Generate initial verification code for pre-confirmation
        const initialVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const initialVerificationToken = require('crypto').randomBytes(32).toString('hex');
        
        await executeQuery(
            'UPDATE reservations SET verification_code = ?, verification_token = ? WHERE id = ?',
            [initialVerificationCode, initialVerificationToken, reservationId]
        );

        // Récupérer les détails de la réservation créée
        const reservation = await ReservationModel.getReservationById(reservationId);

        console.log('Reservation details:', reservation);

        // Get client and service details for notifications and response
        const clientData = await executeQuery('SELECT * FROM clients WHERE id = ?', [client_id]);
        const serviceDetails = await executeQuery('SELECT * FROM services WHERE id = ?', [service_id]);

        // Send Telegram notification for new reservation
        try {
            if (clientData.length && serviceDetails.length) {
                console.log('📱 Sending Telegram notification...');
                const telegramData = {
                    reservation: reservation,
                    client: clientData[0],
                    service: serviceDetails[0]
                };
                
                const telegramResult = await TelegramService.sendNewReservationNotification(telegramData);
                console.log('📱 Telegram notification result:', telegramResult);
                console.log('✅ Telegram notification sent for reservation:', reservationId);
            } else {
                console.log('❌ Missing client or service data for Telegram notification');
            }
        } catch (telegramError) {
            console.error('❌ Error sending Telegram notification:', telegramError);
            // Don't fail the reservation creation if Telegram fails
        }

        // Send confirmation email to client
        // NOTE: Email verification is now handled by the pre-confirmation page
        // Removing automatic email sending to prevent double emails
        /*
        try {
            if (clientData.length && serviceDetails.length && clientData[0].email) {
                // Generate 6-digit verification code for the reservation
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Store verification code in reservation (you may want to add this column)
                await executeQuery(
                    'UPDATE reservations SET verification_code = ? WHERE id = ?',
                    [verificationCode, reservationId]
                );
                
                await EmailService.sendReservationConfirmation(
                    clientData[0].email,
                    reservation,
                    clientData[0],
                    serviceDetails[0],
                    verificationCode
                );
                console.log('Confirmation email sent for reservation:', reservationId);
            }
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail the reservation creation if email fails
        }
        */

        res.status(201).json({
            message: 'Réservation créée avec succès',
            reservation: {
                ...reservation,
                service: serviceDetails.length ? serviceDetails[0] : null,
                client: {
                    nom: nom,
                    prenom: prenom,
                    email: email,
                    telephone: telephone
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la création de la réservation:', error);
        res.status(500).json({ 
            message: 'Erreur interne du serveur',
            error: error.message 
        });
    }
});

// Send verification email for reservation confirmation
router.post('/:id/send-verification', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get reservation details
        const reservation = await ReservationModel.getReservationById(id);
        if (!reservation) {
            return res.status(404).json({ message: 'Réservation non trouvée' });
        }

        // Get client and service details
        const clientData = await executeQuery('SELECT * FROM clients WHERE id = ?', [reservation.client_id]);
        const serviceDetails = await executeQuery('SELECT * FROM services WHERE id = ?', [reservation.service_id]);
        
        if (clientData.length && serviceDetails.length && clientData[0].email) {
            // Check if verification code already exists, if not generate one
            let verificationCode = reservation.verification_code;
            let verificationToken = reservation.verification_token;
            
            if (!verificationCode) {
                verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            }
            
            if (!verificationToken) {
                verificationToken = require('crypto').randomBytes(32).toString('hex');
            }
            
            // Only update if we generated new values
            if (!reservation.verification_code || !reservation.verification_token) {
                await executeQuery(
                    'UPDATE reservations SET verification_code = ?, verification_token = ? WHERE id = ?',
                    [verificationCode, verificationToken, id]
                );
            }
            
            // Send email with both code and link
            await EmailService.sendReservationVerification(
                clientData[0].email,
                reservation,
                clientData[0],
                serviceDetails[0],
                verificationCode,
                verificationToken
            );
            
            res.json({ 
                success: true, 
                message: 'Email de vérification envoyé' 
            });
        } else {
            res.status(400).json({ message: 'Informations client incomplètes' });
        }
    } catch (error) {
        console.error('Error sending verification email:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
    }
});

// Verify reservation with code
router.post('/:id/verify-code', async (req, res) => {
    try {
        const { id } = req.params;
        const { code } = req.body;
        
        const reservation = await executeQuery(
            'SELECT verification_code FROM reservations WHERE id = ?',
            [id]
        );
        
        if (!reservation.length) {
            return res.status(404).json({ success: false, message: 'Réservation non trouvée' });
        }
        
        if (reservation[0].verification_code === code) {
            // Mark as confirmed
            await executeQuery(
                'UPDATE reservations SET statut = "confirmee", reservation_status = "confirmed" WHERE id = ?',
                [id]
            );
            
            // Send Telegram notification for confirmed reservation
            try {
                console.log('📱 Sending Telegram confirmation notification...');
                const fullReservation = await ReservationModel.getReservationById(id);
                const client = await executeQuery('SELECT * FROM clients WHERE id = ?', [fullReservation.client_id]);
                const service = await executeQuery('SELECT * FROM services WHERE id = ?', [fullReservation.service_id]);
                
                if (client.length && service.length) {
                    await TelegramService.sendReservationConfirmationNotification({
                        reservation: fullReservation,
                        client: client[0],
                        service: service[0]
                    });
                    console.log('✅ Telegram confirmation notification sent');
                }
            } catch (telegramError) {
                console.error('❌ Error sending Telegram confirmation notification:', telegramError);
            }
            
            res.json({ 
                success: true, 
                message: 'Réservation confirmée avec succès' 
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Code de vérification incorrect' 
            });
        }
    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ success: false, message: 'Erreur de vérification' });
    }
});

// Verify reservation with link token
router.get('/verify-link/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const reservation = await executeQuery(
            'SELECT id FROM reservations WHERE verification_token = ?',
            [token]
        );
        
        if (!reservation.length) {
            return res.status(404).send(`
                <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h2 style="color: #dc3545;">Lien de vérification invalide</h2>
                        <p>Ce lien n'est pas valide ou a expiré.</p>
                    </body>
                </html>
            `);
        }
        
        // Mark as confirmed
        await executeQuery(
            'UPDATE reservations SET statut = "confirmee", reservation_status = "confirmed", verification_token = NULL WHERE id = ?',
            [reservation[0].id]
        );
        
        res.send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2 style="color: #28a745;">✅ Réservation Confirmée!</h2>
                    <p>Votre réservation a été confirmée avec succès.</p>
                    <p>Nous avons hâte de vous accueillir!</p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                       style="display: inline-block; margin-top: 20px; padding: 10px 20px; 
                              background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                        Retour au site
                    </a>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Error verifying link:', error);
        res.status(500).send('Erreur de vérification');
    }
});

// Récupérer une réservation par ID (pour confirmation)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await ReservationModel.getReservationById(id);

        if (!reservation) {
            return res.status(404).json({ message: 'Réservation non trouvée' });
        }

        res.json(reservation);
    } catch (error) {
        console.error('Erreur lors de la récupération de la réservation:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Vérifier la disponibilité d'un créneau
router.post('/check-availability', async (req, res) => {
    try {
        const { date_reservation, heure_debut, service_id } = req.body;

        if (!date_reservation || !heure_debut || !service_id) {
            return res.status(400).json({ 
                message: 'Date, heure de début et service requis' 
            });
        }

        // Récupérer la durée du service
        const service = await executeQuery('SELECT duree FROM services WHERE id = ?', [service_id]);
        if (!service.length) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        // Calculer l'heure de fin
        const [heures, minutes] = heure_debut.split(':');
        const debutDate = new Date();
        debutDate.setHours(parseInt(heures), parseInt(minutes), 0);
        debutDate.setMinutes(debutDate.getMinutes() + service[0].duree);
        const heure_fin = debutDate.toTimeString().slice(0, 5);

        // Vérifier la disponibilité
        const isAvailable = await ReservationModel.checkAvailability(
            date_reservation, heure_debut, heure_fin
        );

        res.json({
            available: isAvailable,
            heure_fin,
            message: isAvailable ? 'Créneau disponible' : 'Créneau non disponible'
        });

    } catch (error) {
        console.error('Erreur lors de la vérification de disponibilité:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer les créneaux disponibles pour une date et un service
router.get('/available-slots/:date/:serviceId', async (req, res) => {
    try {
        const { date, serviceId } = req.params;

        // Récupérer la durée du service
        const service = await executeQuery('SELECT duree FROM services WHERE id = ?', [serviceId]);
        if (!service.length) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        // Vérifier si c'est un jour d'ouverture
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const dayOfWeek = dayNames[new Date(date).getDay()];

        const openingHours = await executeQuery(`
            SELECT heure_debut, heure_fin 
            FROM creneaux_horaires 
            WHERE jour_semaine = ? AND actif = TRUE
        `, [dayOfWeek]);

        if (!openingHours.length) {
            return res.json({ 
                available: false, 
                slots: [], 
                message: 'Fermé ce jour-là' 
            });
        }

        // Vérifier les fermetures exceptionnelles
        const fermetures = await executeQuery(`
            SELECT * FROM fermetures_exceptionnelles 
            WHERE date_fermeture = ?
        `, [date]);

        if (fermetures.length && fermetures[0].toute_journee) {
            return res.json({ 
                available: false, 
                slots: [], 
                message: 'Fermé exceptionnellement' 
            });
        }

        // Récupérer les réservations existantes
        const reservations = await executeQuery(`
            SELECT heure_debut, heure_fin 
            FROM reservations 
            WHERE date_reservation = ? AND statut NOT IN ('annulee', 'no_show')
            ORDER BY heure_debut
        `, [date]);

        // Générer les créneaux disponibles (implémentation simplifiée)
        const slots = [];
        const { heure_debut: openTime, heure_fin: closeTime } = openingHours[0];
        const serviceDuration = service[0].duree;

        // Convertir les heures en minutes pour faciliter les calculs
        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const minutesToTime = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        const openMinutes = timeToMinutes(openTime);
        const closeMinutes = timeToMinutes(closeTime);
        const slotDuration = 15; // Créneaux de 15 minutes

        for (let currentTime = openMinutes; currentTime + serviceDuration <= closeMinutes; currentTime += slotDuration) {
            const slotStart = minutesToTime(currentTime);
            const slotEnd = minutesToTime(currentTime + serviceDuration);

            // Vérifier si ce créneau est libre
            const isAvailable = await ReservationModel.checkAvailability(date, slotStart, slotEnd);
            
            if (isAvailable) {
                slots.push({
                    heure_debut: slotStart,
                    heure_fin: slotEnd
                });
            }
        }

        res.json({
            available: slots.length > 0,
            slots,
            date,
            service_duree: serviceDuration
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des créneaux disponibles:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Annuler une réservation (avec email de confirmation)
router.put('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email requis pour l\'annulation' });
        }

        // Vérifier que la réservation existe et appartient à ce client
        const reservation = await ReservationModel.getReservationById(id);
        
        if (!reservation) {
            return res.status(404).json({ message: 'Réservation non trouvée' });
        }

        if (reservation.client_email !== email) {
            return res.status(403).json({ message: 'Email incorrect' });
        }

        if (['terminee', 'annulee'].includes(reservation.statut)) {
            return res.status(400).json({ message: 'Cette réservation ne peut plus être annulée' });
        }

        // Vérifier le délai d'annulation (24h)
        const now = new Date();
        const reservationDate = new Date(reservation.date_reservation + ' ' + reservation.heure_debut);
        const timeDiff = reservationDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);

        if (hoursDiff < 24) {
            return res.status(400).json({ 
                message: 'Les annulations doivent être effectuées au moins 24h à l\'avance' 
            });
        }

        // Annuler la réservation
        await ReservationModel.updateReservationStatus(id, 'annulee', 'Annulée par le client');

        // Send Telegram notification for cancellation
        try {
            const updatedReservation = await ReservationModel.getReservationById(id);
            if (updatedReservation) {
                await TelegramService.sendReservationUpdateNotification(updatedReservation, 'cancelled');
                console.log('Telegram cancellation notification sent for reservation:', id);
            }
        } catch (telegramError) {
            console.error('Error sending Telegram cancellation notification:', telegramError);
        }

        res.json({ message: 'Réservation annulée avec succès' });

    } catch (error) {
        console.error('Erreur lors de l\'annulation de la réservation:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Sauvegarder un brouillon de réservation (auto-save)
router.post('/save-draft', async (req, res) => {
    try {
        const {
            sessionId,
            nom = '',
            prenom = '',
            email = '',
            telephone = '',
            service_id = null,
            date_reservation = null,
            heure_reservation = null,
            notes = ''
        } = req.body;

        // Session ID is required
        if (!sessionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de session requis' 
            });
        }

        // Phone number is minimum requirement for saving
        if (!telephone || telephone.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Le numéro de téléphone est requis pour sauvegarder un brouillon' 
            });
        }

        // Check if a draft already exists for this session (one draft per session)
        const existingDraft = await executeQuery(
            'SELECT id FROM reservations WHERE session_id = ? AND statut = "draft"',
            [sessionId]
        );

        if (existingDraft.length > 0) {
            // UPDATE the same draft (one draft per session)
            await executeQuery(`
                UPDATE reservations 
                SET client_nom = ?, 
                    client_prenom = ?,
                    client_telephone = ?,
                    client_email = ?,
                    service_id = ?,
                    date_reservation = ?,
                    heure_debut = ?,
                    heure_fin = ?,
                    notes_client = ?,
                    date_modification = NOW()
                WHERE id = ?
            `, [
                nom.trim(),
                prenom.trim(),
                telephone.trim(),
                email.trim(),
                service_id || 1,
                date_reservation || '2025-07-15',
                heure_reservation || '09:00:00',
                heure_reservation ? 
                    new Date(`1970-01-01T${heure_reservation}:00`).toTimeString().slice(0, 8) : 
                    '09:30:00',
                notes.trim(),
                existingDraft[0].id
            ]);
        } else {
            // CREATE new draft (first time for this session)
            await executeQuery(`
                INSERT INTO reservations 
                (client_id, service_id, date_reservation, heure_debut, heure_fin, 
                 statut, reservation_status, prix_service, prix_final,
                 client_nom, client_prenom, client_telephone, client_email,
                 notes_client, session_id)
                VALUES (NULL, ?, ?, ?, ?, 'draft', 'draft', 0, 0, ?, ?, ?, ?, ?, ?)
            `, [
                service_id || 1,
                date_reservation || '2025-07-15',
                heure_reservation || '09:00:00',
                heure_reservation ? 
                    new Date(`1970-01-01T${heure_reservation}:00`).toTimeString().slice(0, 8) : 
                    '09:30:00',
                nom.trim(),
                prenom.trim(),
                telephone.trim(),
                email.trim(),
                notes.trim(),
                sessionId
            ]);
        }

        res.json({ 
            success: true, 
            sessionId: sessionId,
            message: 'Brouillon mis à jour (un seul par session)'
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde du brouillon:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la sauvegarde du brouillon' 
        });
    }
});

// Récupérer un brouillon de réservation
router.get('/get-draft/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const draft = await executeQuery(
            'SELECT notes_client FROM reservations WHERE session_id = ? AND statut = "draft" LIMIT 1',
            [sessionId]
        );

        if (draft.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Aucun brouillon trouvé' 
            });
        }

        // Extract JSON data from notes_client
        const notesData = draft[0].notes_client;
        
        if (!notesData) {
            return res.status(404).json({ 
                success: false, 
                message: 'Données du brouillon manquantes' 
            });
        }
        
        let draftData;
        try {
            const parts = notesData.split('|');
            const jsonPart = parts.length > 1 ? parts[1] : notesData;
            
            if (!jsonPart || jsonPart === 'undefined') {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Données JSON du brouillon invalides' 
                });
            }
            
            draftData = JSON.parse(jsonPart);
        } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            return res.status(400).json({ 
                success: false, 
                message: 'Format de données invalide' 
            });
        }
        
        res.json({ 
            success: true, 
            data: draftData
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du brouillon:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération du brouillon' 
        });
    }
});

// Supprimer un brouillon
router.delete('/delete-draft/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        await executeQuery(
            'DELETE FROM reservations WHERE session_id = ? AND statut = "draft"',
            [sessionId]
        );

        res.json({ 
            success: true, 
            message: 'Brouillon supprimé avec succès' 
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du brouillon:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la suppression du brouillon' 
        });
    }
});

// GET ALL DRAFT RESERVATIONS (for spa staff to follow up)
router.get('/admin/drafts', async (req, res) => {
    try {
        const drafts = await executeQuery(`
            SELECT 
                id,
                notes_client,
                service_id,
                date_reservation,
                heure_debut,
                date_creation,
                statut
            FROM reservations 
            WHERE statut = 'en_attente' AND notes_client LIKE '%DRAFT:%'
            ORDER BY date_creation DESC
        `);

        // Parse the client data from notes_client
        const parsedDrafts = drafts.map(draft => {
            try {
                const notesData = draft.notes_client;
                const jsonPart = notesData.split('|')[1];
                const clientData = JSON.parse(jsonPart);
                const sessionId = notesData.split('DRAFT:')[1].split('|')[0];
                
                return {
                    id: draft.id,
                    session_id: sessionId,
                    client_data: clientData,
                    service_id: draft.service_id,
                    date_reservation: draft.date_reservation,
                    heure_debut: draft.heure_debut,
                    date_creation: draft.date_creation,
                    statut: draft.statut
                };
            } catch (parseError) {
                console.error('Error parsing draft data:', parseError);
                return {
                    id: draft.id,
                    session_id: 'unknown',
                    client_data: { error: 'Unable to parse client data' },
                    service_id: draft.service_id,
                    date_reservation: draft.date_reservation,
                    heure_debut: draft.heure_debut,
                    date_creation: draft.date_creation,
                    statut: draft.statut
                };
            }
        });

        res.json({
            success: true,
            drafts: parsedDrafts,
            total: parsedDrafts.length
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des brouillons:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des brouillons' 
        });
    }
});

module.exports = router;
