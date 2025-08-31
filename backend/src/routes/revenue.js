const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Get monthly revenue
router.get('/monthly', async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const [revenueResult] = await db.execute(`
      SELECT COALESCE(SUM(price), 0) as total_revenue
      FROM reservations 
      WHERE MONTH(date) = ? AND YEAR(date) = ? 
      AND status IN ('confirmed', 'completed')
    `, [currentMonth, currentYear]);
    
    const revenue = revenueResult[0]?.total_revenue || 0;
    
    res.json({ revenue: parseFloat(revenue) });
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du chiffre d\'affaires' });
  }
});

// Get revenue by period
router.get('/period', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Dates de début et fin requises' });
    }
    
    const [revenueResult] = await db.execute(`
      SELECT COALESCE(SUM(price), 0) as total_revenue
      FROM reservations 
      WHERE date BETWEEN ? AND ? 
      AND status IN ('confirmed', 'completed')
    `, [startDate, endDate]);
    
    const revenue = revenueResult[0]?.total_revenue || 0;
    
    res.json({ revenue: parseFloat(revenue) });
  } catch (error) {
    console.error('Error fetching period revenue:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du chiffre d\'affaires' });
  }
});

module.exports = router;
