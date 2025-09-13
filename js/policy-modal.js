// Policy Modal Functions

// Global variable to store policy data
let currentPolicyData = {};

function showPolicyModal(existingPolicy = null) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.id = 'policyModal';
    
    // If editing existing policy, skip initial form and go straight to tabbed form
    if (existingPolicy) {
        // Store the existing policy data globally for editing
        window.currentPolicyData = existingPolicy;
        window.editingPolicyId = existingPolicy.id;
        
        // Determine policy type label
        const policyTypeLabel = existingPolicy.policyType === 'commercial-auto' ? 'Commercial Auto' :
                                existingPolicy.policyType === 'personal-auto' ? 'Personal Auto' :
                                existingPolicy.policyType ? existingPolicy.policyType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
        
        modalOverlay.innerHTML = `
            <div class="modal-container large">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                        ${policyTypeLabel ? `<span class="policy-type-badge">${policyTypeLabel}</span>` : ''}
                        <h2 style="margin: 0;">Edit Policy - ${existingPolicy.policyNumber}</h2>
                    </div>
                    <button class="close-btn" onclick="closePolicyModal()">&times;</button>
                </div>
                <div class="modal-body" id="policyModalBody">
                    <!-- Will be filled with tabbed form -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Show the tabbed form directly for editing
        setTimeout(() => {
            showTabbedPolicyForm(true); // Pass true to indicate editing mode
            // After form is loaded, populate with existing data
            setTimeout(() => {
                populatePolicyForm(existingPolicy);
            }, 100);
        }, 100);
        
        return;
    }
    
    // Start with initial policy creation form
    modalOverlay.innerHTML = `
        <div class="modal-container large">
            <div class="modal-header">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <h2 style="margin: 0;">Create New Policy</h2>
                </div>
                <button class="close-btn" onclick="closePolicyModal()">&times;</button>
            </div>
            <div class="modal-body" id="policyModalBody">
                <!-- Initial Policy Creation Form -->
                <div id="initialPolicyForm">
                    <div class="form-section">
                        <h3>Policy Information</h3>
                        <p class="form-description">Enter the required information to create a new policy. Additional details can be added after creation.</p>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Policy Number <span class="required">*</span></label>
                                <input type="text" id="policyNumber" class="form-control" placeholder="POL-2024-XXXX" required>
                            </div>
                            <div class="form-group">
                                <label>Policy Type <span class="required">*</span></label>
                                <select id="policyType" class="form-control" required onchange="updateFieldsBasedOnType()">
                                    <option value="">Select Type</option>
                                    <option value="personal-auto">Personal Auto</option>
                                    <option value="commercial-auto">Commercial Auto</option>
                                    <option value="homeowners">Homeowners</option>
                                    <option value="commercial-property">Commercial Property</option>
                                    <option value="general-liability">General Liability</option>
                                    <option value="professional-liability">Professional Liability</option>
                                    <option value="workers-comp">Workers Compensation</option>
                                    <option value="umbrella">Umbrella</option>
                                    <option value="life">Life</option>
                                    <option value="health">Health</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Insurance Carrier <span class="required">*</span></label>
                                <select id="carrier" class="form-control" required>
                                    <option value="">Select Carrier</option>
                                    <option>Progressive</option>
                                    <option>State Farm</option>
                                    <option>GEICO</option>
                                    <option>Allstate</option>
                                    <option>Liberty Mutual</option>
                                    <option>Nationwide</option>
                                    <option>Farmers</option>
                                    <option>USAA</option>
                                    <option>Travelers</option>
                                    <option>American Family</option>
                                    <option>Hartford</option>
                                    <option>Chubb</option>
                                    <option>MetLife</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Policy Status <span class="required">*</span></label>
                                <select id="policyStatus" class="form-control" required>
                                    <option value="">Select Status</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="in-force">In Force</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="non-renewed">Non-Renewed</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Effective Date <span class="required">*</span></label>
                                <input type="date" id="effectiveDate" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Expiration Date <span class="required">*</span></label>
                                <input type="date" id="expirationDate" class="form-control" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closePolicyModal()">Cancel</button>
                        <button type="button" class="btn-primary" onclick="createInitialPolicy()">
                            <i class="fas fa-plus"></i> Create Policy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
}

