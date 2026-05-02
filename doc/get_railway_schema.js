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

    // Get all tables
    const [tables] = await conn.query("SHOW TABLES");
    console.log("=== TONG QUAN ===");
    console.log("Host: interchange.proxy.rlwy.net:38550");
    console.log("Database: railway");
    console.log("Tables count: " + tables.length);
    console.log("\n=== DANH SACH BANG ===");
    tables.forEach((t, i) => {
      const name = Object.values(t)[0];
      console.log("  " + (i+1) + ". " + name);
    });

    console.log("\n=== SCHEMA CHI TIET TUNG BANG ===\n");

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      console.log("========== TABLE: " + tableName + " ==========");

      // Columns
      const [cols] = await conn.query("SHOW COLUMNS FROM ??", [tableName]);
      for (const c of cols) {
        let line = "  " + c.Field + " " + c.Type;
        line += " " + (c.Null === 'YES' ? 'NULL' : 'NOT NULL');
        if (c.Default !== null) line += " DEFAULT " + c.Default;
        if (c.Key) line += " [" + c.Key + "]";
        if (c.Extra) line += " (" + c.Extra + ")";
        console.log(line);
      }

      // Foreign keys
      const [fks] = await conn.query(`
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA='railway' AND TABLE_NAME=?
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [tableName]);
      for (const fk of fks) {
        console.log("  -- FK: " + fk.COLUMN_NAME + " -> " + fk.REFERENCED_TABLE_NAME + "." + fk.REFERENCED_COLUMN_NAME);
      }

      // Indexes
      const [idxs] = await conn.query("SHOW INDEXES FROM ??", [tableName]);
      if (idxs.length > 0) {
        console.log("  -- Indexes:");
        const seen = new Set();
        for (const idx of idxs) {
          const key = idx.Key_name;
          if (!seen.has(key)) {
            seen.add(key);
            console.log("    " + key + " (on " + idx.Column_name + ")");
          }
        }
      }

      console.log("");
    }

    conn.release();
    await pool.end();
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
}

main();
