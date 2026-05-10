const http = require('http');

const tests = [
  { message: 'Tìm tour Đà Nẵng 5 triệu cho 2 người' },
  { message: 'Chính sách hủy tour như thế nào?' },
];

async function runTests() {
  for (const test of tests) {
    const data = JSON.stringify(test);
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/chat/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const result = await new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve(JSON.parse(body)));
      });
      req.write(data);
      req.end();
    });

    console.log(`\n=== Test: "${test.message}" ===`);
    console.log('Success:', result.success);
    if (result.data) {
      console.log('Content:', result.data.content?.substring(0, 200) + '...');
    } else {
      console.log('Message:', result.message);
    }
  }
}

runTests();