function createInitialPolicy() {
    // Validate required fields
    const policyNumber = document.getElementById('policyNumber').value;
    const policyType = document.getElementById('policyType').value;
    const carrier = document.getElementById('carrier').value;
    const policyStatus = document.getElementById('policyStatus').value;
    const effectiveDate = document.getElementById('effectiveDate').value;
    const expirationDate = document.getElementById('expirationDate').value;
    
    if (!policyNumber || !policyType || !carrier || !policyStatus || !effectiveDate || !expirationDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Store initial policy data
    currentPolicyData = {
        policyNumber,
        policyType,
        carrier,
        policyStatus,
        effectiveDate,
        expirationDate
    };
    
    // Show the tabbed interface
    showTabbedPolicyForm();
}

function showTabbedPolicyForm(isEditing = false) {
    const modalBody = document.getElementById('policyModalBody');
    
    // Get the policy data from either the global or window scope
    const policyData = window.currentPolicyData || currentPolicyData;
    const policyType = policyData.policyType;
    
    console.log('showTabbedPolicyForm - Policy Type:', policyType, 'Is Editing:', isEditing);
    
    // Generate tabs based on policy type
    const tabs = generateTabsForPolicyType(policyType);
    
    modalBody.innerHTML = `
        ${!isEditing ? `
        <!-- Success Message -->
        <div class="success-banner">
            <i class="fas fa-check-circle"></i>
            Policy ${policyData.policyNumber} created successfully! Add additional details below.
        </div>` : ''}
        
        <!-- Tab Navigation -->
        <div class="policy-tabs">
            ${tabs.map((tab, index) => `
                <button class="tab-btn ${index === 0 ? 'active' : ''}" data-tab="${tab.id}" onclick="switchTab('${tab.id}')">
                    <i class="${tab.icon}"></i> ${tab.name}
                </button>
            `).join('')}
        </div>
        
        <!-- Tab Contents -->
        <div class="tab-contents">
            ${tabs.map((tab, index) => `
                <div id="${tab.id}-content" class="tab-content ${index === 0 ? 'active' : ''}">
                    ${generateTabContent(tab.id, policyType)}
                </div>
            `).join('')}
        </div>
        
        <!-- Form Actions -->
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="savePolicyDraft()">Save as Draft</button>
            <button type="button" class="btn-primary" onclick="savePolicy()">
                <i class="fas fa-save"></i> Save Policy
            </button>
        </div>
    `;
    
    // Update modal header
    if (!isEditing) {
        const header = document.querySelector('.modal-header');
        const policyTypeLabel = policyData.policyType === 'commercial-auto' ? 'Commercial Auto' :
                                policyData.policyType === 'personal-auto' ? 'Personal Auto' :
                                policyData.policyType ? policyData.policyType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
        
        // Update the header content while preserving the close button
        const closeBtn = header.querySelector('.close-btn');
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                ${policyTypeLabel ? `<span class="policy-type-badge">${policyTypeLabel}</span>` : ''}
                <h2 style="margin: 0;">Policy Details - ${policyData.policyNumber}</h2>
            </div>
        `;
        header.appendChild(closeBtn);
    }
}

function generateTabsForPolicyType(policyType) {
    const baseTabs = [
        { id: 'overview', name: 'Overview', icon: 'fas fa-info-circle' },
        { id: 'insured', name: 'Named Insured', icon: 'fas fa-user' },
        { id: 'contact', name: 'Contact Info', icon: 'fas fa-address-book' },
        { id: 'coverage', name: 'Coverage', icon: 'fas fa-shield-alt' },
        { id: 'financial', name: 'Financial', icon: 'fas fa-dollar-sign' },
        { id: 'documents', name: 'Documents', icon: 'fas fa-file-alt' },
        { id: 'notes', name: 'Notes', icon: 'fas fa-sticky-note' }
    ];
    
    // Add type-specific tabs
    if (policyType === 'personal-auto' || policyType === 'commercial-auto') {
        baseTabs.splice(4, 0, 
            { id: 'vehicles', name: 'Vehicles', icon: 'fas fa-car' },
            { id: 'drivers', name: 'Drivers', icon: 'fas fa-id-card' }
        );
    } else if (policyType === 'homeowners' || policyType === 'commercial-property') {
        baseTabs.splice(4, 0, 
            { id: 'property', name: 'Property', icon: 'fas fa-home' },
            { id: 'mortgagee', name: 'Mortgagee', icon: 'fas fa-bank' }
        );
    } else if (policyType === 'general-liability' || policyType === 'professional-liability') {
        baseTabs.splice(4, 0, 
            { id: 'operations', name: 'Operations', icon: 'fas fa-industry' },
            { id: 'locations', name: 'Locations', icon: 'fas fa-map-marker-alt' }
        );
    }
    
    return baseTabs;
}

function generateTabContent(tabId, policyType) {
    switch(tabId) {
        case 'overview':
            return `
                <div class="form-section">
                    <h3>Policy Overview</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Policy Number</label>
                            <input type="text" class="form-control" id="overview-policy-number">
                        </div>
                        <div class="form-group">
                            <label>Policy Type</label>
                            <select class="form-control" id="overview-policy-type">
                                <option value="">Select Type</option>
                                <option value="Personal Auto">Personal Auto</option>
                                <option value="Commercial Auto">Commercial Auto</option>
                                <option value="Homeowners">Homeowners</option>
                                <option value="Commercial Property">Commercial Property</option>
                                <option value="General Liability">General Liability</option>
                                <option value="Professional">Professional Liability</option>
                                <option value="Workers Comp">Workers Comp</option>
                                <option value="Umbrella">Umbrella</option>
                                <option value="Life">Life</option>
                                <option value="Health">Health</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Carrier</label>
                            <select class="form-control" id="overview-carrier">
                                <option value="">Select Carrier</option>
                                <option>Progressive</option>
                                <option>State Farm</option>
                                <option>GEICO</option>
                                <option>Allstate</option>
                                <option>Liberty Mutual</option>
                                <option>Nationwide</option>
                                <option>Farmers</option>
                                <option>USAA</option>
                                <option>Travelers</option>
                                <option>American Family</option>
                                <option>Hartford</option>
                                <option>Chubb</option>
                                <option>MetLife</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select class="form-control" id="overview-status">
                                <option value="">Select Status</option>
                                <option value="Active">Active</option>
                                <option value="Pending">Pending</option>
                                <option value="In Force">In Force</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Non-Renewed">Non-Renewed</option>
                                <option value="Expired">Expired</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Effective Date</label>
                            <input type="date" class="form-control" id="overview-effective-date">
                        </div>
                        <div class="form-group">
                            <label>Expiration Date</label>
                            <input type="date" class="form-control" id="overview-expiration-date">
                        </div>
                        <div class="form-group">
                            <label>Premium</label>
                            <input type="text" class="form-control" id="overview-premium">
                        </div>
                        <div class="form-group">
                            <label>Agent</label>
                            <input type="text" class="form-control" id="overview-agent">
                        </div>
                    </div>
                    ${policyType === 'commercial-auto' ? `
                    <h3 style="margin-top: 30px;">Commercial Auto Details</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>DOT Number</label>
                            <input type="text" class="form-control" id="overview-dot-number">
                        </div>
                        <div class="form-group">
                            <label>MC Number</label>
                            <input type="text" class="form-control" id="overview-mc-number">
                        </div>
                        <div class="form-group">
                            <label>Fleet Size</label>
                            <input type="text" class="form-control" id="overview-fleet-size">
                        </div>
                        <div class="form-group">
                            <label>Operating Radius</label>
                            <select class="form-control" id="overview-operating-radius">
                                <option value="">Select Radius</option>
                                <option>Local (0-50 miles)</option>
                                <option>Regional (50-300 miles)</option>
                                <option>Interstate (300+ miles)</option>
                            </select>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        case 'insured':
            return `
                <div class="form-section">
                    <h3>Named Insured Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Name/Business Name <span class="required">*</span></label>
                            <input type="text" class="form-control" id="insured-name">
                        </div>
                        <div class="form-group">
                            <label>DBA</label>
                            <input type="text" class="form-control" id="insured-dba">
                        </div>
                        <div class="form-group">
                            <label>Tax ID/SSN</label>
                            <input type="text" class="form-control" id="insured-taxid">
                        </div>
                        <div class="form-group">
                            <label>Date of Birth/Inception</label>
                            <input type="date" class="form-control" id="insured-dob">
                        </div>
                    </div>
                </div>
                <div class="form-section">
                    <h3>Additional Insured</h3>
                    <div id="additionalInsuredList"></div>
                    <button type="button" class="btn-secondary" onclick="addAdditionalInsured()">
                        <i class="fas fa-plus"></i> Add Additional Insured
                    </button>
                </div>
            `;
            
        case 'contact':
            return `
                <div class="form-section">
                    <h3>Primary Contact</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Phone Number <span class="required">*</span></label>
                            <input type="tel" class="form-control" id="contact-phone">
                        </div>
                        <div class="form-group">
                            <label>Email Address <span class="required">*</span></label>
                            <input type="email" class="form-control" id="contact-email">
                        </div>
                        <div class="form-group">
                            <label>Mailing Address</label>
                            <input type="text" class="form-control" placeholder="Street Address" id="contact-address">
                        </div>
                        <div class="form-group">
                            <label>City</label>
                            <input type="text" class="form-control" id="contact-city">
                        </div>
                        <div class="form-group">
                            <label>State</label>
                            <select class="form-control" id="contact-state">
                                <option value="">Select State</option>
                                <option>AL</option><option>AK</option><option>AZ</option><option>AR</option>
                                <option>CA</option><option>CO</option><option>CT</option><option>DE</option>
                                <option>FL</option><option>GA</option><option>HI</option><option>ID</option>
                                <option>IL</option><option>IN</option><option>IA</option><option>KS</option>
                                <option>KY</option><option>LA</option><option>ME</option><option>MD</option>
                                <option>MA</option><option>MI</option><option>MN</option><option>MS</option>
                                <option>MO</option><option>MT</option><option>NE</option><option>NV</option>
                                <option>NH</option><option>NJ</option><option>NM</option><option>NY</option>
                                <option>NC</option><option>ND</option><option>OH</option><option>OK</option>
                                <option>OR</option><option>PA</option><option>RI</option><option>SC</option>
                                <option>SD</option><option>TN</option><option>TX</option><option>UT</option>
                                <option>VT</option><option>VA</option><option>WA</option><option>WV</option>
                                <option>WI</option><option>WY</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ZIP Code</label>
                            <input type="text" class="form-control" id="contact-zip">
                        </div>
                    </div>
                </div>
            `;
            
        case 'coverage':
            if (policyType === 'commercial-auto') {
                return `
                    <div class="form-section">
                        <h3>Primary Liability Coverage</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Liability Limits</label>
                                <select class="form-control" id="coverage-liability-limits">
                                    <option value="">Select Liability Limits</option>
                                    <option value="750000">$750,000 CSL</option>
                                    <option value="1000000">$1,000,000 CSL</option>
                                    <option value="2000000">$2,000,000 CSL</option>
                                    <option value="5000000">$5,000,000 CSL</option>
                                    <option value="100/300/100">$100K/$300K/$100K Split Limit</option>
                                    <option value="250/500/250">$250K/$500K/$250K Split Limit</option>
                                    <option value="500/1000/500">$500K/$1M/$500K Split Limit</option>
                                    <option value="1000/2000/1000">$1M/$2M/$1M Split Limit</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>General Aggregate</label>
                                <select class="form-control" id="coverage-general-aggregate">
                                    <option value="">Select Aggregate Limit</option>
                                    <option value="1000000">$1,000,000</option>
                                    <option value="2000000">$2,000,000</option>
                                    <option value="3000000">$3,000,000</option>
                                    <option value="4000000">$4,000,000</option>
                                    <option value="5000000">$5,000,000</option>
                                    <option value="10000000">$10,000,000</option>
                                </select>
                            </div>
                        </div>
                        
                        <h3>Physical Damage Coverage</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Comprehensive Deductible</label>
                                <select class="form-control" id="coverage-comp-deduct">
                                    <option value="">Select Deductible</option>
                                    <option value="0">$0</option>
                                    <option value="250">$250</option>
                                    <option value="500">$500</option>
                                    <option value="1000">$1,000</option>
                                    <option value="2500">$2,500</option>
                                    <option value="5000">$5,000</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Collision Deductible</label>
                                <select class="form-control" id="coverage-coll-deduct">
                                    <option value="">Select Deductible</option>
                                    <option value="0">$0</option>
                                    <option value="500">$500</option>
                                    <option value="1000">$1,000</option>
                                    <option value="2500">$2,500</option>
                                    <option value="5000">$5,000</option>
                                    <option value="10000">$10,000</option>
                                </select>
                            </div>
                        </div>
                        
                        <h3>Cargo Coverage</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Cargo Limit</label>
                                <select class="form-control" id="coverage-cargo-limit">
                                    <option value="">Select Cargo Limit</option>
                                    <option value="0">No Cargo Coverage</option>
                                    <option value="10000">$10,000</option>
                                    <option value="25000">$25,000</option>
                                    <option value="50000">$50,000</option>
                                    <option value="100000">$100,000</option>
                                    <option value="150000">$150,000</option>
                                    <option value="200000">$200,000</option>
                                    <option value="250000">$250,000</option>
                                    <option value="500000">$500,000</option>
                                    <option value="1000000">$1,000,000</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Cargo Deductible</label>
                                <select class="form-control" id="coverage-cargo-deduct">
                                    <option value="">Select Deductible</option>
                                    <option value="0">$0</option>
                                    <option value="1000">$1,000</option>
                                    <option value="2500">$2,500</option>
                                    <option value="5000">$5,000</option>
                                    <option value="10000">$10,000</option>
                                </select>
                            </div>
                        </div>
                        
                        <h3>Other Coverages</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Medical Payments</label>
                                <select class="form-control" id="coverage-medical">
                                    <option value="">Select Limit</option>
                                    <option value="0">No Coverage</option>
                                    <option value="1000">$1,000</option>
                                    <option value="2500">$2,500</option>
                                    <option value="5000">$5,000</option>
                                    <option value="10000">$10,000</option>
                                    <option value="25000">$25,000</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Uninsured/Underinsured Motorist</label>
                                <select class="form-control" id="coverage-um-uim">
                                    <option value="">Select Limit</option>
                                    <option value="0">Rejected</option>
                                    <option value="25/50">$25K/$50K</option>
                                    <option value="50/100">$50K/$100K</option>
                                    <option value="100/300">$100K/$300K</option>
                                    <option value="250/500">$250K/$500K</option>
                                    <option value="500/1000">$500K/$1M</option>
                                    <option value="1000000">$1,000,000 CSL</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Trailer Interchange Limit</label>
                                <select class="form-control" id="coverage-trailer-interchange">
                                    <option value="">Select Limit</option>
                                    <option value="0">No Coverage</option>
                                    <option value="25000">$25,000</option>
                                    <option value="50000">$50,000</option>
                                    <option value="75000">$75,000</option>
                                    <option value="100000">$100,000</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Non-Trucking Liability</label>
                                <select class="form-control" id="coverage-non-trucking">
                                    <option value="">Select Limit</option>
                                    <option value="0">No Coverage</option>
                                    <option value="30/60/25">$30K/$60K/$25K</option>
                                    <option value="100/300/100">$100K/$300K/$100K</option>
                                    <option value="1000000">$1,000,000 CSL</option>
                                </select>
                            </div>
                        </div>
                        
                        <h3>Additional Coverages</h3>
                        <div class="checkbox-group">
                            <label><input type="checkbox" id="coverage-hired"> Hired Auto Physical Damage</label>
                            <label><input type="checkbox" id="coverage-non-owned"> Non-Owned Auto Liability</label>
                            <label><input type="checkbox" id="coverage-towing"> Towing & Labor</label>
                            <label><input type="checkbox" id="coverage-rental"> Rental Reimbursement</label>
                            <label><input type="checkbox" id="coverage-reefer"> Reefer Breakdown</label>
                            <label><input type="checkbox" id="coverage-general-liability"> General Liability</label>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="form-section">
                        <h3>Coverage Limits</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Liability Limits</label>
                                <select class="form-control" id="coverage-liability">
                                    <option value="">Select Limits</option>
                                    <option value="25/50/25">$25K/$50K/$25K (State Minimum)</option>
                                    <option value="50/100/50">$50K/$100K/$50K</option>
                                    <option value="100/300/100">$100K/$300K/$100K</option>
                                    <option value="250/500/250">$250K/$500K/$250K</option>
                                    <option value="500/1000/500">$500K/$1M/$500K</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Comprehensive Deductible</label>
                                <select class="form-control" id="coverage-comp-deduct-personal">
                                    <option value="">Select Deductible</option>
                                    <option value="0">$0</option>
                                    <option value="250">$250</option>
                                    <option value="500">$500</option>
                                    <option value="1000">$1,000</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Collision Deductible</label>
                                <select class="form-control" id="coverage-coll-deduct-personal">
                                    <option value="">Select Deductible</option>
                                    <option value="250">$250</option>
                                    <option value="500">$500</option>
                                    <option value="1000">$1,000</option>
                                    <option value="2500">$2,500</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Uninsured/Underinsured Motorist</label>
                                <select class="form-control" id="coverage-um-uim-personal">
                                    <option value="">Select Limit</option>
                                    <option value="0">Rejected</option>
                                    <option value="25/50">$25K/$50K</option>
                                    <option value="100/300">$100K/$300K</option>
                                    <option value="250/500">$250K/$500K</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `;
            }
            
        case 'vehicles':
            return `
                <div class="form-section">
                    <h3>Insured Vehicles</h3>
                    <div id="vehiclesList"></div>
                    <button type="button" class="btn-secondary" onclick="addVehicle()">
                        <i class="fas fa-plus"></i> Add Vehicle
                    </button>
                </div>
                ${policyType === 'commercial-auto' ? `
                <div class="form-section">
                    <h3>Trailers</h3>
                    <div id="trailersList"></div>
                    <button type="button" class="btn-secondary" onclick="addTrailer()">
                        <i class="fas fa-plus"></i> Add Trailer
                    </button>
                </div>
                ` : ''}
            `;
            
        case 'drivers':
            return `
                <div class="form-section">
                    <h3>Listed Drivers</h3>
                    <div id="driversList"></div>
                    <button type="button" class="btn-secondary" onclick="addDriver()">
                        <i class="fas fa-plus"></i> Add Driver
                    </button>
                </div>
                ${policyType === 'commercial-auto' ? `
                <div class="form-section">
                    <h3>CDL Driver Information</h3>
                    <div class="checkbox-group">
                        <label><input type="checkbox" id="drivers-hazmat"> Hazmat Endorsement</label>
                        <label><input type="checkbox" id="drivers-tanker"> Tanker Endorsement</label>
                        <label><input type="checkbox" id="drivers-doubles"> Doubles/Triples Endorsement</label>
                        <label><input type="checkbox" id="drivers-passenger"> Passenger Endorsement</label>
                    </div>
                </div>
                ` : ''}
            `;
            
        case 'financial':
            return `
                <div class="form-section">
                    <h3>Premium & Payment</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Annual Premium <span class="required">*</span></label>
                            <input type="text" class="form-control" id="financial-annual-premium">
                        </div>
                        <div class="form-group">
                            <label>Payment Plan</label>
                            <select class="form-control" id="financial-payment-plan">
                                <option>Annual</option>
                                <option>Semi-Annual</option>
                                <option>Quarterly</option>
                                <option>Monthly</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Down Payment</label>
                            <input type="text" class="form-control" id="financial-down-payment">
                        </div>
                        <div class="form-group">
                            <label>Monthly Payment</label>
                            <input type="text" class="form-control" id="financial-monthly-payment">
                        </div>
                    </div>
                </div>
                <div class="form-section">
                    <h3>Billing Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Billing Method</label>
                            <select class="form-control" id="financial-billing-method">
                                <option>Direct Bill</option>
                                <option>Agency Bill</option>
                                <option>Mortgagee Bill</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Payment Method</label>
                            <select class="form-control" id="financial-payment-method">
                                <option>Check</option>
                                <option>Credit Card</option>
                                <option>ACH/EFT</option>
                                <option>Cash</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
            
        case 'documents':
            return `
                <div class="form-section">
                    <h3>Policy Documents</h3>
                    <div class="document-upload">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Drag and drop files here or click to browse</p>
                        <input type="file" multiple style="display: none;">
                    </div>
                    <div id="documentsList"></div>
                </div>
            `;
            
        case 'notes':
            return `
                <div class="form-section">
                    <h3>Internal Notes</h3>
                    <textarea class="form-control" rows="6" placeholder="Add internal notes about this policy..." id="notes-internal"></textarea>
                </div>
                <div class="form-section">
                    <h3>Client Notes</h3>
                    <textarea class="form-control" rows="6" placeholder="Add notes visible to client..." id="notes-client"></textarea>
                </div>
            `;
            
        default:
            return `<p>Content for ${tabId} tab</p>`;
    }
}

function switchTab(tabId) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}-content`).classList.add('active');
}

function addVehicle() {
    const vehiclesList = document.getElementById('vehiclesList');
    const vehicleCount = vehiclesList.children.length + 1;
    
    const vehicleEntry = document.createElement('div');
    vehicleEntry.className = 'vehicle-entry';
    vehicleEntry.innerHTML = `
        <h4>Vehicle ${vehicleCount}</h4>
        <div class="form-grid">
            <input type="text" class="form-control" placeholder="Year">
            <input type="text" class="form-control" placeholder="Make">
            <input type="text" class="form-control" placeholder="Model">
            <input type="text" class="form-control" placeholder="VIN">
            <input type="number" class="form-control" placeholder="Value ($)" step="1000">
            <input type="number" class="form-control" placeholder="Deductible ($)" step="250">
            <select class="form-control">
                <option>Comprehensive & Collision</option>
                <option>Liability Only</option>
            </select>
            <button type="button" class="btn-danger" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    vehiclesList.appendChild(vehicleEntry);
}

