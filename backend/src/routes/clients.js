const express = require('express');
const ClientModel = require('../models/Client');
const { authenticateAdmin, requireRole, validateClientData } = require('../middleware/auth');
const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticateAdmin);

// Récupérer tous les clients avec pagination et recherche
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        
        const clients = await ClientModel.getAllClients(page, limit, search);
        const totalClients = await ClientModel.getClientCount(search);
        
        res.json({
            clients,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalClients / limit),
                totalClients,
                limit
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des clients:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer un client par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await ClientModel.getClientById(id);
        
        if (!client) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }
        
        res.json(client);
    } catch (error) {
        console.error('Erreur lors de la récupération du client:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer les réservations d'un client
router.get('/:id/reservations', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        const client = await ClientModel.getClientById(id);
        if (!client) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }
        
        const reservations = await ClientModel.getClientReservations(id, limit);
        const stats = await ClientModel.getClientStats(id);
        
        res.json({
            client: {
                nom: client.nom,
                prenom: client.prenom,
                email: client.email
            },
            reservations,
            statistiques: stats
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des réservations du client:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Créer un nouveau client
router.post('/', validateClientData, async (req, res) => {
    try {
        const clientData = req.body;
        
        // Vérifier si l'email existe déjà
        const emailExists = await ClientModel.emailExists(clientData.email);
        if (emailExists) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        
        const clientId = await ClientModel.createClient(clientData);
        const newClient = await ClientModel.getClientById(clientId);
        
        res.status(201).json({
            message: 'Client créé avec succès',
            client: newClient
        });
    } catch (error) {
        console.error('Erreur lors de la création du client:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Mettre à jour un client
router.put('/:id', validateClientData, async (req, res) => {
    try {
        const { id } = req.params;
        const clientData = req.body;
        
        // Vérifier que le client existe
        const existingClient = await ClientModel.getClientById(id);
        if (!existingClient) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }
        
        // Vérifier si l'email existe déjà (sauf pour ce client)
        const emailExists = await ClientModel.emailExists(clientData.email, id);
        if (emailExists) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre client' });
        }
        
        await ClientModel.updateClient(id, clientData);
        const updatedClient = await ClientModel.getClientById(id);
        
        res.json({
            message: 'Client mis à jour avec succès',
            client: updatedClient
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du client:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Supprimer un client (soft delete)
router.delete('/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier que le client existe
        const existingClient = await ClientModel.getClientById(id);
        if (!existingClient) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }
        
        await ClientModel.deleteClient(id);
        
        res.json({ message: 'Client supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du client:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Rechercher des clients
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        const clients = await ClientModel.getAllClients(1, limit, term);
        
        res.json(clients);
    } catch (error) {
        console.error('Erreur lors de la recherche de clients:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

module.exports = router;
