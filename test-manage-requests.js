const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test credentials
const testUsers = {
  admin: { email: 'admin@fleetmate.com', password: 'admin123' },
  authority: { email: 'authority@fleetmate.com', password: 'authority123' },
  approver: { email: 'approver@fleetmate.com', password: 'approver123' }
};

async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data.access_token;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function testManageRequestsEndpoints() {
  console.log('🧪 Testing Manage Requests Endpoints\n');

  // Test Admin user
  console.log('1. Testing Admin User (pending final approvals)');
  const adminToken = await login(testUsers.admin.email, testUsers.admin.password);
  if (adminToken) {
    try {
      const response = await axios.get(`${BASE_URL}/requests/pending-final-approval`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ Admin - Pending final approvals: ${response.data.length} requests`);
      if (response.data.length > 0) {
        console.log('   Sample request:', {
          id: response.data[0].id,
          user: response.data[0].user?.firstName + ' ' + response.data[0].user?.lastName,
          status: response.data[0].status
        });
      }
    } catch (error) {
      console.error('❌ Admin endpoint failed:', error.response?.data || error.message);
    }
  }

  console.log();

  // Test Authority user
  console.log('2. Testing Authority User (pending eligibility)');
  const authorityToken = await login(testUsers.authority.email, testUsers.authority.password);
  if (authorityToken) {
    try {
      const response = await axios.get(`${BASE_URL}/requests/pending-eligibility`, {
        headers: { Authorization: `Bearer ${authorityToken}` }
      });
      console.log(`✅ Authority - Pending eligibility: ${response.data.length} requests`);
      if (response.data.length > 0) {
        console.log('   Sample request:', {
          id: response.data[0].id,
          user: response.data[0].user?.firstName + ' ' + response.data[0].user?.lastName,
          status: response.data[0].status
        });
      }
    } catch (error) {
      console.error('❌ Authority endpoint failed:', error.response?.data || error.message);
    }
  }

  console.log();

  // Test Approver user
  console.log('3. Testing Approver User (pending approvals)');
  const approverToken = await login(testUsers.approver.email, testUsers.approver.password);
  if (approverToken) {
    try {
      const response = await axios.get(`${BASE_URL}/requests/pending-approvals`, {
        headers: { Authorization: `Bearer ${approverToken}` }
      });
      console.log(`✅ Approver - Pending approvals: ${response.data.length} requests`);
      if (response.data.length > 0) {
        console.log('   Sample request:', {
          id: response.data[0].id,
          user: response.data[0].user?.firstName + ' ' + response.data[0].user?.lastName,
          status: response.data[0].status
        });
      }
    } catch (error) {
      console.error('❌ Approver endpoint failed:', error.response?.data || error.message);
    }
  }

  console.log('\n🏁 Test completed');
}

testManageRequestsEndpoints().catch(console.error);
