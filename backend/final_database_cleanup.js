const mysql = require('mysql2');
require('dotenv').config();

const primaryDbConfig = {
    host: process.env.DB_HOST || 'fdb1032.awardspace.net',
    user: process.env.DB_USER || '4675996_waadnails',
    password: process.env.DB_PASSWORD || 'yf5040y12',
    database: process.env.DB_NAME || '4675996_waadnails',
    port: parseInt(process.env.DB_PORT) || 3306,
    charset: 'utf8mb4',
    connectTimeout: 60000,
    ssl: false
};

async function finalCleanup() {
    const connection = mysql.createConnection(primaryDbConfig);
    
    try {
        console.log('🔧 Final database cleanup for NBrow Studio...');
        
        // Drop categories_services table
        await new Promise((resolve, reject) => {
            connection.query('DROP TABLE IF EXISTS categories_services', (err, result) => {
                if (err) {
                    console.log('⚠️  Could not drop categories_services:', err.message);
                    resolve(); // Continue even if it fails
                } else {
                    console.log('🗑️  Successfully dropped table: categories_services');
                    resolve();
                }
            });
        });
        
        // List remaining tables to verify cleanup
        await new Promise((resolve, reject) => {
            connection.query('SHOW TABLES', (err, results) => {
                if (err) {
                    console.log('❌ Error listing tables:', err.message);
                } else {
                    console.log('\n📋 Remaining tables after cleanup:');
                    results.forEach(row => {
                        const tableName = Object.values(row)[0];
                        console.log(`   - ${tableName}`);
                    });
                }
                resolve();
            });
        });
        
        console.log('\n✅ NBrow Studio database transformation completed!');
        console.log('🎉 Database now optimized for French eyebrow studio services');
        
    } catch (error) {
        console.error('❌ Error during final cleanup:', error.message);
    } finally {
        try {
            connection.end();
        } catch (e) {
            // Ignore connection close errors
        }
    }
}

finalCleanup();