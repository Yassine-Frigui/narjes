const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const [expenses] = await db.execute(`
      SELECT id, name, amount, category, recurring, description, created_at 
      FROM expenses 
      ORDER BY created_at DESC
    `);
    
    res.json({ expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des dépenses' });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const { name, amount, category, recurring, description } = req.body;
    
    if (!name || !amount) {
      return res.status(400).json({ error: 'Le nom et le montant sont requis' });
    }

    const [result] = await db.execute(`
      INSERT INTO expenses (name, amount, category, recurring, description, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [name, parseFloat(amount), category || 'other', Boolean(recurring), description || '']);
    
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      amount: parseFloat(amount), 
      category, 
      recurring, 
      description 
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la dépense' });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, category, recurring, description } = req.body;
    
    await db.execute(`
      UPDATE expenses 
      SET name = ?, amount = ?, category = ?, recurring = ?, description = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, parseFloat(amount), category, Boolean(recurring), description, id]);
    
    res.json({ message: 'Dépense mise à jour avec succès' });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la dépense' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute('DELETE FROM expenses WHERE id = ?', [id]);
    
    res.json({ message: 'Dépense supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la dépense' });
  }
});

module.exports = router;
