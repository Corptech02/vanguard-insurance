// API Service for comprehensive Vanguard Insurance API
// Dynamic API URL configuration
const getAPIBaseURL = () => {
    // Check for manually set API URL first
    const customAPI = localStorage.getItem('VANGUARD_API_URL');
    if (customAPI) {
        console.log('Using custom API URL:', customAPI);
        return customAPI;
    }

    // Default URLs
    if (window.location.hostname === 'localhost') {
        return 'http://localhost:8897';
    }

    // For GitHub Pages, try to use a tunnel if available
    if (window.location.protocol === 'https:') {
        // Show setup instructions if no custom URL is set
        if (!sessionStorage.getItem('api_warning_shown')) {
            sessionStorage.setItem('api_warning_shown', 'true');
            console.warn(`
⚠️ DATABASE CONNECTION REQUIRED
================================
To connect to the 2.2M carrier database:

1. Ask your admin for the current API tunnel URL
2. Set it using: localStorage.setItem('VANGUARD_API_URL', 'https://your-tunnel-url')
3. Refresh the page

Or access from the local network at: http://192.168.40.232
            `);
        }
        // Return a placeholder that will fail gracefully
        return 'https://api-not-configured';
    }

    return 'http://192.168.40.232:8897';
};

const API_BASE_URL = getAPIBaseURL();
console.log('API Service using:', API_BASE_URL);

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

