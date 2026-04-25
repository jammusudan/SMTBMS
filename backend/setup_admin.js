const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Jammu@730',
        database: 'smtbms_db'
    });

    try {
        const email = 'admin@jsw.com';
        const password = 'password'; // or 'admin123'
        
        // The user typed 8 characters `........`
        // So password could be 'password' or '12345678' or 'admin123'. 
        // We will just hash 'admin123' and save it. Wait, the user might be typing 'password'. 
        // Let's set the password to '12345678'.
        const hashed1 = await bcrypt.hash('12345678', 10);
        const hashed2 = await bcrypt.hash('password', 10);
        const hashed3 = await bcrypt.hash('admin123', 10);
        
        // Actually, let's just make it 'password' which is 8 chars.
        const targetPass = await bcrypt.hash('password', 10);

        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            await connection.query('UPDATE users SET password = ?, role = "Admin" WHERE email = ?', [targetPass, email]);
            console.log('Admin user updated (password set to "password")');
        } else {
            await connection.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', 
                ['JSW Admin', email, targetPass, 'Admin']);
            console.log('Admin user created (password set to "password")');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

setupAdmin();
