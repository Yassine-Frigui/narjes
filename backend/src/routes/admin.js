const express = require('express');
const ReservationModel = require('../models/Reservation');
const { authenticateAdmin, requireRole } = require('../middleware/auth');
const { executeQuery } = require('../../config/database');
const TelegramService = require('../services/TelegramService');
const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticateAdmin);

// Dashboard - Statistiques générales
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        console.log('📊 Admin dashboard request:', { today, thisMonth });
        
        // NBrow Studio - Return mock dashboard data
        // This will be replaced with real database queries once the tables are properly set up
        const mockDashboardData = {
            rdv_aujourd_hui: 8,
            rdv_ce_mois: 45,
            ca_mois: 1875, // 45 appointments × avg 41.7€
            total_clients: 32,
            reservations_par_statut: [
                { statut: 'confirmee', nombre: 5 },
                { statut: 'en_attente', nombre: 2 },
                { statut: 'terminee', nombre: 1 }
            ],
            prochaines_reservations: [
                {
                    id: 1,
                    date_reservation: today,
                    heure_debut: '10:00',
                    heure_fin: '10:30',
                    statut: 'confirmee',
                    client_nom: 'Marie Dupont',
                    client_telephone: '+216 XX XXX XXX',
                    service_nom: 'Épilation Sourcils Classique',
                    duree: 30
                },
                {
                    id: 2,
                    date_reservation: today,
                    heure_debut: '14:00',
                    heure_fin: '14:45',
                    statut: 'confirmee',
                    client_nom: 'Fatma Ben Ali',
                    client_telephone: '+216 XX XXX XXY',
                    service_nom: 'Restructuration Sourcils',
                    duree: 45
                },
                {
                    id: 3,
                    date_reservation: today,
                    heure_debut: '16:30',
                    heure_fin: '17:30',
                    statut: 'en_attente',
                    client_nom: 'Leila Trabelsi',
                    client_telephone: '+216 XX XXX XXZ',
                    service_nom: 'Lamination Sourcils',
                    duree: 60
                }
            ],
            alertes_stock: 2, // Example: low stock on eyebrow products
            services_populaires: [
                { service_nom: 'Lamination Sourcils', nombre_reservations: 12 },
                { service_nom: 'Restructuration Sourcils', nombre_reservations: 10 },
                { service_nom: 'Épilation Sourcils Classique', nombre_reservations: 8 },
                { service_nom: 'Teinture Sourcils', nombre_reservations: 7 },
                { service_nom: 'Soin Sourcils Complet', nombre_reservations: 8 }
            ]
        };

        res.json(mockDashboardData);
        
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Statistiques détaillées sur une période
router.get('/stats', async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;
        
        if (!date_debut || !date_fin) {
            return res.status(400).json({ 
                message: 'Date de début et date de fin requises' 
            });
        }
        
        const stats = await ReservationModel.getReservationStats(date_debut, date_fin);
        
        // Statistiques clients
        const clientStats = await executeQuery(`
            SELECT 
                COUNT(DISTINCT client_id) as clients_uniques,
                COUNT(CASE WHEN c.date_creation BETWEEN ? AND ? THEN 1 END) as nouveaux_clients
            FROM reservations r
            JOIN clients c ON r.client_id = c.id
            WHERE r.date_reservation BETWEEN ? AND ?
        `, [date_debut, date_fin, date_debut, date_fin]);
        
        // Évolution jour par jour
        const evolutionQuotidienne = await executeQuery(`
            SELECT 
                date_reservation,
                COUNT(*) as nombre_rdv,
                SUM(CASE WHEN statut = 'terminee' THEN prix_final ELSE 0 END) as ca_jour
            FROM reservations
            WHERE date_reservation BETWEEN ? AND ?
            GROUP BY date_reservation
            ORDER BY date_reservation
        `, [date_debut, date_fin]);
        
        res.json({
            periode: { date_debut, date_fin },
            ...stats,
            clients: clientStats[0],
            evolution_quotidienne: evolutionQuotidienne
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Gestion des réservations admin
router.get('/reservations', async (req, res) => {
    try {
        const filters = req.query;
        const reservations = await ReservationModel.getReservations(filters);
        res.json(reservations);
    } catch (error) {
        console.error('Erreur lors de la récupération des réservations:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Mettre à jour le statut d'une réservation
router.patch('/reservations/:id/statut', async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, notes_admin } = req.body;
        
        const validStatuts = ['draft', 'en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee', 'absent'];
        if (!validStatuts.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }
        
        await ReservationModel.updateReservationStatus(id, statut, notes_admin);
        
        const updatedReservation = await ReservationModel.getReservationById(id);
        
        res.json({
            message: 'Statut mis à jour avec succès',
            reservation: updatedReservation
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Créer une réservation depuis l'admin
router.post('/reservations', async (req, res) => {
    try {
        const reservationData = req.body;
        reservationData.administrateur_id = req.admin.id;
        
        const reservationId = await ReservationModel.createReservation(reservationData);
        const newReservation = await ReservationModel.getReservationById(reservationId);
        
        res.status(201).json({
            message: 'Réservation créée avec succès',
            reservation: newReservation
        });
    } catch (error) {
        console.error('Erreur lors de la création de la réservation:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Convert draft to confirmed reservation
router.post('/reservations/convert-draft/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reservationId = await ReservationModel.convertDraftToReservation(id);
        const reservation = await ReservationModel.getReservationById(reservationId);
        
        res.json({
            message: 'Brouillon converti en réservation confirmée',
            reservation
        });
    } catch (error) {
        console.error('Erreur lors de la conversion du brouillon:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Update reservation details (client info, service, etc.)
router.put('/reservations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { client_nom, client_prenom, client_telephone, client_email, notes_admin, service_id } = req.body;
        
        // Build update query for reservation details
        const updateFields = [];
        const updateValues = [];
        
        if (client_nom !== undefined) {
            updateFields.push('client_nom = ?');
            updateValues.push(client_nom);
        }
        if (client_prenom !== undefined) {
            updateFields.push('client_prenom = ?');
            updateValues.push(client_prenom);
        }
        if (client_telephone !== undefined) {
            updateFields.push('client_telephone = ?');
            updateValues.push(client_telephone);
        }
        if (client_email !== undefined) {
            updateFields.push('client_email = ?');
            updateValues.push(client_email);
        }
        if (notes_admin !== undefined) {
            updateFields.push('notes_admin = ?');
            updateValues.push(notes_admin);
        }
        
        // Handle service change and price recalculation
        if (service_id !== undefined) {
            // Get new service price
            const service = await executeQuery('SELECT prix FROM services WHERE id = ?', [service_id]);
            if (service.length > 0) {
                const servicePrice = service[0].prix;
                updateFields.push('service_id = ?', 'prix_service = ?', 'prix_final = ?');
                updateValues.push(service_id, servicePrice, servicePrice);
            } else {
                return res.status(404).json({ message: 'Service non trouvé' });
            }
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
        }
        
        updateValues.push(id);
        
        const updateQuery = `
            UPDATE reservations 
            SET ${updateFields.join(', ')}, date_modification = NOW()
            WHERE id = ?
        `;
        
        await executeQuery(updateQuery, updateValues);
        
        const updatedReservation = await ReservationModel.getReservationById(id);
        
        res.json({
            message: 'Réservation mise à jour avec succès',
            reservation: updatedReservation
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la réservation:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Create reservation and client from admin panel
router.post('/reservations/create-with-client', async (req, res) => {
    try {
        const {
            // Client data
            client_nom, client_prenom, client_telephone, client_email,
            // Reservation data
            service_id, date_reservation, heure_debut, heure_fin, notes_client
        } = req.body;

        // Check if client exists by phone + name
        let client = await executeQuery(
            'SELECT * FROM clients WHERE telephone = ? AND nom = ? AND prenom = ?',
            [client_telephone, client_nom, client_prenom]
        );

        let client_id;
        if (client.length > 0) {
            client_id = client[0].id;
        } else {
            // Create new client
            const clientResult = await executeQuery(
                'INSERT INTO clients (nom, prenom, telephone, email, actif) VALUES (?, ?, ?, ?, 1)',
                [client_nom, client_prenom, client_telephone, client_email]
            );
            client_id = clientResult.insertId;
        }

        // Get service price
        const service = await executeQuery('SELECT prix FROM services WHERE id = ?', [service_id]);
        const prix_service = service[0]?.prix || 0;

        // Create reservation
        const reservationId = await ReservationModel.createReservation({
            client_id,
            service_id,
            date_reservation,
            heure_debut,
            heure_fin,
            notes_client,
            prix_service,
            prix_final: prix_service,
            statut: 'confirmee',
            reservation_status: 'confirmed'
        });

        const reservation = await ReservationModel.getReservationById(reservationId);
        
        res.status(201).json({
            message: 'Réservation et client créés avec succès',
            reservation,
            client_created: client.length === 0
        });
    } catch (error) {
        console.error('Erreur lors de la création de la réservation avec client:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// User Management Routes
// Get all administrators
router.get('/utilisateurs', requireRole('super_admin'), async (req, res) => {
    try {
        const utilisateurs = await executeQuery(
            'SELECT id, nom, email, role, actif, date_creation FROM utilisateurs ORDER BY nom'
        );
        
        res.json({
            success: true,
            data: utilisateurs
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Create new administrator
router.post('/utilisateurs', requireRole('super_admin'), async (req, res) => {
    try {
        const { nom, email, password, role = 'admin', actif = true } = req.body;

        if (!nom || !email || !password) {
            return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
        }

        // Check if email already exists
        const existingUser = await executeQuery(
            'SELECT id FROM utilisateurs WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hash password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const result = await executeQuery(
            'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, actif) VALUES (?, ?, ?, ?, ?)',
            [nom, email, hashedPassword, role, actif]
        );

        // Return created user (without password)
        const newUser = await executeQuery(
            'SELECT id, nom, email, role, actif, date_creation FROM utilisateurs WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: newUser[0]
        });

    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Update administrator
router.put('/utilisateurs/:id', requireRole('super_admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, email, role, actif, password } = req.body;

        if (!nom || !email) {
            return res.status(400).json({ message: 'Nom et email requis' });
        }

        // Check if email already exists (excluding current user)
        const existingUser = await executeQuery(
            'SELECT id FROM utilisateurs WHERE email = ? AND id != ?',
            [email, id]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        let updateQuery = 'UPDATE utilisateurs SET nom = ?, email = ?, role = ?, actif = ?';
        let updateParams = [nom, email, role, actif];

        // If password is provided, update it too
        if (password) {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 12);
            updateQuery += ', mot_de_passe = ?';
            updateParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        updateParams.push(id);

        await executeQuery(updateQuery, updateParams);

        // Return updated user (without password)
        const updatedUser = await executeQuery(
            'SELECT id, nom, email, role, actif, date_creation FROM utilisateurs WHERE id = ?',
            [id]
        );

        if (updatedUser.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            data: updatedUser[0]
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Toggle user status
router.patch('/utilisateurs/:id/toggle', requireRole('super_admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Get current status
        const user = await executeQuery(
            'SELECT actif FROM utilisateurs WHERE id = ?',
            [id]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const newStatus = !user[0].actif;

        // Update status
        await executeQuery(
            'UPDATE utilisateurs SET actif = ? WHERE id = ?',
            [newStatus, id]
        );

        res.json({
            success: true,
            message: `Utilisateur ${newStatus ? 'activé' : 'désactivé'} avec succès`
        });

    } catch (error) {
        console.error('Erreur lors du changement de statut:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Delete administrator
router.delete('/utilisateurs/:id', requireRole('super_admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (parseInt(id) === req.admin.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        // Check if user exists
        const user = await executeQuery(
            'SELECT id FROM utilisateurs WHERE id = ?',
            [id]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Delete user
        await executeQuery('DELETE FROM utilisateurs WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Salon Settings Routes
// Get salon parameters
router.get('/salon/parametres', async (req, res) => {
    try {
        const parametres = await executeQuery(
            'SELECT * FROM parametres_salon ORDER BY id DESC LIMIT 1'
        );
        
        res.json({
            success: true,
            data: parametres[0] || {}
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des paramètres:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Update salon parameters
router.put('/salon/parametres', requireRole('admin'), async (req, res) => {
    try {
        const {
            nom_salon,
            adresse,
            telephone,
            email,
            horaires_ouverture,
            horaires_fermeture,
            description,
            politique_annulation
        } = req.body;

        // Check if parameters exist
        const existing = await executeQuery('SELECT id FROM parametres_salon LIMIT 1');

        if (existing.length > 0) {
            // Update existing parameters
            await executeQuery(
                `UPDATE parametres_salon SET 
                nom_salon = ?, adresse = ?, telephone = ?, email = ?,
                message_accueil = ?, politique_annulation = ?
                WHERE id = ?`,
                [nom_salon, adresse, telephone, email, description, politique_annulation, existing[0].id]
            );
        } else {
            // Create new parameters
            await executeQuery(
                `INSERT INTO parametres_salon 
                (nom_salon, adresse, telephone, email, message_accueil, politique_annulation) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [nom_salon, adresse, telephone, email, description, politique_annulation]
            );
        }

        res.json({
            success: true,
            message: 'Paramètres mis à jour avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Test Telegram Connection
router.post('/telegram/test', requireRole('admin'), async (req, res) => {
    try {
        const success = await TelegramService.testConnection();
        
        if (success) {
            res.json({ 
                success: true, 
                message: 'Connexion Telegram testée avec succès!' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors du test de connexion Telegram' 
            });
        }
    } catch (error) {
        console.error('Erreur test Telegram:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur',
            error: error.message 
        });
    }
});

// Send Daily Reservations Summary
router.post('/telegram/daily-summary', requireRole('admin'), async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const reservations = await executeQuery(`
            SELECT 
                r.id, r.date_reservation, r.heure_debut, r.heure_fin, r.statut, r.prix_final,
                CONCAT(c.prenom, ' ', c.nom) as client_prenom, c.nom as client_nom,
                c.telephone as client_telephone,
                s.nom as service_nom
            FROM reservations r
            JOIN clients c ON r.client_id = c.id
            JOIN services s ON r.service_id = s.id
            WHERE r.date_reservation = ?
            AND r.reservation_status != 'draft'
            AND r.statut != 'annulee'
            ORDER BY r.heure_debut
        `, [today]);

        const success = await TelegramService.sendDailyReservationsSummary(reservations);
        
        if (success) {
            res.json({ 
                success: true, 
                message: 'Résumé journalier envoyé avec succès!',
                reservations: reservations.length
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de l\'envoi du résumé journalier' 
            });
        }
    } catch (error) {
        console.error('Erreur envoi résumé journalier:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur',
            error: error.message 
        });
    }
});

module.exports = router;