function addTrailer() {
    const trailersList = document.getElementById('trailersList');
    const trailerCount = trailersList.children.length + 1;
    
    const trailerEntry = document.createElement('div');
    trailerEntry.className = 'trailer-entry';
    trailerEntry.innerHTML = `
        <h4>Trailer ${trailerCount}</h4>
        <div class="form-grid">
            <input type="text" class="form-control" placeholder="Year">
            <input type="text" class="form-control" placeholder="Make">
            <input type="text" class="form-control" placeholder="Type (Flatbed, Reefer, etc.)">
            <input type="text" class="form-control" placeholder="VIN">
            <input type="text" class="form-control" placeholder="Length">
            <input type="number" class="form-control" placeholder="Value ($)" step="1000">
            <input type="number" class="form-control" placeholder="Deductible ($)" step="250">
            <button type="button" class="btn-danger" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    trailersList.appendChild(trailerEntry);
}

function addDriver() {
    const driversList = document.getElementById('driversList');
    const driverCount = driversList.children.length + 1;
    
    const driverEntry = document.createElement('div');
    driverEntry.className = 'driver-entry';
    driverEntry.innerHTML = `
        <h4>Driver ${driverCount}</h4>
        <div class="form-grid">
            <input type="text" class="form-control" placeholder="Full Name">
            <input type="date" class="form-control" placeholder="Date of Birth">
            <input type="text" class="form-control" placeholder="License Number">
            <select class="form-control">
                <option>Primary</option>
                <option>Occasional</option>
                <option>Excluded</option>
            </select>
            <button type="button" class="btn-danger" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        ${currentPolicyData.policyType === 'commercial-auto' ? `
        <div class="form-group">
            <label>CDL Endorsements:</label>
            <div class="checkbox-group">
                <label><input type="checkbox"> Hazmat</label>
                <label><input type="checkbox"> Tanker</label>
                <label><input type="checkbox"> Doubles/Triples</label>
                <label><input type="checkbox"> Passenger</label>
            </div>
        </div>
        ` : ''}
    `;
    
    driversList.appendChild(driverEntry);
}

function addAdditionalInsured() {
    const list = document.getElementById('additionalInsuredList');
    const count = list.children.length + 1;
    
    const entry = document.createElement('div');
    entry.className = 'additional-insured-entry';
    entry.innerHTML = `
        <h4>Additional Insured ${count}</h4>
        <div class="form-grid">
            <input type="text" class="form-control" placeholder="Name/Business">
            <input type="text" class="form-control" placeholder="Relationship">
            <input type="text" class="form-control" placeholder="Address">
            <button type="button" class="btn-danger" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    list.appendChild(entry);
}

