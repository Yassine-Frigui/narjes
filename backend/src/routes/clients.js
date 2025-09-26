const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const { executeQuery } = require('../../config/database');

// All routes require admin authentication
router.use(authenticateAdmin);

// ============================================================================
// CLIENTS MANAGEMENT ROUTES - NBrow Studio
// ============================================================================

// Get all clients with pagination and search
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        console.log('📋 Clients request:', { page, limit, search, offset });
        
        // For now, return mock client data since we need to set up the clients table properly
        const mockClients = [
            {
                id: 1,
                nom: 'Dupont',
                prenom: 'Marie',
                telephone: '+216 XX XXX XXX',
                email: 'marie.dupont@email.com',
                date_creation: '2025-09-01',
                actif: true,
                nb_reservations: 3,
                derniere_visite: '2025-09-20'
            },
            {
                id: 2,
                nom: 'Ben Ali',
                prenom: 'Fatma',
                telephone: '+216 XX XXX XXY',
                email: 'fatma.benali@email.com',
                date_creation: '2025-09-05',
                actif: true,
                nb_reservations: 2,
                derniere_visite: '2025-09-18'
            },
            {
                id: 3,
                nom: 'Trabelsi',
                prenom: 'Leila',
                telephone: '+216 XX XXX XXZ',
                email: 'leila.trabelsi@email.com',
                date_creation: '2025-09-10',
                actif: true,
                nb_reservations: 1,
                derniere_visite: '2025-09-15'
            }
        ];
        
        // Filter by search if provided
        let filteredClients = mockClients;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredClients = mockClients.filter(client => 
                client.nom.toLowerCase().includes(searchLower) ||
                client.prenom.toLowerCase().includes(searchLower) ||
                client.telephone.includes(search) ||
                client.email.toLowerCase().includes(searchLower)
            );
        }
        
        // Apply pagination
        const total = filteredClients.length;
        const paginatedClients = filteredClients.slice(offset, offset + parseInt(limit));
        
        res.json({
            success: true,
            clients: paginatedClients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des clients'
        });
    }
});

// Get single client by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('📋 Client by ID request:', { id });
        
        // Mock client data
        const mockClient = {
            id: parseInt(id),
            nom: 'Dupont',
            prenom: 'Marie',
            telephone: '+216 XX XXX XXX',
            email: 'marie.dupont@email.com',
            date_creation: '2025-09-01',
            actif: true,
            nb_reservations: 3,
            derniere_visite: '2025-09-20',
            adresse: 'Tunis, Tunisie',
            date_naissance: '1990-05-15',
            notes: 'Cliente fidèle, préfère les rendez-vous en matinée'
        };
        
        res.json({
            success: true,
            client: mockClient
        });
        
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du client'
        });
    }
});

// Create new client
router.post('/', async (req, res) => {
    try {
        const { nom, prenom, telephone, email, adresse, date_naissance, notes } = req.body;
        
        console.log('📋 Create client request:', { nom, prenom, telephone, email });
        
        // Mock client creation
        const newClient = {
            id: Math.floor(Math.random() * 1000) + 100,
            nom,
            prenom,
            telephone,
            email,
            adresse,
            date_naissance,
            notes,
            date_creation: new Date().toISOString().split('T')[0],
            actif: true,
            nb_reservations: 0,
            derniere_visite: null
        };
        
        res.status(201).json({
            success: true,
            client: newClient,
            message: 'Client créé avec succès'
        });
        
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du client'
        });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        console.log('📋 Update client request:', { id, updateData });
        
        // Mock client update
        const updatedClient = {
            id: parseInt(id),
            ...updateData,
            date_modification: new Date().toISOString().split('T')[0]
        };
        
        res.json({
            success: true,
            client: updatedClient,
            message: 'Client mis à jour avec succès'
        });
        
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du client'
        });
    }
});

// Delete/deactivate client
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('📋 Delete client request:', { id });
        
        // Mock client deletion (deactivation)
        res.json({
            success: true,
            message: 'Client désactivé avec succès'
        });
        
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du client'
        });
    }
});

module.exports = router;