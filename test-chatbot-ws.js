/**
 * Test script for Chatbot AI via WebSocket
 * Run: node test-chatbot-ws.js
 */

const WebSocket = require('ws');

const WS_URL = 'wss://tourista-production.up.railway.app/ws/chat';
const API_BASE = 'https://tourista-production.up.railway.app/api';

// Simple HTTP request helper
function fetch(url, options = {}) {
  return fetch_impl(url, options);
}

function fetch_impl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
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
    if (options.body) req.write(options.body);
    req.end();
  });
}

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

// Create WebSocket connection
function createWsConnection(email) {
  return new Promise((resolve, reject) => {
    // Append email as query param for authentication
    const wsUrl = `${WS_URL}?email=${encodeURIComponent(email)}`;
    const ws = new WebSocket(wsUrl, {
      rejectUnauthorized: false, // For Railway SSL
    });

    ws.on('open', () => {
      console.log('🔌 WebSocket connected');
      resolve(ws);
    });

    ws.on('error', (err) => {
      console.log('❌ WebSocket error:', err.message);
      reject(err);
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleMessage(msg);
      } catch (e) {
        console.log('📨 Raw message:', data.toString());
      }
    });
  });
}

let lastBotMessage = '';
let messageHandler = null;

function handleMessage(msg) {
  // Handle different message types
  if (msg.type === 'AUTH_SUCCESS') {
    console.log('✅ Authenticated as:', msg.email);
  } else if (msg.type === 'MESSAGE' || msg.message) {
    const content = msg.message?.content || msg.content || '';
    if (content) {
      lastBotMessage = content;
      console.log(`🤖 Bot: ${content.substring(0, 300)}${content.length > 300 ? '...' : ''}`);
    }
    if (msg.cards || msg.hotels || msg.tours) {
      console.log('📋 Cards received:', JSON.stringify(msg.cards || msg.hotels || msg.tours, null, 2));
    }
  } else if (msg.type === 'TYPING') {
    console.log('⏳ Bot is typing...');
  }

  if (messageHandler) messageHandler(msg);
}

// Send message via WebSocket
function sendMessage(ws, content) {
  return new Promise((resolve) => {
    lastBotMessage = '';
    messageHandler = (msg) => {
      if (msg.message || msg.content) {
        resolve();
      }
    };

    const payload = {
      type: 'MESSAGE',
      content: content,
    };

    ws.send(JSON.stringify(payload));
    console.log(`\n📨 User: "${content}"`);
  });
}

// Run single test
async function runSingleTest(ws, testCase) {
  await sendMessage(ws, testCase.input);

  // Wait for bot response
  await new Promise((r) => setTimeout(r, 3000));

  console.log(`\n📊 Expected: ${testCase.expected}`);
  console.log(`📝 Bot responded with location-related content: ${lastBotMessage.includes(testCase.expected) ? '✅ YES' : '⚠️ CHECK MANUALLY'}`);
}

// Run tests
async function runTests() {
  console.log('🧪 Chatbot AI - Location Understanding Test via WebSocket');
  console.log('='.repeat(60));
  console.log(`📡 URL: ${WS_URL}`);
  console.log();

  try {
    // Connect to WebSocket
    const ws = await createWsConnection('test@example.com');

    // Wait for connection ready
    await new Promise((r) => setTimeout(r, 2000));

    console.log('\n📋 Test Cases:');
    console.log('-'.repeat(60));
    testCases.forEach((tc, i) => {
      console.log(`${(i + 1).toString().padStart(2)}. "${tc.input}" → ${tc.expected}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('Starting tests...\n');

    // Test a few key cases
    const keyTests = [0, 1, 2, 3, 10, 11];

    for (const idx of keyTests) {
      const tc = testCases[idx];
      await runSingleTest(ws, tc);
      await new Promise((r) => setTimeout(r, 2000)); // Wait between tests
    }

    // Close connection
    ws.close();
    console.log('\n' + '='.repeat(60));
    console.log('✅ Tests completed!');
  } catch (err) {
    console.log('\n❌ Error:', err.message);
    console.log('   Make sure backend is deployed and running on Railway');
  }
}

// Interactive mode
async function interactiveMode() {
  console.log('💬 Interactive Mode');
  console.log(`📡 URL: ${WS_URL}`);
  console.log('   (type "quit" to exit)\n');

  try {
    const ws = await createWsConnection('test@example.com');
    await new Promise((r) => setTimeout(r, 2000));

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question('📝 You: ', async (message) => {
        if (message.toLowerCase() === 'quit') {
          ws.close();
          rl.close();
          return;
        }

        await sendMessage(ws, message);
        await new Promise((r) => setTimeout(r, 3000));
        askQuestion();
      });
    };

    askQuestion();
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

// Main
const args = process.argv.slice(2);
if (args.includes('--interactive') || args.includes('-i')) {
  interactiveMode();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test-chatbot-ws.js [options]

Options:
  --interactive, -i    Start interactive chat mode
  --help, -h           Show this help message

Examples:
  node test-chatbot-ws.js          Run predefined tests
  node test-chatbot-ws.js -i       Chat interactively with bot
  `);
} else {
  runTests();
}
