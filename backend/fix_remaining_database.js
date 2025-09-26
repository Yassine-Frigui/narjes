const mysql = require('mysql2');
require('dotenv').config();

const primaryDbConfig = {
    host: process.env.DB_HOST || 'fdb1032.awardspace.net',
    user: process.env.DB_USER || '4675996_waadnails',
    password: process.env.DB_PASSWORD || 'yf5040y12',
    database: process.env.DB_NAME || '4675996_waadnails',
    port: parseInt(process.env.DB_PORT) || 3306,
    charset: 'utf8mb4',
    connectTimeout: 30000,
    ssl: false
};

async function fixRemainingIssues() {
    const connection = mysql.createConnection(primaryDbConfig);
    
    try {
        console.log('🔧 Fixing remaining database issues...');
        
        // First drop the translations table that has foreign key to categories_services
        try {
            await new Promise((resolve, reject) => {
                connection.query('DROP TABLE IF EXISTS categories_services_translations', (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('🗑️  Dropped table: categories_services_translations');
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.log('⚠️  Could not drop categories_services_translations:', error.message);
        }
        
        // Now drop categories_services
        try {
            await new Promise((resolve, reject) => {
                connection.query('DROP TABLE IF EXISTS categories_services', (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('🗑️  Dropped table: categories_services');
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.log('⚠️  Could not drop categories_services:', error.message);
        }
        
        // Remove foreign key constraints one by one (MySQL compatible syntax)
        try {
            await new Promise((resolve, reject) => {
                connection.query('ALTER TABLE services DROP FOREIGN KEY services_ibfk_1', (err, result) => {
                    if (err && !err.message.includes('check that constraint exists')) reject(err);
                    else {
                        console.log('🔧 Removed foreign key constraint services_ibfk_1');
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.log('⚠️  Could not remove services_ibfk_1:', error.message);
        }
        
        try {
            await new Promise((resolve, reject) => {
                connection.query('ALTER TABLE services DROP FOREIGN KEY services_ibfk_2', (err, result) => {
                    if (err && !err.message.includes('check that constraint exists')) reject(err);
                    else {
                        console.log('🔧 Removed foreign key constraint services_ibfk_2');
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.log('⚠️  Could not remove services_ibfk_2:', error.message);
        }
        
        // Remove unused columns one by one
        try {
            await new Promise((resolve, reject) => {
                connection.query('ALTER TABLE services DROP COLUMN categorie_id', (err, result) => {
                    if (err && !err.message.includes("check that it exists")) reject(err);
                    else {
                        console.log('🔧 Removed column categorie_id from services');
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.log('⚠️  Could not remove categorie_id:', error.message);
        }
        
        try {
            await new Promise((resolve, reject) => {
                connection.query('ALTER TABLE services DROP COLUMN parent_service_id', (err, result) => {
                    if (err && !err.message.includes("check that it exists")) reject(err);
                    else {
                        console.log('🔧 Removed column parent_service_id from services');
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.log('⚠️  Could not remove parent_service_id:', error.message);
        }
        
        console.log('\n✅ Database structure cleanup completed for NBrow Studio!');
        
    } catch (error) {
        console.error('❌ Error during database structure cleanup:', error);
    } finally {
        connection.end();
    }
}

fixRemainingIssues();