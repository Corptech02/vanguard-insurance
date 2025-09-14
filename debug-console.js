// Debug COI Gmail Integration
console.log('=== COI GMAIL DEBUG ===');

// Check connection status
const isConnected = localStorage.getItem('gmail_connected');
const tokens = localStorage.getItem('gmail_tokens');
const credentials = localStorage.getItem('gmail_credentials');

console.log('1. Connection Status:');
console.log('   gmail_connected:', isConnected || 'NOT SET');
console.log('   Has tokens:', !!tokens);
console.log('   Has credentials:', !!credentials);

if (isConnected !== 'true') {
    console.log('\n❌ PROBLEM: Gmail is NOT marked as connected!');
    console.log('FIX: Run this command:');
    console.log("   localStorage.setItem('gmail_connected', 'true')");
} else {
    console.log('\n✅ Gmail is marked as connected');
}

// Try to fetch emails
console.log('\n2. Testing email fetch...');
const GMAIL_API_URL = 'http://192.168.40.232:3001/api/gmail';

fetch(`${GMAIL_API_URL}/search-coi?days=30`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(emails => {
        console.log(`\n✅ SUCCESS! Found ${emails.length} emails`);
        if (emails.length > 0) {
            console.log('First email:', emails[0]);
        } else {
            console.log('No COI-related emails found');
        }

        // Try to display them
        console.log('\n3. Attempting to display emails...');
        if (window.loadCOIInbox) {
            window.loadCOIInbox();
            console.log('✅ Called loadCOIInbox()');
        } else {
            console.log('❌ loadCOIInbox function not found');
        }
    })
    .catch(error => {
        console.log('\n❌ ERROR fetching emails:', error.message);
        console.log('This could mean:');
        console.log('- Backend not running');
        console.log('- Gmail not authorized');
        console.log('- CORS/Mixed content issue');
        console.log('\nTry allowing mixed content in browser settings');
    });

console.log('\n=== END DEBUG ===');