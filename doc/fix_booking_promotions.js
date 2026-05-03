const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'interchange.proxy.rlwy.net',
    port: 38550,
    user: 'root',
    password: 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    database: 'railway',
    charset: 'utf8mb4',
    multipleStatements: false,
    connectTimeout: 15000,
  });

  try {
    const conn = await pool.getConnection();

    // Check current schema
    const [cols] = await conn.query("SHOW COLUMNS FROM booking_promotions");
    console.log("=== booking_promotions CURRENT SCHEMA ===");
    cols.forEach(c => {
      console.log("  " + c.Field + " " + c.Type + " " + (c.Null === 'YES' ? 'NULL' : 'NOT NULL') + (c.Key ? " [" + c.Key + "]" : "") + (c.Extra ? " (" + c.Extra + ")" : ""));
    });

    // Check if id column already exists
    const hasId = cols.some(c => c.Field === 'id');
    if (hasId) {
      console.log("\n[id] column already exists. Nothing to do.");
    } else {
      console.log("\n[id] column is MISSING. Adding it now...");
      await conn.query(`
        ALTER TABLE booking_promotions
        ADD COLUMN id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST
      `);
      console.log("Added [id] column successfully!");

      // Verify
      const [newCols] = await conn.query("SHOW COLUMNS FROM booking_promotions");
      console.log("\n=== booking_promotions AFTER ALTER ===");
      newCols.forEach(c => {
        console.log("  " + c.Field + " " + c.Type + " " + (c.Null === 'YES' ? 'NULL' : 'NOT NULL') + (c.Key ? " [" + c.Key + "]" : "") + (c.Extra ? " (" + c.Extra + ")" : ""));
      });
    }

    conn.release();
    await pool.end();
    console.log("\nDone.");
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
}

main();
