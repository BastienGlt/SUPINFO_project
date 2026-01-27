require('dotenv').config();
const mysql = require('mysql2/promise');

// Connexion à MySQL (Pool de connexions)
const pool = mysql.createPool({
  host: '193.38.250.100',
  user: 'main',
  password: '28c!5q6Xu',
  database: 'supinfo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
