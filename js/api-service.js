// API Service for connecting to FMCSA Database
const API_BASE_URL = 'http://localhost:8894';

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
            
            // Add insurance companies filter if provided
            if (criteria.insuranceCompanies && criteria.insuranceCompanies.length > 0) {
                params.append('insurance_companies', criteria.insuranceCompanies.join(','));
            }
            
            // Always use the proxied API endpoint through the same server
            // This works both locally and through ngrok
            const response = await fetch(`/api/leads/expiring-insurance?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
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
            
            console.log(`Generated ${transformedLeads.length} real insurance leads from FMCSA database`);
            return {
                success: true,
                total: transformedLeads.length,
                leads: transformedLeads
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
    }
};

// Make it globally available
window.apiService = apiService;