const apiService = {
    // Search carriers with filters
    searchCarriers: async function(filters) {
        try {
            // Build clean request body - only include non-empty values
            const searchBody = {
                page: filters.page || 1,
                per_page: filters.limit || 20
            };
            
            // Only add filters that have values
            if (filters.usdot) searchBody.usdot_number = filters.usdot;
            if (filters.company) searchBody.legal_name = filters.company;
            if (filters.state) searchBody.state = filters.state;
            if (filters.mc) searchBody.mc_number = filters.mc;
            if (filters.hasInsurance !== undefined) searchBody.has_insurance = filters.hasInsurance;
            if (filters.minCoverage) searchBody.min_coverage = filters.minCoverage;
            
            console.log('Sending search request:', searchBody);
            
            const response = await fetch(`${API_BASE_URL}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(searchBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching carriers:', error);
            throw error;
        }
    },

    // Get carrier by USDOT number
    getCarrierByDOT: async function(dotNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/carriers/${dotNumber}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching carrier:', error);
            throw error;
        }
    },

    // Get summary statistics
    getStats: async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/stats/summary`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    },

    // Generate leads based on criteria - uses REAL insurance database
    generateLeads: async function(criteria) {
        try {
            console.log('Generating leads with criteria:', criteria);

            // Use the real FMCSA API for expiring insurance leads
            const params = new URLSearchParams({
                days: criteria.expiryDays || criteria.insurance_expiring_days || 30,
                limit: criteria.limit || criteria.count || 500,
                state: criteria.state || '',
                min_premium: criteria.minPremium || 0
            });

            // Add skip days for 5/30 filter
            if (criteria.skipDays && criteria.skipDays > 0) {
                params.append('skip_days', criteria.skipDays);
                console.log(`Applying 5/30 filter: skipping first ${criteria.skipDays} days`);
            }
            
            // Add insurance companies filter if provided
            if (criteria.insuranceCompanies && criteria.insuranceCompanies.length > 0) {
                params.append('insurance_companies', criteria.insuranceCompanies.join(','));
            }
            
            // Always use the backend server API endpoint
            const response = await fetch(`${API_BASE_URL}/api/leads/expiring-insurance?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Handle both array response and object with leads property
            const leadsArray = Array.isArray(data) ? data : (data.leads || []);
            console.log(`Retrieved ${leadsArray.length} real insurance leads from FMCSA database`);
            
            // Transform the API data to match our lead format
            const transformedLeads = leadsArray.map(lead => ({
                id: `LEAD_${lead.dot_number || lead.usdot_number}_${Date.now()}`,
                name: lead.dba_name || lead.legal_name || lead.carrier_name || 'Unknown Carrier',
                contact: lead.company_officer_1 || lead.contact_name || 'Unknown',
                company: lead.dba_name || lead.legal_name || lead.carrier_name || '',
                email: lead.email_address || lead.email || `contact${lead.dot_number || lead.usdot_number}@carrier.com`,
                phone: lead.phone || lead.telephone || '(555) 000-0000',
                product: criteria.product || 'Commercial Auto Insurance',
                premium: lead.coverage_amount || lead.liability_insurance_amount || lead.insurance_amount || lead.bipd_insurance_on_file_amount || 1000000,
                stage: 'new',
                priority: lead.priority || 'medium',
                renewalDate: lead.insurance_expiry_date || lead.liability_insurance_date || lead.policy_renewal_date || lead.insurance_expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                assignedTo: 'Unassigned',
                source: 'FMCSA Database',
                state: lead.phy_state || lead.physical_state || lead.mailing_state || criteria.state || 'Unknown',
                created: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString(),
                // Additional insurance data WITH CORRECT FIELD NAMES
                insuranceCompany: lead.insurance_company || lead.insurance_carrier || 'Unknown',
                policyNumber: lead.policy_number || lead.policy_surety_number || 'N/A',
                usdotNumber: lead.dot_number || lead.usdot_number,
                mcNumber: lead.mc_number || lead.mc_mx_ff_number || 'N/A',
                powerUnits: lead.power_units || lead.nbr_power_unit || 0,
                drivers: lead.total_drivers || lead.driver_total || 0,
                // Pass through the original insurance data
                insurance_company: lead.insurance_company,
                insurance_expiry_date: lead.insurance_expiry_date,
                liability_insurance_amount: lead.liability_insurance_amount,
                coverage_amount: lead.coverage_amount
            }));
            
            // Save to localStorage
            const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const allLeads = [...existingLeads, ...transformedLeads];
            localStorage.setItem('leads', JSON.stringify(allLeads));
            
            // Apply 5/30 filter if skipDays is specified
            let finalLeads = transformedLeads;
            if (criteria.skipDays && criteria.skipDays > 0) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const skipUntil = new Date(today);
                skipUntil.setDate(skipUntil.getDate() + criteria.skipDays);

                const showUntil = new Date(today);
                showUntil.setDate(showUntil.getDate() + criteria.expiryDays);

                finalLeads = transformedLeads.filter(lead => {
                    const renewalDate = new Date(lead.renewalDate);
                    return renewalDate > skipUntil && renewalDate <= showUntil;
                });

                console.log(`Applied 5/30 filter: ${finalLeads.length} of ${transformedLeads.length} leads (skipped first ${criteria.skipDays} days)`);
            }

            console.log(`Generated ${finalLeads.length} real insurance leads from FMCSA database`);
            return {
                success: true,
                total: finalLeads.length,
                leads: finalLeads
            };
        } catch (error) {
            console.error('Error generating leads:', error);
            
            // Detailed error diagnostics
            let errorMessage = 'Unable to connect to insurance database.\n\n';
            let debugInfo = [];
            
            // Check if it's a network error
            if (error.message.includes('Failed to fetch')) {
                debugInfo.push('❌ Network Error: Cannot reach the insurance API server');
                debugInfo.push('📍 API URL: http://localhost:8002');
                debugInfo.push('🔍 Possible causes:');
                debugInfo.push('  • Insurance database server is not running');
                debugInfo.push('  • Port 8002 is blocked or unavailable');
                debugInfo.push('  • CORS policy blocking the request');
                
                // Check if API is accessible
                try {
                    const healthCheck = await fetch('http://localhost:8002/api/health', { 
                        method: 'GET',
                        mode: 'no-cors' 
                    });
                    debugInfo.push('✅ API server appears to be reachable');
                } catch (e) {
                    debugInfo.push('❌ API server is not accessible from this browser');
                    
                    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
                        debugInfo.push('');
                        debugInfo.push('⚠️ NGROK LIMITATION DETECTED');
                        debugInfo.push('You are accessing Vanguard through ngrok, which cannot reach localhost:8002');
                        debugInfo.push('');
                        debugInfo.push('💡 SOLUTIONS:');
                        debugInfo.push('1. Access Vanguard locally: http://localhost:8897');
                        debugInfo.push('2. OR upgrade ngrok to paid plan for multiple tunnels');
                        debugInfo.push('3. OR set up a reverse proxy on your server');
                        debugInfo.push('');
                        debugInfo.push('✅ The insurance database IS running with 2.2M carriers,');
                        debugInfo.push('   but cannot be accessed through ngrok free tier.');
                    } else {
                        debugInfo.push('💡 Solution: Start the insurance API server');
                        debugInfo.push('   Run: cd /home/corp06/DB-system && python3 demo_real_api_alt_port.py');
                    }
                }
            } else if (error.message.includes('HTTP error')) {
                debugInfo.push(`❌ HTTP Error: ${error.message}`);
                debugInfo.push('🔍 The API server responded with an error');
                
                if (error.message.includes('404')) {
                    debugInfo.push('  • Endpoint not found - API may need update');
                } else if (error.message.includes('500')) {
                    debugInfo.push('  • Server error - Check API logs');
                } else if (error.message.includes('403')) {
                    debugInfo.push('  • Access denied - Check API permissions');
                }
            } else {
                debugInfo.push(`❌ Unexpected Error: ${error.message}`);
                debugInfo.push('📋 Full error details:');
                debugInfo.push(error.stack || error.toString());
            }
            
            // Add timestamp
            debugInfo.push('');
            debugInfo.push(`⏰ Error occurred at: ${new Date().toLocaleString()}`);
            debugInfo.push('📊 Requested criteria:');
            debugInfo.push(JSON.stringify(criteria, null, 2));
            
            errorMessage += debugInfo.join('\n');
            
            // Log to console with formatting
            console.group('🚨 Lead Generation Failed - Diagnostic Report');
            debugInfo.forEach(line => console.log(line));
            console.groupEnd();
            
            // Throw detailed error for UI to handle
            const detailedError = new Error(errorMessage);
            detailedError.diagnostics = debugInfo;
            detailedError.originalError = error;
            throw detailedError;
        }
    },

    // Lead Management Functions
    async getLeads() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/leads`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching leads:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('leads') || '[]');
        }
    },

    async createLead(leadData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/leads`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(leadData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Also save to localStorage for offline support
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            localLeads.push(data);
            localStorage.setItem('leads', JSON.stringify(localLeads));

            return data;
        } catch (error) {
            console.error('Error creating lead:', error);
            // Fallback to localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const newLead = {
                id: `LEAD_${Date.now()}`,
                ...leadData,
                created: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString()
            };
            localLeads.push(newLead);
            localStorage.setItem('leads', JSON.stringify(localLeads));
            return newLead;
        }
    },

    async updateLead(leadId, leadData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(leadData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Also update localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const index = localLeads.findIndex(lead => lead.id === leadId);
            if (index !== -1) {
                localLeads[index] = { ...localLeads[index], ...leadData };
                localStorage.setItem('leads', JSON.stringify(localLeads));
            }

            return data;
        } catch (error) {
            console.error('Error updating lead:', error);
            // Fallback to localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const index = localLeads.findIndex(lead => lead.id === leadId);
            if (index !== -1) {
                localLeads[index] = { ...localLeads[index], ...leadData };
                localStorage.setItem('leads', JSON.stringify(localLeads));
                return localLeads[index];
            }
            throw error;
        }
    },

    async deleteLead(leadId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Also remove from localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const filteredLeads = localLeads.filter(lead => lead.id !== leadId);
            localStorage.setItem('leads', JSON.stringify(filteredLeads));

            return { success: true };
        } catch (error) {
            console.error('Error deleting lead:', error);
            // Fallback to localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const filteredLeads = localLeads.filter(lead => lead.id !== leadId);
            localStorage.setItem('leads', JSON.stringify(filteredLeads));
            return { success: true };
        }
    },

    // Policy Management Functions
    async getPolicies() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/policies`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching policies:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('policies') || '[]');
        }
    },

    async createPolicy(policyData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/policies`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(policyData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Also save to localStorage
            const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');
            localPolicies.push(data);
            localStorage.setItem('policies', JSON.stringify(localPolicies));

            return data;
        } catch (error) {
            console.error('Error creating policy:', error);
            // Fallback to localStorage
            const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');
            const newPolicy = {
                id: `POLICY_${Date.now()}`,
                ...policyData,
                created: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString()
            };
            localPolicies.push(newPolicy);
            localStorage.setItem('policies', JSON.stringify(localPolicies));
            return newPolicy;
        }
    },

    async updatePolicy(policyId, policyData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/policies/${policyId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(policyData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Also update localStorage
            const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');
            const index = localPolicies.findIndex(policy => policy.id === policyId);
            if (index !== -1) {
                localPolicies[index] = { ...localPolicies[index], ...policyData };
                localStorage.setItem('policies', JSON.stringify(localPolicies));
            }

            return data;
        } catch (error) {
            console.error('Error updating policy:', error);
            throw error;
        }
    },

    // Reminders/Tasks Functions
    async getReminders() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reminders`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching reminders:', error);
            // Fallback to localStorage
            const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
            const agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
            return [...personalTodos, ...agencyTodos];
        }
    },

    async createReminder(reminderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reminders`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(reminderData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating reminder:', error);
            throw error;
        }
    },

    // Authentication Functions
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();

            // Store token and user info
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('userInfo', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    },

    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error during registration:', error);
            throw error;
        }
    },

    // Dashboard Statistics
    async getDashboardStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/stats/dashboard`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Fallback to calculating from localStorage
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const clients = JSON.parse(localStorage.getItem('clients') || '[]');
            const policies = JSON.parse(localStorage.getItem('policies') || '[]');

            return {
                total_leads: leads.length,
                total_clients: clients.length,
                total_policies: policies.length,
                total_premium: policies.reduce((sum, policy) => sum + (parseFloat(policy.premium) || 0), 0),
                monthly_lead_premium: leads.reduce((sum, lead) => sum + (parseFloat(lead.premium) || 0), 0)
            };
        }
    }
};

// Make it globally available
window.apiService = apiService;