// Data Synchronization Module for Vanguard Insurance Platform
// This module handles all data persistence with the backend server

const DataSync = {
    // Backend API URL - Update this when deploying
    API_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api'
        : window.location.hostname.includes('github.io')
        ? 'https://vanguard-backend.loca.lt/api'
        : 'http://192.168.40.232:3001/api',

    // Initialize data sync
    async init() {
        console.log('Initializing data sync...');

        // Check if we have local data to migrate
        const hasLocalData = this.checkLocalData();

        if (hasLocalData) {
            console.log('Migrating local data to server...');
            await this.migrateLocalData();
        }

        // Load data from server
        await this.loadAllData();

        // Set up auto-sync
        this.setupAutoSync();
    },

    // Check if there's local data to migrate
    checkLocalData() {
        const clients = localStorage.getItem('insurance_clients');
        const policies = localStorage.getItem('insurance_policies');
        const leads = localStorage.getItem('insurance_leads');

        return !!(clients || policies || leads);
    },

    // Migrate local data to server
    async migrateLocalData() {
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        if (clients.length > 0 || policies.length > 0 || leads.length > 0) {
            try {
                const response = await fetch(`${this.API_URL}/bulk-save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ clients, policies, leads })
                });

                if (response.ok) {
                    console.log('Local data migrated successfully');
                    // Clear migrated flag to prevent re-migration
                    localStorage.setItem('data_migrated', 'true');
                }
            } catch (error) {
                console.error('Error migrating data:', error);
            }
        }
    },

    // Load all data from server
    async loadAllData() {
        try {
            const response = await fetch(`${this.API_URL}/all-data`);
            if (response.ok) {
                const data = await response.json();

                // Update localStorage with server data
                localStorage.setItem('insurance_clients', JSON.stringify(data.clients || []));
                localStorage.setItem('insurance_policies', JSON.stringify(data.policies || []));
                localStorage.setItem('insurance_leads', JSON.stringify(data.leads || []));

                console.log('Data loaded from server');

                // Trigger UI refresh if the app is loaded
                if (window.refreshDashboard) {
                    window.refreshDashboard();
                }
            }
        } catch (error) {
            console.error('Error loading data from server:', error);
            // Fall back to localStorage if server is unavailable
        }
    },

    // Save client to server
    async saveClient(client) {
        try {
            const response = await fetch(`${this.API_URL}/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(client)
            });

            if (response.ok) {
                // Also update localStorage for immediate UI update
                const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const index = clients.findIndex(c => c.id === client.id);

                if (index >= 0) {
                    clients[index] = client;
                } else {
                    clients.push(client);
                }

                localStorage.setItem('insurance_clients', JSON.stringify(clients));
                return true;
            }
        } catch (error) {
            console.error('Error saving client:', error);
            // Fall back to localStorage only
            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const index = clients.findIndex(c => c.id === client.id);

            if (index >= 0) {
                clients[index] = client;
            } else {
                clients.push(client);
            }

            localStorage.setItem('insurance_clients', JSON.stringify(clients));
        }
        return false;
    },

    // Delete client from server
    async deleteClient(clientId) {
        try {
            const response = await fetch(`${this.API_URL}/clients/${clientId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Also update localStorage
                const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const filtered = clients.filter(c => c.id !== clientId);
                localStorage.setItem('insurance_clients', JSON.stringify(filtered));
                return true;
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            // Fall back to localStorage only
            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const filtered = clients.filter(c => c.id !== clientId);
            localStorage.setItem('insurance_clients', JSON.stringify(filtered));
        }
        return false;
    },

    // Save policy to server
    async savePolicy(policy) {
        try {
            const response = await fetch(`${this.API_URL}/policies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(policy)
            });

            if (response.ok) {
                // Also update localStorage
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const index = policies.findIndex(p => p.id === policy.id);

                if (index >= 0) {
                    policies[index] = policy;
                } else {
                    policies.push(policy);
                }

                localStorage.setItem('insurance_policies', JSON.stringify(policies));
                return true;
            }
        } catch (error) {
            console.error('Error saving policy:', error);
            // Fall back to localStorage only
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const index = policies.findIndex(p => p.id === policy.id);

            if (index >= 0) {
                policies[index] = policy;
            } else {
                policies.push(policy);
            }

            localStorage.setItem('insurance_policies', JSON.stringify(policies));
        }
        return false;
    },

    // Delete policy from server
    async deletePolicy(policyId) {
        try {
            const response = await fetch(`${this.API_URL}/policies/${policyId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Also update localStorage
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const filtered = policies.filter(p => p.id !== policyId);
                localStorage.setItem('insurance_policies', JSON.stringify(filtered));
                return true;
            }
        } catch (error) {
            console.error('Error deleting policy:', error);
            // Fall back to localStorage only
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const filtered = policies.filter(p => p.id !== policyId);
            localStorage.setItem('insurance_policies', JSON.stringify(filtered));
        }
        return false;
    },

    // Save lead to server
    async saveLead(lead) {
        try {
            const response = await fetch(`${this.API_URL}/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lead)
            });

            if (response.ok) {
                // Also update localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const index = leads.findIndex(l => l.id === lead.id);

                if (index >= 0) {
                    leads[index] = lead;
                } else {
                    leads.push(lead);
                }

                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                return true;
            }
        } catch (error) {
            console.error('Error saving lead:', error);
            // Fall back to localStorage only
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const index = leads.findIndex(l => l.id === lead.id);

            if (index >= 0) {
                leads[index] = lead;
            } else {
                leads.push(lead);
            }

            localStorage.setItem('insurance_leads', JSON.stringify(leads));
        }
        return false;
    },

    // Delete lead from server
    async deleteLead(leadId) {
        try {
            const response = await fetch(`${this.API_URL}/leads/${leadId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Also update localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const filtered = leads.filter(l => l.id !== leadId);
                localStorage.setItem('insurance_leads', JSON.stringify(filtered));
                return true;
            }
        } catch (error) {
            console.error('Error deleting lead:', error);
            // Fall back to localStorage only
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const filtered = leads.filter(l => l.id !== leadId);
            localStorage.setItem('insurance_leads', JSON.stringify(filtered));
        }
        return false;
    },

    // Set up auto-sync to periodically sync with server
    setupAutoSync() {
        // Sync every 30 seconds
        setInterval(() => {
            this.loadAllData();
        }, 30000);

        // Also sync when window regains focus
        window.addEventListener('focus', () => {
            this.loadAllData();
        });

        // Sync before page unload
        window.addEventListener('beforeunload', () => {
            // Quick sync attempt (may not always complete)
            this.syncLocalChanges();
        });
    },

    // Sync any local changes to server
    async syncLocalChanges() {
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        // Use bulk save for efficiency
        if (clients.length > 0 || policies.length > 0 || leads.length > 0) {
            try {
                await fetch(`${this.API_URL}/bulk-save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ clients, policies, leads })
                });
            } catch (error) {
                console.error('Error syncing changes:', error);
            }
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    DataSync.init();
});

// Export for use in other modules
window.DataSync = DataSync;