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
        
        const queries = [
            // Réservations du jour (excluant les brouillons)
            `SELECT COUNT(*) as rdv_aujourd_hui FROM reservations WHERE date_reservation = '${today}' AND reservation_status != 'draft'`,
            
            // Réservations du mois (excluant les brouillons)
            `SELECT COUNT(*) as rdv_ce_mois FROM reservations WHERE date_reservation LIKE '${thisMonth}%' AND reservation_status != 'draft'`,
            
            // Chiffre d'affaires du mois
            `SELECT SUM(prix_final) as ca_mois FROM reservations WHERE date_reservation LIKE '${thisMonth}%' AND statut = 'terminee'`,
            
            // Total des clients
            `SELECT COUNT(*) as total_clients FROM clients WHERE actif = TRUE`,
            
            // Réservations par statut aujourd'hui
            `SELECT statut, COUNT(*) as nombre FROM reservations WHERE date_reservation = '${today}' AND reservation_status != 'draft' GROUP BY statut`,
            
            // Prochaines réservations (aujourd'hui et demain)
            `SELECT 
                r.id, r.date_reservation, r.heure_debut, r.heure_fin, r.statut,
                CONCAT(c.prenom, ' ', c.nom) as client_nom,
                c.telephone as client_telephone,
                s.nom as service_nom,
                s.duree
            FROM reservations r
            JOIN clients c ON r.client_id = c.id
            JOIN services s ON r.service_id = s.id
            WHERE r.date_reservation BETWEEN '${today}' AND DATE_ADD('${today}', INTERVAL 1 DAY)
            AND r.statut IN ('en_attente', 'confirmee')
            AND r.reservation_status != 'draft'
            ORDER BY r.date_reservation, r.heure_debut
            LIMIT 10`,
            
            // Alertes de stock
            `SELECT COUNT(*) as alertes_stock FROM inventaire WHERE actif = TRUE AND quantite_stock <= quantite_minimum`,
            
            // Services les plus demandés ce mois
            `SELECT 
                s.nom as service_nom,
                COUNT(*) as nombre_reservations
            FROM reservations r
            JOIN services s ON r.service_id = s.id
            WHERE r.date_reservation LIKE '${thisMonth}%' 
            AND r.reservation_status != 'draft'
            GROUP BY s.id, s.nom
            ORDER BY nombre_reservations DESC
            LIMIT 5`
        ];

        const results = await Promise.all(queries.map(query => executeQuery(query)));

        res.json({
            rdv_aujourd_hui: results[0][0]?.rdv_aujourd_hui || 0,
            rdv_ce_mois: results[1][0]?.rdv_ce_mois || 0,
            ca_mois: results[2][0]?.ca_mois || 0,
            total_clients: results[3][0]?.total_clients || 0,
            reservations_par_statut: results[4],
            prochaines_reservations: results[5],
            alertes_stock: results[6][0]?.alertes_stock || 0,
            services_populaires: results[7]
        });
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

