const http = require('http');

async function testTables() {
    // 1. Login
    const loginData = JSON.stringify({ email: 'admin@restaurant.com', password: 'admin123' });
    const loginOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };

    const loginRes = await new Promise((resolve) => {
        const req = http.request(loginOptions, resolve);
        req.write(loginData);
        req.end();
    });

    let loginBody = '';
    for await (const chunk of loginRes) loginBody += chunk;
    const { token } = JSON.parse(loginBody);
    console.log('Got Token:', token.substring(0, 20) + '...');

    // 2. Get Tables
    const tablesOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v2/tables?withOrders=true',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const tablesRes = await new Promise((resolve) => {
        const req = http.request(tablesOptions, resolve);
        req.end();
    });

    console.log('Tables Status:', tablesRes.statusCode);
    let tablesBody = '';
    for await (const chunk of tablesRes) tablesBody += chunk;
    console.log('Tables Body:', tablesBody.substring(0, 500));
}

testTables().catch(console.error);
