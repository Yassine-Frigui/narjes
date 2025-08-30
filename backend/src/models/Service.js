const { executeQuery, executeTransaction } = require('../../config/database');

class ServiceModel {
    // ============================================================================
    // BASIC CRUD OPERATIONS
    // ============================================================================

    // Get all services with optional type filtering
    static async getAllServices(serviceType = null, includeInactive = false) {
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
                c.nom as categorie,
                c.couleur_theme,
                c.id as categorie_id,
                parent.nom as parent_nom
            FROM services s
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            LEFT JOIN services parent ON s.parent_service_id = parent.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (serviceType) {
            query += ' AND s.service_type = ?';
            params.push(serviceType);
        }
        
        if (!includeInactive) {
            query += ' AND s.actif = TRUE';
        }
        
        query += ' ORDER BY s.service_type, s.ordre_affichage, s.nom';
        
        return await executeQuery(query, params);
    }

    // Get service by ID
    static async getServiceById(id) {
        const query = `
            SELECT 
                s.*,
                c.nom as categorie,
                c.couleur_theme,
                parent.nom as parent_nom
            FROM services s
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            LEFT JOIN services parent ON s.parent_service_id = parent.id
            WHERE s.id = ? AND s.actif = TRUE
        `;
        const result = await executeQuery(query, [id]);
        return result[0];
    }

