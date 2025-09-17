// Centralized API Configuration
// This file controls the API endpoint for all Vanguard Insurance functionality

// IMPORTANT: Update this URL when the API server changes
// Current API is hosted on centralized server with Cloudflare tunnel
const API_URL = 'https://establishment-high-mostly-modifications.trycloudflare.com';

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_URL };
}

// Make available globally
window.VANGUARD_API_URL = API_URL;

console.log('Vanguard API configured:', API_URL);