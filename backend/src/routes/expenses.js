const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Get all available categories (from existing data)
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT DISTINCT category 
      FROM monthly_expenses 
      ORDER BY category
    `);
    
    res.json({ categories: categories.map(row => row.category) });
  } catch (error) {
    console.error('Error fetching categories:', error);
    // If table doesn't exist, return empty array
    res.json({ categories: [] });
  }
});

// Get monthly expenses
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    
    // Check if table exists first
    const [tableCheck] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'monthly_expenses'
    `);
    
    if (tableCheck[0].count === 0) {
      return res.json({ expenses: [] });
    }
    
    const [expenses] = await db.execute(`
      SELECT category, amount, notes 
      FROM monthly_expenses 
      WHERE month = ? AND year = ?
      ORDER BY category
    `, [currentMonth, currentYear]);
    
    res.json({ expenses });
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.json({ expenses: [] });
  }
});

// Update expense for a specific category
router.put('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { amount, month, year, notes } = req.body;
    
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    
    // Check if table exists, create if not
    await db.execute(`
      CREATE TABLE IF NOT EXISTS monthly_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_category_month_year (category, month, year)
      )
    `);
    
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

// Delete a category completely
router.delete('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    await db.execute(`
      DELETE FROM monthly_expenses 
      WHERE category = ?
    `, [category]);
    
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
  }
});

module.exports = router;