function closePolicyModal() {
    const modal = document.getElementById('policyModal');
    if (modal) {
        modal.remove();
    }
    
    // Clear any editing flags
    delete window.editingPolicyId;
    delete window.currentPolicyData;
}

function updateFieldsBasedOnType() {
    const policyType = document.getElementById('policyType').value;
    // This can be expanded to show/hide specific fields based on policy type
    console.log('Policy type changed to:', policyType);
}

// Auto-fill policy number
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const policyNumberField = document.getElementById('policyNumber');
        if (policyNumberField && !policyNumberField.value) {
            const date = new Date();
            const year = date.getFullYear();
            const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
            policyNumberField.value = `POL-${year}-${random}`;
        }
    }, 100);
});

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
if (!document.getElementById('policy-modal-animations')) {
    const styles = document.createElement('style');
    styles.id = 'policy-modal-animations';
    styles.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(styles);
}

function savePolicy() {
    try {
        console.log('Saving policy...');
        
        // Gather all policy data from the form
        const isEditing = window.editingPolicyId !== undefined;
        const policyData = {
            ...currentPolicyData,
            timestamp: new Date().toISOString(),
            id: isEditing ? window.editingPolicyId : generatePolicyId()
        };
        
        // Store the initial policyType to ensure it's not lost
        const initialPolicyType = policyData.policyType || currentPolicyData.policyType;
        
        // If we have a current client ID (from client profile), add it to the policy
        if (window.currentClientId) {
            policyData.clientId = window.currentClientId;
        }
        
        // Get data from each tab
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            const tabId = tab.id.replace('-content', '');
            const inputs = tab.querySelectorAll('input, select, textarea');
            
            if (!policyData[tabId]) {
                policyData[tabId] = {};
            }
            
            inputs.forEach(input => {
                const label = input.closest('.form-group')?.querySelector('label')?.textContent.replace(' *', '').replace(':', '').trim();
                if (label && input.id) {
                    // Store in tab-specific data
                    if (input.type === 'checkbox') {
                        if (!policyData[tabId][label]) policyData[tabId][label] = [];
                        if (input.checked) policyData[tabId][label].push(input.parentElement.textContent.trim());
                    } else {
                        policyData[tabId][label] = input.value;
                    }
                    
                    // Also store key fields at root level for easier access
                    if (tabId === 'overview') {
                        if (input.id === 'overview-policy-number' && input.value) {
                            policyData.policyNumber = input.value;
                        }
                        if (input.id === 'overview-policy-type' && input.value) {
                            // Convert display type back to system type
                            const typeMap = {
                                'Commercial Auto': 'commercial-auto',
                                'Personal Auto': 'personal-auto',
                                'Homeowners': 'homeowners',
                                'Commercial Property': 'commercial-property',
                                'General Liability': 'general-liability',
                                'Professional': 'professional-liability',
                                'Professional Liability': 'professional-liability',
                                'Workers Comp': 'workers-comp',
                                'Umbrella': 'umbrella',
                                'Life': 'life',
                                'Health': 'health'
                            };
                            policyData.policyType = typeMap[input.value] || input.value.toLowerCase().replace(/\s+/g, '-');
                        }
                        if (input.id === 'overview-carrier') policyData.carrier = input.value;
                        if (input.id === 'overview-status') policyData.policyStatus = input.value;
                        if (input.id === 'overview-effective-date') policyData.effectiveDate = input.value;
                        if (input.id === 'overview-expiration-date') policyData.expirationDate = input.value;
                        if (input.id === 'overview-premium') policyData.premium = input.value;
                        if (input.id === 'overview-dot-number') policyData.dotNumber = input.value;
                        if (input.id === 'overview-mc-number') policyData.mcNumber = input.value;
                    }
                    
                    // Store financial data at root level too
                    if (tabId === 'financial') {
                        if (label === 'Annual Premium') {
                            policyData.premium = input.value;
                            policyData.annualPremium = input.value;
                            // Also ensure it's in the financial object
                            if (!policyData.financial) policyData.financial = {};
                            policyData.financial['Annual Premium'] = input.value;
                        }
                        if (label === 'Premium') {
                            policyData.premium = input.value;
                        }
                        if (label === 'Monthly Premium') {
                            policyData.monthlyPremium = input.value;
                        }
                    }
                }
            });
        });
        
        // Collect vehicle and trailer data
        policyData.vehicles = [];
        
        // Collect vehicles
        const vehicleEntries = document.querySelectorAll('.vehicle-entry');
        vehicleEntries.forEach(entry => {
            const vehicle = {};
            const inputs = entry.querySelectorAll('input, select');
            
            inputs.forEach(field => {
                if (field.value) {
                    // Map placeholders to proper field names
                    let fieldName = field.placeholder || '';
                    
                    if (fieldName.includes('Year')) fieldName = 'Year';
                    else if (fieldName.includes('Make')) fieldName = 'Make';
                    else if (fieldName.includes('Model')) fieldName = 'Model';
                    else if (fieldName.includes('VIN')) fieldName = 'VIN';
                    else if (fieldName.includes('Value')) fieldName = 'Value';
                    else if (fieldName.includes('Deductible')) fieldName = 'Deductible';
                    else if (field.tagName === 'SELECT') fieldName = 'Coverage';
                    
                    vehicle[fieldName] = field.value;
                }
            });
            
            if (Object.keys(vehicle).length > 0) {
                vehicle.Type = 'Vehicle';
                policyData.vehicles.push(vehicle);
            }
        });
        
        // Collect trailers
        const trailerEntries = document.querySelectorAll('.trailer-entry');
        trailerEntries.forEach(entry => {
            const trailer = {};
            const inputs = entry.querySelectorAll('input');
            
            inputs.forEach(field => {
                if (field.value) {
                    // Map placeholders to proper field names
                    let fieldName = field.placeholder || '';
                    
                    if (fieldName.includes('Year')) fieldName = 'Year';
                    else if (fieldName.includes('Make')) fieldName = 'Make';
                    else if (fieldName.includes('Type')) fieldName = 'Trailer Type';
                    else if (fieldName.includes('VIN')) fieldName = 'VIN';
                    else if (fieldName.includes('Length')) fieldName = 'Length';
                    else if (fieldName.includes('Value')) fieldName = 'Value';
                    else if (fieldName.includes('Deductible')) fieldName = 'Deductible';
                    
                    trailer[fieldName] = field.value;
                }
            });
            
            if (Object.keys(trailer).length > 0) {
                trailer.Type = 'Trailer';
                policyData.vehicles.push(trailer);
            }
        });
        
        // Collect drivers data
        policyData.drivers = [];
        const driverEntries = document.querySelectorAll('.driver-entry');
        driverEntries.forEach(entry => {
            const driver = {};
            entry.querySelectorAll('input, select').forEach(field => {
                if (field.value) {
                    const fieldName = field.placeholder || 'unknown';
                    driver[fieldName] = field.value;
                }
            });
            if (Object.keys(driver).length > 0) {
                policyData.drivers.push(driver);
            }
        });
        
        // Ensure policyType is not lost - use initial type if current is empty
        if (!policyData.policyType || policyData.policyType === '') {
            policyData.policyType = initialPolicyType;
        }
        
        console.log('Policy data collected:', policyData);
        console.log('Policy type being saved:', policyData.policyType);
        console.log('Vehicles being saved:', policyData.vehicles);
        
        // Store in localStorage (or send to backend) - use insurance_policies
        let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        
        if (isEditing) {
            // Update existing policy
            const index = policies.findIndex(p => String(p.id) === String(window.editingPolicyId));
            if (index !== -1) {
                policies[index] = policyData;
                showNotification(`Policy ${policyData.policyNumber} has been updated successfully!`, 'success');
            } else {
                // If not found, add as new
                policies.push(policyData);
                showNotification(`Policy ${policyData.policyNumber} has been created successfully!`, 'success');
            }
        } else {
            // Add new policy
            policies.push(policyData);
            showNotification(`Policy ${policyData.policyNumber} has been created successfully!`, 'success');
        }
        
        localStorage.setItem('insurance_policies', JSON.stringify(policies));
        
        console.log('Policy saved to localStorage');
        console.log('Saved policy with type:', policyData.policyType);
        
        // Update the policies count in the dashboard
        updatePoliciesCount();
        
        // Clear editing flag
        delete window.editingPolicyId;
        
        // Close modal after a short delay
        setTimeout(() => {
            closePolicyModal();
            // Refresh the policies view if it's currently active
            if (document.querySelector('.dashboard-content h1')?.textContent === 'Policy Management') {
                // Call loadPoliciesView if it exists
                if (typeof window.loadPoliciesView === 'function') {
                    window.loadPoliciesView();
                }
            }
        }, 1500);
    } catch (error) {
        console.error('Error saving policy:', error);
        showNotification('Error saving policy. Please try again.', 'error');
    }
}

