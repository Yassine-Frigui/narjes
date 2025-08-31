const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Expense categories with their display names and icons
const EXPENSE_CATEGORIES = {
  rent: { name: 'Loyer', icon: '🏠', defaultAmount: 800 },
  salaries: { name: 'Salaires', icon: '👥', defaultAmount: 1500 },
  utilities: { name: 'Factures', icon: '⚡', defaultAmount: 120 },
  supplies: { name: 'Fournitures', icon: '💄', defaultAmount: 250 },
  marketing: { name: 'Marketing', icon: '📱', defaultAmount: 150 },
  insurance: { name: 'Assurance', icon: '🛡️', defaultAmount: 80 },
  maintenance: { name: 'Entretien', icon: '🔧', defaultAmount: 50 },
  other: { name: 'Autres', icon: '📋', defaultAmount: 0 }
};

// Get monthly expenses for current month or specified month/year
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Get existing expenses for the month
    const [expenses] = await db.execute(`
      SELECT category, amount, notes, created_at, updated_at
      FROM monthly_expenses 
      WHERE month = ? AND year = ?
      ORDER BY FIELD(category, 'rent', 'salaries', 'utilities', 'supplies', 'marketing', 'insurance', 'maintenance', 'other')
    `, [targetMonth, targetYear]);
    
    // Create a complete list with all categories (fill missing ones with defaults)
    const completeExpenses = Object.entries(EXPENSE_CATEGORIES).map(([category, info]) => {
      const existing = expenses.find(exp => exp.category === category);
      return {
        category,
        name: info.name,
        icon: info.icon,
        amount: existing ? parseFloat(existing.amount) : info.defaultAmount,
        notes: existing ? existing.notes : '',
        exists: !!existing,
        updated_at: existing ? existing.updated_at : null
      };
    });
    
    // Calculate total
    const total = completeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    res.json({ 
      expenses: completeExpenses, 
      total,
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des dépenses mensuelles' });
  }
});

// Update expense amount for a category in current month
router.put('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { amount, notes, month, year } = req.body;
    
    if (!EXPENSE_CATEGORIES[category]) {
      return res.status(400).json({ error: 'Catégorie de dépense invalide' });
    }
    
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    const expenseAmount = parseFloat(amount) || 0;
    
    // Insert or update the expense for this month
    await db.execute(`
      INSERT INTO monthly_expenses (category, month, year, amount, notes, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        amount = VALUES(amount), 
        notes = VALUES(notes), 
        updated_at = NOW()
    `, [category, targetMonth, targetYear, expenseAmount, notes || '']);
    
    res.json({ 
      message: 'Dépense mise à jour avec succès',
      category,
      amount: expenseAmount,
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la dépense' });
  }
});

// Initialize current month with default values (useful for first-time setup)
router.post('/initialize', async (req, res) => {
  try {
    const { month, year } = req.body;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    // Insert all categories with default amounts
    for (const [category, info] of Object.entries(EXPENSE_CATEGORIES)) {
      await db.execute(`
        INSERT INTO monthly_expenses (category, month, year, amount, notes, created_at) 
        VALUES (?, ?, ?, ?, '', NOW())
        ON DUPLICATE KEY UPDATE amount = amount -- Don't overwrite existing values
      `, [category, targetMonth, targetYear, info.defaultAmount]);
    }
    
    res.json({ 
      message: 'Dépenses initialisées pour le mois',
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    console.error('Error initializing expenses:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation des dépenses' });
  }
});

// Get expense history for a specific category
router.get('/history/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 12 } = req.query; // Default to last 12 months
    
    if (!EXPENSE_CATEGORIES[category]) {
      return res.status(400).json({ error: 'Catégorie de dépense invalide' });
    }
    
    const [history] = await db.execute(`
      SELECT month, year, amount, notes, updated_at
      FROM monthly_expenses 
      WHERE category = ?
      ORDER BY year DESC, month DESC
      LIMIT ?
    `, [category, parseInt(limit)]);
    
    res.json({ 
      category,
      categoryName: EXPENSE_CATEGORIES[category].name,
      history
    });
  } catch (error) {
    console.error('Error fetching expense history:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

module.exports = router;
