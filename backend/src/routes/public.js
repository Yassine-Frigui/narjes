const express = require('express');
const ServiceModel = require('../models/Service');
const MultilingualService = require('../services/MultilingualService');
const { executeQuery } = require('../../config/database');
const router = express.Router();

// Public routes (accessible without authentication)

// Booking route - Get services for booking page
router.get('/booking', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        // Try to get services with translations first
        let services;
        let categories;
        
        try {
            // Attempt to use MultilingualService for translations
            services = await MultilingualService.getServicesWithTranslations(lang, {
                // Get all service types for booking
            });
            categories = await MultilingualService.getCategoriesWithTranslations(lang);
            
            // Check if we got meaningful data (not just "Service X" fallbacks)
            const hasRealNames = services.some(service => 
                service.nom && !service.nom.startsWith('Service ')
            );
            
            if (!hasRealNames) {
                // Fallback to direct database query
                throw new Error('Translation tables empty, using fallback');
            }
        } catch (translationError) {
            console.log('Translation system not available, using direct database query:', translationError.message);
            
            // Fallback: Get services directly from database with original names
            services = await executeQuery(`
                SELECT s.*, c.nom as categorie_nom, c.couleur_theme 
                FROM services s 
                LEFT JOIN categories_services c ON s.categorie_id = c.id
                WHERE s.actif = 1
                ORDER BY s.ordre_affichage ASC, s.id ASC
            `);
            
            categories = await executeQuery(`
                SELECT * FROM categories_services 
                WHERE actif = TRUE 
                ORDER BY ordre_affichage
            `);
        }
        
        res.json({
            success: true,
            services: services,
            categories: categories,
            language: lang
        });
    } catch (error) {
        console.error('Error fetching booking data:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get all service categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await executeQuery(`
            SELECT * FROM categories_services 
            WHERE actif = TRUE 
            ORDER BY ordre_affichage
        `);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all service categories (alternative route)
router.get('/services/categories/list', async (req, res) => {
    try {
        const categories = await executeQuery(`
            SELECT * FROM categories_services 
            WHERE actif = TRUE 
            ORDER BY ordre_affichage
        `);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all public services
router.get('/services', async (req, res) => {
    try {
        const services = await ServiceModel.getAllServices();
        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get services grouped by category
router.get('/services/grouped', async (req, res) => {
    try {
        const groupedServices = await ServiceModel.getServicesGroupedByCategory();
        res.json(groupedServices);
    } catch (error) {
        console.error('Error fetching grouped services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get popular services
router.get('/services/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const services = await ServiceModel.getPopularServices(limit);
        res.json(services);
    } catch (error) {
        console.error('Error fetching popular services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get featured services (alternative route)
router.get('/services/featured/list', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const services = await ServiceModel.getPopularServices(limit);
        res.json(services);
    } catch (error) {
        console.error('Error fetching featured services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get new services
router.get('/services/new', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const services = await ServiceModel.getNewServices(limit);
        res.json(services);
    } catch (error) {
        console.error('Error fetching new services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get services by category
router.get('/services/category/:categorieId', async (req, res) => {
    try {
        const { categorieId } = req.params;
        const services = await ServiceModel.getServicesByCategory(categorieId);
        res.json(services);
    } catch (error) {
        console.error('Error fetching services by category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get addon services
router.get('/services/addons', async (req, res) => {
    try {
        const addons = await ServiceModel.getAddonServices();
        res.json(addons);
    } catch (error) {
        console.error('Error fetching add-ons:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get memberships
router.get('/memberships', async (req, res) => {
    try {
        const memberships = await executeQuery(`
            SELECT * FROM memberships 
            WHERE actif = TRUE 
            ORDER BY ordre_affichage
        `);
        res.json(memberships);
    } catch (error) {
        console.error('Error fetching memberships:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get specific service
router.get('/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const service = await ServiceModel.getServiceWithOptions(id);
        
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        res.json(service);
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Récupérer les services populaires
router.get('/services-populaires', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const services = await ServiceModel.getPopularServices(limit);
        res.json(services);
    } catch (error) {
        console.error('Erreur lors de la récupération des services populaires:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer les nouveaux services
router.get('/nouveaux-services', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 4;
        const services = await ServiceModel.getNewServices(limit);
        res.json(services);
    } catch (error) {
        console.error('Erreur lors de la récupération des nouveaux services:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer les informations du salon
router.get('/salon-info', async (req, res) => {
    try {
        let salonInfo;
        try {
            salonInfo = await executeQuery(`
                SELECT 
                    nom_salon, adresse, telephone, email, site_web,
                    horaires_ouverture, couleur_principale, couleur_secondaire,
                    logo_url, message_accueil, politique_annulation
                FROM parametres_salon 
                LIMIT 1
            `);
        } catch (dbError) {
            console.error('Error getting salon info, table might not exist:', dbError.message);
            // Provide default values if table doesn't exist
            return res.json({
                nom_salon: 'ZenShe Spa',
                adresse: '9777 Yonge Street, Richmond Hill, ON L4C 1T9, Canada',
                telephone: '9056051188',
                email: 'info@zenshe.ca',
                site_web: 'https://zenshe.ca',
                couleur_principale: '#2e4d4c',
                couleur_secondaire: '#e0e0e0'
            });
        }
        
        if (!salonInfo.length) {
            return res.status(404).json({ message: 'Informations du salon non trouvées' });
        }
        
        // Parser les horaires si c'est du JSON
        const salon = salonInfo[0];
        if (salon.horaires_ouverture && typeof salon.horaires_ouverture === 'string') {
            try {
                salon.horaires_ouverture = JSON.parse(salon.horaires_ouverture);
            } catch (e) {
                console.error('Erreur lors du parsing des horaires:', e);
            }
        }
        
        res.json(salon);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations du salon:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Alternative route for salon settings
router.get('/services/settings/salon', async (req, res) => {
    try {
        let salonInfo;
        try {
            salonInfo = await executeQuery(`
                SELECT 
                    nom_salon, adresse, telephone, email, site_web,
                    horaires_ouverture, couleur_principale, couleur_secondaire,
                    logo_url, message_accueil, politique_annulation
                FROM parametres_salon 
                LIMIT 1
            `);
        } catch (dbError) {
            console.error('Error getting salon info, table might not exist:', dbError.message);
            // Provide default values if table doesn't exist
            return res.json({
                nom_salon: 'ZenShe Spa',
                adresse: '9777 Yonge Street, Richmond Hill, ON L4C 1T9, Canada',
                telephone: '9056051188',
                email: 'info@zenshe.ca',
                site_web: 'https://zenshe.ca',
                couleur_principale: '#2e4d4c',
                couleur_secondaire: '#e0e0e0'
            });
        }
        
        if (!salonInfo.length) {
            return res.json({
                nom_salon: 'ZenShe Spa',
                adresse: '9777 Yonge Street, Richmond Hill, ON L4C 1T9, Canada',
                telephone: '9056051188',
                email: 'info@zenshe.ca',
                site_web: 'https://zenshe.ca',
                couleur_principale: '#2e4d4c',
                couleur_secondaire: '#e0e0e0'
            });
        }
        
        // Parser les horaires si c'est du JSON
        const salon = salonInfo[0];
        if (salon.horaires_ouverture && typeof salon.horaires_ouverture === 'string') {
            try {
                salon.horaires_ouverture = JSON.parse(salon.horaires_ouverture);
            } catch (e) {
                console.error('Erreur lors du parsing des horaires:', e);
            }
        }
        
        res.json(salon);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations du salon:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer les créneaux d'ouverture
router.get('/horaires', async (req, res) => {
    try {
        const horaires = await executeQuery(`
            SELECT jour_semaine, heure_debut, heure_fin
            FROM creneaux_horaires 
            WHERE actif = TRUE
            ORDER BY 
                CASE jour_semaine
                    WHEN 'lundi' THEN 1
                    WHEN 'mardi' THEN 2
                    WHEN 'mercredi' THEN 3
                    WHEN 'jeudi' THEN 4
                    WHEN 'vendredi' THEN 5
                    WHEN 'samedi' THEN 6
                    WHEN 'dimanche' THEN 7
                END
        `);
        
        res.json(horaires);
    } catch (error) {
        console.error('Erreur lors de la récupération des horaires:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Vérifier les jours de fermeture exceptionnelle
router.get('/fermetures/:date', async (req, res) => {
    try {
        const { date } = req.params;
        
        const fermetures = await executeQuery(`
            SELECT date_fermeture, raison, toute_journee, heure_debut, heure_fin
            FROM fermetures_exceptionnelles
            WHERE date_fermeture = ?
        `, [date]);
        
        res.json(fermetures);
    } catch (error) {
        console.error('Erreur lors de la vérification des fermetures:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer les avis clients visibles
router.get('/avis', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        
        let avis = [];
        let notesMoyenne = [{ moyenne: 0, total: 0 }];
        
        try {
            avis = await executeQuery(`
                SELECT 
                    a.note,
                    a.commentaire,
                    a.date_avis,
                    a.reponse_admin,
                    a.date_reponse,
                    CONCAT(c.prenom, ' ', SUBSTRING(c.nom, 1, 1), '.') as client_nom
                FROM avis_clients a
                JOIN clients c ON a.client_id = c.id
                WHERE a.visible = TRUE
                ORDER BY a.date_avis DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
            
            // Calculer la note moyenne
            notesMoyenne = await executeQuery(`
                SELECT AVG(note) as moyenne, COUNT(*) as total
                FROM avis_clients
                WHERE visible = TRUE
            `);
        } catch (dbError) {
            console.error('Error getting reviews, table might not exist:', dbError.message);
            // Return empty reviews if table doesn't exist
        }
        
        res.json({
            avis,
            moyenne: notesMoyenne[0].moyenne || 0,
            total: notesMoyenne[0].total || 0
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des avis:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer les promotions actives
router.get('/promotions', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const promotions = await executeQuery(`
            SELECT 
                p.id, p.nom, p.description, p.type_reduction, p.valeur_reduction,
                p.date_debut, p.date_fin, p.code_promo, p.montant_minimum,
                s.nom as service_nom,
                c.nom as categorie_nom
            FROM promotions p
            LEFT JOIN services s ON p.service_id = s.id
            LEFT JOIN categories_services c ON p.categorie_id = c.id
            WHERE p.actif = TRUE
            AND p.date_debut <= ?
            AND p.date_fin >= ?
            AND (p.nombre_utilisations_max IS NULL OR p.nombre_utilisations_actuelles < p.nombre_utilisations_max)
            ORDER BY p.date_creation DESC
        `, [today, today]);
        
        res.json(promotions);
    } catch (error) {
        console.error('Erreur lors de la récupération des promotions:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

module.exports = router;
