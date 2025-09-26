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

const connection = mysql.createConnection(primaryDbConfig);

connection.query('DESCRIBE services', (err, results) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Services table structure:');
    console.log(JSON.stringify(results, null, 2));
  }
  connection.end();
});