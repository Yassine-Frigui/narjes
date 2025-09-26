const { executeQuery } = require('../../config/database');

class MultilingualService {
    /**
     * Get services (French-only for NBrow Studio)
     * @param {string} language - Language code (always 'fr' for NBrow)
     * @param {object} filters - Optional filters
     * @returns {Promise<Array>} Services
     */
    static async getServicesWithTranslations(language = 'fr', filters = {}) {
        let query = `
            SELECT 
                s.id,
                s.nom,
                s.description,
                s.description_detaillee,
                s.service_type,
                s.parent_service_id,
                s.prix,
                s.duree,
                s.image_url,
                s.inclus,
                s.contre_indications,
                s.conseils_apres_soin,
                s.nombre_sessions,
                s.prix_par_session,
                s.validite_jours,
                s.actif,
                s.populaire,
                s.nouveau,
                s.ordre_affichage,
                
                -- Parent service information
                parent.nom as parent_nom
                
            FROM services s
            
            -- Parent service info (if any)
            LEFT JOIN services parent ON s.parent_service_id = parent.id
            
            WHERE s.actif = TRUE
        `;
        
        const params = [];
        
        // Apply filters
        if (filters.service_type) {
            query += ' AND s.service_type = ?';
            params.push(filters.service_type);
        }
        
        if (filters.popular) {
            query += ' AND s.populaire = TRUE';
        }
        
        if (filters.nouveau) {
            query += ' AND s.nouveau = TRUE';
        }
        
        // Order by display order
        query += ' ORDER BY s.ordre_affichage ASC, s.nom ASC';
        
        try {
            const results = await executeQuery(query, params);
            return results;
        } catch (error) {
            console.error('Error fetching services:', error);
            throw error;
        }
    }

    /**
     * Get single service by ID (French-only for NBrow Studio)
     * @param {number} serviceId - Service ID
     * @param {string} language - Language code (always 'fr' for NBrow)
     * @returns {Promise<Object|null>} Service details
     */
    static async getServiceWithTranslations(serviceId, language = 'fr') {
        const query = `
            SELECT 
                s.id,
                s.nom,
                s.description,
                s.description_detaillee,
                s.service_type,
                s.parent_service_id,
                s.prix,
                s.duree,
                s.image_url,
                s.inclus,
                s.contre_indications,
                s.conseils_apres_soin,
                s.nombre_sessions,
                s.prix_par_session,
                s.validite_jours,
                s.actif,
                s.populaire,
                s.nouveau,
                s.ordre_affichage,
                
                -- Parent service information
                parent.nom as parent_nom
                
            FROM services s
            
            -- Parent service info (if any)
            LEFT JOIN services parent ON s.parent_service_id = parent.id
            
            WHERE s.id = ? AND s.actif = TRUE
        `;
        
        try {
            const results = await executeQuery(query, [serviceId]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Error fetching service:', error);
            throw error;
        }
    }

    /**
     * Get salon parameters (French-only for NBrow Studio)
     * @param {string} language - Language code (always 'fr' for NBrow)
     * @returns {Promise<Object|null>} Salon parameters
     */
    static async getSalonParametersWithTranslations(language = 'fr') {
        const query = `
            SELECT 
                nom_salon,
                adresse,
                telephone,
                email,
                site_web,
                horaires_ouverture,
                couleur_principale,
                couleur_secondaire,
                logo_url,
                message_accueil,
                politique_annulation,
                cgv
            FROM parametres_salon 
            WHERE id = 1
        `;
        
        try {
            const results = await executeQuery(query);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Error fetching salon parameters:', error);
            throw error;
        }
    }

    /**
     * Get categories (removed for NBrow Studio - all services are eyebrow services)
     * @param {string} language - Language code (always 'fr' for NBrow)
     * @returns {Promise<Array>} Empty array (no categories in NBrow)
     */
    static async getCategoriesWithTranslations(language = 'fr') {
        // NBrow Studio doesn't use categories - all services are eyebrow services
        return [];
    }

    /**
     * Get promotions (removed for NBrow Studio - simple pricing model)
     * @param {string} language - Language code (always 'fr' for NBrow)
     * @returns {Promise<Array>} Empty array (no promotions system)
     */
    static async getPromotionsWithTranslations(language = 'fr') {
        // NBrow Studio doesn't use promotions - simple pricing model
        return [];
    }

    /**
     * Get available languages (French-only for NBrow Studio)
     * @returns {Promise<Array>} Available languages
     */
    static async getAvailableLanguages() {
        // NBrow Studio is French-only
        return [
            {
                code: 'fr',
                name: 'Français',
                flag: '🇫🇷',
                default: true
            }
        ];
    }
}

module.exports = MultilingualService;