const bcrypt = require('bcrypt');

const users = [
    { role: 'admin', password: 'admin123' },
    { role: 'manager', password: 'manager123' },
    { role: 'waiter', password: 'mesero123' },
    { role: 'cashier', password: 'cajero123' },
    { role: 'kitchen', password: 'cocinero123' },
    { role: 'bartender', password: 'bartender123' }
];

async function generateHashes() {
    console.log('-- Generated password hashes');
    for (const user of users) {
        const hash = await bcrypt.hash(user.password, 10);
        console.log(`-- ${user.role}: ${user.password}`);
        console.log(`-- Hash: ${hash}`);
        console.log();
    }
}

generateHashes();
