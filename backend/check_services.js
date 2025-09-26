const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'waad_nails'
});

connection.query('SELECT * FROM services', (err, results) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Current services:');
    console.log(JSON.stringify(results, null, 2));
  }
  connection.end();
});