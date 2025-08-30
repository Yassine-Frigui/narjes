const { executeQuery } = require('../../config/database');

class MembershipModel {
    // Récupérer toutes les adhésions actives
    static async getAllMemberships() {
        const query = `
            SELECT 
                id,
                nom,
                prix_mensuel,
                prix_3_mois,
                services_par_mois,
                description,
                avantages,
                actif,
                date_creation
            FROM memberships
            WHERE actif = TRUE
            ORDER BY prix_mensuel ASC
        `;
        return await executeQuery(query);
    }

    // Récupérer une adhésion par ID
    static async getMembershipById(id) {
        const query = `
            SELECT *
            FROM memberships
            WHERE id = ? AND actif = TRUE
        `;
        const result = await executeQuery(query, [id]);
        return result[0];
    }

    // Créer une nouvelle adhésion
    static async createMembership(membershipData) {
        const { 
            nom, 
            prix_mensuel, 
            prix_3_mois,
            services_par_mois,
            description,
            avantages
        } = membershipData;

        const query = `
            INSERT INTO memberships 
            (nom, prix_mensuel, prix_3_mois, services_par_mois, description, avantages)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(query, [
            nom, prix_mensuel, prix_3_mois, services_par_mois, description, avantages
        ]);
        return result.insertId;
    }

    // Mettre à jour une adhésion
    static async updateMembership(id, membershipData) {
        const { 
            nom, 
            prix_mensuel, 
            prix_3_mois,
            services_par_mois,
            description,
            avantages,
            actif 
        } = membershipData;

        const query = `
            UPDATE memberships 
            SET nom = ?, prix_mensuel = ?, prix_3_mois = ?, services_par_mois = ?, 
                description = ?, avantages = ?, actif = ?
            WHERE id = ?
        `;
        
        return await executeQuery(query, [
            nom, prix_mensuel, prix_3_mois, services_par_mois, description, avantages, actif, id
        ]);
    }

    // Supprimer une adhésion (soft delete)
    static async deleteMembership(id) {
        const query = 'UPDATE memberships SET actif = FALSE WHERE id = ?';
        return await executeQuery(query, [id]);
    }
}

module.exports = MembershipModel;
