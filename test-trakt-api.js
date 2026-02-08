// Quick test script untuk debug Trakt API
const testTraktAPI = async () => {
  const CLIENT_ID = 'a77e82fa02d745fd23fe10a24d5f9eb8bc078a2d3b8dfee67890f5f10eb7782b';
  const ACCESS_TOKEN = '2e4c9dff2e717aa4a0f070afcbf6245cbe828db816d56022975373b94c77aac9';
  
  console.log('Testing Trakt API...\n');
  
  const url = 'https://api.trakt.tv/sync/history?limit=5';
  
  console.log('URL:', url);
  console.log('Headers:');
  console.log('  trakt-api-version: 2');
  console.log('  trakt-api-key:', CLIENT_ID);
  console.log('  Authorization: Bearer', ACCESS_TOKEN.substring(0, 20) + '...\n');
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': CLIENT_ID,
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
  });
  
  console.log('Response status:', response.status, response.statusText);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (response.ok) {
    const data = await response.json();
    console.log('\nSuccess! Data:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    const errorText = await response.text();
    console.log('\nError response:');
    console.log(errorText);
  }
};

testTraktAPI().catch(console.error);
