const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    console.log('Password:', process.env.DB_PASSWORD ? '***hidden***' : 'Not set');

    let connection;
    
    try {
        // Test connection
        console.log('\n📡 Attempting to connect to remote database...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectTimeout: 10000, // 10 seconds
            acquireTimeout: 10000,
            timeout: 10000
        });

        console.log('✅ Database connection successful!');

        // Test a simple query
        console.log('\n🔧 Testing query execution...');
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Query test successful:', rows[0]);

        // Check if tables exist
        console.log('\n📋 Checking if main tables exist...');
        const tablesToCheck = [
            'clients',
            'services', 
            'reservations',
            'utilisateurs',
            'categories_services'
        ];

        for (const table of tablesToCheck) {
            try {
                const [result] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
                if (result.length > 0) {
                    console.log(`✅ Table '${table}' exists`);
                    
                    // Get row count
                    const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                    console.log(`   📊 Records: ${countResult[0].count}`);
                } else {
                    console.log(`❌ Table '${table}' does not exist`);
                }
            } catch (error) {
                console.log(`❌ Error checking table '${table}':`, error.message);
            }
        }

        // Test the database configuration from our app
        console.log('\n🔧 Testing application database config...');
        const { testConnection } = require('../config/database');
        await testConnection();
        console.log('✅ Application database config works!');

    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('📡 Connection refused - check host and port');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('🔐 Access denied - check username and password');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('🗄️ Database does not exist - check database name');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏰ Connection timeout - check network connectivity');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// Run the test
testDatabaseConnection()
    .then(() => {
        console.log('\n🎉 Database connection test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Database connection test failed:', error);
        process.exit(1);
    });
