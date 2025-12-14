import { fetchGasStations } from './gasStationService';

async function testApi() {
  console.log('Testing Tankerkönig API...');
  
  try {
    // Test with Berlin coordinates
    const result = await fetchGasStations(52.521, 13.438, 2);
    
    if (result.ok) {
      console.log('✅ API is working!');
      console.log(`Found ${result.stations.length} stations`);
      console.log('Sample station:', result.stations[0]);
      
      // Check if we have real data or demo data
      if (result.data === 'MTS-K') {
        console.log('📡 Using real API data');
      } else if (result.data.includes('DEMO')) {
        console.log('⚠️ Using demo data - check your API key');
      }
    } else {
      console.log('❌ API returned error:', result.status);
    }
  } catch (error) {
    console.log('❌ API call failed:', error);
  }
}

// Run test
testApi();