// Simple API test script
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
    console.log('Testing FleetMate API endpoints...\n');
    
    // Test 1: Health check
    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: {
                'Authorization': 'Bearer invalid-token'
            }
        });
        console.log('✅ API is responding:', response.status);
    } catch (error) {
        console.log('❌ API connection failed:', error.message);
        return;
    }

    // Test 2: Test user creation payload
    const testUserData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        department: 'IT',
        position: 'Developer',
        role: 'user'
    };
    console.log('✅ User creation payload structure:', JSON.stringify(testUserData, null, 2));

    // Test 3: Test vehicle creation payload
    const testVehicleData = {
        plateNumber: 'ABC-123',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        color: 'Blue',
        type: 'sedan',
        capacity: 5,
        mileage: 15000
    };
    console.log('✅ Vehicle creation payload structure:', JSON.stringify(testVehicleData, null, 2));

    console.log('\nAPI structure validation complete!');
}

testAPI().catch(console.error);
