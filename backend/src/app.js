const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import performance middleware and caching service
const performanceMiddleware = require('./middleware/performance');
const cacheService = require('./services/CacheService');

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

// Security warning for dangerous settings
if (process.env.BYPASS_AUTH === '1' && process.env.NODE_ENV === 'production') {
    console.error('🚨 SECURITY WARNING: BYPASS_AUTH is enabled in production! This is extremely dangerous.');
    console.error('🚨 Please set BYPASS_AUTH=0 or remove it entirely for production.');
}

// Rate limiting for security
const rateLimit = require('express-rate-limit');

// Create rate limiters
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Trop de requêtes, veuillez réessayer plus tard.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
        error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Import des routes - NBrow Studio (simplified)
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const reservationRoutes = require('./routes/reservations');
const adminRoutes = require('./routes/admin');
const statisticsRoutes = require('./routes/statistics');
const publicRoutes = require('./routes/public');

// Import de la configuration de base de données
const { testConnection } = require('../config/database');
const performanceOptimizations = require('./middleware/performanceOptimizations');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting when behind reverse proxy (like Render, Heroku, etc.)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Middleware
// Performance middleware should be applied early
app.use(performanceMiddleware.compression);
app.use(performanceMiddleware.security);
app.use(performanceOptimizations.compressLargeResponses(2048)); // Compress responses > 2KB
app.use(performanceMiddleware.responseTime);
app.use(performanceMiddleware.staticCache);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'https://narjes.onrender.com',
            'https://nbrowstudionarjes.netlify.app',
            'https://nbrowstudionarjes.netlify.app/',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
        
        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            return origin === allowedOrigin || origin.startsWith(allowedOrigin);
        });
        
        if (isAllowed) {
            return callback(null, true);
        }
        
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/client/login', authLimiter);
app.use('/api/client/register', authLimiter);

// API optimization middleware
app.use('/api/', performanceMiddleware.apiOptimization);

// Add ngrok warning bypass
app.use((req, res, next) => {
    res.set('ngrok-skip-browser-warning', 'true');
    next();
});

// Security headers
app.use((req, res, next) => {
    // Prevent clickjacking
    res.set('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.set('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS filtering
    res.set('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Hide server information
    res.removeHeader('X-Powered-By');
    
    next();
});

// Servir les fichiers statiques (images, uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes principales - NBrow Studio (simplified)
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/statistics', statisticsRoutes);
app.use('/api/public/services', publicRoutes);
console.log('📊 NBrow Studio routes mounted - auth, services, reservations, admin, statistics, public');

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'NBrow Studio by Narjes API is working correctly!',
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
    
    // In production, don't expose error details
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        message: err.message || 'Erreur interne du serveur',
        ...(isDevelopment && { error: err.stack })
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

        app.listen(PORT, async () => {
            console.log(`\n🚀 Serveur ZenShe Spa démarré sur le port ${PORT}`);
            console.log(`🎯 API accessible sur: http://localhost:${PORT}/api`);
            console.log(`🔗 Test de l'API: http://localhost:${PORT}/api/test`);
            console.log(`📊 Performance monitoring: http://localhost:${PORT}/api/admin/performance`);
            console.log(`💾 Environnement: ${process.env.NODE_ENV || 'development'}\n`);

            // Initialize caching system
            try {
                await cacheService.preloadCache();
                console.log('✅ Cache system initialized');
                
                // Warm up performance cache
                await performanceOptimizations.warmUpCache();
                console.log('🚀 Performance optimizations ready');
            } catch (error) {
                console.warn('⚠️ Cache initialization warning:', error.message);
            }

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
