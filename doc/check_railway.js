const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  try {
    // Check railway deployments via API
    const r = await httpGet('https://railway.app/api/v1/deployments');
    console.log('Status:', r.status);
    console.log('Body:', r.body.slice(0, 500));
  } catch(e) {
    console.log('Error:', e.message);
  }
}
main();
