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

  // Check user-role mapping table
  try {
    const [userRoles] = await conn.query('SHOW COLUMNS FROM user_roles');
    console.log('=== USER_ROLES TABLE ===');
    for (const c of userRoles) { console.log(c.Field, c.Type, c.Null, c.Key); }
  } catch(e) {
    console.log('No user_roles table');
  }

  // Check what the user's role column contains
  const [userRole] = await conn.query('SELECT id, email, full_name, role_id, (SELECT name FROM roles WHERE id = users.role_id) as role_name FROM users WHERE id IN (1, 8199)');
  console.log('\n=== USERS WITH HOTELS/TOURS ===');
  console.table(userRole);

  // Check all users with PARTNER role (role_id = 3)
  const [partnerUsers] = await conn.query('SELECT id, email, full_name, role_id, (SELECT name FROM roles WHERE id = users.role_id) as role_name FROM users WHERE role_id = 3 LIMIT 5');
  console.log('\n=== PARTNER USERS (role_id=3) ===');
  console.table(partnerUsers);

  // Count
  const [count] = await conn.query('SELECT COUNT(*) as cnt FROM users WHERE role_id = 3');
  console.log('\nTotal PARTNER users:', count);

  conn.release();
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
