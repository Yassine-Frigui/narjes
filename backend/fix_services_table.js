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

async function fixServicesTable() {
    const connection = mysql.createConnection(primaryDbConfig);
    
    try {
        console.log('🔧 Fixing services table ID field to auto-increment...');
        
        await new Promise((resolve, reject) => {
            connection.query('ALTER TABLE services MODIFY id INT NOT NULL AUTO_INCREMENT', (err, result) => {
                if (err) reject(err);
                else {
                    console.log('✅ Successfully added AUTO_INCREMENT to services.id');
                    resolve();
                }
            });
        });
        
        console.log('✅ Services table structure fixed!');
        
    } catch (error) {
        console.error('❌ Error fixing services table:', error);
    } finally {
        connection.end();
    }
}

fixServicesTable();