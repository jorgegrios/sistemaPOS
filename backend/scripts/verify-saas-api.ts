import axios from 'axios';

async function verify() {
    const API_URL = 'http://localhost:3000/api/v1';

    console.log('--- SaaS API Verification Started ---');

    try {
        // 1. Test Login with companySlug
        console.log('Step 1: Testing Login with slug "default"...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'mesero1@restaurant.com',
            password: 'mesero123',
            companySlug: 'default'
        });

        const token = loginRes.data.token;
        const user = loginRes.data.user;

        console.log('✅ Login successful!');
        console.log(`👤 User: ${user.name}, Role: ${user.role}`);
        console.log(`🏢 Company ID: ${user.companyId}`);

        // 2. Test fetching tables (isolated)
        console.log('\nStep 2: Fetching tables for this company...');
        const tablesRes = await axios.get(`${API_URL}/tables`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Successfully fetched ${tablesRes.data.tables.length} tables.`);
        if (tablesRes.data.tables.length > 0) {
            const firstTable = tablesRes.data.tables[0];
            console.log(`🪑 First Table: ${firstTable.tableNumber}, ID: ${firstTable.id}`);
        }

        // 3. Test fetching orders (isolated)
        console.log('\nStep 3: Fetching orders for this company...');
        const ordersRes = await axios.get(`${API_URL}/orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Successfully fetched ${ordersRes.data.orders.length} orders.`);

        console.log('\n--- SaaS API Verification Completed Successfully ---');
    } catch (error: any) {
        console.error('❌ Verification failed:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data));
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

verify();
