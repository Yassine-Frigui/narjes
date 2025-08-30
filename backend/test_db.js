// test_db.js
const { testConnection, executeQuery } = require('./config/database');

async function main() {
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Database connection failed.');
    process.exit(1);
  }

  try {
    const reservations = await executeQuery('SELECT * FROM reservations');
    console.log('Reservations table data:');
    console.table(reservations);
  } catch (err) {
    console.error('❌ Error fetching reservations:', err);
  } finally {
    process.exit(0);
  }
}

main();