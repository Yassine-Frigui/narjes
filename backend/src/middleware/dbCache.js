const cacheService = require('../services/CacheService');

// Database caching middleware
const dbCacheMiddleware = {
    // Cache GET requests with query results
    cacheQuery: (keyPrefix, ttl = cacheService.TTL.MEDIUM) => {
        return async (req, res, next) => {
            // Only cache GET requests
            if (req.method !== 'GET') {
                return next();
            }

            // Create cache key from route and query parameters
            const cacheKey = `${keyPrefix}:${req.path}:${JSON.stringify(req.query)}`;
            
            try {
                const cachedData = await cacheService.get(cacheKey);
                
                if (cachedData) {
                    res.setHeader('X-Cache-Hit', 'true');
                    res.setHeader('X-Cache-Key', cacheKey);
                    return res.json(cachedData);
                }

                // Store original res.json
                const originalJson = res.json;
                
                // Override res.json to cache the response
                res.json = function(data) {
                    // Cache successful responses
                    if (res.statusCode === 200 && data) {
                        cacheService.set(cacheKey, data, ttl);
                    }
                    
                    res.setHeader('X-Cache-Hit', 'false');
                    res.setHeader('X-Cache-Key', cacheKey);
                    return originalJson.call(this, data);
                };

                next();
            } catch (error) {
                console.error('Cache middleware error:', error);
                next();
            }
        };
    },

    // Invalidate cache when data changes
    invalidateCache: (patterns) => {
        return async (req, res, next) => {
            // Store original response methods
            const originalJson = res.json;
            const originalSend = res.send;

            // Override response methods to invalidate cache on success
            const invalidateOnSuccess = function(data) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Invalidate cache patterns asynchronously
                    Promise.all(patterns.map(pattern => cacheService.clearPattern(pattern)))
                        .catch(err => console.error('Cache invalidation error:', err));
                }
                return data;
            };

            res.json = function(data) {
                return originalJson.call(this, invalidateOnSuccess(data));
            };

            res.send = function(data) {
                return originalSend.call(this, invalidateOnSuccess(data));
            };

            next();
        };
    },

    // Cache specific to user/client
    cacheUserData: (keyPrefix, ttl = cacheService.TTL.SHORT) => {
        return async (req, res, next) => {
            if (req.method !== 'GET') {
                return next();
            }

            // Get user ID from token or request
            const userId = req.user?.id || req.clientUser?.id;
            if (!userId) {
                return next();
            }

            const cacheKey = `${keyPrefix}:user:${userId}:${req.path}:${JSON.stringify(req.query)}`;
            
            try {
                const cachedData = await cacheService.get(cacheKey);
                
                if (cachedData) {
                    res.setHeader('X-Cache-Hit', 'true');
                    res.setHeader('X-Cache-Key', cacheKey);
                    return res.json(cachedData);
                }

                const originalJson = res.json;
                
                res.json = function(data) {
                    if (res.statusCode === 200 && data) {
                        cacheService.set(cacheKey, data, ttl);
                    }
                    
                    res.setHeader('X-Cache-Hit', 'false');
                    res.setHeader('X-Cache-Key', cacheKey);
                    return originalJson.call(this, data);
                };

                next();
            } catch (error) {
                console.error('User cache middleware error:', error);
                next();
            }
        };
    },

    // Statistics cache with longer TTL
    cacheStats: (ttl = cacheService.TTL.LONG) => {
        return dbCacheMiddleware.cacheQuery('stats', ttl);
    },

    // Services cache (static data)
    cacheServices: (ttl = cacheService.TTL.VERY_LONG) => {
        return dbCacheMiddleware.cacheQuery('services', ttl);
    },

    // Reservations cache (dynamic data)
    cacheReservations: (ttl = cacheService.TTL.SHORT) => {
        return dbCacheMiddleware.cacheUserData('reservations', ttl);
    }
};

module.exports = dbCacheMiddleware;
