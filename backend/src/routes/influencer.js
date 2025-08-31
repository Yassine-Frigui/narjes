const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const db = require('../../config/database');

// Generate random alphanumeric code
function generateCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// PUBLIC: Redirect route - track click and redirect
router.get('/r/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    const referrer = req.get('Referer') || '';

    // Look up the influencer link
    const [linkRows] = await db.execute(
      'SELECT id, code, target_url, active FROM influencer_links WHERE code = ? AND active = 1',
      [code]
    );

    if (linkRows.length === 0) {
      return res.status(404).send('Link not found or inactive');
    }

    const link = linkRows[0];

    // Record the click event
    await db.execute(
      `INSERT INTO influencer_events (influencer_link_id, code, event_type, ip, user_agent, referrer, created_at) 
       VALUES (?, ?, 'click', ?, ?, ?, NOW())`,
      [link.id, code, ip, userAgent, referrer]
    );

    // Set tracking cookie (30 days expiry)
    const cookieOptions = {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: false, // Allow frontend access
      sameSite: 'lax',
      path: '/'
    };

    // Only set secure in production
    if (req.secure || process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('influencer_code', code, cookieOptions);

    // Redirect to target URL or default landing page
    const redirectUrl = link.target_url || process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('Error in influencer redirect:', error);
    res.status(500).send('Internal server error');
  }
});

// ADMIN: Create new influencer link
router.post('/api/admin/influencer', authenticateAdmin, async (req, res) => {
  try {
    const { name, code, target_url, active = true, metadata = {} } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate code if not provided
    const finalCode = code || generateCode();

    // Check if code already exists
    const [existingRows] = await db.execute(
      'SELECT id FROM influencer_links WHERE code = ?',
      [finalCode]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'Code already exists' });
    }

    // Insert new link
    const [result] = await db.execute(
      `INSERT INTO influencer_links (name, code, target_url, active, metadata, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, finalCode, target_url, active ? 1 : 0, JSON.stringify(metadata)]
    );

    const newLink = {
      id: result.insertId,
      name,
      code: finalCode,
      target_url,
      active
    };

    res.status(201).json(newLink);

  } catch (error) {
    console.error('Error creating influencer link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: List influencer links with basic stats
router.get('/api/admin/influencer', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get links with click and conversion counts
    const [rows] = await db.execute(`
      SELECT 
        il.id,
        il.name,
        il.code,
        il.target_url,
        il.active,
        il.created_at,
        COUNT(CASE WHEN ie.event_type = 'click' THEN 1 END) as clicks,
        COUNT(CASE WHEN ie.event_type = 'conversion' THEN 1 END) as conversions,
        CASE 
          WHEN COUNT(CASE WHEN ie.event_type = 'click' THEN 1 END) > 0 
          THEN ROUND((COUNT(CASE WHEN ie.event_type = 'conversion' THEN 1 END) * 100.0) / COUNT(CASE WHEN ie.event_type = 'click' THEN 1 END), 2)
          ELSE 0 
        END as conversion_rate
      FROM influencer_links il
      LEFT JOIN influencer_events ie ON il.id = ie.influencer_link_id
      GROUP BY il.id, il.name, il.code, il.target_url, il.active, il.created_at
      ORDER BY il.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Get total count
    const [countRows] = await db.execute('SELECT COUNT(*) as total FROM influencer_links');
    const total = countRows[0].total;

    res.json({
      links: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching influencer links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Get detailed stats for a specific link
router.get('/api/admin/influencer/:id/stats', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get link details
    const [linkRows] = await db.execute(
      'SELECT * FROM influencer_links WHERE id = ?',
      [id]
    );

    if (linkRows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const link = linkRows[0];

    // Get detailed stats
    const [statsRows] = await db.execute(`
      SELECT 
        event_type,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM influencer_events 
      WHERE influencer_link_id = ? 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY event_type, DATE(created_at)
      ORDER BY date DESC
    `, [id]);

    // Get recent events
    const [recentRows] = await db.execute(`
      SELECT event_type, ip, created_at, reservation_id
      FROM influencer_events 
      WHERE influencer_link_id = ?
      ORDER BY created_at DESC 
      LIMIT 50
    `, [id]);

    // Calculate totals
    const totalClicks = statsRows.filter(s => s.event_type === 'click').reduce((sum, s) => sum + s.count, 0);
    const totalConversions = statsRows.filter(s => s.event_type === 'conversion').reduce((sum, s) => sum + s.count, 0);
    const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0;

    res.json({
      link,
      stats: {
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        conversion_rate: parseFloat(conversionRate),
        daily_stats: statsRows,
        recent_events: recentRows
      }
    });

  } catch (error) {
    console.error('Error fetching link stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Update influencer link
router.put('/api/admin/influencer/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target_url, active, metadata } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (target_url !== undefined) {
      updates.push('target_url = ?');
      values.push(target_url);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      values.push(active ? 1 : 0);
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(metadata));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await db.execute(
      `UPDATE influencer_links SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Return updated link
    const [updatedRows] = await db.execute(
      'SELECT * FROM influencer_links WHERE id = ?',
      [id]
    );

    if (updatedRows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json(updatedRows[0]);

  } catch (error) {
    console.error('Error updating influencer link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
