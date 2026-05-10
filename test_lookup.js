const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/chat/booking?code=TRS-20260509-52074',
  method: 'GET',
  headers: {}
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.end();
