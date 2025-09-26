const express = require('express');
const cors = require('cors');
const publicRoutes = require('./src/routes/public');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Trust proxy for production
app.set('trust proxy', 1);

// Public routes (no database required - uses mock data)
app.use('/api/public/services', publicRoutes);

// Basic test route
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'NBrow Studio test server running!',
        endpoints: {
            services: '/api/public/services',
            featured: '/api/public/services/featured/list',
            categories: '/api/public/services/categories/list',
            settings: '/api/public/services/settings/salon'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 NBrow Studio Test Server running on port ${PORT}`);
    console.log(`📋 Public services available at: http://localhost:${PORT}/api/public/services`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});