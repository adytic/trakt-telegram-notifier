/**
 * Helper script untuk mendapatkan Trakt Access Token & Refresh Token
 * 
 * Usage:
 * 1. Paste Client ID dan Client Secret Anda di bawah
 * 2. Run: node get-trakt-tokens.js
 * 3. Buka URL yang muncul di browser
 * 4. Authorize aplikasi
 * 5. Copy authorization code yang muncul
 * 6. Paste code tersebut ke script ini saat diminta
 */

const readline = require('readline');
const https = require('https');

// ===== ISI CREDENTIALS ANDA DI SINI =====
const CLIENT_ID = 'a77e82fa02d745fd23fe10a24d5f9eb8bc078a2d3b8dfee67890f5f10eb7782b';
const CLIENT_SECRET = '2b60b01fa6f441a06724244fa9fae5585f566e9b4803bec84ebf11ee32273c8b';
// =========================================

const REDIRECT_URI = 'https://zapp.com';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Trakt OAuth Token Generator ===\n');

// Step 1: Generate authorization URL
const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

console.log('STEP 1: Buka URL ini di browser Anda:\n');
console.log('\x1b[36m%s\x1b[0m', authUrl);
console.log('\n');
console.log('STEP 2: Login dan authorize aplikasi');
console.log('STEP 3: Browser akan redirect ke https://zapp.com?code=...');
console.log('STEP 4: Copy SEMUA text setelah "code=" dari URL bar (tanpa code=)\n');

// Step 2: Get authorization code from user
rl.question('Paste authorization code di sini: ', (code) => {
  if (!code || code.trim() === '') {
    console.error('❌ Authorization code tidak boleh kosong!');
    rl.close();
    return;
  }

  console.log('\n⏳ Menukar authorization code dengan access token...\n');

  // Step 3: Exchange code for tokens
  const postData = JSON.stringify({
    code: code.trim(),
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  });

  const options = {
    hostname: 'api.trakt.tv',
    port: 443,
    path: '/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        const tokens = JSON.parse(data);
        
        console.log('✅ Berhasil mendapatkan tokens!\n');
        console.log('='.repeat(60));
        console.log('Copy credentials berikut ke file .env Anda:');
        console.log('='.repeat(60));
        console.log(`TRAKT_CLIENT_ID=${CLIENT_ID}`);
        console.log(`TRAKT_CLIENT_SECRET=${CLIENT_SECRET}`);
        console.log(`TRAKT_ACCESS_TOKEN=${tokens.access_token}`);
        console.log(`TRAKT_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('='.repeat(60));
        console.log('\n✅ Token expires in:', tokens.expires_in, 'seconds (~90 days)');
        console.log('✅ Token akan auto-refresh oleh worker saat mendekati expiry\n');
      } else {
        console.error('❌ Error:', res.statusCode);
        console.error(data);
      }
      rl.close();
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
    rl.close();
  });

  req.write(postData);
  req.end();
});
