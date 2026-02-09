const bcrypt = require('bcrypt');
const fs = require('fs');

const users = [
    { role: 'admin', email: 'admin@restaurant.com', password: 'admin123' },
    { role: 'manager', email: 'gerente@restaurant.com', password: 'gerente123' },
    { role: 'waiter', email: 'mesero@restaurant.com', password: 'mesero123' },
    { role: 'cashier', email: 'cajero@restaurant.com', password: 'cajero123' },
    { role: 'kitchen', email: 'cocinero@restaurant.com', password: 'cocinero123' },
    { role: 'bartender', email: 'bartender@restaurant.com', password: 'bartender123' }
];

async function generateSQL() {
    let sql = `-- Delete existing test users (except admin@test.com)
DELETE FROM users WHERE email IN (
  'admin@restaurant.com',
  'gerente@restaurant.com', 
  'mesero@restaurant.com',
  'cajero@restaurant.com',
  'cocinero@restaurant.com',
  'bartender@restaurant.com'
);

-- Insert all test users
`;

    for (const user of users) {
        const hash = await bcrypt.hash(user.password, 10);
        const name = user.role.charAt(0).toUpperCase() + user.role.slice(1);

        sql += `
-- ${user.role.toUpperCase()}: ${user.email} / ${user.password}
INSERT INTO users (company_id, restaurant_id, email, password_hash, name, role, active)
SELECT c.id, r.id, '${user.email}', '${hash}', '${name}', '${user.role}', true
FROM companies c 
JOIN restaurants r ON r.company_id = c.id 
WHERE c.slug = 'default' 
LIMIT 1;
`;
    }

    fs.writeFileSync('seed-all-users.sql', sql);
    console.log('✅ SQL file generated: seed-all-users.sql');
    console.log('\nCredentials:');
    users.forEach(u => console.log(`  ${u.role.padEnd(10)} → ${u.email.padEnd(30)} / ${u.password}`));
}

generateSQL();
