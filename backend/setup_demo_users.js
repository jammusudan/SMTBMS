const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupDemoUsers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Jammu@730',
        database: 'smtbms_db'
    });

    try {
        const users = [
            { email: 'hr@jsw.com', username: 'HR Dept', role: 'HR' },
            { email: 'manager@jsw.com', username: 'General Manager', role: 'Manager' },
            { email: 'employee@jsw.com', username: 'Staff Member', role: 'Employee' },
            { email: 'sales@jsw.com', username: 'Sales Rep', role: 'Sales' }
        ];

        // Let's use a dummy password that will be bypassed anyway, or '123456' which is 6 dots.
        const defaultHash = await bcrypt.hash('123456', 10);

        for (const u of users) {
            const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [u.email]);
            
            if (rows.length > 0) {
                await connection.query('UPDATE users SET role = ? WHERE email = ?', [u.role, u.email]);
                console.log(`Updated ${u.email} to role ${u.role}`);
            } else {
                await connection.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', 
                    [u.username, u.email, defaultHash, u.role]);
                console.log(`Created ${u.email} with role ${u.role}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

setupDemoUsers();
