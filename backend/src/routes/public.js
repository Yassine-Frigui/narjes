const express = require('express');
const router = express.Router();
const ServiceModel = require('../models/Service');
const MultilingualService = require('../services/MultilingualService');

// ============================================================================
// PUBLIC SERVICES ROUTES (No authentication required)
// ============================================================================

// Get all services (public endpoint)
router.get('/', async (req, res) => {
    try {
        const { lang = 'fr', category, service_type, limit } = req.query;
        
        console.log('📋 Public services request:', { lang, category, service_type, limit });
        
        // NBrow Studio - Return mock eyebrow services for testing
        const mockServices = [
            {
                id: 1,
                nom: 'Épilation Sourcils Classique',
                description: 'Épilation précise des sourcils pour un look naturel',
                prix: 25,
                duree: 30,
                category: 'Sourcils',
                color: '#8B4A6B',
                image_url: '/images/sourcils_classique.jpg'
            },
            {
                id: 2,
                nom: 'Restructuration Sourcils',
                description: 'Restructuration complète de la forme des sourcils',
                prix: 35,
                duree: 45,
                category: 'Sourcils',
                color: '#8B4A6B', 
                image_url: '/images/sourcils_restructuration.jpg'
            },
            {
                id: 3,
                nom: 'Teinture Sourcils',
                description: 'Teinture pour intensifier la couleur des sourcils',
                prix: 20,
                duree: 20,
                category: 'Sourcils',
                color: '#8B4A6B',
                image_url: '/images/sourcils_teinture.jpg'
            },
            {
                id: 4,
                nom: 'Lamination Sourcils',
                description: 'Technique de lamination pour des sourcils parfaitement structurés',
                prix: 45,
                duree: 60,
                category: 'Sourcils',
                color: '#8B4A6B',
                image_url: '/images/sourcils_lamination.jpg'
            },
            {
                id: 5,
                nom: 'Soin Sourcils Complet',
                description: 'Soin complet incluant épilation, teinture et restructuration',
                prix: 55,
                duree: 75,
                category: 'Sourcils',
                color: '#8B4A6B',
                image_url: '/images/sourcils_complet.jpg'
            }
        ];
        
        res.json({
            success: true,
            services: mockServices
        });
    } catch (error) {
        console.error('Error fetching public services:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des services',
            services: []
        });
    }
});

// Get single service by ID (public endpoint)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { lang = 'fr' } = req.query;
        
        console.log('📋 Public service by ID request:', { id, lang });
        
        // NBrow Studio - Mock services
        const mockServices = {
            1: { id: 1, nom: 'Épilation Sourcils Classique', description: 'Épilation précise des sourcils pour un look naturel', prix: 25, duree: 30, category: 'Sourcils', color: '#8B4A6B' },
            2: { id: 2, nom: 'Restructuration Sourcils', description: 'Restructuration complète de la forme des sourcils', prix: 35, duree: 45, category: 'Sourcils', color: '#8B4A6B' },
            3: { id: 3, nom: 'Teinture Sourcils', description: 'Teinture pour intensifier la couleur des sourcils', prix: 20, duree: 20, category: 'Sourcils', color: '#8B4A6B' },
            4: { id: 4, nom: 'Lamination Sourcils', description: 'Technique de lamination pour des sourcils parfaitement structurés', prix: 45, duree: 60, category: 'Sourcils', color: '#8B4A6B' },
            5: { id: 5, nom: 'Soin Sourcils Complet', description: 'Soin complet incluant épilation, teinture et restructuration', prix: 55, duree: 75, category: 'Sourcils', color: '#8B4A6B' }
        };
        
        const service = mockServices[id];
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service non trouvé'
            });
        }
        
        res.json({
            success: true,
            service
        });
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du service'
        });
    }
});

// Get featured/popular services (public endpoint)
router.get('/featured/list', async (req, res) => {
    try {
        const { limit = 6, lang = 'fr' } = req.query;
        
        console.log('📋 Featured services request:', { limit, lang });
        
        // NBrow Studio - Return top eyebrow services as featured
        const featuredServices = [
            { id: 4, nom: 'Lamination Sourcils', description: 'Technique de lamination pour des sourcils parfaitement structurés', prix: 45, duree: 60, category: 'Sourcils', color: '#8B4A6B', featured: true },
            { id: 5, nom: 'Soin Sourcils Complet', description: 'Soin complet incluant épilation, teinture et restructuration', prix: 55, duree: 75, category: 'Sourcils', color: '#8B4A6B', featured: true },
            { id: 2, nom: 'Restructuration Sourcils', description: 'Restructuration complète de la forme des sourcils', prix: 35, duree: 45, category: 'Sourcils', color: '#8B4A6B', featured: true }
        ];
        
        res.json({
            success: true,
            services: featuredServices.slice(0, parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching featured services:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des services populaires',
            services: []
        });
    }
});

// Get service categories (public endpoint) - NBrow Studio: returns Sourcils only
router.get('/categories/list', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        console.log('📋 Categories request:', { lang });
        
        // NBrow Studio - Only eyebrow services category
        const categories = [
            {
                id: 1,
                nom: 'Sourcils',
                description: 'Services spécialisés pour sourcils',
                color: '#8B4A6B',
                icon: 'eyebrow-icon'
            }
        ];
        
        res.json({
            success: true,
            categories: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des catégories',
            categories: []
        });
    }
});

// Get memberships (public endpoint) - NBrow Studio: not used
router.get('/memberships/list', async (req, res) => {
    try {
        // NBrow Studio doesn't use memberships
        res.json({
            success: true,
            memberships: []
        });
    } catch (error) {
        console.error('Error fetching memberships:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des abonnements',
            memberships: []
        });
    }
});

// Get salon settings (public endpoint)
router.get('/settings/salon', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        console.log('📋 Salon settings request:', { lang });
        
        // NBrow Studio - Basic salon information
        const settings = {
            nom_salon: "NBrow Studio by Narjes",
            adresse: "Tunis, Tunisie",
            telephone: "+216 XX XXX XXX",
            email: "contact@nbrowstudio.tn",
            horaires: {
                lundi: "9h00 - 18h00",
                mardi: "9h00 - 18h00", 
                mercredi: "9h00 - 18h00",
                jeudi: "9h00 - 18h00",
                vendredi: "9h00 - 18h00",
                samedi: "9h00 - 17h00",
                dimanche: "Fermé"
            },
            couleur_theme: "#8B4A6B",
            specialite: "Soins spécialisés pour sourcils"
        };
        
        res.json({
            success: true,
            settings: settings
        });
    } catch (error) {
        console.error('Error fetching salon settings:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des paramètres du salon',
            settings: {}
        });
    }
});

// Get promotions (public endpoint) - NBrow Studio: not used
router.get('/promotions/list', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        console.log('📋 Promotions request:', { lang });
        
        // NBrow Studio doesn't use promotions
        res.json({
            success: true,
            promotions: []
        });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des promotions',
            promotions: []
        });
    }
});

module.exports = router;