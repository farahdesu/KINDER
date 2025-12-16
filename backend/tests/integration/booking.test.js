const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testBookingAPI() {
  try {
    console.log('=== Testing Booking API ===\n');
    
    // 1. Login as parent
    console.log('1. Logging in as parent...');
    const loginRes = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful. Token received.');
    
    // 2. Test booking routes
    console.log('\n2. Testing booking routes...');
    const testRes = await axios.get(`${API_BASE}/api/bookings/test`);
    console.log(`✅ Booking test: ${testRes.data.message}`);
    
    // 3. Get available babysitters
    console.log('\n3. Getting available babysitters...');
    const babysittersRes = await axios.get(`${API_BASE}/api/bookings/available-babysitters`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Found ${babysittersRes.data.count} babysitters`);
    
    // DEBUG: See what properties the babysitter has
    console.log('\n📋 Debug - First babysitter data:');
    console.log(JSON.stringify(babysittersRes.data.babysitters[0], null, 2));
    
    if (babysittersRes.data.count > 0) {
      // Get the correct ID property
      const babysitter = babysittersRes.data.babysitters[0];
      const babysitterId = babysitter._id || babysitter.id || babysitter.userId;
      const babysitterName = babysitter.fullName || babysitter.name || babysitter.username || 'Unnamed Babysitter';
      
      console.log(`\n👶 Using babysitter: ${babysitterName} (ID: ${babysitterId})`);
      
      // 4. Create a test booking
      console.log('\n4. Creating test booking...');
      const bookingRes = await axios.post(`${API_BASE}/api/bookings`, {
        babysitterId: babysitterId,
        date: '2025-12-15',
        startTime: '14:00',
        endTime: '18:00',
        address: 'Test Address, Dhaka',
        specialInstructions: 'Test booking from API',
        children: '1 child'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Booking created: ${bookingRes.data.message}`);
      console.log(`Booking ID: ${bookingRes.data.booking._id}`);
      console.log(`Status: ${bookingRes.data.booking.status}`);
      console.log(`Amount: ${bookingRes.data.booking.totalAmount} BDT`);
    }
    
    console.log('\n=== All tests passed! ===');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

testBookingAPI();