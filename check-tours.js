const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'interchange.proxy.rlwy.net',
    port: 38550,
    user: 'root',
    password: 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    database: 'railway'
  });

  const [tours] = await conn.query(`
    SELECT t.id, t.title, c.name_vi as city_name,
           t.max_group_size, t.min_group_size, 
           t.price_per_adult, t.price_per_child,
           t.is_active, t.admin_status
    FROM tours t
    LEFT JOIN cities c ON t.city_id = c.id
    ORDER BY t.id
  `);
  
  console.log(`=== DANH SACH TOUR - GIOI HAN NGUOI (${tours.length} tours) ===\n`);
  
  let noLimit = 0;
  tours.forEach(t => {
    const max = t.max_group_size;
    const min = t.min_group_size;
    const hasLimit = max > 0;
    if (!hasLimit) noLimit++;
    
    console.log(`[ID=${t.id}] ${t.title}`);
    console.log(`   TP: ${t.city_name || 'N/A'} | Gia: ${t.price_per_adult} VND`);
    console.log(`   Max: ${max} | Min: ${min} | Active: ${t.is_active} | Status: ${t.admin_status}`);
    console.log(`   => ${hasLimit ? 'DA gioi han' : 'CHUA gioi han'}`);
    console.log('');
  });

  console.log(`\n=== TONG KET ===`);
  console.log(`Co gioi han: ${tours.length - noLimit}/${tours.length}`);
  console.log(`Chua gioi han: ${noLimit}/${tours.length}`);

  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
