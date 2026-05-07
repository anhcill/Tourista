/**
 * Test script for Chatbot AI - Location Understanding
 * Run: node test-chatbot.js
 */

const http = require('http');

const API_BASE = 'https://tourista-production.up.railway.app/api';

// Test cases for location understanding
const testCases = [
  // Landmarks → City
  { input: "khách sạn gần Hồ Hoàn Kiếm", expected: "Ha Noi" },
  { input: "tìm khách sạn gần cầu Rồng", expected: "Da Nang" },
  { input: "khách sạn gần Bà Nà Hills", expected: "Da Nang" },
  { input: "tìm khách sạn ở phố cổ Hội An", expected: "Hoi An" },
  { input: "hotel gần Kinh thành Huế", expected: "Hue" },
  { input: "khách sạn gần Fansipan", expected: "Sa Pa" },
  { input: "tìm tour ở Bãi Sao Phú Quốc", expected: "Phu Quoc" },
  { input: "hotel gần Hòn Mun Nha Trang", expected: "Nha Trang" },
  { input: "khách sạn gần Hồ Xuân Hương", expected: "Da Lat" },
  { input: "tìm tour Vịnh Hạ Long", expected: "Ha Long" },

  // Direct city name
  { input: "khách sạn Đà Nẵng", expected: "Da Nang" },
  { input: "tour Hà Nội", expected: "Ha Noi" },
  { input: "tìm khách sạn ở Sapa", expected: "Sa Pa" },
];

// Make HTTP request
function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test chatbot message
async function testChat(message, sessionId = 'test-session-001') {
  console.log(`\n📨 User: "${message}"`);

  try {
    // Create or get conversation
    let convId;
    const convRes = await makeRequest('/chat/conversations', 'POST', {
      sessionId: sessionId,
      clientEmail: 'test@example.com',
    });

    if (convRes.data && convRes.data.id) {
      convId = convRes.data.id;
    } else {
      // Try to get existing conversation
      const listRes = await makeRequest(`/chat/conversations?sessionId=${sessionId}`);
      if (listRes.data && listRes.data.length > 0) {
        convId = listRes.data[0].id;
      }
    }

    if (!convId) {
      console.log('❌ Could not create/get conversation');
      return null;
    }

    // Send message
    const sendRes = await makeRequest(`/chat/messages?conversationId=${convId}`, 'POST', {
      content: message,
    });

    console.log(`📬 Response status: ${sendRes.status}`);

    // Wait a bit for AI to process
    await new Promise((r) => setTimeout(r, 2000));

    // Get messages
    const msgsRes = await makeRequest(`/chat/messages/${convId}`);
    if (msgsRes.data && msgsRes.data.messages) {
      const botMsg = msgsRes.data.messages
        .filter((m) => m.senderType === 'BOT')
        .pop();

      if (botMsg) {
        console.log(`🤖 Bot: ${botMsg.content?.substring(0, 200)}...`);
        return botMsg.content;
      }
    }

    console.log('⏳ Waiting for response...');
    return null;
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Chatbot AI - Location Understanding Test');
  console.log('='.repeat(50));

  // Check if API is running
  try {
    const health = await makeRequest('/actuator/health');
    console.log(`\n✅ API Status: ${health.status === 200 ? 'Running' : 'Unknown'}`);
  } catch {
    console.log('\n⚠️  API might not be running. Make sure backend is started:');
    console.log('   cd backend && ./mvnw spring-boot:run');
  }

  console.log('\n📋 Test Cases:');
  console.log('-'.repeat(50));
  testCases.forEach((tc, i) => {
    console.log(`${i + 1}. "${tc.input}" → ${tc.expected}`);
  });

  console.log('\n' + '='.repeat(50));
  console.log('Starting tests...\n');

  // Test a few key cases
  const keyTests = [0, 1, 2, 3, 10, 11]; // Hồ Hoàn Kiếm, Cầu Rồng, Bà Nà, Hội An, Đà Nẵng, Hà Nội

  for (const idx of keyTests) {
    const tc = testCases[idx];
    await testChat(tc.input, `test-${idx}`);
    await new Promise((r) => setTimeout(r, 3000)); // Wait between tests
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests completed!');
}

// Interactive mode
async function interactiveMode() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n💬 Interactive Mode - Type your message:');
  console.log('   (or "quit" to exit)\n');

  let convId = null;
  let sessionId = `test-${Date.now()}`;

  const askQuestion = () => {
    rl.question('📝 You: ', async (message) => {
      if (message.toLowerCase() === 'quit') {
        rl.close();
        return;
      }

      await testChat(message, sessionId);
      askQuestion();
    });
  };

  askQuestion();
}

// Main
const args = process.argv.slice(2);
if (args.includes('--interactive') || args.includes('-i')) {
  interactiveMode();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test-chatbot.js [options]

Options:
  --interactive, -i    Start interactive chat mode
  --help, -h           Show this help message

Examples:
  node test-chatbot.js          Run predefined tests
  node test-chatbot.js -i       Chat interactively with bot
  `);
} else {
  runTests();
}
