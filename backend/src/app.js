const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const clientAuthRoutes = require('./routes/clientAuth');
const publicServicesRoutes = require('./routes/publicServices');
const publicServicesMultilingualRoutes = require('./routes/publicServicesMultilingual');
const serviceRoutes = require('./routes/services');
const reservationRoutes = require('./routes/reservations');
const inventaireRoutes = require('./routes/inventaire');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const membershipRoutes = require('./routes/memberships');
const statisticsRoutes = require('./routes/statistics');

// Import de la configuration de base de données
const { testConnection } = require('../config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://https://waad-nails.onrender.com/',
        'https://waad-nails.netlify.app/',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Add ngrok warning bypass
app.use((req, res, next) => {
    res.set('ngrok-skip-browser-warning', 'true');
    next();
});

// Servir les fichiers statiques (images, uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/client', clientAuthRoutes);
app.use('/api/public/services', publicServicesRoutes);
app.use('/api/public/services-multilingual', publicServicesMultilingualRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/inventaire', inventaireRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/statistics', statisticsRoutes);
console.log('📊 Statistics routes mounted at /api/admin/statistics');
app.use('/api/public', publicRoutes);
app.use('/api/memberships', membershipRoutes);

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'ZenShe Spa API is working correctly!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// Route pour vérifier la santé de l'API
app.get('/api/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.json({
            status: 'OK',
            database: dbConnected ? 'Connectée' : 'Déconnectée',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route non trouvée',
        path: req.originalUrl
    });
});

// Démarrage du serveur
const startServer = async () => {
    try {
        // Test de la connexion à la base de données
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️  Attention: Impossible de se connecter à la base de données');
        }

        app.listen(PORT, () => {
            console.log(`\n� Serveur ZenShe Spa démarré sur le port ${PORT}`);
            console.log(`🎯 API accessible sur: http://localhost:${PORT}/api`);
            console.log(`🔗 Test de l'API: http://localhost:${PORT}/api/test`);
            console.log(`� Environnement: ${process.env.NODE_ENV || 'development'}\n`);

            // Log memory usage
            const mem = process.memoryUsage();
            const heapUsedKB = (mem.heapUsed / 1024).toFixed(2);
            const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
            console.log(`🧠 Mémoire utilisée: ${heapUsedKB} KB (${heapUsedMB} MB)`);
        });
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
};

// Gestion de l'arrêt propre du serveur
process.on('SIGTERM', () => {
    console.log('SIGTERM reçu, arrêt du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT reçu, arrêt du serveur...');
    process.exit(0);
});

startServer();

module.exports = app;
