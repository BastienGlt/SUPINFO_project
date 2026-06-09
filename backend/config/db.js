const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

// Connexion à MySQL (Pool de connexions)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

module.exports = pool;
