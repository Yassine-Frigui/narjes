const express = require('express');
const { authenticateAdmin, requireRole } = require('../middleware/auth');
const { executeQuery } = require('../../config/database');
const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticateAdmin);

// Récupérer tout l'inventaire avec pagination et filtres
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const type = req.query.type || '';
        const alerteStock = req.query.alerte === 'true';
        
        let whereConditions = ['actif = TRUE'];
        let params = [];
        
        if (search) {
            whereConditions.push('(nom_produit LIKE ? OR marque LIKE ? OR code_produit LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }
        
        if (type) {
            whereConditions.push('type_produit = ?');
            params.push(type);
        }
        
        if (alerteStock) {
            whereConditions.push('quantite_stock <= quantite_minimum');
        }
        
        const whereClause = 'WHERE ' + whereConditions.join(' AND ');
        const offset = (page - 1) * limit;
        
        // Récupérer les produits
        const query = `
            SELECT 
                id, nom_produit, marque, type_produit, couleur, code_produit,
                quantite_stock, quantite_minimum, prix_achat, prix_vente,
                fournisseur, date_achat, date_expiration, emplacement, notes,
                CASE 
                    WHEN quantite_stock <= 0 THEN 'RUPTURE'
                    WHEN quantite_stock <= quantite_minimum THEN 'ALERTE'
                    ELSE 'OK'
                END as statut_stock,
                date_creation
            FROM inventaire 
            ${whereClause}
            ORDER BY 
                CASE 
                    WHEN quantite_stock <= 0 THEN 1
                    WHEN quantite_stock <= quantite_minimum THEN 2
                    ELSE 3
                END,
                nom_produit
            LIMIT ? OFFSET ?
        `;
        
        params.push(limit, offset);
        const produits = await executeQuery(query, params);
        
        // Compter le total
        const countQuery = `SELECT COUNT(*) as total FROM inventaire ${whereClause}`;
        const countParams = params.slice(0, -2); // Enlever limit et offset
        const totalResult = await executeQuery(countQuery, countParams);
        const total = totalResult[0].total;
        
        res.json({
            produits,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'inventaire:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer un produit par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'SELECT * FROM inventaire WHERE id = ? AND actif = TRUE';
        const result = await executeQuery(query, [id]);
        
        if (!result.length) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        
        res.json(result[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Ajouter un nouveau produit à l'inventaire
router.post('/', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const {
            nom_produit, marque, type_produit, couleur, code_produit,
            quantite_stock, quantite_minimum, prix_achat, prix_vente,
            fournisseur, date_achat, date_expiration, emplacement, notes
        } = req.body;
        
        // Validation des données requises
        if (!nom_produit || !type_produit || quantite_stock === undefined) {
            return res.status(400).json({ 
                message: 'Nom du produit, type et quantité en stock sont requis' 
            });
        }
        
        // Vérifier l'unicité du code produit s'il est fourni
        if (code_produit) {
            const existingProduct = await executeQuery(
                'SELECT id FROM inventaire WHERE code_produit = ? AND actif = TRUE',
                [code_produit]
            );
            
            if (existingProduct.length) {
                return res.status(400).json({ message: 'Ce code produit existe déjà' });
            }
        }
        
        const query = `
            INSERT INTO inventaire 
            (nom_produit, marque, type_produit, couleur, code_produit, quantite_stock, 
             quantite_minimum, prix_achat, prix_vente, fournisseur, date_achat, 
             date_expiration, emplacement, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(query, [
            nom_produit, marque, type_produit, couleur, code_produit,
            quantite_stock, quantite_minimum || 5, prix_achat, prix_vente,
            fournisseur, date_achat, date_expiration, emplacement, notes
        ]);
        
        // Récupérer le produit créé
        const newProduct = await executeQuery(
            'SELECT * FROM inventaire WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({
            message: 'Produit ajouté à l\'inventaire avec succès',
            produit: newProduct[0]
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du produit:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Mettre à jour un produit
router.put('/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nom_produit, marque, type_produit, couleur, code_produit,
            quantite_stock, quantite_minimum, prix_achat, prix_vente,
            fournisseur, date_achat, date_expiration, emplacement, notes
        } = req.body;
        
        // Vérifier que le produit existe
        const existingProduct = await executeQuery(
            'SELECT * FROM inventaire WHERE id = ? AND actif = TRUE',
            [id]
        );
        
        if (!existingProduct.length) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        
        // Vérifier l'unicité du code produit s'il est modifié
        if (code_produit && code_produit !== existingProduct[0].code_produit) {
            const duplicateProduct = await executeQuery(
                'SELECT id FROM inventaire WHERE code_produit = ? AND id != ? AND actif = TRUE',
                [code_produit, id]
            );
            
            if (duplicateProduct.length) {
                return res.status(400).json({ message: 'Ce code produit existe déjà' });
            }
        }
        
        const query = `
            UPDATE inventaire 
            SET nom_produit = ?, marque = ?, type_produit = ?, couleur = ?, 
                code_produit = ?, quantite_stock = ?, quantite_minimum = ?,
                prix_achat = ?, prix_vente = ?, fournisseur = ?, date_achat = ?,
                date_expiration = ?, emplacement = ?, notes = ?
            WHERE id = ?
        `;
        
        await executeQuery(query, [
            nom_produit, marque, type_produit, couleur, code_produit,
            quantite_stock, quantite_minimum, prix_achat, prix_vente,
            fournisseur, date_achat, date_expiration, emplacement, notes, id
        ]);
        
        // Récupérer le produit mis à jour
        const updatedProduct = await executeQuery(
            'SELECT * FROM inventaire WHERE id = ?',
            [id]
        );
        
        res.json({
            message: 'Produit mis à jour avec succès',
            produit: updatedProduct[0]
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du produit:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Ajuster la quantité d'un produit
router.patch('/:id/quantite', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { quantite, type_mouvement, notes } = req.body; // type: 'entree' ou 'sortie'
        
        if (quantite === undefined || !type_mouvement) {
            return res.status(400).json({ 
                message: 'Quantité et type de mouvement requis' 
            });
        }
        
        // Récupérer le produit actuel
        const product = await executeQuery(
            'SELECT * FROM inventaire WHERE id = ? AND actif = TRUE',
            [id]
        );
        
        if (!product.length) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        
        const currentStock = product[0].quantite_stock;
        let newStock;
        
        if (type_mouvement === 'entree') {
            newStock = currentStock + parseInt(quantite);
        } else if (type_mouvement === 'sortie') {
            newStock = currentStock - parseInt(quantite);
            
            if (newStock < 0) {
                return res.status(400).json({ 
                    message: 'Stock insuffisant pour cette sortie' 
                });
            }
        } else {
            return res.status(400).json({ 
                message: 'Type de mouvement invalide (entree ou sortie)' 
            });
        }
        
        // Mettre à jour le stock
        await executeQuery(
            'UPDATE inventaire SET quantite_stock = ? WHERE id = ?',
            [newStock, id]
        );
        
        // TODO: Enregistrer le mouvement dans une table d'historique
        
        const updatedProduct = await executeQuery(
            'SELECT * FROM inventaire WHERE id = ?',
            [id]
        );
        
        res.json({
            message: `${type_mouvement === 'entree' ? 'Entrée' : 'Sortie'} de stock enregistrée`,
            produit: updatedProduct[0],
            mouvement: {
                type: type_mouvement,
                quantite,
                ancien_stock: currentStock,
                nouveau_stock: newStock,
                notes
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajustement du stock:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Supprimer un produit (soft delete)
router.delete('/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier que le produit existe
        const existingProduct = await executeQuery(
            'SELECT * FROM inventaire WHERE id = ? AND actif = TRUE',
            [id]
        );
        
        if (!existingProduct.length) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        
        await executeQuery('UPDATE inventaire SET actif = FALSE WHERE id = ?', [id]);
        
        res.json({ message: 'Produit supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer les alertes de stock
router.get('/alertes/stock', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, nom_produit, marque, type_produit, quantite_stock, quantite_minimum,
                CASE 
                    WHEN quantite_stock <= 0 THEN 'RUPTURE'
                    WHEN quantite_stock <= quantite_minimum THEN 'ALERTE'
                END as niveau_alerte
            FROM inventaire 
            WHERE actif = TRUE AND quantite_stock <= quantite_minimum
            ORDER BY quantite_stock ASC
        `;
        
        const alertes = await executeQuery(query);
        
        res.json({
            alertes,
            nombre_alertes: alertes.length,
            ruptures: alertes.filter(a => a.niveau_alerte === 'RUPTURE').length,
            stocks_bas: alertes.filter(a => a.niveau_alerte === 'ALERTE').length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des alertes:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Récupérer les statistiques de l'inventaire
router.get('/stats/general', async (req, res) => {
    try {
        const queries = [
            // Nombre total de produits
            'SELECT COUNT(*) as total FROM inventaire WHERE actif = TRUE',
            
            // Valeur totale du stock
            'SELECT SUM(quantite_stock * prix_achat) as valeur_stock FROM inventaire WHERE actif = TRUE AND prix_achat IS NOT NULL',
            
            // Produits par type
            'SELECT type_produit, COUNT(*) as nombre FROM inventaire WHERE actif = TRUE GROUP BY type_produit',
            
            // Produits en alerte
            'SELECT COUNT(*) as alertes FROM inventaire WHERE actif = TRUE AND quantite_stock <= quantite_minimum',
            
            // Produits en rupture
            'SELECT COUNT(*) as ruptures FROM inventaire WHERE actif = TRUE AND quantite_stock <= 0'
        ];
        
        const results = await Promise.all(
            queries.map(query => executeQuery(query))
        );
        
        res.json({
            total_produits: results[0][0].total,
            valeur_stock: results[1][0].valeur_stock || 0,
            produits_par_type: results[2],
            alertes_stock: results[3][0].alertes,
            ruptures_stock: results[4][0].ruptures
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

module.exports = router;
