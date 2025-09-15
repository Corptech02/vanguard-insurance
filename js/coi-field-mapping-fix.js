// Enhanced field mapping for COI policy display
console.log('COI Field Mapping Fix loading...');

// Helper function to get field value from various possible locations
window.getFieldValue = function(policy, fieldPaths) {
    for (const path of fieldPaths) {
        const value = path.split('.').reduce((obj, key) => {
            if (!obj) return null;
            // Handle bracket notation
            if (key.includes('[')) {
                const [base, prop] = key.split('[');
                const propName = prop.replace(']', '').replace(/['"]/g, '');
                return obj[base] ? obj[base][propName] : null;
            }
            return obj[key];
        }, policy);

        if (value !== null && value !== undefined && value !== '') {
            return value;
        }
    }
    return null;
};

// Override the viewPolicyProfileCOI to use enhanced field mapping
const originalViewPolicyProfileCOI = window.viewPolicyProfileCOI;
window.viewPolicyProfileCOI = function(policyId) {
    console.log('Enhanced View policy profile:', policyId);

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('Policy viewer element not found');
        return;
    }

    // Get all policies from localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Find the policy
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.policyNumber) === String(policyId) ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        console.error('Policy not found:', policyId);
        policyViewer.innerHTML = '<div class="error">Policy not found</div>';
        return;
    }

    console.log('Found policy:', policy);

    // Save current content for back button
    window.originalPolicyListHTML = policyViewer.innerHTML;

    // Enhanced field extraction with multiple possible paths
    const getPremium = () => {
        const paths = [
            'financial["Annual Premium"]',
            'financial.annualPremium',
            'financial.Premium',
            'financial.premium',
            'annualPremium',
            'premium',
            'overview["Annual Premium"]',
            'overview.premium'
        ];
        return getFieldValue(policy, paths) || 0;
    };

    const getCoverageLimit = () => {
        const paths = [
            'coverage["Liability Limit"]',
            'coverage["Combined Single Limit"]',
            'coverage.liabilityLimit',
            'coverage.Liability',
            'coverageLimit',
            'coverage["Liability Limits"]',
            'coverage.combinedSingleLimit'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getCargoLimit = () => {
        const paths = [
            'coverage["Cargo Limit"]',
            'coverage.cargoLimit',
            'coverage.Cargo',
            'coverage["Cargo Coverage"]',
            'cargoLimit'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getDeductible = (type = '') => {
        const paths = type === 'comp' ? [
            'coverage["Comprehensive Deductible"]',
            'coverage.comprehensiveDeductible',
            'coverage["Comp Deductible"]',
            'financial["Comprehensive Deductible"]'
        ] : type === 'collision' ? [
            'coverage["Collision Deductible"]',
            'coverage.collisionDeductible',
            'coverage["Coll Deductible"]',
            'financial["Collision Deductible"]'
        ] : type === 'cargo' ? [
            'coverage["Cargo Deductible"]',
            'coverage.cargoDeductible',
            'financial["Cargo Deductible"]'
        ] : [
            'financial.Deductible',
            'financial.deductible',
            'coverage.Deductible',
            'coverage.deductible',
            'deductible'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getMedicalPayments = () => {
        const paths = [
            'coverage["Medical Payments"]',
            'coverage.medicalPayments',
            'coverage["Medical"]',
            'coverage.Medical',
            'medicalPayments'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getUMUIM = () => {
        const paths = [
            'coverage["Uninsured/Underinsured Motorist"]',
            'coverage["UM/UIM"]',
            'coverage.umUim',
            'coverage["Uninsured Motorist"]',
            'coverage.uninsuredMotorist'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getTrailerInterchange = () => {
        const paths = [
            'coverage["Trailer Interchange Limit"]',
            'coverage["Trailer Interchange"]',
            'coverage.trailerInterchange',
            'trailerInterchange'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getNonTrucking = () => {
        const paths = [
            'coverage["Non-Trucking Liability"]',
            'coverage["Non Trucking Liability"]',
            'coverage.nonTruckingLiability',
            'coverage["Bobtail"]',
            'nonTruckingLiability'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getGeneralAggregate = () => {
        const paths = [
            'coverage["General Aggregate"]',
            'coverage.generalAggregate',
            'coverage["Aggregate"]',
            'coverage.Aggregate',
            'generalAggregate'
        ];
        return getFieldValue(policy, paths) || '';
    };

    // Get all values
    const premium = getPremium();
    const liabilityLimit = getCoverageLimit();
    const cargoLimit = getCargoLimit();
    const cargoDeductible = getDeductible('cargo');
    const compDeductible = getDeductible('comp');
    const collisionDeductible = getDeductible('collision');
    const medicalPayments = getMedicalPayments();
    const umUim = getUMUIM();
    const trailerInterchange = getTrailerInterchange();
    const nonTrucking = getNonTrucking();
    const generalAggregate = getGeneralAggregate();

    // Get insured name
    const insuredName = policy.clientName ||
                       policy.name ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       policy.insured?.name ||
                       policy.insuredName ||
                       'Unknown';

    // Display comprehensive policy details with actual data
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
                            <span>${policy.carrier || policy.overview?.['Carrier'] || policy.overview?.carrier || policy.insuranceCarrier || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Policy Status:</label>
                            <span class="status-badge ${(policy.policyStatus || policy.status || policy.overview?.['Status'] || 'Active') === 'Active' ? 'status-active' : 'status-inactive'}">
                                ${policy.policyStatus || policy.status || policy.overview?.['Status'] || 'Active'}
                            </span>
                        </div>
                        <div class="info-item">
                            <label>Effective Date:</label>
                            <span>${policy.effectiveDate || policy.overview?.['Effective Date'] || policy.startDate || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Expiration Date:</label>
                            <span>${policy.expirationDate || policy.overview?.['Expiration Date'] || policy.expiryDate || 'N/A'}</span>
                        </div>
                        ${policy.dotNumber || policy.overview?.['DOT Number'] ? `
                        <div class="info-item">
                            <label>DOT Number:</label>
                            <span>${policy.dotNumber || policy.overview?.['DOT Number'] || 'N/A'}</span>
                        </div>` : ''}
                        ${policy.mcNumber || policy.overview?.['MC Number'] ? `
                        <div class="info-item">
                            <label>MC Number:</label>
                            <span>${policy.mcNumber || policy.overview?.['MC Number'] || 'N/A'}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Financial Information Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-dollar-sign"></i> Financial Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Annual Premium:</label>
                            <span><strong>${premium ? '$' + Number(premium).toLocaleString() : '$0'}</strong></span>
                        </div>
                        <div class="info-item">
                            <label>Monthly Payment:</label>
                            <span>${premium ? '$' + (Number(premium) / 12).toFixed(2).toLocaleString() : '$0.00'}</span>
                        </div>
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
                        ${policy.insured?.['Additional Named Insured'] ? `
                        <div class="info-item">
                            <label>Additional Insured:</label>
                            <span>${policy.insured['Additional Named Insured']}</span>
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
                    </div>
                </div>

                <!-- Coverage Details Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-shield-alt"></i> Coverage Details</h3>
                    <div class="coverage-grid">
                        ${liabilityLimit ? `
                        <div class="coverage-item">
                            <label>Liability Limits:</label>
                            <span>${liabilityLimit}</span>
                        </div>` : ''}
                        ${generalAggregate ? `
                        <div class="coverage-item">
                            <label>General Aggregate:</label>
                            <span>${generalAggregate}</span>
                        </div>` : ''}
                        ${compDeductible ? `
                        <div class="coverage-item">
                            <label>Comprehensive Deductible:</label>
                            <span>${typeof compDeductible === 'number' ? '$' + compDeductible.toLocaleString() : compDeductible}</span>
                        </div>` : ''}
                        ${collisionDeductible ? `
                        <div class="coverage-item">
                            <label>Collision Deductible:</label>
                            <span>${typeof collisionDeductible === 'number' ? '$' + collisionDeductible.toLocaleString() : collisionDeductible}</span>
                        </div>` : ''}
                        ${cargoLimit ? `
                        <div class="coverage-item">
                            <label>Cargo Limit:</label>
                            <span>${typeof cargoLimit === 'number' ? '$' + cargoLimit.toLocaleString() : cargoLimit}</span>
                        </div>` : ''}
                        ${cargoDeductible ? `
                        <div class="coverage-item">
                            <label>Cargo Deductible:</label>
                            <span>${typeof cargoDeductible === 'number' ? '$' + cargoDeductible.toLocaleString() : cargoDeductible}</span>
                        </div>` : ''}
                        ${medicalPayments ? `
                        <div class="coverage-item">
                            <label>Medical Payments:</label>
                            <span>${typeof medicalPayments === 'number' ? '$' + medicalPayments.toLocaleString() : medicalPayments}</span>
                        </div>` : ''}
                        ${umUim ? `
                        <div class="coverage-item">
                            <label>Uninsured/Underinsured Motorist:</label>
                            <span>${umUim}</span>
                        </div>` : ''}
                        ${trailerInterchange ? `
                        <div class="coverage-item">
                            <label>Trailer Interchange Limit:</label>
                            <span>${typeof trailerInterchange === 'number' ? '$' + trailerInterchange.toLocaleString() : trailerInterchange}</span>
                        </div>` : ''}
                        ${nonTrucking ? `
                        <div class="coverage-item">
                            <label>Non-Trucking Liability:</label>
                            <span>${nonTrucking}</span>
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
                                        <td style="padding: 8px;">${driver.experience || driver.Experience || driver['Years of Experience'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.cdl || driver.CDL || driver['CDL'] || driver.hasCDL ? 'Yes' : 'No'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
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

console.log('COI Field Mapping Fix loaded - policy fields will now display correctly');