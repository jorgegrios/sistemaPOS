const http = require('http');

async function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: body ? JSON.parse(body) : {} }));
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function verifyOrderAdditions() {
    const host = 'localhost';
    const port = 3000;
    const tableId = '4694ae68-32f1-432a-bc96-188e63283256'; // From previous diagnostics

    console.log('--- Order Additions Verification ---');

    // 1. Login
    const login = await request({
        hostname: host, port, path: '/api/v1/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@restaurant.com', password: 'admin123' });

    const token = login.body.token;
    const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    console.log('1. Logged in successfully');

    // 2. Create Order
    const create = await request({
        hostname: host, port, path: '/api/v1/orders', method: 'POST', headers: authHeader
    }, { tableId });
    const orderId = create.body.id;
    console.log(`2. Order created: ${orderId}`);

    // 3. Add Item 1
    const productsResult = await request({
        hostname: host, port, path: '/api/v2/products', method: 'GET', headers: authHeader
    });
    const productId = productsResult.body.products[0].id;

    await request({
        hostname: host, port, path: `/api/v1/orders/${orderId}/items`, method: 'POST', headers: authHeader
    }, { items: [{ productId, quantity: 1, notes: 'First Item' }] });
    console.log('3. Added first item');

    // 4. Send to Kitchen
    await request({
        hostname: host, port, path: `/api/v1/orders/${orderId}/send-to-kitchen`, method: 'POST', headers: authHeader
    });
    console.log('4. Sent to kitchen (Initial)');

    // 5. Add Item 2 (The Fix)
    const addExtra = await request({
        hostname: host, port, path: `/api/v1/orders/${orderId}/items`, method: 'POST', headers: authHeader
    }, { items: [{ productId, quantity: 2, notes: 'Extra Item' }] });

    if (addExtra.statusCode === 201) {
        console.log('5. SUCCESS: Added extra item after kitchen sync');
    } else {
        console.error('5. FAILURE: Could not add extra item after kitchen sync', addExtra.body);
        process.exit(1);
    }

    // 6. Send to Kitchen Again
    const sendAgain = await request({
        hostname: host, port, path: `/api/v1/orders/${orderId}/send-to-kitchen`, method: 'POST', headers: authHeader
    });
    console.log('6. Sent to kitchen again (Idempotent update)');

    // 7. Final Verification
    const finalOrder = await request({
        hostname: host, port, path: `/api/v1/orders/${orderId}`, method: 'GET', headers: authHeader
    });

    const totalItems = finalOrder.body.items.length;
    console.log(`7. Final Order Item Count: ${totalItems}`);
    console.log('All items status:', finalOrder.body.items.map(i => i.status));

    if (totalItems >= 2) {
        console.log('\n✅ VERIFICATION SUCCESSFUL: Products can be appended to sent orders.');
    } else {
        console.error('\n❌ VERIFICATION FAILED: Items were not appended correctly.');
        process.exit(1);
    }
}

verifyOrderAdditions().catch(e => {
    console.error(e);
    process.exit(1);
});
