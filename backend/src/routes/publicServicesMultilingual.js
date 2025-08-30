const express = require('express');
const { executeQuery } = require('../../config/database');
const router = express.Router();

// Helper function to get translated content with fallback
const getTranslatedContent = async (tableName, entityId, lang = 'fr', fields = []) => {
    try {
        // Try to get content in requested language
        const fieldsStr = fields.join(', ');
        let query = `SELECT ${fieldsStr} FROM ${tableName}_translations WHERE ${tableName.replace('_translations', '')}_id = ? AND language_code = ?`;
        let result = await executeQuery(query, [entityId, lang]);
        
        // If not found and not French, fallback to French
        if (result.length === 0 && lang !== 'fr') {
            result = await executeQuery(query, [entityId, 'fr']);
        }
        
        return result[0] || null;
    } catch (error) {
        console.error('Error getting translated content:', error);
        return null;
    }
};

// Public routes for services (accessible without authentication)

// Get all services with translations
router.get('/', async (req, res) => {
    try {
        const { category, search, limit = 10, offset = 0, lang = 'fr' } = req.query;
        
        // Get base service data
        let query = `
            SELECT s.id, s.prix, s.duree, s.categorie_id, s.actif, s.service_type, s.populaire, s.nouveau,
                   c.couleur_theme as category_color
            FROM services s 
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            WHERE s.actif = 1
        `;
        let params = [];
        
        if (category) {
            query += ' AND s.categorie_id = ?';
            params.push(category);
        }
        
        query += ' ORDER BY s.ordre_affichage ASC, s.id ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const services = await executeQuery(query, params);
        
        // Get translations for each service
        const servicesWithTranslations = await Promise.all(
            services.map(async (service) => {
                const translation = await getTranslatedContent(
                    'services', 
                    service.id, 
                    lang, 
                    ['nom', 'description', 'description_detaillee', 'inclus']
                );
                
                return {
                    ...service,
                    nom: translation?.nom || `Service ${service.id}`,
                    description: translation?.description || '',
                    description_detaillee: translation?.description_detaillee || '',
                    inclus: translation?.inclus || ''
                };
            })
        );
        
        // Apply search filter on translated content
        let filteredServices = servicesWithTranslations;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredServices = servicesWithTranslations.filter(service => 
                service.nom.toLowerCase().includes(searchLower) ||
                service.description.toLowerCase().includes(searchLower)
            );
        }
        
        res.json({
            success: true,
            services: filteredServices,
            language: lang,
            total: filteredServices.length
        });
        
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching services',
            error: error.message
        });
    }
});

// Get service by ID with translations
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { lang = 'fr' } = req.query;
        
        // Get base service data
        const query = `
            SELECT s.*, c.couleur_theme as category_color
            FROM services s 
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            WHERE s.id = ? AND s.actif = 1
        `;
        
        const services = await executeQuery(query, [id]);
        
        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        
        const service = services[0];
        
        // Get translation
        const translation = await getTranslatedContent(
            'services', 
            service.id, 
            lang, 
            ['nom', 'description', 'description_detaillee', 'inclus', 'contre_indications', 'conseils_apres_soin']
        );
        
        const serviceWithTranslation = {
            ...service,
            nom: translation?.nom || `Service ${service.id}`,
            description: translation?.description || '',
            description_detaillee: translation?.description_detaillee || '',
            inclus: translation?.inclus || '',
            contre_indications: translation?.contre_indications || '',
            conseils_apres_soin: translation?.conseils_apres_soin || ''
        };
        
        res.json({
            success: true,
            service: serviceWithTranslation,
            language: lang
        });
        
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching service',
            error: error.message
        });
    }
});

// Get all categories with translations
router.get('/categories/all', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        // Get base categories
        const query = 'SELECT * FROM categories_services WHERE actif = 1 ORDER BY ordre_affichage ASC';
        const categories = await executeQuery(query);
        
        // Get translations for each category
        const categoriesWithTranslations = await Promise.all(
            categories.map(async (category) => {
                const translation = await getTranslatedContent(
                    'categories_services', 
                    category.id, 
                    lang, 
                    ['nom', 'description']
                );
                
                return {
                    ...category,
                    nom: translation?.nom || `Category ${category.id}`,
                    description: translation?.description || ''
                };
            })
        );
        
        res.json({
            success: true,
            categories: categoriesWithTranslations,
            language: lang
        });
        
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
});

// Get featured/popular services
router.get('/featured/popular', async (req, res) => {
    try {
        const { lang = 'fr', limit = 6 } = req.query;
        
        // Get popular services
        const query = `
            SELECT s.*, c.couleur_theme as category_color
            FROM services s 
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            WHERE s.actif = 1 AND s.populaire = 1
            ORDER BY s.ordre_affichage ASC
            LIMIT ?
        `;
        
        const services = await executeQuery(query, [parseInt(limit)]);
        
        // Get translations for each service
        const servicesWithTranslations = await Promise.all(
            services.map(async (service) => {
                const translation = await getTranslatedContent(
                    'services', 
                    service.id, 
                    lang, 
                    ['nom', 'description', 'inclus']
                );
                
                return {
                    ...service,
                    nom: translation?.nom || `Service ${service.id}`,
                    description: translation?.description || '',
                    inclus: translation?.inclus || ''
                };
            })
        );
        
        res.json({
            success: true,
            services: servicesWithTranslations,
            language: lang
        });
        
    } catch (error) {
        console.error('Error fetching featured services:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching featured services',
            error: error.message
        });
    }
});

module.exports = router;
