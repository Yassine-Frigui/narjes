const { executeQuery } = require('./config/database');

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        
        // Test connection
        const result = await executeQuery('SELECT DATABASE() as current_db');
        console.log('Current database:', result[0]);
        
        // Check available databases
        const databases = await executeQuery('SHOW DATABASES');
        console.log('Available databases:', databases.map(db => Object.values(db)[0]));
        
        // Check services in current database
        const services = await executeQuery('SELECT COUNT(*) as count FROM services');
        console.log('Services count:', services[0]);
        
        // Check actual service names
        const serviceNames = await executeQuery('SELECT id, nom FROM services LIMIT 5');
        console.log('Sample services:', serviceNames);
        
        // Check categories
        const categories = await executeQuery('SELECT id, nom FROM categories_services');
        console.log('Categories:', categories);
        
    } catch (error) {
        console.error('Database test error:', error);
    }
}

testDatabase();
