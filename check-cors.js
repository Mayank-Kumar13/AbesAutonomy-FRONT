const fetch = require('node-fetch') || globalThis.fetch;
async function checkCors() {
  const url = 'https://abesautonomy-backend.onrender.com/api/notes/123/pdf';
  try {
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://abes-autonomy-front.vercel.app',
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('Status:', res.status);
    console.log('Headers:');
    res.headers.forEach((value, name) => console.log(name, ':', value));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
checkCors();
