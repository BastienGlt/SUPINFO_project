const fs = require('fs');
const path = require('path');
const db = require('./db');

async function ensureColumn(tableName, columnName, columnDefinition) {
  const [tableRows] = await db.query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = ?
      LIMIT 1
    `,
    [tableName]
  );

  if (tableRows.length === 0) {
    return;
  }

  const [rows] = await db.query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );

  if (rows.length === 0) {
    await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
    console.log(`Patched schema: added ${tableName}.${columnName}`);
  }
}

async function runPreSchemaPatches() {
  // Some existing Docker volumes contain an older schema where this column is missing,
  // which breaks v_signalements creation.
  await ensureColumn(
    'signalements',
    'created_at',
    'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  );
}

async function hasExistingSchema() {
  const [rows] = await db.query(
    `
      SELECT COUNT(*) AS table_count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `
  );

  return rows[0].table_count > 0;
}

async function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const schemaAlreadyExists = await hasExistingSchema();

  if (!schemaAlreadyExists) {
    await db.query(schemaSql);
    console.log('Database schema initialized successfully.');
  } else {
    console.log('Database schema already present, skipping full import.');
  }

  await runPreSchemaPatches();
}

module.exports = initializeDatabase;
