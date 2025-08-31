const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Get monthly expenses
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    
    const [expenses] = await db.execute(`
      SELECT category, amount, notes 
      FROM monthly_expenses 
      WHERE month = ? AND year = ?
      ORDER BY category
    `, [currentMonth, currentYear]);
    
    res.json({ expenses });
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des dépenses' });
  }
});

// Update expense for a specific category
router.put('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { amount, month, year, notes } = req.body;
    
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    
    await db.execute(`
      INSERT INTO monthly_expenses (category, month, year, amount, notes) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      amount = VALUES(amount), 
      notes = VALUES(notes),
      updated_at = NOW()
    `, [category, currentMonth, currentYear, parseFloat(amount) || 0, notes || '']);
    
    res.json({ 
      message: 'Dépense mise à jour avec succès',
      category,
      amount: parseFloat(amount) || 0
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la dépense' });
  }
});

module.exports = router;
