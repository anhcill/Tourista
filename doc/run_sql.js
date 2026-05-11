// Run ALTER TABLE directly on Railway MySQL
// Chạy: node run_sql.js

const mysql = require('mysql2/promise');

const DB = {
    host: 'interchange.proxy.rlwy.net',
    port: 38550,
    user: 'root',
    password: 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    database: 'railway'
};

async function run() {
    console.log('Connecting to MySQL...');
    const conn = await mysql.createConnection(DB);

    console.log('Checking if flow_type column exists...');
    const [cols] = await conn.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'session_recommendation_states'
        AND COLUMN_NAME = 'flow_type'
    `, [DB.database]);

    if (cols.length > 0) {
        console.log('flow_type column already exists — skipping.');
    } else {
        console.log('Adding flow_type column...');
        await conn.query(`
            ALTER TABLE session_recommendation_states
            ADD COLUMN flow_type VARCHAR(20) AFTER conversation_id
        `);
        console.log('Done!');
    }

    await conn.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
