// ViciDial HTTPS Handler - Works around mixed content issues
// This creates a special proxy handler for HTTPS environments

(function() {
    // Only activate on HTTPS
    if (window.location.protocol !== 'https:') return;
    
    console.log('ViciDial HTTPS handler activated');
    
    // Override the proxy URL for HTTPS
    // We'll create a manual proxy that works differently
    window.VICIDIAL_PROXY_URL = 'MANUAL_PROXY';
    
    // Store the original fetch
    const originalFetch = window.fetch;
    
    // Override fetch for ViciDial requests
    window.fetch = function(url, options) {
        // Check if this is a ViciDial request
        if (typeof url === 'string' && url.includes('MANUAL_PROXY')) {
            // Extract parameters from URL
            const urlObj = new URL(url.replace('MANUAL_PROXY', 'http://dummy'));
            const params = Object.fromEntries(urlObj.searchParams);
            
            console.log('Intercepted ViciDial request:', params);
            
            // For HTTPS, we need to show instructions to the user
            // since we can't make HTTP requests
            return Promise.resolve({
                ok: false,
                text: () => Promise.resolve('HTTPS_MODE_INSTRUCTIONS'),
                json: () => Promise.resolve({
                    error: 'HTTPS mode requires special configuration',
                    instructions: 'Please access the management system directly via HTTP at http://204.13.233.29:8888/ to use ViciDial integration'
                })
            });
        }
        
        // For all other requests, use original fetch
        return originalFetch.apply(this, arguments);
    };
    
    // Provide a direct test method
    window.testViciDialDirect = function(user, pass) {
        const testUrl = `http://204.13.233.29:8889/?source=test&user=${user}&pass=${pass}&function=version`;
        console.log('Direct test URL (copy and paste in new tab):', testUrl);
        alert('Due to HTTPS restrictions, please:\n\n1. Copy this URL: ' + testUrl + '\n2. Open it in a new tab\n3. If it shows VERSION info, credentials are correct');
    };
})();