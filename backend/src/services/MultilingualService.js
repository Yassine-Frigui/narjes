const { executeQuery } = require('../../config/database');

class MultilingualService {
    /**
     * Get services with translations
     * @param {string} language - Language code (fr, en, ar)
     * @param {object} filters - Optional filters
     * @returns {Promise<Array>} Services with translations
     */
    static async getServicesWithTranslations(language = 'fr', filters = {}) {
        let query = `
            SELECT 
                s.id,
                s.service_type,
                s.parent_service_id,
                s.prix,
                s.duree,
                s.image_url,
                s.nombre_sessions,
                s.prix_par_session,
                s.validite_jours,
                s.actif,
                s.populaire,
                s.nouveau,
                s.ordre_affichage,
                s.categorie_id,
                
                -- Translated fields with fallback to French
                COALESCE(st.nom, st_fr.nom) as nom,
                COALESCE(st.description, st_fr.description) as description,
                COALESCE(st.description_detaillee, st_fr.description_detaillee) as description_detaillee,
                COALESCE(st.inclus, st_fr.inclus) as inclus,
                COALESCE(st.contre_indications, st_fr.contre_indications) as contre_indications,
                COALESCE(st.conseils_apres_soin, st_fr.conseils_apres_soin) as conseils_apres_soin,
                
                -- Category information
                c.couleur_theme,
                COALESCE(ct.nom, ct_fr.nom) as categorie,
                
                -- Parent service information
                COALESCE(parent_st.nom, parent_st_fr.nom) as parent_nom
                
            FROM services s
            
            -- Service translations for requested language
            LEFT JOIN services_translations st ON s.id = st.service_id AND st.language_code = ?
            
            -- Service translations fallback to French
            LEFT JOIN services_translations st_fr ON s.id = st_fr.service_id AND st_fr.language_code = 'fr'
            
            -- Category information
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            LEFT JOIN categories_services_translations ct ON c.id = ct.category_id AND ct.language_code = ?
            LEFT JOIN categories_services_translations ct_fr ON c.id = ct_fr.category_id AND ct_fr.language_code = 'fr'
            
            -- Parent service information
            LEFT JOIN services parent ON s.parent_service_id = parent.id
            LEFT JOIN services_translations parent_st ON parent.id = parent_st.service_id AND parent_st.language_code = ?
            LEFT JOIN services_translations parent_st_fr ON parent.id = parent_st_fr.service_id AND parent_st_fr.language_code = 'fr'
            
            WHERE s.actif = TRUE
        `;
        
        const params = [language, language, language];
        
        // Apply filters
        if (filters.service_type) {
            query += ' AND s.service_type = ?';
            params.push(filters.service_type);
        }
        
        if (filters.category_id) {
            query += ' AND s.categorie_id = ?';
            params.push(filters.category_id);
        }
        
        if (filters.popular) {
            query += ' AND s.populaire = TRUE';
        }
        
        if (filters.search) {
            query += ' AND (COALESCE(st.nom, st_fr.nom) LIKE ? OR COALESCE(st.description, st_fr.description) LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        
        query += ' ORDER BY s.ordre_affichage ASC, COALESCE(st.nom, st_fr.nom) ASC';
        
        return await executeQuery(query, params);
    }

    /**
     * Get service by ID with translations
     * @param {number} serviceId - Service ID
     * @param {string} language - Language code
     * @returns {Promise<object>} Service with translations
     */
    static async getServiceByIdWithTranslations(serviceId, language = 'fr') {
        const query = `
            SELECT 
                s.id,
                s.service_type,
                s.parent_service_id,
                s.prix,
                s.duree,
                s.image_url,
                s.nombre_sessions,
                s.prix_par_session,
                s.validite_jours,
                s.actif,
                s.populaire,
                s.nouveau,
                s.ordre_affichage,
                s.categorie_id,
                
                -- Translated fields with fallback to French
                COALESCE(st.nom, st_fr.nom) as nom,
                COALESCE(st.description, st_fr.description) as description,
                COALESCE(st.description_detaillee, st_fr.description_detaillee) as description_detaillee,
                COALESCE(st.inclus, st_fr.inclus) as inclus,
                COALESCE(st.contre_indications, st_fr.contre_indications) as contre_indications,
                COALESCE(st.conseils_apres_soin, st_fr.conseils_apres_soin) as conseils_apres_soin,
                
                -- Category information
                c.couleur_theme,
                COALESCE(ct.nom, ct_fr.nom) as categorie
                
            FROM services s
            
            -- Service translations
            LEFT JOIN services_translations st ON s.id = st.service_id AND st.language_code = ?
            LEFT JOIN services_translations st_fr ON s.id = st_fr.service_id AND st_fr.language_code = 'fr'
            
            -- Category information
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            LEFT JOIN categories_services_translations ct ON c.id = ct.category_id AND ct.language_code = ?
            LEFT JOIN categories_services_translations ct_fr ON c.id = ct_fr.category_id AND ct_fr.language_code = 'fr'
            
            WHERE s.id = ? AND s.actif = TRUE
        `;
        
        const result = await executeQuery(query, [language, language, serviceId]);
        return result[0] || null;
    }

    /**
     * Get categories with translations
     * @param {string} language - Language code
     * @returns {Promise<Array>} Categories with translations
     */
    static async getCategoriesWithTranslations(language = 'fr') {
        const query = `
            SELECT 
                c.id,
                c.couleur_theme,
                c.ordre_affichage,
                c.actif,
                
                -- Translated fields with fallback to French
                COALESCE(ct.nom, ct_fr.nom) as nom,
                COALESCE(ct.description, ct_fr.description) as description
                
            FROM categories_services c
            
            -- Category translations
            LEFT JOIN categories_services_translations ct ON c.id = ct.category_id AND ct.language_code = ?
            LEFT JOIN categories_services_translations ct_fr ON c.id = ct_fr.category_id AND ct_fr.language_code = 'fr'
            
            WHERE c.actif = TRUE
            ORDER BY c.ordre_affichage ASC, COALESCE(ct.nom, ct_fr.nom) ASC
        `;
        
        return await executeQuery(query, [language]);
    }

    /**
     * Get memberships with translations
     * @param {string} language - Language code
     * @returns {Promise<Array>} Memberships with translations
     */
    static async getMembershipsWithTranslations(language = 'fr') {
        const query = `
            SELECT 
                m.id,
                m.prix_mensuel,
                m.duree_engagement,
                m.couleur_theme,
                m.populaire,
                m.actif,
                m.ordre_affichage,
                
                -- Translated fields with fallback to French
                COALESCE(mt.nom, mt_fr.nom) as nom,
                COALESCE(mt.description, mt_fr.description) as description,
                COALESCE(mt.avantages, mt_fr.avantages) as avantages
                
            FROM memberships m
            
            -- Membership translations
            LEFT JOIN memberships_translations mt ON m.id = mt.membership_id AND mt.language_code = ?
            LEFT JOIN memberships_translations mt_fr ON m.id = mt_fr.membership_id AND mt_fr.language_code = 'fr'
            
            WHERE m.actif = TRUE
            ORDER BY m.ordre_affichage ASC
        `;
        
        return await executeQuery(query, [language]);
    }

    /**
     * Get promotions with translations
     * @param {string} language - Language code
     * @returns {Promise<Array>} Promotions with translations
     */
    static async getPromotionsWithTranslations(language = 'fr') {
        const query = `
            SELECT 
                p.id,
                p.type_reduction,
                p.valeur_reduction,
                p.date_debut,
                p.date_fin,
                p.actif,
                p.code_promo,
                
                -- Translated fields with fallback to French
                COALESCE(pt.nom, pt_fr.nom) as nom,
                COALESCE(pt.description, pt_fr.description) as description,
                COALESCE(pt.conditions_utilisation, pt_fr.conditions_utilisation) as conditions_utilisation
                
            FROM promotions p
            
            -- Promotion translations
            LEFT JOIN promotions_translations pt ON p.id = pt.promotion_id AND pt.language_code = ?
            LEFT JOIN promotions_translations pt_fr ON p.id = pt_fr.promotion_id AND pt_fr.language_code = 'fr'
            
            WHERE p.actif = TRUE 
                AND (p.date_debut IS NULL OR p.date_debut <= NOW())
                AND (p.date_fin IS NULL OR p.date_fin >= NOW())
            ORDER BY p.date_debut DESC
        `;
        
        return await executeQuery(query, [language]);
    }

    /**
     * Get salon settings with translations
     * @param {string} language - Language code
     * @returns {Promise<object>} Salon settings with translations
     */
    static async getSalonSettingsWithTranslations(language = 'fr') {
        const query = `
            SELECT 
                ps.id,
                ps.adresse,
                ps.telephone,
                ps.email,
                ps.site_web,
                ps.horaires_ouverture,
                ps.couleur_principale,
                ps.couleur_secondaire,
                ps.logo_url,
                
                -- Translated fields with fallback to French
                COALESCE(pst.nom_salon, pst_fr.nom_salon) as nom_salon,
                COALESCE(pst.message_accueil, pst_fr.message_accueil) as message_accueil,
                COALESCE(pst.politique_annulation, pst_fr.politique_annulation) as politique_annulation,
                COALESCE(pst.cgv, pst_fr.cgv) as cgv
                
            FROM parametres_salon ps
            
            -- Salon settings translations
            LEFT JOIN parametres_salon_translations pst ON ps.id = pst.parametre_id AND pst.language_code = ?
            LEFT JOIN parametres_salon_translations pst_fr ON ps.id = pst_fr.parametre_id AND pst_fr.language_code = 'fr'
            
            ORDER BY ps.id ASC
            LIMIT 1
        `;
        
        const result = await executeQuery(query, [language]);
        return result[0] || null;
    }
}

module.exports = MultilingualService;
