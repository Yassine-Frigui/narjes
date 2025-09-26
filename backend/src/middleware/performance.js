const compression = require('compression');
const helmet = require('helmet');

// Performance middleware configuration
const performanceMiddleware = {
    // Compression middleware with custom configuration
    compression: compression({
        // Only compress responses larger than 1KB
        threshold: 1024,
        
        // Compression level (1-9, higher = better compression, slower)
        level: 6,
        
        // Memory level (1-9, higher = more memory, better compression)
        memLevel: 8,
        
        // Custom filter function to decide what to compress
        filter: (req, res) => {
            // Skip compression for images and already compressed content
            const contentType = res.getHeader('content-type');
            
            if (contentType) {
                // Don't compress images, videos, or already compressed formats
                if (contentType.includes('image/') || 
                    contentType.includes('video/') ||
                    contentType.includes('application/zip') ||
                    contentType.includes('application/gzip')) {
                    return false;
                }
            }
            
            // Use default compression filter for other content
            return compression.filter(req, res);
        }
    }),

    // Security headers with performance considerations
    security: helmet({
        // Content Security Policy - more permissive for production
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                connectSrc: ["'self'", "https://narjes.onrender.com", "https://nbrowstudionarjes.netlify.app"]
            }
        },
        
        // Cross Origin Embedder Policy - disabled for compatibility
        crossOriginEmbedderPolicy: false,
        
        // Cross Origin Resource Policy - permissive
        crossOriginResourcePolicy: { policy: "cross-origin" },
        
        // HSTS with performance-friendly settings
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        }
    }),

    // Static file caching headers
    staticCache: (req, res, next) => {
        // Set cache headers for static assets
        if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
            // Cache static assets for 30 days
            res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
            res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
        } else if (req.url.match(/\.(html|json)$/)) {
            // Cache HTML and JSON for 5 minutes
            res.setHeader('Cache-Control', 'public, max-age=300');
        } else {
            // No cache for dynamic content
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        next();
    },

    // Response time monitoring
    responseTime: (req, res, next) => {
        const start = Date.now();
        
        // Set header before any response is sent
        const originalSend = res.send;
        const originalJson = res.json;
        
        res.send = function(data) {
            const duration = Date.now() - start;
            if (!res.headersSent) {
                res.setHeader('X-Response-Time', `${duration}ms`);
            }
            
            // Log slow requests
            if (duration > 1000) {
                console.warn(`⚠️ Slow request: ${req.method} ${req.url} took ${duration}ms`);
            }
            
            return originalSend.call(this, data);
        };
        
        res.json = function(data) {
            const duration = Date.now() - start;
            if (!res.headersSent) {
                res.setHeader('X-Response-Time', `${duration}ms`);
            }
            
            // Log slow requests
            if (duration > 1000) {
                console.warn(`⚠️ Slow request: ${req.method} ${req.url} took ${duration}ms`);
            }
            
            return originalJson.call(this, data);
        };
        
        next();
    },

    // API response optimization
    apiOptimization: (req, res, next) => {
        // Add ETag support for API responses
        if (req.url.startsWith('/api/')) {
            res.setHeader('Cache-Control', 'no-cache');
            
            // Override res.json to add performance headers
            const originalJson = res.json;
            res.json = function(data) {
                // Add response metadata
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    data._meta = {
                        timestamp: new Date().toISOString(),
                        cached: res.get('X-Cache-Hit') === 'true'
                    };
                }
                
                return originalJson.call(this, data);
            };
        }
        
        next();
    }
};

module.exports = performanceMiddleware;