// Update reservation details (client info, etc.)
router.put('/reservations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { client_nom, client_prenom, client_telephone, client_email, notes_admin } = req.body;
        
        // Build update query for reservation client details
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
    try {
        const { period = '30' } = req.query; // Default to 30 days
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);
        
        // Overview statistics
        const overviewQueries = [
            `SELECT COUNT(*) as total_clients FROM clients WHERE actif = TRUE`,
            `SELECT COUNT(*) as total_reservations FROM reservations WHERE date_reservation >= '${startDateStr}' AND reservation_status != 'draft'`,
            `SELECT SUM(prix_final) as total_revenue FROM reservations WHERE date_reservation >= '${startDateStr}' AND statut = 'terminee'`,
            `SELECT COUNT(*) as total_services FROM services WHERE actif = TRUE`
        ];
        
        const overviewResults = await Promise.all(
            overviewQueries.map(query => executeQuery(query))
        );

        // === A. CRUCIAL METRICS - ENHANCED FINANCIAL TRACKING ===
        
        // 1. Financial Revenue Analysis - Actual vs Potential vs Lost
        const revenueAnalysisQuery = `
            SELECT 
                -- Actual Revenue (completed)
                SUM(CASE WHEN statut = 'terminee' THEN prix_final ELSE 0 END) as revenue_completed,
                COUNT(CASE WHEN statut = 'terminee' THEN 1 END) as bookings_completed,
                
                -- Potential Revenue (confirmed but not completed yet)
                SUM(CASE WHEN statut IN ('confirmee', 'en_cours') THEN prix_final ELSE 0 END) as revenue_potential,
                COUNT(CASE WHEN statut IN ('confirmee', 'en_cours') THEN 1 END) as bookings_confirmed,
                
                -- Lost Revenue (cancelled or no-show)
                SUM(CASE WHEN statut IN ('annulee', 'no_show') THEN prix_final ELSE 0 END) as revenue_lost,
                COUNT(CASE WHEN statut IN ('annulee', 'no_show') THEN 1 END) as bookings_lost,
                
                -- Manual Conversions (draft to confirmed - admin intervention)
                COUNT(CASE WHEN statut != 'draft' AND reservation_status = 'confirmed' THEN 1 END) as admin_conversions,
                SUM(CASE WHEN statut != 'draft' AND reservation_status = 'confirmed' THEN prix_final ELSE 0 END) as admin_conversion_value,
                
                -- Total Draft Impact (all drafts created)
                (SELECT COUNT(*) FROM reservations 
                 WHERE date_creation >= '${startDateStr}' 
                 AND statut = 'draft') as total_drafts_created,
                
                -- Draft Conversion Rate
                (SELECT COUNT(*) FROM reservations 
                 WHERE date_creation >= '${startDateStr}' 
                 AND statut != 'draft' AND reservation_status IN ('confirmed', 'reserved')) as drafts_converted_to_bookings
                 
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND reservation_status != 'draft'
        `;

        // 2. Admin Intervention Impact Analysis
        const adminInterventionQuery = `
            SELECT 
                -- Reservations manually confirmed by admin
                COUNT(CASE WHEN reservation_status = 'confirmed' AND statut != 'draft' THEN 1 END) as admin_touched_reservations,
                AVG(CASE WHEN reservation_status = 'confirmed' THEN prix_final END) as avg_value_admin_handled,
                
                -- Success rate of confirmed reservations
                COUNT(CASE WHEN reservation_status = 'confirmed' AND statut = 'terminee' THEN 1 END) as admin_successful_completions,
                COUNT(CASE WHEN reservation_status = 'confirmed' AND statut IN ('annulee', 'no_show') THEN 1 END) as admin_failed_conversions,
                
                -- Draft system effectiveness
                (SELECT COUNT(*) FROM reservations 
                 WHERE statut = 'draft' 
                 AND date_creation >= '${startDateStr}') as current_drafts,
                
                (SELECT COUNT(*) FROM reservations r1
                 WHERE r1.date_creation >= '${startDateStr}'
                 AND r1.statut != 'draft' 
                 AND EXISTS (
                     SELECT 1 FROM reservations r2 
                     WHERE r2.client_telephone = r1.client_telephone 
                     AND r2.statut = 'draft' 
                     AND r2.date_creation < r1.date_creation
                 )) as draft_converted_customers,
                
                -- Revenue from confirmed reservations (admin interventions)
                SUM(CASE WHEN reservation_status = 'confirmed' AND statut = 'terminee' THEN prix_final ELSE 0 END) as revenue_rescued_by_admin
                
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}'
        `;

        // 3. Status Breakdown with Financial Impact
        const statusBreakdownQuery = `
            SELECT 
                statut,
                COUNT(*) as count,
                SUM(prix_final) as total_value,
                AVG(prix_final) as avg_value,
                -- Percentage of total bookings
                (COUNT(*) * 100.0 / (
                    SELECT COUNT(*) FROM reservations 
                    WHERE date_reservation >= '${startDateStr}' 
                    AND reservation_status != 'draft'
                )) as percentage_of_total,
                -- Percentage of total potential revenue
                (SUM(prix_final) * 100.0 / (
                    SELECT SUM(prix_final) FROM reservations 
                    WHERE date_reservation >= '${startDateStr}' 
                    AND reservation_status != 'draft'
                )) as percentage_of_revenue
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND reservation_status != 'draft'
            GROUP BY statut
            ORDER BY total_value DESC
        `;

        // 4. Draft System Performance Metrics
        const draftSystemMetricsQuery = `
            SELECT 
                -- Total drafts created (shows lead generation)
                COUNT(*) as total_drafts,
                
                -- Drafts that became confirmed bookings (based on phone number matching)
                SUM(CASE WHEN converted_reservation.id IS NOT NULL THEN 1 ELSE 0 END) as drafts_converted,
                
                -- Average time from draft to conversion
                AVG(CASE WHEN converted_reservation.id IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, draft_res.date_creation, converted_reservation.date_creation) 
                    END) as avg_conversion_time_hours,
                
                -- Total value of converted drafts
                SUM(CASE WHEN converted_reservation.id IS NOT NULL 
                    THEN converted_reservation.prix_final ELSE 0 END) as converted_draft_value,
                
                -- Conversion rate
                (SUM(CASE WHEN converted_reservation.id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as conversion_rate
                
            FROM reservations draft_res
            LEFT JOIN reservations converted_reservation ON (
                draft_res.client_telephone = converted_reservation.client_telephone
                AND converted_reservation.statut != 'draft'
                AND converted_reservation.reservation_status IN ('reserved', 'confirmed')
                AND converted_reservation.date_creation > draft_res.date_creation
                AND converted_reservation.date_creation <= DATE_ADD(draft_res.date_creation, INTERVAL 30 DAY)
            )
            WHERE draft_res.statut = 'draft'
                AND draft_res.date_creation >= '${startDateStr}'
        `;

        // 1. Reservation Metrics - Peak/Off-Peak Hours
        const peakHoursQuery = `
            SELECT 
                HOUR(STR_TO_DATE(heure_debut, '%H:%i:%s')) as hour,
                COUNT(*) as bookings
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND reservation_status != 'draft'
            GROUP BY HOUR(STR_TO_DATE(heure_debut, '%H:%i:%s'))
            ORDER BY bookings DESC
        `;

        // Cancellations vs No-Shows
        const cancellationStatsQuery = `
            SELECT 
                statut,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations WHERE date_reservation >= '${startDateStr}' AND reservation_status != 'draft')) as percentage
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND statut IN ('annulee', 'no_show')
            GROUP BY statut
        `;

        // 2. Revenue Metrics - Average Spend per Client
        const avgSpendQuery = `
            SELECT 
                AVG(prix_final) as avg_spend,
                COUNT(DISTINCT client_id) as unique_clients
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND statut = 'terminee'
        `;

        // Revenue by Service Type
        const revenueByServiceQuery = `
            SELECT 
                s.nom as service_name,
                cs.nom as category,
                COUNT(r.id) as bookings,
                SUM(r.prix_final) as revenue,
                AVG(r.prix_final) as avg_price
            FROM services s
            LEFT JOIN categories_services cs ON s.categorie_id = cs.id
            LEFT JOIN reservations r ON s.id = r.service_id
            WHERE r.date_reservation >= '${startDateStr}'
                AND r.statut = 'terminee'
            GROUP BY s.id, s.nom, cs.nom
            ORDER BY revenue DESC
        `;

        // 3. Client Management - New vs Returning Clients
        const clientAnalysisQuery = `
            SELECT 
                SUM(CASE WHEN client_reservations.reservation_count = 1 THEN 1 ELSE 0 END) as new_clients,
                SUM(CASE WHEN client_reservations.reservation_count > 1 THEN 1 ELSE 0 END) as returning_clients
            FROM (
                SELECT 
                    client_id,
                    COUNT(*) as reservation_count
                FROM reservations 
                WHERE date_reservation >= '${startDateStr}' 
                    AND statut = 'terminee'
                GROUP BY client_id
            ) as client_reservations
        `;

        // Client Retention Rates (30, 60, 90 days)
        const retentionQuery = `
            SELECT 
                '30_days' as period,
                COUNT(DISTINCT r2.client_id) as returned_clients,
                COUNT(DISTINCT r1.client_id) as total_clients
            FROM reservations r1
            LEFT JOIN reservations r2 ON r1.client_id = r2.client_id 
                AND r2.date_reservation BETWEEN r1.date_reservation 
                AND DATE_ADD(r1.date_reservation, INTERVAL 30 DAY)
                AND r2.id != r1.id
            WHERE r1.date_reservation >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
                AND r1.statut = 'terminee'
            
            UNION ALL
            
            SELECT 
                '60_days' as period,
                COUNT(DISTINCT r2.client_id) as returned_clients,
                COUNT(DISTINCT r1.client_id) as total_clients
            FROM reservations r1
            LEFT JOIN reservations r2 ON r1.client_id = r2.client_id 
                AND r2.date_reservation BETWEEN r1.date_reservation 
                AND DATE_ADD(r1.date_reservation, INTERVAL 60 DAY)
                AND r2.id != r1.id
            WHERE r1.date_reservation >= DATE_SUB(CURDATE(), INTERVAL 120 DAY)
                AND r1.statut = 'terminee'
        `;

        // VIP/Loyal Customers
        const vipClientsQuery = `
            SELECT 
                c.nom,
                c.prenom,
                c.email,
                COUNT(r.id) as total_visits,
                SUM(r.prix_final) as total_spent,
                AVG(r.prix_final) as avg_spend,
                MAX(r.date_reservation) as last_visit
            FROM clients c
            JOIN reservations r ON c.id = r.client_id
            WHERE r.statut = 'terminee'
            GROUP BY c.id, c.nom, c.prenom, c.email
            HAVING total_visits >= 3 OR total_spent >= 500
            ORDER BY total_spent DESC
            LIMIT 10
        `;

        // === B. INTERESTING METRICS ===

        // 4. Service Popularity & Trends - Seasonal Variations
        const seasonalTrendsQuery = `
            SELECT 
                MONTH(date_reservation) as month,
                s.nom as nom_service,
                COUNT(r.id) as bookings
            FROM reservations r
            JOIN services s ON r.service_id = s.id
            WHERE YEAR(date_reservation) = YEAR(CURDATE())
                AND r.statut = 'terminee'
            GROUP BY MONTH(date_reservation), s.id, s.nom
            ORDER BY month, bookings DESC
        `;

        // Common Service Combinations (requires additional table or analysis)
        const serviceCombinationsQuery = `
            SELECT 
                s1.nom as service1,
                s2.nom as service2,
                COUNT(*) as combination_count
            FROM reservations r1
            JOIN reservations r2 ON r1.client_id = r2.client_id 
                AND r1.date_reservation = r2.date_reservation
                AND r1.id < r2.id
            JOIN services s1 ON r1.service_id = s1.id
            JOIN services s2 ON r2.service_id = s2.id
            WHERE r1.date_reservation >= '${startDateStr}'
                AND r1.statut = 'terminee'
                AND r2.statut = 'terminee'
            GROUP BY s1.id, s2.id, s1.nom, s2.nom
            ORDER BY combination_count DESC
            LIMIT 10
        `;

        // 5. Client Insights - Booking Behavior
        const bookingBehaviorQuery = `
            SELECT 
                AVG(DATEDIFF(date_reservation, date_creation)) as avg_lead_time,
                COUNT(CASE WHEN DATEDIFF(date_reservation, date_creation) <= 1 THEN 1 END) as same_day_bookings,
                COUNT(CASE WHEN DATEDIFF(date_reservation, date_creation) BETWEEN 2 AND 7 THEN 1 END) as week_advance_bookings,
                COUNT(CASE WHEN DATEDIFF(date_reservation, date_creation) > 7 THEN 1 END) as long_advance_bookings
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}'
                AND reservation_status != 'draft'
        `;

        // 6. Spa Utilization - Busiest Times Heatmap
        const utilizationHeatmapQuery = `
            SELECT 
                DAYOFWEEK(date_reservation) as day_of_week,
                HOUR(STR_TO_DATE(heure_debut, '%H:%i:%s')) as hour,
                COUNT(*) as booking_count
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}'
                AND reservation_status != 'draft'
            GROUP BY DAYOFWEEK(date_reservation), HOUR(STR_TO_DATE(heure_debut, '%H:%i:%s'))
            ORDER BY day_of_week, hour
        `;

        // 7. Financial Insights - Client Lifetime Value
        const clvQuery = `
            SELECT 
                AVG(client_totals.total_spent) as avg_clv,
                AVG(client_totals.total_visits) as avg_visits_per_client,
                AVG(client_totals.days_as_client) as avg_client_lifespan
            FROM (
                SELECT 
                    c.id,
                    SUM(r.prix_final) as total_spent,
                    COUNT(r.id) as total_visits,
                    DATEDIFF(MAX(r.date_reservation), MIN(r.date_reservation)) as days_as_client
                FROM clients c
                JOIN reservations r ON c.id = r.client_id
                WHERE r.statut = 'terminee'
                GROUP BY c.id
            ) as client_totals
        `;

        // Execute all new queries
        const [
            revenueAnalysis, adminIntervention, statusBreakdown, draftSystemMetrics,
            peakHours, cancellationStats, avgSpend, revenueByService,
            clientAnalysis, retention, vipClients, seasonalTrends,
            serviceCombinations, bookingBehavior, utilizationHeatmap, clv
        ] = await Promise.all([
            executeQuery(revenueAnalysisQuery),
            executeQuery(adminInterventionQuery),
            executeQuery(statusBreakdownQuery),
            executeQuery(draftSystemMetricsQuery),
            executeQuery(peakHoursQuery),
            executeQuery(cancellationStatsQuery),
            executeQuery(avgSpendQuery),
            executeQuery(revenueByServiceQuery),
            executeQuery(clientAnalysisQuery),
            executeQuery(retentionQuery),
            executeQuery(vipClientsQuery),
            executeQuery(seasonalTrendsQuery),
            executeQuery(serviceCombinationsQuery),
            executeQuery(bookingBehaviorQuery),
            executeQuery(utilizationHeatmapQuery),
            executeQuery(clvQuery)
        ]);

        // Execute existing queries
        const revenueTrendQuery = `
            SELECT 
                date_reservation as date,
                SUM(prix_final) as revenue,
                COUNT(*) as bookings
            FROM reservations 
            WHERE date_reservation >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                AND statut = 'terminee'
            GROUP BY date_reservation
            ORDER BY date_reservation ASC
        `;
        
        const popularServicesQuery = `
            SELECT 
                s.nom as name,
                COUNT(r.id) as bookings,
                SUM(r.prix_final) as revenue
            FROM services s
            LEFT JOIN reservations r ON s.id = r.service_id
            WHERE r.date_reservation >= '${startDateStr}'
                AND r.reservation_status != 'draft'
            GROUP BY s.id, s.nom
            ORDER BY bookings DESC
            LIMIT 5
        `;
        
        const monthlyComparisonQuery = `
            SELECT 
                DATE_FORMAT(date_reservation, '%Y-%m') as month,
                COUNT(*) as bookings,
                SUM(prix_final) as revenue
            FROM reservations 
            WHERE DATE_FORMAT(date_reservation, '%Y-%m') IN ('${thisMonth}', '${new Date().toISOString().slice(0, 7)}')
                AND statut = 'terminee'
            GROUP BY DATE_FORMAT(date_reservation, '%Y-%m')
            ORDER BY month DESC
        `;
        
        const clientGrowthQuery = `
            SELECT 
                DATE(date_creation) as date,
                COUNT(*) as new_clients
            FROM clients 
            WHERE date_creation >= '${startDateStr}'
            GROUP BY DATE(date_creation)
            ORDER BY date ASC
        `;
        
        const [revenueTrend, popularServices, monthlyComparison, clientGrowth] = await Promise.all([
            executeQuery(revenueTrendQuery),
            executeQuery(popularServicesQuery),
            executeQuery(monthlyComparisonQuery),
            executeQuery(clientGrowthQuery)
        ]);
        
        // Calculate growth percentages
        const currentMonth = monthlyComparison.find(m => m.month === thisMonth) || { bookings: 0, revenue: 0 };
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = lastMonth.toISOString().slice(0, 7);
        const previousMonth = monthlyComparison.find(m => m.month === lastMonthStr) || { bookings: 0, revenue: 0 };
        
        const bookingGrowth = previousMonth.bookings > 0 
            ? ((currentMonth.bookings - previousMonth.bookings) / previousMonth.bookings * 100).toFixed(1)
            : 0;
            
        const revenueGrowth = previousMonth.revenue > 0 
            ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1)
            : 0;
        
        res.json({
            success: true,
            data: {
                // Basic Overview
                overview: {
                    totalClients: overviewResults[0][0]?.total_clients || 0,
                    totalReservations: overviewResults[1][0]?.total_reservations || 0,
                    totalRevenue: overviewResults[2][0]?.total_revenue || 0,
                    totalServices: overviewResults[3][0]?.total_services || 0,
                    bookingGrowth: parseFloat(bookingGrowth),
                    revenueGrowth: parseFloat(revenueGrowth),
                    avgSpendPerClient: avgSpend[0]?.avg_spend || 0
                },

                // === ENHANCED FINANCIAL TRACKING ===
                financialOverview: {
                    // Actual money earned
                    revenueCompleted: parseFloat(revenueAnalysis[0]?.revenue_completed || 0),
                    bookingsCompleted: revenueAnalysis[0]?.bookings_completed || 0,
                    
                    // Money expected from confirmed bookings
                    revenuePotential: parseFloat(revenueAnalysis[0]?.revenue_potential || 0),
                    bookingsConfirmed: revenueAnalysis[0]?.bookings_confirmed || 0,
                    
                    // Money lost from cancellations/no-shows
                    revenueLost: parseFloat(revenueAnalysis[0]?.revenue_lost || 0),
                    bookingsLost: revenueAnalysis[0]?.bookings_lost || 0,
                    
                    // Admin intervention value
                    adminConversions: revenueAnalysis[0]?.admin_conversions || 0,
                    adminConversionValue: parseFloat(revenueAnalysis[0]?.admin_conversion_value || 0),
                    
                    // Total potential if everything was completed
                    totalPotentialRevenue: parseFloat(
                        (revenueAnalysis[0]?.revenue_completed || 0) + 
                        (revenueAnalysis[0]?.revenue_potential || 0) + 
                        (revenueAnalysis[0]?.revenue_lost || 0)
                    )
                },

                // === ADMIN IMPACT TRACKING ===
                adminImpact: {
                    totalInterventions: adminIntervention[0]?.admin_touched_reservations || 0,
                    avgValueAdminHandled: parseFloat(adminIntervention[0]?.avg_value_admin_handled || 0),
                    successfulCompletions: adminIntervention[0]?.admin_successful_completions || 0,
                    failedConversions: adminIntervention[0]?.admin_failed_conversions || 0,
                    revenueRescuedByAdmin: parseFloat(adminIntervention[0]?.revenue_rescued_by_admin || 0),
                    
                    // Success rate of admin interventions
                    adminSuccessRate: adminIntervention[0]?.admin_touched_reservations > 0 
                        ? ((adminIntervention[0]?.admin_successful_completions || 0) / 
                           adminIntervention[0]?.admin_touched_reservations * 100).toFixed(1)
                        : 0
                },

                // === DRAFT SYSTEM PERFORMANCE ===
                draftSystemPerformance: {
                    totalDraftsCreated: draftSystemMetrics[0]?.total_drafts || 0,
                    draftsConverted: draftSystemMetrics[0]?.drafts_converted || 0,
                    conversionRate: parseFloat(draftSystemMetrics[0]?.conversion_rate || 0),
                    avgConversionTimeHours: parseFloat(draftSystemMetrics[0]?.avg_conversion_time_hours || 0),
                    convertedDraftValue: parseFloat(draftSystemMetrics[0]?.converted_draft_value || 0),
                    currentDrafts: adminIntervention[0]?.current_drafts || 0,
                    
                    // How much revenue was generated from draft leads
                    draftGeneratedRevenue: parseFloat(draftSystemMetrics[0]?.converted_draft_value || 0),
                    
                    // ROI of draft system (assuming minimal cost)
                    draftROI: draftSystemMetrics[0]?.total_drafts > 0 
                        ? (parseFloat(draftSystemMetrics[0]?.converted_draft_value || 0) / draftSystemMetrics[0]?.total_drafts).toFixed(2)
                        : 0
                },

                // === STATUS BREAKDOWN WITH FINANCIAL IMPACT ===
                statusBreakdown: statusBreakdown.map(status => ({
                    status: status.statut,
                    count: status.count,
                    totalValue: parseFloat(status.total_value || 0),
                    avgValue: parseFloat(status.avg_value || 0),
                    percentageOfTotal: parseFloat(status.percentage_of_total || 0),
                    percentageOfRevenue: parseFloat(status.percentage_of_revenue || 0)
                })),

                // A. CRUCIAL METRICS (existing structure maintained)
                reservationMetrics: {
                    peakHours: peakHours.map(h => ({
                        hour: h.hour,
                        bookings: h.bookings
                    })),
                    cancellationStats: cancellationStats.map(c => ({
                        status: c.statut,
                        count: c.count,
                        percentage: parseFloat(c.percentage || 0)
                    }))
                },

                revenueMetrics: {
                    totalRevenue: overviewResults[2][0]?.total_revenue || 0,
                    avgSpendPerClient: avgSpend[0]?.avg_spend || 0,
                    revenueByService: revenueByService.map(s => ({
                        serviceName: s.service_name,
                        category: s.category,
                        bookings: s.bookings || 0,
                        revenue: parseFloat(s.revenue || 0),
                        avgPrice: parseFloat(s.avg_price || 0)
                    }))
                },

                clientManagement: {
                    newVsReturning: {
                        newClients: clientAnalysis[0]?.new_clients || 0,
                        returningClients: clientAnalysis[0]?.returning_clients || 0
                    },
                    retentionRates: retention.map(r => ({
                        period: r.period,
                        rate: r.total_clients > 0 ? (r.returned_clients / r.total_clients * 100).toFixed(1) : 0
                    })),
                    vipClients: vipClients.map(c => ({
                        name: `${c.prenom} ${c.nom}`,
                        email: c.email,
                        totalVisits: c.total_visits,
                        totalSpent: parseFloat(c.total_spent),
                        avgSpend: parseFloat(c.avg_spend),
                        lastVisit: c.last_visit
                    }))
                },

                // B. INTERESTING METRICS
                serviceInsights: {
                    popularServices: popularServices.map(service => ({
                        name: service.name,
                        bookings: service.bookings || 0,
                        revenue: parseFloat(service.revenue || 0)
                    })),
                    seasonalTrends: seasonalTrends.map(t => ({
                        month: t.month,
                        serviceName: t.nom_service,
                        bookings: t.bookings
                    })),
                    serviceCombinations: serviceCombinations.map(c => ({
                        service1: c.service1,
                        service2: c.service2,
                        count: c.combination_count
                    }))
                },

                clientInsights: {
                    bookingBehavior: {
                        avgLeadTime: parseFloat(bookingBehavior[0]?.avg_lead_time || 0),
                        sameDayBookings: bookingBehavior[0]?.same_day_bookings || 0,
                        weekAdvanceBookings: bookingBehavior[0]?.week_advance_bookings || 0,
                        longAdvanceBookings: bookingBehavior[0]?.long_advance_bookings || 0
                    }
                },

                spaUtilization: {
                    utilizationHeatmap: utilizationHeatmap.map(u => ({
                        dayOfWeek: u.day_of_week,
                        hour: u.hour,
                        bookingCount: u.booking_count
                    }))
                },

                financialInsights: {
                    clientLifetimeValue: {
                        avgCLV: parseFloat(clv[0]?.avg_clv || 0),
                        avgVisitsPerClient: parseFloat(clv[0]?.avg_visits_per_client || 0),
                        avgClientLifespan: parseFloat(clv[0]?.avg_client_lifespan || 0)
                    }
                },

                // Existing data for compatibility
                revenueTrend: revenueTrend.map(item => ({
                    date: item.date,
                    revenue: parseFloat(item.revenue || 0),
                    bookings: item.bookings || 0
                })),
                clientGrowth: clientGrowth.map(item => ({
                    date: item.date,
                    newClients: item.new_clients || 0
                })),
                monthlyComparison: {
                    current: {
                        month: thisMonth,
                        bookings: currentMonth.bookings || 0,
                        revenue: parseFloat(currentMonth.revenue || 0)
                    },
                    previous: {
                        month: lastMonthStr,
                        bookings: previousMonth.bookings || 0,
                        revenue: parseFloat(previousMonth.revenue || 0)
                    }
                },

                // === SEASONAL TRENDS WITH MONTHLY BOOKINGS ===
                seasonalTrends: {
                    monthlyBookings: (() => {
                        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                                       'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                        const currentYear = new Date().getFullYear();
                        const currentMonth = new Date().getMonth();
                        
                        // Get last 12 months of data
                        const monthlyData = [];
                        for (let i = 11; i >= 0; i--) {
                            const date = new Date();
                            date.setMonth(currentMonth - i);
                            const monthNum = date.getMonth() + 1;
                            const year = date.getFullYear();
                            
                            // Find bookings for this month from seasonal trends data
                            const monthBookings = seasonalTrends
                                .filter(t => t.month === monthNum)
                                .reduce((sum, t) => sum + t.bookings, 0);
                            
                            monthlyData.push({
                                month: months[date.getMonth()],
                                bookings: monthBookings,
                                year: year
                            });
                        }
                        return monthlyData;
                    })(),
                    
                    peakSeason: (() => {
                        // Find the month with most bookings
                        const monthlyTotals = {};
                        seasonalTrends.forEach(t => {
                            const monthName = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                                             'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][t.month - 1];
                            monthlyTotals[monthName] = (monthlyTotals[monthName] || 0) + t.bookings;
                        });
                        
                        const peakMonth = Object.keys(monthlyTotals).reduce((a, b) => 
                            monthlyTotals[a] > monthlyTotals[b] ? a : b, Object.keys(monthlyTotals)[0]
                        );
                        
                        return {
                            month: peakMonth || 'N/A',
                            bookings: monthlyTotals[peakMonth] || 0
                        };
                    })(),
                    
                    growthRate: (() => {
                        // Calculate month-over-month average growth
                        const recentMonths = revenueTrend.slice(-60); // Last 60 days
                        if (recentMonths.length < 2) return 0;
                        
                        const oldRevenue = recentMonths.slice(0, 30).reduce((sum, day) => sum + day.revenue, 0);
                        const newRevenue = recentMonths.slice(-30).reduce((sum, day) => sum + day.revenue, 0);
                        
                        return oldRevenue > 0 ? ((newRevenue - oldRevenue) / oldRevenue * 100) : 0;
                    })()
                }
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

// NEW: Draft Performance Dashboard Endpoint
router.get('/draft-performance', authenticateAdmin, async (req, res) => {
    try {
        console.log('🎯 Draft Performance endpoint started');
        
        const draftMetricsQuery = `
            SELECT 
                COUNT(CASE WHEN reservation_status = 'draft' THEN 1 END) as total_drafts_created,
                COUNT(CASE WHEN reservation_status = 'draft' AND statut IN ('confirmee', 'terminee') THEN 1 END) as drafts_converted,
                COUNT(CASE WHEN reservation_status = 'draft' AND statut = 'draft' THEN 1 END) as drafts_pending,
                COUNT(CASE WHEN reservation_status = 'reserved' THEN 1 END) as direct_bookings,
                SUM(CASE WHEN reservation_status = 'draft' AND statut IN ('confirmee', 'terminee') THEN prix_final ELSE 0 END) as revenue_from_conversions,
                SUM(CASE WHEN reservation_status = 'reserved' THEN prix_final ELSE 0 END) as revenue_from_direct
            FROM reservations
        `;
        
        console.log('📊 About to execute query');

        const result = await executeQuery(draftMetricsQuery);
        const data = result[0] || {
            total_drafts_created: 0,
            drafts_converted: 0, 
            drafts_pending: 0,
            direct_bookings: 0,
            revenue_from_conversions: 0,
            revenue_from_direct: 0
        };
        
        const conversionRate = data.total_drafts_created > 0 ? 
            (data.drafts_converted / data.total_drafts_created * 100) : 0;
        
        console.log('� FULL DATABASE ANALYSIS:', draftMetrics[0]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalDraftsCreated: data.total_drafts_created,
                    draftsConverted: data.drafts_converted,
                    draftsPending: data.drafts_pending,
                    directBookings: data.direct_bookings,
                    conversionRate: conversionRate.toFixed(1),
                    revenueFromConversions: data.revenue_from_conversions || 0,
                    revenueFromDirect: data.revenue_from_direct || 0,
                    avgConvertedValue: data.drafts_converted > 0 ? (data.revenue_from_conversions / data.drafts_converted) : 0,
                    avgDirectValue: data.direct_bookings > 0 ? (data.revenue_from_direct / data.direct_bookings) : 0
                },
                statusBreakdown: [],
                dailyPerformance: [],
                insights: {
                    conversionEffectiveness: conversionRate > 20 ? 'excellent' : conversionRate > 10 ? 'good' : 'needs_improvement',
                    revenueComparison: 'converted_higher'
                }
            }
        });
    } catch (error) {
        console.error('❌ Draft Performance Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du chargement des statistiques de draft',
            error: error.message 
        });
    }
});

module.exports = router;
