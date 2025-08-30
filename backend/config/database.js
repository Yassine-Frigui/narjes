require('dotenv').config();
const mysql = require('mysql2');

// Determine if we're in production or local environment
const isProduction = process.env.NODE_ENV === 'production';

// Primary configuration (production or local based on NODE_ENV)
// Allow opting into SSL via DB_SSL env var. Default: false (many free hosts don't support SSL).
const useSSL = (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1');

const primaryDbConfig = {
    host: process.env.DB_HOST || 'fdb1032.awardspace.net',
    user: process.env.DB_USER || '4675996_waadnails',
    password: process.env.DB_PASSWORD || 'yf5040y12',
    database: process.env.DB_NAME || '4675996_waadnails',
    port: parseInt(process.env.DB_PORT) || 3306,
    charset: 'utf8mb4',
    connectTimeout: 30000,
    ssl: useSSL ? { rejectUnauthorized: false } : false
};

// Fallback configuration (local)
const fallbackDbConfig = {
    host: process.env.DB_HOST_LOCAL || 'localhost',
    user: process.env.DB_USER_LOCAL || 'root',
    password: process.env.DB_PASSWORD_LOCAL || '',
    database: process.env.DB_NAME_LOCAL || 'nails_waad',
    port: parseInt(process.env.DB_PORT_LOCAL) || 4306,
    charset: 'utf8mb4',
    connectTimeout: 10000,
    ssl: false
};

// Choose configuration based on environment or fallback
let dbConfig = isProduction ? primaryDbConfig : fallbackDbConfig;

// Création du pool de connexions avec retry logic
let pool;
let promisePool;

const createPool = (config) => {
    return mysql.createPool({
        ...config,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        idleTimeout: 300000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        reconnect: true,
        multipleStatements: false
    });
};

// Initialize with primary config
pool = createPool(dbConfig);
promisePool = pool.promise();

// Test de connexion avec fallback
const testConnection = async (useConfig = dbConfig, configName = 'primary') => {
    try {
        console.log(`🔍 Testing ${configName} database connection...`);
        console.log('Host:', useConfig.host);
        console.log('Port:', useConfig.port);
        console.log('Database:', useConfig.database);
        console.log('User:', useConfig.user);
        
        const testPool = createPool(useConfig);
        const testPromisePool = testPool.promise();
        
        const connection = await testPromisePool.getConnection();
        console.log(`✅ ${configName} database connection successful`);
        
        // Test a simple query
        const [result] = await connection.execute('SELECT 1 as test');
        console.log(`✅ ${configName} test query successful:`, result[0]);
        
        connection.release();
        await testPool.end();
        
        return true;
    } catch (error) {
        console.error(`❌ ${configName} database connection failed:`, error.message);
        return false;
    }
};

// Initialize connection with fallback logic
const initializeDatabase = async () => {
    try {
        // Try primary configuration first
        const primarySuccess = await testConnection(dbConfig, 'primary');
        
        if (primarySuccess) {
            console.log('✅ Using primary database configuration');
            return;
        }
        
        // If primary fails, try fallback (local)
        console.log('🔄 Primary connection failed, trying fallback configuration...');
        const fallbackSuccess = await testConnection(fallbackDbConfig, 'fallback');
        
        if (fallbackSuccess) {
            console.log('✅ Using fallback (local) database configuration');
            // Recreate pool with fallback config
            await pool.end();
            dbConfig = fallbackDbConfig;
            pool = createPool(dbConfig);
            promisePool = pool.promise();
        } else {
            throw new Error('Both primary and fallback database connections failed');
        }
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
};

// Fonction pour exécuter des requêtes avec retry
const executeQuery = async (query, params = [], retryCount = 0) => {
    const maxRetries = 3;
    
    try {
        const [rows] = await promisePool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la requête:', error);
        
        // Retry for connection reset errors
        if ((error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') && retryCount < maxRetries) {
            console.log(`Retrying query (attempt ${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return executeQuery(query, params, retryCount + 1);
        }
        
        throw error;
    }
};

// Fonction pour les transactions
const executeTransaction = async (queries) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.execute(query, params);
            results.push(result);
        }
        
        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    promisePool,
    testConnection: initializeDatabase,
    executeQuery,
    executeTransaction,
    initializeDatabase
};
