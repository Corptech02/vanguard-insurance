// ViciDial Proxy Configuration
// This file configures the proxy URL for ViciDial integration

// Using local proxy URL - update this when using ngrok
// For local testing: http://localhost:5001/vicidial/api
// For ngrok: Update with current ngrok URL + /vicidial/api
// ViciDial API URL - Direct access
// This works when both sites use the same protocol (HTTP)
window.VICIDIAL_PROXY_URL = 'http://204.13.233.29/vicidial/non_agent_api.php';

console.log('ViciDial Proxy configured:', window.VICIDIAL_PROXY_URL);