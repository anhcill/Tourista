// Check bookings table schema and booking_type values
const mysql = require('mysql2/promise');

const DB = {
    host: 'interchange.proxy.rlwy.net',
    port: 38550,
    user: 'root',
    password: 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    database: 'railway'
};

async function run() {
    const conn = await mysql.createConnection(DB);

    const [cols] = await conn.query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'booking_type'
    `, [DB.database]);
    console.log('booking_type column:', cols);

    const [rows] = await conn.query('SELECT booking_type, COUNT(*) FROM bookings GROUP BY booking_type');
    console.log('booking_type values:', rows);

    await conn.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
