// COI Real Policies - Fetch and display real policies from localStorage
console.log('COI Real Policies loading...');

// Create a new function to load real policies from localStorage
window.loadRealPolicyList = function() {
    console.log('Loading real policies from localStorage...');

    const policyList = document.getElementById('policyList');
    if (!policyList) return;

    // Get policies from localStorage (same as Policies tab)
    // This will always get the current state of policies
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log(`Loaded ${policies.length} real policies from localStorage`);

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

        // Display policies using exact demo design
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
                        // Determine status based on expiry
                        const expiryDate = new Date(policy.expiryDate || policy.expirationDate);
                        const today = new Date();
                        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
                        let status = daysUntilExpiry < 0 ? 'expired' : (daysUntilExpiry < 30 ? 'expiring' : 'active');

                        // Format coverage - check various property names
                        let coverageDisplay = '$1M'; // default
                        if (policy.coverageLimit) {
                            coverageDisplay = typeof policy.coverageLimit === 'number' ?
                                `$${(policy.coverageLimit / 1000000).toFixed(0)}M` : policy.coverageLimit;
                        } else if (policy.coverage) {
                            coverageDisplay = policy.coverage;
                        } else if (policy.coverageDetails && policy.coverageDetails.liabilityLimit) {
                            coverageDisplay = `$${Math.round(policy.coverageDetails.liabilityLimit / 1000)}K`;
                        }

                        // Get policy type
                        const policyType = policy.policyType || policy.type || 'Commercial Auto';

                        return `
                            <tr class="policy-row" data-policy-id="${policy.policyNumber || policy.id}">
                                <td><strong>${policy.policyNumber || policy.id}</strong></td>
                                <td>${policy.clientName || policy.name || 'Unknown'}</td>
                                <td><span class="policy-type">${policyType}</span></td>
                                <td>${coverageDisplay}</td>
                                <td>
                                    <span class="status-badge ${status === 'expiring' ? 'status-warning' : status === 'expired' ? 'status-expired' : 'status-active'}">
                                        ${expiryDate.toLocaleDateString()}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="viewPolicyProfileCOI('${policy.policyNumber || policy.id}')" title="View Profile">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
};

// View policy profile in COI panel (like demo)
window.viewPolicyProfileCOI = function(policyId) {
    console.log('View policy profile:', policyId);

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        // If policyViewer doesn't exist, use policyList area
        const policyList = document.getElementById('policyList');
        if (!policyList) return;
        policyViewer = policyList.parentElement;
    }

    // Get all policies from localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Find the specific policy
    const policy = policies.find(p => p.policyNumber === policyId || p.id === policyId);

    if (!policy) {
        console.error('Policy not found:', policyId);
        return;
    }

    // Display policy details in the same design as demo
    policyViewer.innerHTML = `
        <div class="policy-profile">
            <div class="profile-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn-back" onclick="backToPolicyList()" title="Back to Policy List">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>Policy Profile: ${policy.policyNumber || policy.id}</h2>
                </div>
                <button class="btn-primary" onclick="prepareCOI('${policy.policyNumber || policy.id}')">
                    <i class="fas fa-file-alt"></i> Prepare COI
                </button>
            </div>

            <div class="profile-content">
                <div class="profile-section">
                    <h3>Policy Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Policy Number:</label>
                            <span>${policy.policyNumber || policy.id}</span>
                        </div>
                        <div class="info-item">
                            <label>Type:</label>
                            <span>${policy.policyType || policy.type || 'Commercial Auto'}</span>
                        </div>
                        <div class="info-item">
                            <label>Carrier:</label>
                            <span>${policy.carrier || policy.insuranceCarrier || 'GEICO'}</span>
                        </div>
                        <div class="info-item">
                            <label>Premium:</label>
                            <span>$${policy.premium || policy.annualPremium || '0'}/year</span>
                        </div>
                        <div class="info-item">
                            <label>Effective Date:</label>
                            <span>${new Date(policy.effectiveDate || policy.startDate || new Date()).toLocaleDateString()}</span>
                        </div>
                        <div class="info-item">
                            <label>Expiry Date:</label>
                            <span>${new Date(policy.expiryDate || policy.expirationDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Named Insured</h3>
                    <ul class="insured-list">
                        <li>${policy.clientName || policy.name || 'Primary Insured'}</li>
                        ${policy.namedInsured ? policy.namedInsured.map(name => `<li>${name}</li>`).join('') : ''}
                    </ul>
                </div>

                <div class="profile-section">
                    <h3>Coverage Details</h3>
                    <div class="coverage-grid">
                        ${policy.coverageDetails ?
                            Object.entries(policy.coverageDetails).map(([key, value]) => `
                                <div class="coverage-item">
                                    <label>${key}:</label>
                                    <span>${typeof value === 'number' ? `$${value.toLocaleString()}` : value}</span>
                                </div>
                            `).join('') :
                            `<div class="coverage-item">
                                <label>Liability Limit:</label>
                                <span>${policy.coverageLimit || policy.coverage || '$1,000,000'}</span>
                            </div>`
                        }
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn-secondary" onclick="editPolicy('${policy.policyNumber || policy.id}')">
                        <i class="fas fa-edit"></i> Edit Policy
                    </button>
                    <button class="btn-secondary" onclick="downloadPolicy('${policy.policyNumber || policy.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn-secondary" onclick="emailPolicy('${policy.policyNumber || policy.id}')">
                        <i class="fas fa-envelope"></i> Email
                    </button>
                </div>
            </div>
        </div>
    `;
};

// Back to policy list
window.backToPolicyList = function() {
    console.log('Back to policy list');
    // Reload the policy list
    if (window.loadRealPolicyList) {
        window.loadRealPolicyList();
    }
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

    window.loadRealPolicyList();
    setTimeout(() => notification.remove(), 1000);
};

console.log('COI Real Policies ready');