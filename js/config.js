// API Configuration
const API_CONFIG = {
    // Using Render backend URL for production
    API_BASE_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:8897'
        : 'https://vanguard-insurance.onrender.com',
    
    // API endpoints
    ENDPOINTS: {
        SEARCH: '/api/search',
        STATS: '/api/stats/summary',
        LEADS_EXPIRING: '/api/leads/expiring-insurance',
        VICIDIAL_TEST: '/api/vicidial/test',
        VICIDIAL_LISTS: '/api/vicidial/lists',
        VICIDIAL_OVERWRITE: '/api/vicidial/overwrite',
        VICIDIAL_UPLOAD: '/api/vicidial/upload'
    }
};

// Export for use in other scripts
window.API_CONFIG = API_CONFIG;