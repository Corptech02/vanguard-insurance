// Authentication Service for Vanguard Insurance
const authService = {
    // API URLs
    AUTH_API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8881'
        : 'https://0ef6f73c45be.ngrok-free.app',  // Using same ngrok for now
    
    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;
        
        // Check if token is expired (basic check)
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            // Token is valid for 8 hours
            const tokenAge = Date.now() - (userInfo.loginTime || 0);
            if (tokenAge > 8 * 60 * 60 * 1000) {
                this.logout();
                return false;
            }
            return true;
        } catch {
            return false;
        }
    },
    
    // Get current user info
    getCurrentUser() {
        if (!this.isAuthenticated()) return null;
        return JSON.parse(localStorage.getItem('userInfo') || '{}');
    },
    
    // Get auth token
    getToken() {
        return localStorage.getItem('authToken');
    },
    
    // Login
    async login(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${this.AUTH_API_URL}/auth/token`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        
        const data = await response.json();
        
        // Store token and user info
        localStorage.setItem('authToken', data.access_token);
        const userInfo = {
            ...data.user_info,
            loginTime: Date.now()
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        return data;
    },
    
    // Register
    async register(userData) {
        const response = await fetch(`${this.AUTH_API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }
        
        return await response.json();
    },
    
    // Logout
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        window.location.href = 'login.html';
    },
    
    // Check authentication and redirect if needed
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },
    
    // Get authorization headers
    getAuthHeaders() {
        const token = this.getToken();
        if (!token) return {};
        
        return {
            'Authorization': `Bearer ${token}`
        };
    },
    
    // Check if user has permission
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // Admin has all permissions
        if (user.role === 'admin' || (user.permissions && user.permissions.includes('all'))) {
            return true;
        }
        
        return user.permissions && user.permissions.includes(permission);
    },
    
    // Display user info in UI
    displayUserInfo() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        // Update any user display elements
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = user.full_name || user.username;
        });
        
        const userRoleElements = document.querySelectorAll('.user-role');
        userRoleElements.forEach(el => {
            el.textContent = user.role;
        });
        
        // Add logout button if not exists
        if (!document.getElementById('logoutBtn')) {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'logoutBtn';
                logoutBtn.className = 'logout-btn';
                logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout (${user.username})`;
                logoutBtn.style.cssText = `
                    position: absolute;
                    right: 20px;
                    top: 15px;
                    padding: 8px 16px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                `;
                logoutBtn.onclick = () => this.logout();
                navbar.appendChild(logoutBtn);
            }
        }
    },
    
    // Initialize auth check on page load
    init() {
        // Pages that don't require auth
        const publicPages = ['login.html', 'register.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (!publicPages.includes(currentPage)) {
            // Require authentication for all other pages
            if (!this.requireAuth()) {
                return false;
            }
            
            // Display user info
            this.displayUserInfo();
            
            // Setup periodic token check
            setInterval(() => {
                if (!this.isAuthenticated()) {
                    alert('Your session has expired. Please login again.');
                    this.logout();
                }
            }, 60000); // Check every minute
        }
        
        return true;
    },
    
    // Migrate localStorage data to server
    async migrateLocalData() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        try {
            // Get local data
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
            const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');
            
            // Only migrate if there's data
            if (localLeads.length || localClients.length || localPolicies.length) {
                console.log('Migrating local data to server...');
                
                // Use CRM API to save data
                const CRM_API = window.location.hostname === 'localhost'
                    ? 'http://localhost:8880'
                    : 'https://0ef6f73c45be.ngrok-free.app';
                
                const headers = {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                };
                
                // Migrate leads
                for (const lead of localLeads) {
                    await fetch(`${CRM_API}/api/leads`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            ...lead,
                            assigned_to: user.id
                        })
                    });
                }
                
                // Clear local storage after successful migration
                localStorage.removeItem('leads');
                localStorage.removeItem('clients');
                localStorage.removeItem('policies');
                
                console.log('Data migration completed');
            }
        } catch (error) {
            console.error('Data migration failed:', error);
        }
    }
};

// Initialize auth service when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authService.init());
} else {
    authService.init();
}

// Make authService globally available
window.authService = authService;