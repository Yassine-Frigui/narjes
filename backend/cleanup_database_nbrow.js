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

async function cleanupDatabase() {
    const connection = mysql.createConnection(primaryDbConfig);
    
    try {
        console.log('🧹 Cleaning up database for NBrow Studio...');
        
        // Tables to drop (not needed for eyebrow studio)
        const tablesToDrop = [
            'promotions',           // No promotions system needed
            'avis_clients',         // No reviews system needed  
            'influencer_stats',     // No influencer tracking needed
            'influencer_clients',   // No influencer tracking needed
            'salon_parameters',     // No complex salon parameters needed
            'inventaire',          // No inventory management needed
            'inventory_logs',      // No inventory tracking needed
            'memberships',         // No membership system needed
            'membership_benefits', // No membership system needed
            'categories_services', // Simplified - no service categories needed
            'expenses',           // No expense tracking needed
            'revenue'             // No revenue tracking needed
        ];
        
        // Drop tables that exist and are not needed
        for (const table of tablesToDrop) {
            try {
                await new Promise((resolve, reject) => {
                    connection.query(`DROP TABLE IF EXISTS ${table}`, (err, result) => {
                        if (err) reject(err);
                        else {
                            console.log(`🗑️  Dropped table: ${table}`);
                            resolve();
                        }
                    });
                });
            } catch (error) {
                console.log(`⚠️  Could not drop ${table}:`, error.message);
            }
        }
        
        // Also clean up any foreign key references that might be broken
        console.log('\n🔧 Cleaning up service table foreign key constraints...');
        
        try {
            await new Promise((resolve, reject) => {
                connection.query(`
                    ALTER TABLE services 
                    DROP FOREIGN KEY IF EXISTS services_ibfk_1,
                    DROP FOREIGN KEY IF EXISTS services_ibfk_2
                `, (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('🔧 Removed foreign key constraints from services table');
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.log('⚠️  Could not remove foreign keys:', error.message);
        }
        
        // Remove category_id and parent_service_id columns since we dropped related tables
        try {
            await new Promise((resolve, reject) => {
                connection.query(`
                    ALTER TABLE services 
                    DROP COLUMN IF EXISTS categorie_id,
                    DROP COLUMN IF EXISTS parent_service_id
                `, (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('🔧 Removed unused columns from services table');
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.log('⚠️  Could not remove columns:', error.message);
        }
        
        console.log('\n✅ Database cleanup completed for NBrow Studio!');
        console.log('📊 Remaining core tables: services, reservations, clients, admin');
        
    } catch (error) {
        console.error('❌ Error during database cleanup:', error);
    } finally {
        connection.end();
    }
}

cleanupDatabase();