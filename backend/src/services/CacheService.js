const NodeCache = require('node-cache');
const Redis = require('ioredis');

class CacheService {
    constructor() {
        // Primary cache: In-memory (Node-Cache) for hot data
        this.memoryCache = new NodeCache({
            stdTTL: 300, // 5 minutes default TTL
            checkperiod: 60, // Check for expired keys every minute
            useClones: false, // Better performance
            deleteOnExpire: true,
            maxKeys: 1000 // Limit memory usage
        });

        // Secondary cache: Redis for distributed caching (optional)
        this.redisCache = null;
        this.initRedis();

        // Cache hit/miss statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0
        };

        // Cache keys organization
        this.CACHE_KEYS = {
            SERVICES: 'services:all',
            SERVICE_BY_ID: (id) => `service:${id}`,
            CATEGORIES: 'categories:all',
            RESERVATIONS_TODAY: 'reservations:today',
            CLIENT_BY_ID: (id) => `client:${id}`,
            STATS_DASHBOARD: 'stats:dashboard',
            SALON_SETTINGS: 'salon:settings',
            POPULAR_SERVICES: 'services:popular',
            REVENUE_STATS: (period) => `revenue:${period}`,
            SERVICE_TRANSLATIONS: (serviceId, lang) => `service:${serviceId}:${lang}`,
        };

        // Cache TTL configurations (in seconds)
        this.TTL = {
            SHORT: 60,      // 1 minute - frequently changing data
            MEDIUM: 300,    // 5 minutes - semi-static data
            LONG: 3600,     // 1 hour - static data
            VERY_LONG: 86400 // 24 hours - rarely changing data
        };
    }

    async initRedis() {
        // Only initialize Redis if URL is provided
        if (process.env.REDIS_URL || process.env.REDIS_HOST) {
            try {
                this.redisCache = new Redis(process.env.REDIS_URL || {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379,
                    password: process.env.REDIS_PASSWORD,
                    db: process.env.REDIS_DB || 0,
                    retryDelayOnFailover: 100,
                    enableReadyCheck: false,
                    maxRetriesPerRequest: 3,
                });

                this.redisCache.on('connect', () => {
                    console.log('✅ Redis cache connected successfully');
                });

                this.redisCache.on('error', (err) => {
                    console.warn('⚠️ Redis cache error (falling back to memory cache):', err.message);
                    this.redisCache = null;
                });

            } catch (error) {
                console.warn('⚠️ Redis initialization failed, using memory cache only:', error.message);
                this.redisCache = null;
            }
        }
    }

    // Get data from cache (checks memory first, then Redis)
    async get(key) {
        try {
            // Check memory cache first (fastest)
            let value = this.memoryCache.get(key);
            if (value !== undefined) {
                this.stats.hits++;
                return value;
            }

            // Check Redis cache if available
            if (this.redisCache) {
                const redisValue = await this.redisCache.get(key);
                if (redisValue) {
                    // Parse JSON if it's a string
                    try {
                        value = JSON.parse(redisValue);
                    } catch {
                        value = redisValue;
                    }
                    
                    // Store in memory cache for faster next access
                    this.memoryCache.set(key, value, this.TTL.MEDIUM);
                    this.stats.hits++;
                    return value;
                }
            }

            this.stats.misses++;
            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            this.stats.misses++;
            return null;
        }
    }

    // Set data in cache (stores in both memory and Redis)
    async set(key, value, ttl = this.TTL.MEDIUM) {
        try {
            // Store in memory cache
            this.memoryCache.set(key, value, ttl);

            // Store in Redis cache if available
            if (this.redisCache) {
                const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                await this.redisCache.setex(key, ttl, stringValue);
            }

            this.stats.sets++;
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    // Delete from cache
    async del(key) {
        try {
            this.memoryCache.del(key);
            if (this.redisCache) {
                await this.redisCache.del(key);
            }
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    // Clear cache by pattern
    async clearPattern(pattern) {
        try {
            // Clear from memory cache
            const keys = this.memoryCache.keys();
            keys.forEach(key => {
                if (key.includes(pattern)) {
                    this.memoryCache.del(key);
                }
            });

            // Clear from Redis cache
            if (this.redisCache) {
                const redisKeys = await this.redisCache.keys(`*${pattern}*`);
                if (redisKeys.length > 0) {
                    await this.redisCache.del(...redisKeys);
                }
            }
            return true;
        } catch (error) {
            console.error('Cache clear pattern error:', error);
            return false;
        }
    }

    // Clear all cache
    async clear() {
        try {
            this.memoryCache.flushAll();
            if (this.redisCache) {
                await this.redisCache.flushdb();
            }
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }

    // Get cache statistics
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            memoryKeys: this.memoryCache.keys().length,
            memoryStats: this.memoryCache.getStats()
        };
    }

    // Utility method for cache-aside pattern
    async getOrSet(key, fetchFunction, ttl = this.TTL.MEDIUM) {
        try {
            let value = await this.get(key);
            
            if (value === null) {
                value = await fetchFunction();
                if (value !== null && value !== undefined) {
                    await this.set(key, value, ttl);
                }
            }
            
            return value;
        } catch (error) {
            console.error('Cache getOrSet error:', error);
            // Fallback: call the function directly
            return await fetchFunction();
        }
    }

    // Preload common data into cache
    async preloadCache() {
        console.log('🚀 Preloading cache with common data...');
        
        try {
            // This would be implemented with actual database calls
            // For now, just clear old cache to prepare for fresh data
            await this.clearPattern('services');
            await this.clearPattern('categories');
            
            console.log('✅ Cache preloading completed');
        } catch (error) {
            console.error('❌ Cache preloading failed:', error);
        }
    }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
