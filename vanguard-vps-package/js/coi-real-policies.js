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
                        } else if (policy.coverage?.['Liability Limit']) {
                            coverageDisplay = policy.coverage['Liability Limit'];
                        } else if (policy.coverage?.['Combined Single Limit']) {
                            coverageDisplay = policy.coverage['Combined Single Limit'];
                        } else if (typeof policy.coverage === 'string') {
                            coverageDisplay = policy.coverage;
                        } else if (policy.coverageDetails?.liabilityLimit) {
                            coverageDisplay = `$${Math.round(policy.coverageDetails.liabilityLimit / 1000)}K`;
                        } else if (policy.coverageDetails?.['Liability Limit']) {
                            coverageDisplay = policy.coverageDetails['Liability Limit'];
                        }

                        // Get policy type
                        const policyType = policy.policyType || policy.type || 'Commercial Auto';

                        // Get client name - check multiple possible field locations
                        let clientName = policy.clientName ||
                                        policy.name ||
                                        policy.insured?.['Name/Business Name'] ||
                                        policy.insured?.['Primary Named Insured'] ||
                                        policy.insured?.name ||
                                        policy.insuredName ||
                                        'Unknown';

                        return `
                            <tr class="policy-row" data-policy-id="${policy.policyNumber || policy.id}">
                                <td><strong>${policy.policyNumber || policy.id}</strong></td>
                                <td>${clientName}</td>
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

    // Always use policyViewer as the container
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('policyViewer element not found');
        return;
    }

    // Get all policies from localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Find the specific policy
    const policy = policies.find(p => p.policyNumber === policyId || p.id === policyId);

    if (!policy) {
        console.error('Policy not found:', policyId);
        return;
    }

    // Store the current HTML for back navigation
    window.originalPolicyListHTML = policyViewer.innerHTML;

    // Get insured name
    const insuredName = policy.clientName ||
                       policy.name ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       policy.insured?.name ||
                       policy.insuredName ||
                       'Primary Insured';

    // Display comprehensive policy details
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
                <!-- Policy Information Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-file-contract"></i> Policy Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Policy Number:</label>
                            <span><strong>${policy.policyNumber || policy.overview?.['Policy Number'] || policy.id}</strong></span>
                        </div>
                        <div class="info-item">
                            <label>Policy Type:</label>
                            <span>${policy.policyType || policy.overview?.['Policy Type'] || policy.type || 'Commercial Auto'}</span>
                        </div>
                        <div class="info-item">
                            <label>Insurance Carrier:</label>
                            <span>${policy.carrier || policy.overview?.['Carrier'] || policy.overview?.carrier || policy.insuranceCarrier || policy.financial?.carrier || 'GEICO'}</span>
                        </div>
                        <div class="info-item">
                            <label>Policy Status:</label>
                            <span class="status-badge ${(policy.policyStatus || policy.status || policy.overview?.['Status'] || 'Active') === 'Active' ? 'status-active' : 'status-inactive'}">
                                ${policy.policyStatus || policy.status || policy.overview?.['Status'] || policy.overview?.status || 'Active'}
                            </span>
                        </div>
                        <div class="info-item">
                            <label>Effective Date:</label>
                            <span>${policy.effectiveDate || policy.overview?.['Effective Date'] || policy.overview?.effectiveDate || policy.startDate ? new Date(policy.effectiveDate || policy.overview?.['Effective Date'] || policy.overview?.effectiveDate || policy.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Expiration Date:</label>
                            <span>${policy.expirationDate || policy.overview?.['Expiration Date'] || policy.overview?.expirationDate || policy.expiryDate ? new Date(policy.expirationDate || policy.overview?.['Expiration Date'] || policy.overview?.expirationDate || policy.expiryDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        ${policy.dotNumber || policy.overview?.['DOT Number'] || policy.overview?.['DOT#'] ? `
                        <div class="info-item">
                            <label>DOT Number:</label>
                            <span>${policy.dotNumber || policy.overview?.['DOT Number'] || policy.overview?.['DOT#'] || 'N/A'}</span>
                        </div>` : ''}
                        ${policy.mcNumber || policy.overview?.['MC Number'] || policy.overview?.['MC#'] ? `
                        <div class="info-item">
                            <label>MC Number:</label>
                            <span>${policy.mcNumber || policy.overview?.['MC Number'] || policy.overview?.['MC#'] || 'N/A'}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Financial Information Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-dollar-sign"></i> Financial Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Annual Premium:</label>
                            <span><strong>$${(policy.annualPremium || policy.premium || policy.financial?.['Annual Premium'] || policy.financial?.['Premium'] || policy.financial?.annualPremium || policy.financial?.premium || 0).toLocaleString()}</strong></span>
                        </div>
                        <div class="info-item">
                            <label>Monthly Payment:</label>
                            <span>$${((policy.annualPremium || policy.premium || policy.financial?.['Annual Premium'] || policy.financial?.['Premium'] || policy.financial?.annualPremium || policy.financial?.premium || 0) / 12).toFixed(2).toLocaleString()}</span>
                        </div>
                        ${policy.financial?.deductible || policy.financial?.['Deductible'] || policy.financial?.['Collision Deductible'] || policy.deductible ? `
                        <div class="info-item">
                            <label>Deductible:</label>
                            <span>$${(policy.financial?.deductible || policy.financial?.['Deductible'] || policy.financial?.['Collision Deductible'] || policy.deductible || 0).toLocaleString()}</span>
                        </div>` : ''}
                        ${policy.financial?.downPayment || policy.financial?.['Down Payment'] || policy.financial?.['Down payment'] || policy.downPayment ? `
                        <div class="info-item">
                            <label>Down Payment:</label>
                            <span>$${(policy.financial?.downPayment || policy.financial?.['Down Payment'] || policy.financial?.['Down payment'] || policy.downPayment || 0).toLocaleString()}</span>
                        </div>` : ''}
                        ${policy.financial?.['Payment Frequency'] ? `
                        <div class="info-item">
                            <label>Payment Frequency:</label>
                            <span>${policy.financial['Payment Frequency']}</span>
                        </div>` : ''}
                        ${policy.financial?.['Finance Company'] ? `
                        <div class="info-item">
                            <label>Finance Company:</label>
                            <span>${policy.financial['Finance Company']}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Named Insured Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-user"></i> Named Insured</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Primary Insured:</label>
                            <span><strong>${insuredName}</strong></span>
                        </div>
                        ${policy.insured?.['Additional Named Insured'] || policy.additionalInsured ? `
                        <div class="info-item">
                            <label>Additional Insured:</label>
                            <span>${policy.insured?.['Additional Named Insured'] || policy.additionalInsured || 'None'}</span>
                        </div>` : ''}
                        ${policy.insured?.['DBA Name'] ? `
                        <div class="info-item">
                            <label>DBA Name:</label>
                            <span>${policy.insured['DBA Name']}</span>
                        </div>` : ''}
                        ${policy.insured?.['Mailing Address'] ? `
                        <div class="info-item">
                            <label>Mailing Address:</label>
                            <span>${policy.insured['Mailing Address']}</span>
                        </div>` : ''}
                        ${policy.insured?.['Garaging Address'] ? `
                        <div class="info-item">
                            <label>Garaging Address:</label>
                            <span>${policy.insured['Garaging Address']}</span>
                        </div>` : ''}
                        ${policy.contact?.phone || policy.insured?.phone || policy.insured?.['Phone'] ? `
                        <div class="info-item">
                            <label>Phone:</label>
                            <span>${policy.contact?.phone || policy.insured?.phone || policy.insured?.['Phone'] || 'N/A'}</span>
                        </div>` : ''}
                        ${policy.contact?.email || policy.insured?.email || policy.insured?.['Email'] ? `
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${policy.contact?.email || policy.insured?.email || policy.insured?.['Email'] || 'N/A'}</span>
                        </div>` : ''}
                        ${policy.insured?.['FEIN'] ? `
                        <div class="info-item">
                            <label>FEIN:</label>
                            <span>${policy.insured['FEIN']}</span>
                        </div>` : ''}
                        ${policy.insured?.['Entity Type'] ? `
                        <div class="info-item">
                            <label>Entity Type:</label>
                            <span>${policy.insured['Entity Type']}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Coverage Details Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-shield-alt"></i> Coverage Details</h3>
                    <div class="coverage-grid">
                        ${policy.coverage || policy.coverageDetails || policy.coverages ?
                            (policy.coverage ?
                                // If coverage is an object, display all fields
                                Object.entries(policy.coverage).filter(([key, value]) => value && value !== '').map(([key, value]) => `
                                    <div class="coverage-item">
                                        <label>${key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:</label>
                                        <span>${typeof value === 'number' ? `$${value.toLocaleString()}` :
                                               typeof value === 'string' && value.match(/^\d+$/) ? `$${parseInt(value).toLocaleString()}` :
                                               value}</span>
                                    </div>
                                `).join('') :
                                // If coverageDetails or coverages exists
                                Object.entries(policy.coverageDetails || policy.coverages || {}).filter(([key, value]) => value && value !== '').map(([key, value]) => `
                                    <div class="coverage-item">
                                        <label>${key}:</label>
                                        <span>${typeof value === 'number' ? `$${value.toLocaleString()}` :
                                               typeof value === 'string' && value.match(/^\d+$/) ? `$${parseInt(value).toLocaleString()}` :
                                               value}</span>
                                    </div>
                                `).join('')
                            ) :
                            // Default coverage display
                            `<div class="coverage-item">
                                <label>Liability Limit:</label>
                                <span>${policy.coverageLimit || '$1,000,000'}</span>
                            </div>
                            <div class="coverage-item">
                                <label>Coverage Type:</label>
                                <span>${policy.policyType || 'Commercial Auto'}</span>
                            </div>`
                        }
                        ${policy.operations?.radiusOfOperation || policy.operations?.['Radius of Operation'] || policy.radiusOfOperation ? `
                        <div class="coverage-item">
                            <label>Radius of Operation:</label>
                            <span>${policy.operations?.radiusOfOperation || policy.operations?.['Radius of Operation'] || policy.radiusOfOperation}</span>
                        </div>` : ''}
                        ${policy.operations?.['Hazmat'] ? `
                        <div class="coverage-item">
                            <label>Hazmat:</label>
                            <span>${policy.operations['Hazmat']}</span>
                        </div>` : ''}
                        ${policy.operations?.['List of Commodities'] ? `
                        <div class="coverage-item">
                            <label>Commodities:</label>
                            <span>${policy.operations['List of Commodities']}</span>
                        </div>` : ''}
                        ${policy.operations?.['States of Operation'] ? `
                        <div class="coverage-item">
                            <label>States of Operation:</label>
                            <span>${policy.operations['States of Operation']}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Vehicles Section (if applicable) -->
                ${policy.vehicles && policy.vehicles.length > 0 ? `
                <div class="profile-section">
                    <h3><i class="fas fa-truck"></i> Vehicles (${policy.vehicles.length})</h3>
                    <div style="overflow-x: auto;">
                        <table class="vehicles-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f3f4f6;">
                                    <th style="padding: 8px; text-align: left;">Year</th>
                                    <th style="padding: 8px; text-align: left;">Make</th>
                                    <th style="padding: 8px; text-align: left;">Model</th>
                                    <th style="padding: 8px; text-align: left;">VIN</th>
                                    <th style="padding: 8px; text-align: left;">Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${policy.vehicles.map(vehicle => `
                                    <tr style="border-bottom: 1px solid #e5e7eb;">
                                        <td style="padding: 8px;">${vehicle.year || vehicle.Year || vehicle['Year'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${vehicle.make || vehicle.Make || vehicle['Make'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${vehicle.model || vehicle.Model || vehicle['Model'] || 'N/A'}</td>
                                        <td style="padding: 8px; font-size: 12px;">${vehicle.vin || vehicle.VIN || vehicle['VIN'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${vehicle.type || vehicle.Type || vehicle['Type'] || vehicle['Vehicle Type'] || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>` : ''}

                <!-- Drivers Section (if applicable) -->
                ${policy.drivers && policy.drivers.length > 0 ? `
                <div class="profile-section">
                    <h3><i class="fas fa-id-card"></i> Drivers (${policy.drivers.length})</h3>
                    <div style="overflow-x: auto;">
                        <table class="drivers-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f3f4f6;">
                                    <th style="padding: 8px; text-align: left;">Name</th>
                                    <th style="padding: 8px; text-align: left;">License #</th>
                                    <th style="padding: 8px; text-align: left;">DOB</th>
                                    <th style="padding: 8px; text-align: left;">Experience</th>
                                    <th style="padding: 8px; text-align: left;">CDL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${policy.drivers.map(driver => `
                                    <tr style="border-bottom: 1px solid #e5e7eb;">
                                        <td style="padding: 8px;">${driver.name || driver['Full Name'] || driver['Driver Name'] || driver.Name || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.licenseNumber || driver['License Number'] || driver['License #'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.dob || driver.DOB || driver['Date of Birth'] || driver['DOB'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.experience || driver.Experience || driver['Years of Experience'] || driver['Experience (years)'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.cdl || driver.CDL || driver['CDL'] || driver.hasCDL || driver['Has CDL'] ? 'Yes' : 'No'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>` : ''}

                <!-- Operations Section (if applicable) -->
                ${policy.operations && Object.keys(policy.operations).length > 0 ? `
                <div class="profile-section">
                    <h3><i class="fas fa-truck-loading"></i> Operations</h3>
                    <div class="info-grid">
                        ${Object.entries(policy.operations).filter(([key, value]) =>
                            value && value !== '' &&
                            !['radiusOfOperation', 'Radius of Operation', 'Hazmat', 'List of Commodities', 'States of Operation'].includes(key)
                        ).map(([key, value]) => `
                            <div class="info-item">
                                <label>${key}:</label>
                                <span>${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}

                <!-- Additional Documents Section (if applicable) -->
                ${policy.documents && Object.keys(policy.documents).length > 0 ? `
                <div class="profile-section">
                    <h3><i class="fas fa-file-pdf"></i> Documents</h3>
                    <div class="info-grid">
                        ${Object.entries(policy.documents).filter(([key, value]) => value && value !== '').map(([key, value]) => `
                            <div class="info-item">
                                <label>${key}:</label>
                                <span>${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}

                <!-- Additional Information Section -->
                ${policy.notes || policy.additionalInfo || policy['Additional Notes'] ? `
                <div class="profile-section">
                    <h3><i class="fas fa-info-circle"></i> Additional Information</h3>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px;">
                        <p style="margin: 0; white-space: pre-wrap;">${policy.notes || policy.additionalInfo || policy['Additional Notes']}</p>
                    </div>
                </div>` : ''}

                <!-- Action Buttons -->
                <div class="profile-actions" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                    <button class="btn-primary" onclick="prepareCOI('${policy.policyNumber || policy.id}')">
                        <i class="fas fa-file-alt"></i> Generate COI
                    </button>
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

    // Find the policyViewer element
    const policyViewer = document.getElementById('policyViewer');

    if (policyViewer) {
        if (window.originalPolicyListHTML) {
            // Restore the saved HTML
            policyViewer.innerHTML = window.originalPolicyListHTML;
            // Clear the saved HTML for next time
            window.originalPolicyListHTML = null;
        } else {
            // Fallback: recreate the structure
            policyViewer.innerHTML = '<div class="policy-list" id="policyList"></div>';
            // Reload the policy list
            if (window.loadRealPolicyList) {
                window.loadRealPolicyList();
            }
        }
    } else {
        console.error('policyViewer not found');
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