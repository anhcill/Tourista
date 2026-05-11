// Add COMBO to booking_type enum
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
        SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'booking_type'
    `, [DB.database]);
    const currentType = cols[0]?.COLUMN_TYPE;
    console.log('Current type:', currentType);

    if (currentType && !currentType.includes('COMBO')) {
        console.log('Altering booking_type to add COMBO...');
        await conn.query(`
            ALTER TABLE bookings MODIFY COLUMN booking_type ENUM('HOTEL','TOUR','COMBO') NOT NULL
        `);
        console.log('Done!');
    } else {
        console.log('COMBO already exists — skipping.');
    }

    await conn.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
