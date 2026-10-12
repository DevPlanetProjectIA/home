const https = require('https');

https.get('https://lista.mercadolivre.com.br/office-365-12-meses', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, res => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const regex = /href="(https:\/\/produto\.mercadolivre\.com\.br\/MLB-[^"]+)"/g;
    const matches = new Set();
    let m;
    while ((m = regex.exec(html)) !== null) {
      matches.add(m[1].split('?')[0]);
    }
    console.log('Found product links:', Array.from(matches).slice(0, 10));
  });
});
