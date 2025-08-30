const express = require('express');
const MembershipModel = require('../models/Membership');
const { authenticateAdmin, requireRole } = require('../middleware/auth');
const router = express.Router();

// Routes publiques (sans authentification)
router.get('/', async (req, res) => {
    try {
        const memberships = await MembershipModel.getAllMemberships();
        res.json(memberships);
    } catch (error) {
        console.error('Erreur lors de la récupération des adhésions:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer une adhésion par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const membership = await MembershipModel.getMembershipById(id);
        
        if (!membership) {
            return res.status(404).json({ message: 'Adhésion non trouvée' });
        }
        
        res.json(membership);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'adhésion:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Routes admin (avec authentification)
router.use(authenticateAdmin);

// Créer une nouvelle adhésion
router.post('/', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { nom, prix_mensuel, services_par_mois } = req.body;
        
        if (!nom || !prix_mensuel || !services_par_mois) {
            return res.status(400).json({ 
                message: 'Nom, prix mensuel et services par mois sont requis' 
            });
        }
        
        const membershipId = await MembershipModel.createMembership(req.body);
        const membership = await MembershipModel.getMembershipById(membershipId);
        
        res.status(201).json({
            message: 'Adhésion créée avec succès',
            membership
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'adhésion:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Mettre à jour une adhésion
router.put('/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        await MembershipModel.updateMembership(id, req.body);
        const membership = await MembershipModel.getMembershipById(id);
        
        res.json({
            message: 'Adhésion mise à jour avec succès',
            membership
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'adhésion:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Supprimer une adhésion
router.delete('/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        await MembershipModel.deleteMembership(id);
        
        res.json({ message: 'Adhésion supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'adhésion:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

module.exports = router;