function generatePolicyId() {
    return 'POL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function updatePoliciesCount() {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const activeCount = policies.filter(p => p.policyStatus === 'active' || p.policyStatus === 'in-force').length;
    
    // Update dashboard if visible
    const policyCard = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (policyCard) {
        policyCard.textContent = policies.length.toLocaleString();
    }
    
    // Update active policies count
    const activeCard = document.querySelector('.dashboard-header .badge-success');
    if (activeCard) {
        activeCard.textContent = `${activeCount} Active`;
    }
}

function savePolicyDraft() {
    try {
        console.log('Saving policy as draft...');
        
        // Gather all policy data from the form
        const policyData = {
            ...currentPolicyData,
            timestamp: new Date().toISOString(),
            id: generatePolicyId(),
            isDraft: true
        };
        
        // Get data from each tab
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            const tabId = tab.id.replace('-content', '');
            const inputs = tab.querySelectorAll('input, select, textarea');
            
            if (!policyData[tabId]) {
                policyData[tabId] = {};
            }
            
            inputs.forEach(input => {
                const label = input.closest('.form-group')?.querySelector('label')?.textContent.replace(' *', '').replace(':', '').trim();
                if (label && input.id) {
                    // Store in tab-specific data
                    if (input.type === 'checkbox') {
                        if (!policyData[tabId][label]) policyData[tabId][label] = [];
                        if (input.checked) policyData[tabId][label].push(input.parentElement.textContent.trim());
                    } else {
                        policyData[tabId][label] = input.value;
                    }
                    
                    // Also store key fields at root level for easier access
                    if (tabId === 'overview') {
                        if (input.id === 'overview-policy-number' && input.value) {
                            policyData.policyNumber = input.value;
                        }
                        if (input.id === 'overview-policy-type' && input.value) {
                            // Convert display type back to system type
                            const typeMap = {
                                'Commercial Auto': 'commercial-auto',
                                'Personal Auto': 'personal-auto',
                                'Homeowners': 'homeowners',
                                'Commercial Property': 'commercial-property',
                                'General Liability': 'general-liability',
                                'Professional': 'professional-liability',
                                'Professional Liability': 'professional-liability',
                                'Workers Comp': 'workers-comp',
                                'Umbrella': 'umbrella',
                                'Life': 'life',
                                'Health': 'health'
                            };
                            policyData.policyType = typeMap[input.value] || input.value.toLowerCase().replace(/\s+/g, '-');
                        }
                        if (input.id === 'overview-carrier') policyData.carrier = input.value;
                        if (input.id === 'overview-status') policyData.policyStatus = input.value;
                        if (input.id === 'overview-effective-date') policyData.effectiveDate = input.value;
                        if (input.id === 'overview-expiration-date') policyData.expirationDate = input.value;
                        if (input.id === 'overview-premium') policyData.premium = input.value;
                        if (input.id === 'overview-dot-number') policyData.dotNumber = input.value;
                        if (input.id === 'overview-mc-number') policyData.mcNumber = input.value;
                    }
                    
                    // Store financial data at root level too
                    if (tabId === 'financial') {
                        if (label === 'Annual Premium') {
                            policyData.premium = input.value;
                            policyData.annualPremium = input.value;
                            // Also ensure it's in the financial object
                            if (!policyData.financial) policyData.financial = {};
                            policyData.financial['Annual Premium'] = input.value;
                        }
                        if (label === 'Premium') {
                            policyData.premium = input.value;
                        }
                        if (label === 'Monthly Premium') {
                            policyData.monthlyPremium = input.value;
                        }
                    }
                }
            });
        });
        
        // Store drafts separately
        let drafts = JSON.parse(localStorage.getItem('policyDrafts') || '[]');
        drafts.push(policyData);
        localStorage.setItem('policyDrafts', JSON.stringify(drafts));
        
        showNotification('Policy saved as draft!', 'success');
    } catch (error) {
        console.error('Error saving draft:', error);
        showNotification('Error saving draft. Please try again.', 'error');
    }
}

