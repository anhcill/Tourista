const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: 'interchange.proxy.rlwy.net',
    port: 38550,
    user: 'root',
    password: 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    database: 'railway',
    connectTimeout: 15000,
  });
  const conn = await pool.getConnection();

  // Hotels owned by user 8199 (HOTEL_OWNER)
  const [h1] = await conn.query("SELECT id, name, owner_id FROM hotels WHERE owner_id = 8199 LIMIT 3");
  console.log("=== HOTELS OWNER 8199 ===");
  console.table(h1);

  // Hotels owned by user 1 (ADMIN)
  const [h2] = await conn.query("SELECT id, name, owner_id FROM hotels WHERE owner_id = 1 LIMIT 3");
  console.log("=== HOTELS OWNER 1 (ADMIN) ===");
  console.table(h2);

  // Tours by operator 1 (ADMIN)
  const [t1] = await conn.query("SELECT id, title, operator_id FROM tours WHERE operator_id = 1 LIMIT 3");
  console.log("=== TOURS OPERATOR 1 (ADMIN) ===");
  console.table(t1);

  // All roles
  const [roles] = await conn.query("SELECT * FROM roles");
  console.log("=== ALL ROLES ===");
  console.table(roles);

  // Sample users with different roles
  const [sampleUsers] = await conn.query("SELECT id, email, full_name, role_id, (SELECT name FROM roles WHERE id = users.role_id) as role_name FROM users ORDER BY id DESC LIMIT 10");
  console.log("=== SAMPLE USERS ===");
  console.table(sampleUsers);

  conn.release();
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