    // Create new service
    static async createService(serviceData) {
        const {
            nom,
            description,
            description_detaillee,
            service_type = 'base',
            parent_service_id,
            categorie_id,
            prix,
            duree,
            image_url,
            inclus,
            contre_indications,
            conseils_apres_soin,
            nombre_sessions,
            prix_par_session,
            validite_jours,
            populaire = false,
            nouveau = false,
            ordre_affichage = 0
        } = serviceData;

        const query = `
            INSERT INTO services 
            (nom, description, description_detaillee, service_type, parent_service_id, categorie_id,
             prix, duree, image_url, inclus, contre_indications, conseils_apres_soin,
             nombre_sessions, prix_par_session, validite_jours, populaire, nouveau, ordre_affichage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(query, [
            nom, description, description_detaillee, service_type, parent_service_id || null, categorie_id,
            prix, duree, image_url, inclus, contre_indications, conseils_apres_soin,
            nombre_sessions || null, prix_par_session || null, validite_jours || null,
            populaire, nouveau, ordre_affichage
        ]);
        
        return result.insertId;
    }

    // Update service
    static async updateService(id, serviceData) {
        const {
            nom,
            description,
            description_detaillee,
            service_type,
            parent_service_id,
            categorie_id,
            prix,
            duree,
            image_url,
            inclus,
            contre_indications,
            conseils_apres_soin,
            nombre_sessions,
            prix_par_session,
            validite_jours,
            populaire,
            nouveau,
            ordre_affichage,
            actif
        } = serviceData;

        const query = `
            UPDATE services 
            SET nom = ?, description = ?, description_detaillee = ?, service_type = ?,
                parent_service_id = ?, categorie_id = ?, prix = ?, duree = ?, image_url = ?,
                inclus = ?, contre_indications = ?, conseils_apres_soin = ?,
                nombre_sessions = ?, prix_par_session = ?, validite_jours = ?,
                populaire = ?, nouveau = ?, ordre_affichage = ?, actif = ?
            WHERE id = ?
        `;
        
        return await executeQuery(query, [
            nom, description, description_detaillee, service_type, parent_service_id || null,
            categorie_id, prix, duree, image_url, inclus, contre_indications, conseils_apres_soin,
            nombre_sessions || null, prix_par_session || null, validite_jours || null,
            populaire, nouveau, ordre_affichage, actif, id
        ]);
    }

    // Delete service (soft delete)
    static async deleteService(id) {
        const query = 'UPDATE services SET actif = FALSE WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    // ============================================================================
    // SPECIALIZED QUERIES BY SERVICE TYPE
    // ============================================================================

    // Get base services only
    static async getBaseServices() {
        return await this.getAllServices('base');
    }

    // Get service variants for a parent service
    static async getServiceVariants(parentServiceId) {
        const query = `
            SELECT 
                s.id,
                s.nom,
                s.description,
                s.prix,
                s.duree,
                s.ordre_affichage,
                s.actif,
                parent.nom as parent_nom
            FROM services s
            JOIN services parent ON s.parent_service_id = parent.id
            WHERE s.parent_service_id = ? AND s.service_type = 'variant' AND s.actif = TRUE
            ORDER BY s.ordre_affichage, s.prix
        `;
        return await executeQuery(query, [parentServiceId]);
    }

    // Get service packages for a parent service
    static async getServicePackages(parentServiceId) {
        const query = `
            SELECT 
                s.id,
                s.nom,
                s.description,
                s.prix,
                s.duree,
                s.nombre_sessions,
                s.prix_par_session,
                s.validite_jours,
                s.ordre_affichage,
                s.actif,
                parent.nom as parent_nom
            FROM services s
            JOIN services parent ON s.parent_service_id = parent.id
            WHERE s.parent_service_id = ? AND s.service_type = 'package' AND s.actif = TRUE
            ORDER BY s.ordre_affichage, s.nombre_sessions
        `;
        return await executeQuery(query, [parentServiceId]);
    }

    // Get addon services
    static async getAddonServices() {
        return await this.getAllServices('addon');
    }

    // ============================================================================
    // COMPLEX QUERIES WITH RELATIONSHIPS
    // ============================================================================

    // Get service with all its variants and packages
    static async getServiceWithOptions(serviceId) {
        const baseService = await this.getServiceById(serviceId);
        if (!baseService) return null;

        // Get variants if this is a base service
        const variants = baseService.service_type === 'base' 
            ? await this.getServiceVariants(serviceId)
            : [];

        // Get packages if this is a base service
        const packages = baseService.service_type === 'base'
            ? await this.getServicePackages(serviceId)
            : [];

        return {
            ...baseService,
            variants,
            packages
        };
    }

    // Get services by category with their variants and packages
    static async getServicesByCategory(categoryId) {
        const baseServices = await executeQuery(`
            SELECT 
                s.id,
                s.nom,
                s.description,
                s.description_detaillee,
                s.prix,
                s.duree,
                s.image_url,
                s.populaire,
                s.nouveau
            FROM services s
            WHERE s.categorie_id = ? AND s.service_type = 'base' AND s.actif = TRUE
            ORDER BY s.ordre_affichage, s.nom
        `, [categoryId]);

        // For each base service, get its variants and packages
        const servicesWithOptions = [];
        for (const service of baseServices) {
            const variants = await this.getServiceVariants(service.id);
            const packages = await this.getServicePackages(service.id);
            
            servicesWithOptions.push({
                ...service,
                variants,
                packages
            });
        }

        return servicesWithOptions;
    }

    // ============================================================================
    // POPULAR AND NEW SERVICES
    // ============================================================================

    // Get popular services
    static async getPopularServices(limit = 6) {
        const query = `
            SELECT 
                s.id,
                s.nom,
                s.description,
                s.prix,
                s.duree,
                s.image_url,
                s.service_type,
                c.nom as categorie,
                c.couleur_theme,
                parent.nom as parent_nom
            FROM services s
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            LEFT JOIN services parent ON s.parent_service_id = parent.id
            WHERE s.actif = TRUE AND s.populaire = TRUE
            ORDER BY s.ordre_affichage, s.nom
            LIMIT ?
        `;
        return await executeQuery(query, [limit]);
    }

    // Get new services
    static async getNewServices(limit = 4) {
        const query = `
            SELECT 
                s.id,
                s.nom,
                s.description,
                s.prix,
                s.duree,
                s.image_url,
                s.service_type,
                c.nom as categorie,
                c.couleur_theme,
                parent.nom as parent_nom
            FROM services s
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            LEFT JOIN services parent ON s.parent_service_id = parent.id
            WHERE s.actif = TRUE AND s.nouveau = TRUE
            ORDER BY s.date_creation DESC
            LIMIT ?
        `;
        return await executeQuery(query, [limit]);
    }

    // ============================================================================
    // MULTILINGUAL TRANSLATION METHODS
    // ============================================================================

    // Get categories for form dropdowns
    static async getCategories() {
        const query = `
            SELECT id, nom, couleur_theme, ordre_affichage
            FROM categories_services 
            WHERE actif = TRUE 
            ORDER BY ordre_affichage, nom
        `;
        return await executeQuery(query);
    }

    // Get service with all translations
    static async getServiceWithTranslations(id) {
        const query = `
            SELECT 
                s.id,
                s.service_type,
                s.parent_service_id,
                s.categorie_id,
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
                c.nom as categorie_nom,
                c.couleur_theme
            FROM services s
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            WHERE s.id = ?
        `;
        
        const service = await executeQuery(query, [id]);
        if (!service.length) return null;

        const serviceData = service[0];

        // Get all translations
        const translationsQuery = `
            SELECT language_code, nom, description, description_detaillee, 
                   inclus, contre_indications, conseils_apres_soin
            FROM services_translations 
            WHERE service_id = ?
        `;
        
        const translations = await executeQuery(translationsQuery, [id]);
        
        // Organize translations by language
        const translationsByLang = {
            fr: { nom: '', description: '', description_detaillee: '', inclus: '', contre_indications: '', conseils_apres_soin: '' },
            en: { nom: '', description: '', description_detaillee: '', inclus: '', contre_indications: '', conseils_apres_soin: '' },
            ar: { nom: '', description: '', description_detaillee: '', inclus: '', contre_indications: '', conseils_apres_soin: '' }
        };

        translations.forEach(trans => {
            if (translationsByLang[trans.language_code]) {
                translationsByLang[trans.language_code] = {
                    nom: trans.nom || '',
                    description: trans.description || '',
                    description_detaillee: trans.description_detaillee || '',
                    inclus: trans.inclus || '',
                    contre_indications: trans.contre_indications || '',
                    conseils_apres_soin: trans.conseils_apres_soin || ''
                };
            }
        });

        return {
            ...serviceData,
            translations: translationsByLang
        };
    }

    // Create service with translations
    static async createServiceWithTranslations(serviceData) {
        const {
            service_type = 'base',
            parent_service_id,
            categorie_id,
            prix,
            duree,
            image_url,
            nombre_sessions,
            prix_par_session,
            validite_jours,
            populaire = false,
            nouveau = false,
            ordre_affichage = 0,
            actif = true,
            translations
        } = serviceData;

        return await executeTransaction(async (connection) => {
            // Insert base service
            const serviceQuery = `
                INSERT INTO services 
                (service_type, parent_service_id, categorie_id, prix, duree, image_url,
                 nombre_sessions, prix_par_session, validite_jours, populaire, nouveau,
                 ordre_affichage, actif, date_creation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            const serviceResult = await connection.query(serviceQuery, [
                service_type,
                parent_service_id || null,
                categorie_id,
                prix,
                duree,
                image_url || null,
                nombre_sessions || null,
                prix_par_session || null,
                validite_jours || null,
                populaire,
                nouveau,
                ordre_affichage,
                actif
            ]);

            const serviceId = serviceResult.insertId;

            // Insert translations
            if (translations) {
                for (const [langCode, translation] of Object.entries(translations)) {
                    if (translation.nom) { // Only insert if name is provided
                        const translationQuery = `
                            INSERT INTO services_translations 
                            (service_id, language_code, nom, description, description_detaillee,
                             inclus, contre_indications, conseils_apres_soin)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            nom = VALUES(nom),
                            description = VALUES(description),
                            description_detaillee = VALUES(description_detaillee),
                            inclus = VALUES(inclus),
                            contre_indications = VALUES(contre_indications),
                            conseils_apres_soin = VALUES(conseils_apres_soin)
                        `;

                        await connection.query(translationQuery, [
                            serviceId,
                            langCode,
                            translation.nom || '',
                            translation.description || '',
                            translation.description_detaillee || '',
                            translation.inclus || '',
                            translation.contre_indications || '',
                            translation.conseils_apres_soin || ''
                        ]);
                    }
                }
            }

            return serviceId;
        });
    }

    // Update service with translations
    static async updateServiceWithTranslations(id, serviceData) {
        const {
            service_type,
            parent_service_id,
            categorie_id,
            prix,
            duree,
            image_url,
            nombre_sessions,
            prix_par_session,
            validite_jours,
            populaire,
            nouveau,
            ordre_affichage,
            actif,
            translations
        } = serviceData;

        return await executeTransaction(async (connection) => {
            // Update base service
            const serviceQuery = `
                UPDATE services SET
                service_type = ?, parent_service_id = ?, categorie_id = ?, prix = ?, 
                duree = ?, image_url = ?, nombre_sessions = ?, prix_par_session = ?,
                validite_jours = ?, populaire = ?, nouveau = ?, ordre_affichage = ?, 
                actif = ?, date_modification = NOW()
                WHERE id = ?
            `;
            
            await connection.query(serviceQuery, [
                service_type,
                parent_service_id || null,
                categorie_id,
                prix,
                duree,
                image_url || null,
                nombre_sessions || null,
                prix_par_session || null,
                validite_jours || null,
                populaire,
                nouveau,
                ordre_affichage,
                actif,
                id
            ]);

            // Update translations
            if (translations) {
                for (const [langCode, translation] of Object.entries(translations)) {
                    if (translation.nom) { // Only update if name is provided
                        const translationQuery = `
                            INSERT INTO services_translations 
                            (service_id, language_code, nom, description, description_detaillee,
                             inclus, contre_indications, conseils_apres_soin)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            nom = VALUES(nom),
                            description = VALUES(description),
                            description_detaillee = VALUES(description_detaillee),
                            inclus = VALUES(inclus),
                            contre_indications = VALUES(contre_indications),
                            conseils_apres_soin = VALUES(conseils_apres_soin)
                        `;

                        await connection.query(translationQuery, [
                            id,
                            langCode,
                            translation.nom || '',
                            translation.description || '',
                            translation.description_detaillee || '',
                            translation.inclus || '',
                            translation.contre_indications || '',
                            translation.conseils_apres_soin || ''
                        ]);
                    }
                }
            }

            return id;
        });
    }

    // ============================================================================
    // LEGACY COMPATIBILITY METHODS
    // ============================================================================

    // For backward compatibility - get services grouped by category
    static async getServicesGroupedByCategory() {
        const categories = await executeQuery(`
            SELECT * FROM categories_services 
            WHERE actif = TRUE 
            ORDER BY ordre_affichage
        `);

        const result = [];
        for (const category of categories) {
            const services = await this.getServicesByCategory(category.id);
            result.push({
                ...category,
                services
            });
        }

        return result;
    }
}

module.exports = ServiceModel;
