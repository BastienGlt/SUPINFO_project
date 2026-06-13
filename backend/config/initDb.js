const fs = require('fs');
const path = require('path');
const db = require('./db');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase(maxAttempts = 20, delayMs = 1500) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await db.query('SELECT 1');
      return;
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      console.warn(
        `Database not ready yet (attempt ${attempt}/${maxAttempts}): ${error.code || error.message}`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

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

async function ensureView(viewName, createViewSql) {
  const [rows] = await db.query(
    `
      SELECT 1
      FROM information_schema.views
      WHERE table_schema = DATABASE()
        AND table_name = ?
      LIMIT 1
    `,
    [viewName]
  );

  if (rows.length === 0) {
    await db.query(createViewSql);
    console.log(`Patched schema: created view ${viewName}`);
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

  // Some existing Docker volumes were created before this view was added to schema.sql.
  await ensureView(
    'v_oeuvres_notes_moyennes',
    `
      CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW \`v_oeuvres_notes_moyennes\` AS
      SELECT
          \`o\`.\`id\` AS \`oeuvre_id\`,
          \`o\`.\`titre\` AS \`oeuvre_titre\`,
          \`o\`.\`api_reference_id\` AS \`api_reference_id\`,
          ROUND(AVG(\`c\`.\`note\`), 2) AS \`note_moyenne\`,
          COUNT(\`c\`.\`id\`) AS \`total_critiques\`
      FROM
          \`oeuvres\` \`o\`
      JOIN
          \`critiques\` \`c\` ON \`o\`.\`id\` = \`c\`.\`oeuvre_id\`
      GROUP BY
          \`o\`.\`id\`
    `
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
  await waitForDatabase();

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