// Add some basic styles for the policy modal
if (!document.getElementById('policy-modal-styles')) {
    const styles = document.createElement('style');
    styles.id = 'policy-modal-styles';
    styles.textContent = `
        .success-banner {
            background: #10b981;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .policy-tabs {
            display: flex;
            gap: 5px;
            border-bottom: 2px solid #e5e7eb;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .tab-btn {
            padding: 10px 20px;
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            transition: all 0.3s;
        }
        
        .tab-btn:hover {
            color: #3b82f6;
            background: #f3f4f6;
        }
        
        .tab-btn.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
        }
        
        .tab-content {
            display: none;
            animation: fadeIn 0.3s ease;
        }
        
        .tab-content.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .vehicle-entry, .driver-entry, .additional-insured-entry, .trailer-entry {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: #f9fafb;
        }
        
        .vehicle-entry h4, .driver-entry h4, .additional-insured-entry h4, .trailer-entry h4 {
            margin: 0 0 15px 0;
            color: #374151;
            font-size: 16px;
        }
        
        .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 10px;
        }
        
        .checkbox-group label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .document-upload {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .document-upload:hover {
            border-color: #007bff;
            background: #f0f8ff;
        }
        
        .document-upload i {
            font-size: 48px;
            color: #007bff;
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(styles);
}

// Function to populate form fields when editing
function populatePolicyForm(policyData) {
    console.log('Populating form with policy data:', policyData);
    
    // Helper function to find field value from various possible keys
    function findFieldValue(data, possibleKeys) {
        for (const key of possibleKeys) {
            if (data[key] !== undefined && data[key] !== null) {
                return data[key];
            }
        }
        return null;
    }
    
    // Helper function to set field value
    function setFieldValue(field, value) {
        if (value === null || value === undefined) return;
        
        if (field.type === 'checkbox') {
            if (Array.isArray(value)) {
                const checkboxLabel = field.parentElement.textContent.trim();
                field.checked = value.some(v => v.includes(checkboxLabel));
            } else {
                field.checked = !!value;
            }
        } else if (field.type === 'radio') {
            field.checked = field.value === value;
        } else {
            field.value = value;
        }
    }
    
    // Iterate through all form fields and populate them
    document.querySelectorAll('.tab-content').forEach(tabContent => {
        const tabId = tabContent.id.replace('-content', '');
        
        // Check for data in various locations
        const tabData = policyData[tabId] || policyData;
        
        // Populate regular input fields
        tabContent.querySelectorAll('input, select, textarea').forEach(field => {
            const label = field.closest('.form-group')?.querySelector('label')?.textContent.replace(' *', '').replace(':', '').trim();
            const fieldId = field.id;
            const fieldName = field.name;
            
            // Try multiple key variations
            const possibleKeys = [
                label,
                fieldId,
                fieldName,
                fieldId.replace(tabId + '-', ''),
                label?.toLowerCase().replace(/\s+/g, '_'),
                label?.toLowerCase().replace(/\s+/g, '-'),
                label?.replace(/\s+/g, ''),
                // Common variations for commercial auto fields
                label?.replace('DOT Number', 'dotNumber'),
                label?.replace('MC Number', 'mcNumber'),
                label?.replace('USDOT', 'usdot'),
                label?.replace('Motor Carrier', 'motorCarrier'),
                label?.replace('Cargo Type', 'cargoType'),
                label?.replace('Fleet Size', 'fleetSize'),
                label?.replace('Operating Radius', 'operatingRadius'),
                label?.replace('Vehicle Type', 'vehicleType')
            ].filter(Boolean);
            
            let value = findFieldValue(tabData, possibleKeys);
            
            // Also check in the root policyData
            if (!value) {
                value = findFieldValue(policyData, possibleKeys);
            }
            
            setFieldValue(field, value);
        });
    });
    
    // Handle special cases for vehicles and trailers
    if (policyData.vehicles && Array.isArray(policyData.vehicles)) {
        const vehiclesList = document.getElementById('vehiclesList');
        const trailersList = document.getElementById('trailersList');
        
        // Separate vehicles and trailers
        const vehicles = policyData.vehicles.filter(v => v.Type !== 'Trailer');
        const trailers = policyData.vehicles.filter(v => v.Type === 'Trailer');
        
        // Populate vehicles
        if (vehiclesList && vehicles.length > 0) {
            vehiclesList.innerHTML = ''; // Clear existing
            vehicles.forEach((vehicle, index) => {
                addVehicle();
                // Populate the newly added vehicle fields
                const vehicleEntry = vehiclesList.lastElementChild;
                const inputs = vehicleEntry.querySelectorAll('input, select');
                
                // Map fields based on their placeholder
                inputs.forEach((input) => {
                    const placeholder = input.placeholder || '';
                    
                    if (placeholder.includes('Year') && vehicle.Year) {
                        input.value = vehicle.Year;
                    } else if (placeholder.includes('Make') && vehicle.Make) {
                        input.value = vehicle.Make;
                    } else if (placeholder.includes('Model') && vehicle.Model) {
                        input.value = vehicle.Model;
                    } else if (placeholder.includes('VIN') && vehicle.VIN) {
                        input.value = vehicle.VIN;
                    } else if (placeholder.includes('Value') && vehicle.Value) {
                        input.value = vehicle.Value;
                    } else if (placeholder.includes('Deductible') && vehicle.Deductible) {
                        input.value = vehicle.Deductible;
                    } else if (input.tagName === 'SELECT' && vehicle.Coverage) {
                        input.value = vehicle.Coverage;
                    }
                });
            });
        }
        
        // Populate trailers
        if (trailersList && trailers.length > 0) {
            trailersList.innerHTML = ''; // Clear existing
            trailers.forEach((trailer, index) => {
                addTrailer();
                // Populate the newly added trailer fields
                const trailerEntry = trailersList.lastElementChild;
                const inputs = trailerEntry.querySelectorAll('input');
                
                // Map fields based on their placeholder
                inputs.forEach((input) => {
                    const placeholder = input.placeholder || '';
                    
                    if (placeholder.includes('Year') && trailer.Year) {
                        input.value = trailer.Year;
                    } else if (placeholder.includes('Make') && trailer.Make) {
                        input.value = trailer.Make;
                    } else if (placeholder.includes('Type') && trailer['Trailer Type']) {
                        input.value = trailer['Trailer Type'];
                    } else if (placeholder.includes('VIN') && trailer.VIN) {
                        input.value = trailer.VIN;
                    } else if (placeholder.includes('Length') && trailer.Length) {
                        input.value = trailer.Length;
                    } else if (placeholder.includes('Value') && trailer.Value) {
                        input.value = trailer.Value;
                    } else if (placeholder.includes('Deductible') && trailer.Deductible) {
                        input.value = trailer.Deductible;
                    }
                });
            });
        }
    }
    
    // Handle special cases for drivers
    if (policyData.drivers && Array.isArray(policyData.drivers)) {
        const driversList = document.getElementById('driversList');
        if (driversList) {
            driversList.innerHTML = ''; // Clear existing
            policyData.drivers.forEach((driver, index) => {
                addDriver();
                // Populate the newly added driver fields
                const driverEntry = driversList.lastElementChild;
                const inputs = driverEntry.querySelectorAll('input, select');
                
                // Map driver data to fields
                if (inputs[0]) inputs[0].value = driver.name || driver['Full Name'] || driver.fullName || '';
                if (inputs[1]) inputs[1].value = driver.dob || driver['Date of Birth'] || driver.dateOfBirth || '';
                if (inputs[2]) inputs[2].value = driver.license || driver['License Number'] || driver.licenseNumber || '';
                if (inputs[3]) inputs[3].value = driver.type || driver.driverType || driver['Driver Type'] || '';
                if (inputs[4]) inputs[4].value = driver.experience || driver.yearsExperience || driver['Years Experience'] || '';
                if (inputs[5]) inputs[5].value = driver.violations || driver.movingViolations || '';
                
                // Handle CDL fields if present
                const cdlCheckbox = driverEntry.querySelector('input[type="checkbox"][id*="cdl"]');
                if (cdlCheckbox && (driver.cdl || driver.CDL || driver.hasCDL)) {
                    cdlCheckbox.checked = true;
                    // Trigger change event to show CDL fields
                    cdlCheckbox.dispatchEvent(new Event('change'));
                }
                
                // Handle CDL endorsements if present
                if (driver.endorsements || driver.cdlEndorsements) {
                    const endorsements = driver.endorsements || driver.cdlEndorsements;
                    const checkboxes = driverEntry.querySelectorAll('.checkbox-group input[type="checkbox"]');
                    checkboxes.forEach(cb => {
                        const label = cb.parentElement.textContent.trim();
                        cb.checked = Array.isArray(endorsements) ? 
                            endorsements.some(e => e.includes(label)) : 
                            endorsements.includes(label);
                    });
                }
            });
        }
    }
    
    // Handle additional insureds
    if (policyData.additionalInsureds && Array.isArray(policyData.additionalInsureds)) {
        const list = document.getElementById('additionalInsuredList');
        if (list) {
            list.innerHTML = '';
            policyData.additionalInsureds.forEach(insured => {
                addAdditionalInsured();
                const entry = list.lastElementChild;
                const inputs = entry.querySelectorAll('input');
                if (inputs[0]) inputs[0].value = insured.name || insured.Name || '';
                if (inputs[1]) inputs[1].value = insured.relationship || insured.Relationship || '';
                if (inputs[2]) inputs[2].value = insured.address || insured.Address || '';
            });
        }
    }
    
    // Populate financial/coverage data from root level if not in tabs
    const financialFields = ['premium', 'monthlyPremium', 'deductible', 'downPayment'];
    financialFields.forEach(fieldName => {
        if (policyData[fieldName]) {
            const field = document.querySelector(`#financial-${fieldName}, [name="${fieldName}"]`);
            if (field) field.value = policyData[fieldName];
        }
    });
    
    // Populate Overview tab fields
    setTimeout(() => {
        if (document.getElementById('overview-policy-number')) {
            document.getElementById('overview-policy-number').value = policyData.policyNumber || '';
        }
        if (document.getElementById('overview-policy-type')) {
            const typeLabel = policyData.policyType === 'commercial-auto' ? 'Commercial Auto' :
                             policyData.policyType === 'personal-auto' ? 'Personal Auto' :
                             policyData.policyType === 'homeowners' ? 'Homeowners' :
                             policyData.policyType === 'commercial-property' ? 'Commercial Property' :
                             policyData.policyType === 'general-liability' ? 'General Liability' :
                             policyData.policyType === 'professional-liability' ? 'Professional' :
                             policyData.policyType === 'workers-comp' ? 'Workers Comp' :
                             policyData.policyType === 'umbrella' ? 'Umbrella' :
                             policyData.policyType === 'life' ? 'Life' :
                             policyData.policyType === 'health' ? 'Health' :
                             policyData.policyType ? policyData.policyType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
            document.getElementById('overview-policy-type').value = typeLabel;
        }
        if (document.getElementById('overview-carrier')) {
            document.getElementById('overview-carrier').value = policyData.carrier || '';
        }
        if (document.getElementById('overview-status')) {
            const statusValue = policyData.policyStatus || policyData.status || 'Active';
            // Format status for display
            const formattedStatus = statusValue.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            document.getElementById('overview-status').value = formattedStatus;
        }
        if (document.getElementById('overview-effective-date')) {
            document.getElementById('overview-effective-date').value = policyData.effectiveDate || '';
        }
        if (document.getElementById('overview-expiration-date')) {
            document.getElementById('overview-expiration-date').value = policyData.expirationDate || '';
        }
        if (document.getElementById('overview-premium')) {
            document.getElementById('overview-premium').value = policyData.premium || policyData.monthlyPremium || '';
        }
        if (document.getElementById('overview-agent')) {
            document.getElementById('overview-agent').value = policyData.agent || '';
        }
    }, 200);
    
    // Populate Commercial Auto specific fields in Overview
    if (policyData.policyType === 'commercial-auto') {
        if (document.getElementById('overview-dot-number')) {
            document.getElementById('overview-dot-number').value = policyData.dotNumber || policyData['DOT Number'] || '';
        }
        if (document.getElementById('overview-mc-number')) {
            document.getElementById('overview-mc-number').value = policyData.mcNumber || policyData['MC Number'] || '';
        }
        if (document.getElementById('overview-fleet-size')) {
            document.getElementById('overview-fleet-size').value = policyData.fleetSize || policyData['Fleet Size'] || '';
        }
        if (document.getElementById('overview-operating-radius')) {
            document.getElementById('overview-operating-radius').value = policyData.operatingRadius || policyData['Operating Radius'] || '';
        }
    }
    
    // Set policy type if available
    if (policyData.policyType) {
        const policyTypeField = document.querySelector('#policyType, [name="policyType"]');
        if (policyTypeField) {
            policyTypeField.value = policyData.policyType;
            // Trigger change event to update UI based on policy type
            policyTypeField.dispatchEvent(new Event('change'));
        }
    }
    
    console.log('Form population complete');
}