// Small script to test connection to the REMOTE MySQL database only.
// Usage (Windows cmd.exe):
//   cd backend
//   node test-remote-db.js
// To override any value on the fly (Windows):
//   set DB_HOST=host && set DB_USER=user && set DB_PASSWORD=pass && set DB_NAME=db && node test-remote-db.js

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testRemoteDatabase() {
  // Force remote values from env (fall back to the known AwardSpace values if env missing)
  const config = {
    host: process.env.DB_HOST || 'sql7.freesqldatabase.com',
    user: process.env.DB_USER || 'sql7795970',
    password: process.env.DB_PASSWORD || 'DYYCvzN3PW',
    database: process.env.DB_NAME || 'sql7795970',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    connectTimeout: 15000,
  // Allow enabling SSL via DB_SSL env var. Default: disabled (false).
  // Some providers (free ones) do not support SSL and will return HANDSHAKE_NO_SSL_SUPPORT.
  ssl: (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1') ? { rejectUnauthorized: false } : false,
    // Helpful for large responses
    multipleStatements: false,
  };

  console.log('Testing REMOTE database with config:');
  console.log(` host=${config.host} user=${config.user} database=${config.database} port=${config.port}`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to remote database successfully');

    // Basic checks
    const [dbRow] = await connection.query('SELECT DATABASE() AS current_db');
    console.log('Current database:', dbRow[0] && dbRow[0].current_db);

    const [versionRow] = await connection.query('SELECT VERSION() AS version');
    console.log('MySQL version:', versionRow[0] && versionRow[0].version);

    // Test a lightweight query
    const [test] = await connection.query('SELECT 1 AS test');
    console.log('Test query result:', test[0]);

    // Check for existence of a few expected tables (services, clients)
    const expected = ['services', 'clients', 'reservations'];
    for (const tbl of expected) {
      try {
        // Avoid complex escaping by using identifier quoting with ? will not quote identifiers,
        // so we build a safe identifier - here we simply use backticks around the table name.
        const sql = `SELECT COUNT(*) AS cnt FROM \`${tbl}\` LIMIT 1`;
        const [rows] = await connection.query(sql);
        console.log(`Table ${tbl} exists, sample count:`, rows[0] && rows[0].cnt);
      } catch (err) {
        console.warn(`Table ${tbl} check failed:`, err.code || err.message);
      }
    }

    // List up to 10 tables
    try {
      const [tables] = await connection.query(`SHOW TABLES LIMIT 10`);
      console.log('Some tables (up to 10):', tables.map(r => Object.values(r)[0]));
    } catch (err) {
      console.warn('SHOW TABLES failed:', err.code || err.message);
    }

    await connection.end();
    console.log('✅ Remote database checks complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Remote database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (connection && connection.end) await connection.end().catch(()=>{});
    process.exit(1);
  }
}

// Run the check
testRemoteDatabase();
