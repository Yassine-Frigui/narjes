const { executeQuery, executeTransaction } = require('../../config/database');

class ClientModel {
    // Créer un nouveau client
    static async createClient(clientData) {
        const {
            nom,
            prenom,
            email,
            telephone,
            date_naissance,
            adresse,
            notes,
            mot_de_passe,
            email_verifie = false,
            statut = 'actif',
            langue_preferee = 'fr'
        } = clientData;

        const query = `
            INSERT INTO clients 
            (nom, prenom, email, telephone, date_naissance, adresse, notes, 
             mot_de_passe, email_verifie, statut, langue_preferee)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Convert undefined to null for MySQL
        const result = await executeQuery(query, [
            nom || null, 
            prenom || null, 
            email || null, 
            telephone || null, 
            date_naissance || null, 
            adresse || null, 
            notes || null,
            mot_de_passe || null,
            email_verifie,
            statut,
            langue_preferee
        ]);
        
        return result.insertId;
    }

    // Récupérer un client par ID
    static async getClientById(id) {
        const query = `
            SELECT 
                id, nom, prenom, email, telephone, date_naissance,
                adresse, notes, email_verifie, statut, langue_preferee,
                date_creation, actif
            FROM clients 
            WHERE id = ? AND actif = TRUE
        `;
        const result = await executeQuery(query, [id]);
        return result[0];
    }

    // Récupérer un client par email
    static async getClientByEmail(email) {
        const query = `
            SELECT 
                id, nom, prenom, email, telephone, date_naissance,
                adresse, notes, date_creation, actif
            FROM clients 
            WHERE email = ? AND actif = TRUE
        `;
        const result = await executeQuery(query, [email]);
        return result[0];
    }

    // Récupérer un client par email (pour password reset - inclut les comptes inactifs)
    static async findByEmail(email) {
        const query = `
            SELECT 
                id, nom, prenom, email, telephone, date_naissance,
                adresse, notes, date_creation, actif
            FROM clients 
            WHERE email = ?
        `;
        const result = await executeQuery(query, [email]);
        return result[0];
    }

    // Récupérer tous les clients avec pagination
    static async getAllClients(page = 1, limit = 20, search = '') {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE actif = TRUE';
        let params = [];

        if (search) {
            whereClause += ` AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR telephone LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const query = `
            SELECT 
                id, nom, prenom, email, telephone, date_naissance,
                adresse, date_creation,
                (SELECT COUNT(*) FROM reservations WHERE client_id = clients.id) as nombre_reservations,
                (SELECT MAX(date_reservation) FROM reservations WHERE client_id = clients.id) as derniere_visite
            FROM clients 
            ${whereClause}
            ORDER BY date_creation DESC
            LIMIT ? OFFSET ?
        `;
        
        params.push(limit, offset);
        return await executeQuery(query, params);
    }

    // Compter le nombre total de clients
    static async getClientCount(search = '') {
        let whereClause = 'WHERE actif = TRUE';
        let params = [];

        if (search) {
            whereClause += ` AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const query = `SELECT COUNT(*) as total FROM clients ${whereClause}`;
        const result = await executeQuery(query, params);
        return result[0].total;
    }

    // Mettre à jour un client
    static async updateClient(id, clientData) {
        const {
            nom,
            prenom,
            email,
            telephone,
            date_naissance,
            adresse,
            notes
        } = clientData;

        const query = `
            UPDATE clients 
            SET nom = ?, prenom = ?, email = ?, telephone = ?, date_naissance = ?,
                adresse = ?, notes = ?, date_modification = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        // Convert undefined to null for MySQL
        return await executeQuery(query, [
            nom || null, 
            prenom || null, 
            email || null, 
            telephone || null, 
            date_naissance || null,
            adresse || null, 
            notes || null, 
            id
        ]);
    }

    // Supprimer un client (soft delete)
    static async deleteClient(id) {
        const query = 'UPDATE clients SET actif = FALSE WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    // Vérifier si un email existe déjà
    static async emailExists(email, excludeId = null) {
        let query = 'SELECT id FROM clients WHERE email = ? AND actif = TRUE';
        let params = [email];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const result = await executeQuery(query, params);
        return result.length > 0;
    }

    // Récupérer l'historique des réservations d'un client
    static async getClientReservations(clientId, limit = 10) {
        const query = `
            SELECT 
                r.id,
                r.date_reservation,
                r.heure_debut,
                r.heure_fin,
                r.statut,
                r.prix_final,
                r.notes_client,
                s.nom as service_nom,
                s.description as service_description
            FROM reservations r
            JOIN services s ON r.service_id = s.id
            WHERE r.client_id = ?
            ORDER BY r.date_reservation DESC, r.heure_debut DESC
            LIMIT ?
        `;
        return await executeQuery(query, [clientId, limit]);
    }

    // Récupérer les statistiques d'un client
    static async getClientStats(clientId) {
        const queries = [
            // Nombre total de réservations
            `SELECT COUNT(*) as total_reservations FROM reservations WHERE client_id = ?`,
            
            // Nombre de réservations terminées
            `SELECT COUNT(*) as reservations_terminees FROM reservations WHERE client_id = ? AND statut = 'terminee'`,
            
            // Montant total dépensé
            `SELECT SUM(prix_final) as montant_total FROM reservations WHERE client_id = ? AND statut = 'terminee'`,
            
            // Service le plus réservé
            `SELECT s.nom, COUNT(*) as nombre FROM reservations r 
             JOIN services s ON r.service_id = s.id 
             WHERE r.client_id = ? 
             GROUP BY s.id, s.nom 
             ORDER BY nombre DESC LIMIT 1`
        ];

        const results = await Promise.all(
            queries.map(query => executeQuery(query, [clientId]))
        );

        return {
            total_reservations: results[0][0].total_reservations,
            reservations_terminees: results[1][0].reservations_terminees,
            montant_total: results[2][0].montant_total || 0,
            service_prefere: results[3][0] || null
        };
    }
}

module.exports = ClientModel;
