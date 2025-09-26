const cacheService = require('../services/CacheService');
const { executeQuery } = require('../../config/database');

/**
 * Performance optimization middleware and utilities
 * Focuses on database query optimization, result caching, and response optimization
 */

const performanceOptimizations = {
    
    /**
     * Cached query executor with smart invalidation
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @param {string} cacheKey - Cache key pattern
     * @param {number} ttl - Time to live in seconds
     */
    async cachedQuery(query, params = [], cacheKey, ttl = cacheService.TTL.MEDIUM) {
        const fullCacheKey = `query:${cacheKey}:${JSON.stringify(params)}`;
        
        try {
            // Try cache first
            const cached = await cacheService.get(fullCacheKey);
            if (cached) {
                return cached;
            }
            
            // Execute query
            const result = await executeQuery(query, params);
            
            // Cache result
            await cacheService.set(fullCacheKey, result, ttl);
            
            return result;
        } catch (error) {
            console.error('Cached query error:', error);
            // Fallback to direct query
            return await executeQuery(query, params);
        }
    },

    /**
     * Optimized client lookup with caching
     */
    async getClientById(clientId) {
        const cacheKey = cacheService.CACHE_KEYS.CLIENT_BY_ID(clientId);
        
        let client = await cacheService.get(cacheKey);
        if (client) return client;
        
        const result = await executeQuery(
            'SELECT id, nom, prenom, email, telephone, adresse, email_verifie, statut, date_creation FROM clients WHERE id = ?',
            [clientId]
        );
        
        if (result.length > 0) {
            client = result[0];
            await cacheService.set(cacheKey, client, cacheService.TTL.MEDIUM);
            return client;
        }
        
        return null;
    },

    /**
     * Optimized service lookup with caching
     */
    async getServiceById(serviceId) {
        const cacheKey = cacheService.CACHE_KEYS.SERVICE_BY_ID(serviceId);
        
        let service = await cacheService.get(cacheKey);
        if (service) return service;
        
        const result = await executeQuery(
            'SELECT id, nom, description, prix, duree, categorie_id, actif FROM services WHERE id = ? AND actif = 1',
            [serviceId]
        );
        
        if (result.length > 0) {
            service = result[0];
            await cacheService.set(cacheKey, service, cacheService.TTL.LONG);
            return service;
        }
        
        return null;
    },

    /**
     * Batch client lookup to reduce database roundtrips
     */
    async getClientsByIds(clientIds) {
        if (!clientIds || clientIds.length === 0) return [];
        
        const clients = [];
        const uncachedIds = [];
        
        // Check cache for each client
        for (const id of clientIds) {
            const cacheKey = cacheService.CACHE_KEYS.CLIENT_BY_ID(id);
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                clients.push(cached);
            } else {
                uncachedIds.push(id);
            }
        }
        
        // Fetch uncached clients in batch
        if (uncachedIds.length > 0) {
            const placeholders = uncachedIds.map(() => '?').join(',');
            const result = await executeQuery(
                `SELECT id, nom, prenom, email, telephone, adresse, email_verifie, statut, date_creation 
                 FROM clients WHERE id IN (${placeholders})`,
                uncachedIds
            );
            
            // Cache individual clients and add to results
            for (const client of result) {
                const cacheKey = cacheService.CACHE_KEYS.CLIENT_BY_ID(client.id);
                await cacheService.set(cacheKey, client, cacheService.TTL.MEDIUM);
                clients.push(client);
            }
        }
        
        return clients;
    },

    /**
     * Optimized reservations query with smart pagination
     */
    async getClientReservations(clientId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const cacheKey = `client-reservations:${clientId}:${page}:${limit}`;
        
        return await this.cachedQuery(
            `SELECT 
                r.id, r.date_reservation, r.heure_debut, r.heure_fin, r.statut, r.notes,
                r.prix_total, r.service_variant_id,
                s.nom as service_nom, s.duree as service_duree, s.prix as service_prix
             FROM reservations r
             LEFT JOIN services s ON r.service_id = s.id
             WHERE r.client_id = ?
             ORDER BY r.date_reservation DESC, r.heure_debut DESC
             LIMIT ? OFFSET ?`,
            [clientId, parseInt(limit), parseInt(offset)],
            cacheKey,
            cacheService.TTL.SHORT
        );
    },

    /**
     * Response compression middleware for large JSON responses
     */
    compressLargeResponses: (threshold = 1024) => {
        return (req, res, next) => {
            const originalJson = res.json;
            
            res.json = function(data) {
                const jsonString = JSON.stringify(data);
                
                // Add response size header
                res.setHeader('X-Response-Size', jsonString.length);
                
                // For large responses, suggest client-side caching
                if (jsonString.length > threshold) {
                    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
                    res.setHeader('X-Large-Response', 'true');
                }
                
                return originalJson.call(this, data);
            };
            
            next();
        };
    },

    /**
     * Database query performance monitoring
     */
    queryPerformanceMonitor: () => {
        const originalExecuteQuery = executeQuery;
        
        return function monitoredExecuteQuery(query, params) {
            const startTime = Date.now();
            
            return originalExecuteQuery(query, params).then(result => {
                const duration = Date.now() - startTime;
                
                // Log slow queries (over 500ms)
                if (duration > 500) {
                    console.warn(`Slow query detected (${duration}ms):`, {
                        query: query.substring(0, 100) + '...',
                        params: params?.length || 0,
                        duration
                    });
                }
                
                return result;
            });
        };
    },

    /**
     * Cache warm-up for frequently accessed data
     */
    async warmUpCache() {
        try {
            console.log('🔥 Warming up cache...');
            
            // Preload popular services
            await this.cachedQuery(
                'SELECT id, nom, description, prix, duree FROM services WHERE actif = 1 AND populaire = 1',
                [],
                'popular-services',
                cacheService.TTL.LONG
            );
            
            // NBrow Studio - no categories needed (all services are eyebrow services)
            
            // Preload today's reservations count
            await this.cachedQuery(
                'SELECT COUNT(*) as count FROM reservations WHERE DATE(date_reservation) = CURDATE()',
                [],
                'today-reservations-count',
                cacheService.TTL.SHORT
            );
            
            console.log('✅ Cache warm-up completed');
        } catch (error) {
            console.error('❌ Cache warm-up failed:', error);
        }
    },

    /**
     * Smart cache invalidation based on data changes
     */
    async invalidateRelatedCaches(entity, entityId) {
        const patterns = [];
        
        switch (entity) {
            case 'client':
                patterns.push(`client:${entityId}`, `client-reservations:${entityId}:*`);
                break;
            case 'service':
                patterns.push(`service:${entityId}`, 'public-services:*', 'services:*');
                break;
            case 'reservation':
                patterns.push('reservations:*', 'stats:*', 'today-reservations-count');
                break;
        }
        
        for (const pattern of patterns) {
            await cacheService.del(pattern);
        }
    }
};

module.exports = performanceOptimizations;
