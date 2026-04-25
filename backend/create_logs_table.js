const mysql = require('mysql2/promise');

async function createTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Jammu@730',
        database: 'smtbms_db'
    });

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                username VARCHAR(255),
                action VARCHAR(255),
                module VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('activity_logs table checked/created successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

createTable();
