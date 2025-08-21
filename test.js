const axios = require('axios');

async function testProxy() {
  try {
    console.log('Testing Digest Proxy...');
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test proxy endpoint without target
    console.log('\n2. Testing proxy without target (should fail)...');
    try {
      await axios.post('http://localhost:3000');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected request without target');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test proxy endpoint without auth
    console.log('\n3. Testing proxy without auth (should fail)...');
    try {
      await axios.post('http://localhost:3000?target=https://httpbin.org/get');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected request without auth');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test proxy endpoint with invalid auth format
    console.log('\n4. Testing proxy with invalid auth format (should fail)...');
    try {
      await axios.post('http://localhost:3000?target=https://httpbin.org/get', {}, {
        headers: { 'Authorization': 'Bearer invalidformat' }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected request with invalid auth format');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\nTo test with a real Digest auth endpoint, use:');
    console.log('curl -X POST "http://localhost:3000?target=<your_target_url>" \\');
    console.log('  -H "Authorization: Bearer username:password" \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"key": "value"}\'');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the proxy server is running on port 3000');
      console.log('   Run: npm run dev');
    }
  }
}

testProxy();
