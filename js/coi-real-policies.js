// COI Real Policies - Fetch and display real policies from database
console.log('COI Real Policies loading...');

// API URL - Using the same localtunnel as Gmail
const API_URL = 'https://shaggy-dingos-divide.loca.lt';

// Override loadPolicyList to fetch real policies
window.loadPolicyList = async function() {
    console.log('Loading real policies from database...');

    const policyList = document.getElementById('policyList');
    if (!policyList) return;

    // Show loading state
    policyList.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
            <p>Loading policies...</p>
        </div>
    `;

    try {
        // Fetch real policies from backend
        const response = await fetch(`${API_URL}/api/policies`, {
            headers: {
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const policies = await response.json();
        console.log(`Loaded ${policies.length} real policies`);

        if (policies.length === 0) {
            policyList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>No policies found</p>
                    <button class="btn-primary" onclick="addNewPolicy()" style="margin-top: 16px;">
                        <i class="fas fa-plus"></i> Add Policy
                    </button>
                </div>
            `;
            return;
        }

        // Display policies in a table
        policyList.innerHTML = `
            <table class="policy-table">
                <thead>
                    <tr>
                        <th>Policy #</th>
                        <th>Client</th>
                        <th>Type</th>
                        <th>Coverage</th>
                        <th>Expiry</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${policies.map(policy => {
                        // Check expiry status
                        const expiryDate = new Date(policy.expiryDate);
                        const today = new Date();
                        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
                        let statusClass = '';
                        let statusIcon = '';

                        if (daysUntilExpiry < 0) {
                            statusClass = 'expired';
                            statusIcon = '<i class="fas fa-exclamation-circle" style="color: #ef4444;" title="Expired"></i>';
                        } else if (daysUntilExpiry < 30) {
                            statusClass = 'expiring';
                            statusIcon = '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;" title="Expiring Soon"></i>';
                        } else {
                            statusClass = 'active';
                            statusIcon = '<i class="fas fa-check-circle" style="color: #10b981;" title="Active"></i>';
                        }

                        return `
                            <tr class="policy-row ${statusClass}" data-policy-id="${policy.policyNumber}">
                                <td>
                                    ${statusIcon}
                                    <strong>${policy.policyNumber}</strong>
                                </td>
                                <td>${policy.clientName}</td>
                                <td><span class="policy-type">${policy.type}</span></td>
                                <td><strong>${policy.coverageDisplay}</strong></td>
                                <td>${expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td>
                                    <button class="btn-icon" onclick="viewPolicyDetails('${policy.policyNumber}')" title="View Details">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="generateCOI('${policy.policyNumber}')" title="Generate COI">
                                        <i class="fas fa-file-export"></i>
                                    </button>
                                    <button class="btn-icon" onclick="renewPolicy('${policy.policyNumber}')" title="Renew Policy">
                                        <i class="fas fa-sync"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 14px; color: #6b7280;">
                        Total Policies: <strong>${policies.length}</strong> |
                        Active: <strong style="color: #10b981;">${policies.filter(p => {
                            const exp = new Date(p.expiryDate);
                            const days = Math.floor((exp - new Date()) / (1000 * 60 * 60 * 24));
                            return days >= 30;
                        }).length}</strong> |
                        Expiring: <strong style="color: #f59e0b;">${policies.filter(p => {
                            const exp = new Date(p.expiryDate);
                            const days = Math.floor((exp - new Date()) / (1000 * 60 * 60 * 24));
                            return days >= 0 && days < 30;
                        }).length}</strong> |
                        Expired: <strong style="color: #ef4444;">${policies.filter(p => {
                            const exp = new Date(p.expiryDate);
                            const days = Math.floor((exp - new Date()) / (1000 * 60 * 60 * 24));
                            return days < 0;
                        }).length}</strong>
                    </div>
                    <button class="btn-primary btn-small" onclick="exportPolicies()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading policies:', error);
        policyList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>Error loading policies</p>
                <p style="font-size: 14px; margin-top: 8px;">${error.message}</p>
                <button class="btn-primary" onclick="loadPolicyList()" style="margin-top: 16px;">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        `;
    }
};

// View policy details
window.viewPolicyDetails = function(policyId) {
    console.log('View policy details:', policyId);
    // Could open a modal or expand inline with full policy details
    alert(`Policy Details: ${policyId}\n\nFull details view coming soon!`);
};

// Generate COI for policy
window.generateCOI = function(policyId) {
    console.log('Generate COI for policy:', policyId);
    // This would integrate with COI generation
    if (window.selectPolicy) {
        window.selectPolicy(policyId);
    }
};

// Renew policy
window.renewPolicy = function(policyId) {
    console.log('Renew policy:', policyId);
    alert(`Renew Policy: ${policyId}\n\nRenewal workflow coming soon!`);
};

// Export policies
window.exportPolicies = function() {
    console.log('Export policies to CSV');
    alert('Export functionality coming soon!');
};

// Add new policy
window.addNewPolicy = function() {
    console.log('Add new policy');
    alert('Add new policy form coming soon!');
};

// Refresh policies function (for the refresh button)
window.refreshPolicies = function() {
    console.log('Refreshing policies...');
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
    notification.innerHTML = '<i class="fas fa-sync fa-spin"></i> Refreshing policies...';
    document.body.appendChild(notification);

    loadPolicyList().finally(() => {
        setTimeout(() => notification.remove(), 1000);
    });
};

console.log('COI Real Policies ready');