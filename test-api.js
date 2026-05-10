async function test() {
  try {
    const res = await fetch('https://platform.beeknoee.com/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-bee-d32a3f4bc08544b4945bee85e9bb3ff82a8b5ea082484f63b60d64792af5ef8d'
      },
      body: JSON.stringify({
        model: 'gemini-3-flash',
        messages: [{ role: 'user', content: 'hello' }]
      })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('ERROR:', err);
  }
}
test();
