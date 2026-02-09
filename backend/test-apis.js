const fetch = require('node-fetch');

async function testAPIs() {
    try {
        // 1. Login
        console.log('1. Testing login...');
        const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'mesero@restaurant.com',
                password: 'mesero123',
                companySlug: 'default'
            })
        });

        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('   User:', loginData.user.email, '- Role:', loginData.user.role);
        console.log('   Restaurant ID:', loginData.user.restaurantId);
        console.log('   Company ID:', loginData.user.companyId);

        const token = loginData.token;
        const restaurantId = loginData.user.restaurantId;

        // 2. Test Tables API
        console.log('\n2. Testing tables API...');
        const tablesResponse = await fetch('http://localhost:3000/api/v1/tables', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Restaurant-ID': restaurantId
            }
        });

        if (!tablesResponse.ok) {
            const error = await tablesResponse.text();
            console.log('❌ Tables API error:', tablesResponse.status, error);
        } else {
            const tablesData = await tablesResponse.json();
            console.log('✅ Tables API successful');
            console.log('   Tables found:', tablesData.tables?.length || 0);
            if (tablesData.tables && tablesData.tables.length > 0) {
                console.log('   First table:', tablesData.tables[0].tableNumber, '-', tablesData.tables[0].id);
            }
        }

        // 3. Test Menus API
        console.log('\n3. Testing menus API...');
        const menusResponse = await fetch(`http://localhost:3000/api/v1/menus/${restaurantId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Restaurant-ID': restaurantId
            }
        });

        if (!menusResponse.ok) {
            const error = await menusResponse.text();
            console.log('❌ Menus API error:', menusResponse.status, error);
        } else {
            const menusData = await menusResponse.json();
            console.log('✅ Menus API successful');
            console.log('   Response:', JSON.stringify(menusData, null, 2).substring(0, 500));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAPIs();
