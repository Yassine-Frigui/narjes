const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const cacheService = require('../services/CacheService');
const { executeQuery } = require('../../config/database');

// Performance monitoring endpoint
router.get('/performance', authenticateAdmin, async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Get cache statistics
        const cacheStats = cacheService.getStats();
        
        // Get database connection pool info
        let dbPoolInfo = {};
        try {
            // This would be implemented if the database config exposes pool stats
            dbPoolInfo = {
                message: 'Database pool stats not directly available',
                note: 'Connection pooling is configured with max 10 connections'
            };
        } catch (error) {
            dbPoolInfo = { error: 'Unable to fetch database pool info' };
        }
        
        // Get system memory usage
        const memoryUsage = process.memoryUsage();
        const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
        
        // Test database response time
        const dbTestStart = Date.now();
        await executeQuery('SELECT 1 as test');
        const dbResponseTime = Date.now() - dbTestStart;
        
        // Calculate server uptime
        const uptimeSeconds = process.uptime();
        const uptimeFormatted = {
            days: Math.floor(uptimeSeconds / 86400),
            hours: Math.floor((uptimeSeconds % 86400) / 3600),
            minutes: Math.floor((uptimeSeconds % 3600) / 60),
            seconds: Math.floor(uptimeSeconds % 60)
        };
        
        const totalResponseTime = Date.now() - startTime;
        
        res.json({
            timestamp: new Date().toISOString(),
            responseTime: `${totalResponseTime}ms`,
            server: {
                uptime: uptimeFormatted,
                uptimeSeconds: Math.floor(uptimeSeconds),
                nodeVersion: process.version,
                platform: process.platform,
                pid: process.pid
            },
            memory: {
                heapUsed: formatBytes(memoryUsage.heapUsed),
                heapTotal: formatBytes(memoryUsage.heapTotal),
                external: formatBytes(memoryUsage.external),
                rss: formatBytes(memoryUsage.rss),
                arrayBuffers: formatBytes(memoryUsage.arrayBuffers || 0)
            },
            cache: cacheStats,
            database: {
                responseTime: `${dbResponseTime}ms`,
                pool: dbPoolInfo
            },
            performance: {
                status: totalResponseTime < 100 ? 'excellent' : 
                        totalResponseTime < 500 ? 'good' : 
                        totalResponseTime < 1000 ? 'fair' : 'poor',
                recommendations: generateRecommendations(cacheStats, dbResponseTime, memoryUsage)
            }
        });
    } catch (error) {
        console.error('Performance monitoring error:', error);
        res.status(500).json({
            error: 'Unable to fetch performance metrics',
            message: error.message
        });
    }
});

// Cache management endpoints
router.get('/cache/stats', authenticateAdmin, async (req, res) => {
    try {
        const stats = cacheService.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/cache/clear', authenticateAdmin, async (req, res) => {
    try {
        const { pattern } = req.body;
        
        if (pattern) {
            await cacheService.clearPattern(pattern);
            res.json({ message: `Cache cleared for pattern: ${pattern}` });
        } else {
            await cacheService.clear();
            res.json({ message: 'All cache cleared' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/cache/preload', authenticateAdmin, async (req, res) => {
    try {
        await cacheService.preloadCache();
        res.json({ message: 'Cache preloading initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to generate performance recommendations
function generateRecommendations(cacheStats, dbResponseTime, memoryUsage) {
    const recommendations = [];
    
    // Cache performance
    const hitRate = parseFloat(cacheStats.hitRate);
    if (hitRate < 70) {
        recommendations.push({
            type: 'cache',
            priority: 'high',
            message: `Cache hit rate is ${cacheStats.hitRate}. Consider increasing cache TTL or adding more cacheable endpoints.`
        });
    }
    
    // Database performance
    if (dbResponseTime > 100) {
        recommendations.push({
            type: 'database',
            priority: dbResponseTime > 500 ? 'high' : 'medium',
            message: `Database response time is ${dbResponseTime}ms. Consider optimizing queries or adding database indexes.`
        });
    }
    
    // Memory usage
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
        recommendations.push({
            type: 'memory',
            priority: heapUsedMB > 1000 ? 'high' : 'medium',
            message: `High memory usage detected (${heapUsedMB.toFixed(2)} MB). Consider implementing memory optimization strategies.`
        });
    }
    
    // General recommendations
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'general',
            priority: 'low',
            message: 'Performance metrics look good! Continue monitoring for optimal performance.'
        });
    }
    
    return recommendations;
}

module.exports = router;
