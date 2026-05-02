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

  // Check hotel owner 8199's hotels
  const [hotels] = await conn.query("SELECT id, name, owner_id FROM hotels WHERE owner_id = 8199");
  console.log("=== HOTELS OWNER 8199 ===");
  console.table(hotels);

  if (hotels.length > 0) {
    const hotelIds = hotels.map(h => h.id);
    console.log("Hotel IDs:", hotelIds);

    // Check booking_hotel_details for these hotels
    const [bhd] = await conn.query(`SELECT bhd.*, b.status FROM booking_hotel_details bhd JOIN bookings b ON b.id = bhd.booking_id WHERE bhd.hotel_id IN (${hotelIds.join(',')}) LIMIT 5`);
    console.log("\n=== BOOKING HOTEL DETAILS ===");
    console.table(bhd);
  }

  // Check if there's a Hotel Owner user in DB and what their hotels are
  const [userHotels] = await conn.query("SELECT u.id, u.email, u.full_name, u.role_id, h.id as hotel_id, h.name as hotel_name FROM users u JOIN hotels h ON h.owner_id = u.id WHERE u.role_id = 4 LIMIT 10");
  console.log("\n=== HOTEL OWNER USERS + THEIR HOTELS ===");
  console.table(userHotels);

  conn.release();
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
