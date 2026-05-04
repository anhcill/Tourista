// Script to test AI Behavior with non-existent locations

const API_BASE_URL = 'https://tourista-production.up.railway.app/api'; 

async function testAiPlanningWithUnknownLocations() {
  try {
    // We are simulating a call to the AI planning endpoint
    // First, let's login or simulate the endpoint if it is public
    // Assuming /chat/plan or similar exists. We'll try a common endpoint.
    
    // We can also try a free text chat endpoint to the AI
    console.log('Sending request with unknown locations to AI Travel Planner (/api/travel-plan/generate)');
    
    const requestData = {
      destination: 'Hành tinh Namek, Thành phố Atlantis và Đảo Asgard',
      checkIn: '2026-10-01',
      checkOut: '2026-10-04',
      adults: 2,
      budget: 'CAO',
      interests: 'adventure,exploration',
      tripType: 'ADVENTURE'
    };

    const response = await fetch(`${API_BASE_URL}/travel-plan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response Body:', text);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAiPlanningWithUnknownLocations();
