// Vanguard Insurance Software - Main Application JavaScript

// Global variables

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Initializing app');
    
    // Initialize components
    initializeEventListeners();
    initializeAutomation();
    
    // Initialize renewals after a delay
    setTimeout(() => {
        loadUpcomingRenewals();
    }, 500);
    
    // Refresh renewals periodically
    setInterval(() => {
        loadUpcomingRenewals();
    }, 60000); // Every minute
    
    // Load dashboard immediately if on dashboard
    if (!window.location.hash || window.location.hash === '' || window.location.hash === '#dashboard') {
        console.log('Loading dashboard on page load');
        loadContent('#dashboard');
    }
    
    // Add explicit dashboard link handlers
    setTimeout(() => {
        document.querySelectorAll('a[href="#dashboard"]').forEach(link => {
            link.addEventListener('click', function(e) {
                console.log('Dashboard link clicked');
                // Don't prevent default, let the hash change naturally
                // Force reload dashboard after a small delay
                setTimeout(() => {
                    loadContent('#dashboard');
                    updateActiveMenuItem('#dashboard');
                }, 50);
            });
        });
    }, 500);
    
    // Handle initial hash
    if (window.location.hash) {
        console.log('Initial hash:', window.location.hash);
        setTimeout(() => {
            loadContent(window.location.hash);
            updateActiveMenuItem(window.location.hash);
        }, 100);
    } else {
        // Load dashboard by default
        setTimeout(() => {
            loadDashboardView();
            updateActiveMenuItem('#dashboard');
        }, 100);
    }
});

// Ensure To-Do box is added when page is fully loaded
window.addEventListener('load', function() {
    setTimeout(() => {
        const hash = window.location.hash || '#dashboard';
        if (hash === '#dashboard' || hash === '') {
            loadDashboardView();
        }
    }, 500);
});

// COI Management View
function loadCOIView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="coi-management">
            <div class="page-header">
                <h1>COI Management</h1>
                <p>Manage Certificates of Insurance requests and policies</p>
            </div>

            <div class="coi-container">
                <!-- Left Panel - Policy Profile Viewer -->
                <div class="coi-left-panel">
                    <div class="panel-header">
                        <h3><i class="fas fa-file-contract"></i> Policy Profiles</h3>
                        <button class="btn-primary btn-small" onclick="refreshPolicies()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                    <div id="policyViewer" class="policy-viewer">
                        <div class="policy-list" id="policyList">
                            <!-- Policy list will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Right Panel - COI Email Inbox -->
                <div class="coi-right-panel">
                    <div class="panel-header">
                        <h3><i class="fas fa-inbox"></i> COI Request Inbox</h3>
                        <div class="inbox-actions">
                            <button class="btn-secondary btn-small" onclick="filterCOIEmails('unread')">
                                <i class="fas fa-envelope"></i> Unread
                            </button>
                            <button class="btn-secondary btn-small" onclick="filterCOIEmails('all')">
                                <i class="fas fa-list"></i> All
                            </button>
                        </div>
                    </div>
                    <div class="coi-inbox" id="coiInbox">
                        <!-- Email list will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load initial data
    loadPolicyList();
    loadCOIInbox();
}

// Load Policy List
function loadPolicyList() {
    const policyList = document.getElementById('policyList');
    if (!policyList) return;

    // Sample trucking/commercial auto policy data
    const policies = [
        { id: 'POL-001', client: 'Swift Trucking LLC', type: 'Commercial Auto', coverage: '$1M', expiry: '2024-12-31', status: 'active' },
        { id: 'POL-002', client: 'Eagle Transport Inc', type: 'Motor Carrier', coverage: '$2M', expiry: '2024-11-15', status: 'active' },
        { id: 'POL-003', client: 'Rapid Logistics Corp', type: 'Commercial Auto', coverage: '$1M', expiry: '2025-01-20', status: 'active' },
        { id: 'POL-004', client: 'Heavy Haul Express', type: 'Motor Truck Cargo', coverage: '$500K', expiry: '2024-10-30', status: 'expiring' },
        { id: 'POL-005', client: 'Interstate Freight Co', type: 'General Liability', coverage: '$2M', expiry: '2025-03-15', status: 'active' }
    ];

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
                ${policies.map(policy => `
                    <tr class="policy-row" data-policy-id="${policy.id}">
                        <td><strong>${policy.id}</strong></td>
                        <td>${policy.client}</td>
                        <td><span class="policy-type">${policy.type}</span></td>
                        <td>${policy.coverage}</td>
                        <td>
                            <span class="status-badge ${policy.status === 'expiring' ? 'status-warning' : 'status-active'}">
                                ${new Date(policy.expiry).toLocaleDateString()}
                            </span>
                        </td>
                        <td>
                            <button class="btn-icon" onclick="viewPolicyProfile('${policy.id}')" title="View Profile">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load COI Inbox
function loadCOIInbox() {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Sample trucking/commercial auto email data
    const emails = [
        {
            id: 'EMAIL-001',
            from: 'dispatch@walmart.com',
            subject: 'COI Required - Walmart Distribution Center Access',
            date: new Date().toISOString(),
            unread: true,
            hasAttachment: true,
            policyId: 'POL-001'
        },
        {
            id: 'EMAIL-002',
            from: 'broker@chrobinson.com',
            subject: 'Insurance Certificate - Load #78234',
            date: new Date(Date.now() - 86400000).toISOString(),
            unread: true,
            hasAttachment: false,
            policyId: 'POL-003'
        },
        {
            id: 'EMAIL-003',
            from: 'compliance@amazon.com',
            subject: 'Urgent: Auto Liability Certificate for Amazon Relay',
            date: new Date(Date.now() - 172800000).toISOString(),
            unread: false,
            hasAttachment: true,
            policyId: 'POL-002'
        }
    ];

    coiInbox.innerHTML = `
        <div class="email-list">
            ${emails.map(email => `
                <div class="email-item ${email.unread ? 'unread' : ''}" data-email-id="${email.id}" onclick="expandEmail('${email.id}')">
                    <div class="email-header">
                        <div class="email-info">
                            <div class="email-from">
                                ${email.unread ? '<i class="fas fa-circle" style="color: var(--primary-blue); font-size: 8px; margin-right: 8px;"></i>' : ''}
                                <strong>${email.from}</strong>
                            </div>
                            <div class="email-subject">${email.subject}</div>
                            <div class="email-meta">
                                ${email.hasAttachment ? '<i class="fas fa-paperclip" style="margin-right: 8px;"></i>' : ''}
                                <span class="email-date">${formatDate(email.date)}</span>
                            </div>
                        </div>
                        <button class="btn-icon view-profile-btn" onclick="viewPolicyFromEmail(event, '${email.policyId}')" title="View Policy Profile">
                            <i class="fas fa-file-contract"></i>
                        </button>
                    </div>
                    <div class="email-content" id="content-${email.id}" style="display: none;">
                        <!-- Expanded email content will be inserted here -->
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Expand Email
function expandEmail(emailId) {
    const emailContent = document.getElementById(`content-${emailId}`);
    const emailItem = document.querySelector(`[data-email-id="${emailId}"]`);
    
    if (!emailContent || !emailItem) return;

    // Toggle expansion
    if (emailContent.style.display === 'none') {
        // Mark as read
        emailItem.classList.remove('unread');
        
        // Load email content
        emailContent.innerHTML = `
            <div class="email-body">
                <div class="email-actions">
                    <button class="btn-primary btn-small" onclick="viewPolicyFromEmail(event, 'POL-001')">
                        <i class="fas fa-file-contract"></i> View Policy Profile
                    </button>
                    <button class="btn-secondary btn-small" onclick="replyToEmail('${emailId}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn-secondary btn-small" onclick="forwardEmail('${emailId}')">
                        <i class="fas fa-share"></i> Forward
                    </button>
                </div>
                <div class="email-message">
                    <p>Dear Vanguard Insurance,</p>
                    <p>We require a Certificate of Insurance for your client to haul loads to our distribution centers starting ${new Date(Date.now() + 604800000).toLocaleDateString()}.</p>
                    <p>Please include the following as certificate holder:</p>
                    <ul>
                        <li>Walmart Transportation LLC</li>
                        <li>702 SW 8th Street, Bentonville, AR 72716</li>
                    </ul>
                    <p>Required coverages:</p>
                    <ul>
                        <li>Commercial Auto Liability: $1,000,000 minimum</li>
                        <li>Motor Truck Cargo: $100,000 minimum</li>
                        <li>General Liability: $1,000,000 minimum</li>
                    </ul>
                    <p>Please ensure the certificate shows us as certificate holder with 30-day notice of cancellation.</p>
                    <p>Best regards,<br>Transportation Compliance Team<br>Walmart Inc.</p>
                </div>
                ${Math.random() > 0.5 ? `
                <div class="email-attachments">
                    <h4>Attachments:</h4>
                    <div class="attachment-list">
                        <div class="attachment-item">
                            <i class="fas fa-file-pdf"></i>
                            <span>Broker_Carrier_Agreement.pdf</span>
                            <button class="btn-link" onclick="downloadAttachment('agreement.pdf')">Download</button>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        emailContent.style.display = 'block';
    } else {
        emailContent.style.display = 'none';
    }
}

// View Policy Profile
function viewPolicyProfile(policyId) {
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) return;

    // Sample trucking policy details
    const policyDetails = {
        'POL-001': {
            id: 'POL-001',
            client: 'Swift Trucking LLC',
            type: 'Commercial Auto',
            carrier: 'Progressive Commercial',
            coverage: '$1,000,000',
            deductible: '$2,500',
            premium: '$18,500/year',
            effectiveDate: '2024-01-01',
            expiryDate: '2024-12-31',
            namedInsured: ['Swift Trucking LLC', 'Robert Johnson (Owner)'],
            additionalInsured: [],
            coverageDetails: {
                'Combined Single Limit': '$1,000,000',
                'Bodily Injury (Per Person)': '$500,000',
                'Bodily Injury (Per Accident)': '$1,000,000',
                'Property Damage': '$1,000,000',
                'Uninsured Motorist': '$1,000,000',
                'Medical Payments': '$5,000',
                'Motor Truck Cargo': '$100,000',
                'Trailer Interchange': '$50,000'
            }
        }
    };

    const policy = policyDetails[policyId] || policyDetails['POL-001'];

    policyViewer.innerHTML = `
        <div class="policy-profile">
            <div class="profile-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn-back" onclick="backToPolicyList()" title="Back to Policy List">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>Policy Profile: ${policy.id}</h2>
                </div>
                <button class="btn-primary" onclick="prepareCOI('${policy.id}')">
                    <i class="fas fa-file-alt"></i> Prepare COI
                </button>
            </div>
            
            <div class="profile-content">
                <div class="profile-section">
                    <h3>Policy Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Policy Number:</label>
                            <span>${policy.id}</span>
                        </div>
                        <div class="info-item">
                            <label>Type:</label>
                            <span>${policy.type}</span>
                        </div>
                        <div class="info-item">
                            <label>Carrier:</label>
                            <span>${policy.carrier}</span>
                        </div>
                        <div class="info-item">
                            <label>Premium:</label>
                            <span>${policy.premium}</span>
                        </div>
                        <div class="info-item">
                            <label>Effective Date:</label>
                            <span>${new Date(policy.effectiveDate).toLocaleDateString()}</span>
                        </div>
                        <div class="info-item">
                            <label>Expiry Date:</label>
                            <span>${new Date(policy.expiryDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Named Insured</h3>
                    <ul class="insured-list">
                        ${policy.namedInsured.map(name => `<li>${name}</li>`).join('')}
                    </ul>
                </div>

                <div class="profile-section">
                    <h3>Coverage Details</h3>
                    <div class="coverage-grid">
                        ${Object.entries(policy.coverageDetails).map(([key, value]) => `
                            <div class="coverage-item">
                                <label>${key}:</label>
                                <span class="coverage-amount">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Additional Insured</h3>
                    <ul class="insured-list">
                        ${policy.additionalInsured.map(name => `<li>${name}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;

    // Highlight the corresponding policy in the list
    document.querySelectorAll('.policy-row').forEach(row => {
        row.classList.remove('selected');
        if (row.dataset.policyId === policyId) {
            row.classList.add('selected');
        }
    });
}

// View Policy from Email
function viewPolicyFromEmail(event, policyId) {
    event.stopPropagation();
    viewPolicyProfile(policyId);
}

// Prepare COI (ACORD 25 Form)
function prepareCOI(policyId) {
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) return;
    
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // Display COI form in the left panel instead of modal
    policyViewer.innerHTML = `
        <div class="coi-form-container">
            <div class="coi-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn-back" onclick="viewPolicyProfile('${policyId}')" title="Back to Policy Profile">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>ACORD® 25 Certificate</h2>
                </div>
            </div>
            <div class="coi-form-body">
                <div class="acord-form-header">
                    <p style="text-align: center; font-size: 11px; color: #666;">
                        THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER. THIS
                        CERTIFICATE DOES NOT AFFIRMATIVELY OR NEGATIVELY AMEND, EXTEND OR ALTER THE COVERAGE AFFORDED BY THE POLICIES
                        BELOW. THIS CERTIFICATE OF INSURANCE DOES NOT CONSTITUTE A CONTRACT BETWEEN THE ISSUING INSURER(S), AUTHORIZED
                        REPRESENTATIVE OR PRODUCER, AND THE CERTIFICATE HOLDER.
                    </p>
                </div>
                
                <div class="coi-form acord-25">
                    <!-- Producer Section -->
                    <div class="form-section">
                        <h3>PRODUCER</h3>
                        <div class="form-row">
                            <div class="form-group" style="flex: 2;">
                                <label>Producer Name & Address:</label>
                                <textarea class="form-control" rows="3" value="">Vanguard Insurance Group
123 Insurance Way
New York, NY 10001</textarea>
                            </div>
                            <div class="form-group">
                                <label>Phone (A/C, No, Ext):</label>
                                <input type="text" class="form-control" value="(212) 555-0100">
                                <label>Fax (A/C, No):</label>
                                <input type="text" class="form-control" value="(212) 555-0101">
                                <label>E-Mail Address:</label>
                                <input type="email" class="form-control" value="coi@vanguardins.com">
                            </div>
                        </div>
                    </div>

                    <!-- Insured Section -->
                    <div class="form-section">
                        <h3>INSURED</h3>
                        <div class="form-group">
                            <label>Insured Name & Address:</label>
                            <textarea id="insuredInfo" class="form-control" rows="4" placeholder="Enter insured party name and address">Swift Trucking LLC
1234 Highway Drive
Suite 100
Dallas, TX 75001</textarea>
                        </div>
                    </div>

                    <!-- Insurers Section -->
                    <div class="form-section">
                        <h3>INSURERS AFFORDING COVERAGE | NAIC #</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>INSURER A:</label>
                                <input type="text" class="form-control" value="Liberty Mutual Insurance">
                                <input type="text" class="form-control" placeholder="NAIC #" value="23043" style="width: 100px;">
                            </div>
                            <div class="form-group">
                                <label>INSURER B:</label>
                                <input type="text" class="form-control" placeholder="Enter insurer name">
                                <input type="text" class="form-control" placeholder="NAIC #" style="width: 100px;">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>INSURER C:</label>
                                <input type="text" class="form-control" placeholder="Enter insurer name">
                                <input type="text" class="form-control" placeholder="NAIC #" style="width: 100px;">
                            </div>
                            <div class="form-group">
                                <label>INSURER D:</label>
                                <input type="text" class="form-control" placeholder="Enter insurer name">
                                <input type="text" class="form-control" placeholder="NAIC #" style="width: 100px;">
                            </div>
                        </div>
                    </div>

                    <!-- Coverages Section -->
                    <div class="form-section">
                        <h3>COVERAGES | CERTIFICATE NUMBER: COI-${Date.now()}</h3>
                        <p style="font-size: 11px; color: #666;">The policies of insurance listed below have been issued to the insured named above for the policy period indicated.</p>
                        
                        <table class="coverage-table">
                            <thead>
                                <tr>
                                    <th>INSR LTR</th>
                                    <th>TYPE OF INSURANCE</th>
                                    <th>ADDL INSD</th>
                                    <th>SUBR WVD</th>
                                    <th>POLICY NUMBER</th>
                                    <th>POLICY EFF DATE</th>
                                    <th>POLICY EXP DATE</th>
                                    <th>LIMITS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- General Liability -->
                                <tr>
                                    <td><input type="text" class="form-control" value="A" style="width: 30px;"></td>
                                    <td>
                                        <label><input type="checkbox" checked> COMMERCIAL GENERAL LIABILITY</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> CLAIMS-MADE</label>
                                        <label><input type="checkbox" checked> OCCUR</label>
                                    </td>
                                    <td><input type="checkbox" id="glAddl"></td>
                                    <td><input type="checkbox" id="glSubr"></td>
                                    <td><input type="text" class="form-control" value="CGL2024001"></td>
                                    <td><input type="date" class="form-control" value="2024-01-01"></td>
                                    <td><input type="date" class="form-control" value="2024-12-31"></td>
                                    <td>
                                        <div class="limit-row">
                                            <label>EACH OCCURRENCE</label>
                                            <input type="text" class="form-control" value="$1,000,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>DAMAGE TO RENTED PREMISES (Ea occurrence)</label>
                                            <input type="text" class="form-control" value="$100,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>MED EXP (Any one person)</label>
                                            <input type="text" class="form-control" value="$10,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>PERSONAL & ADV INJURY</label>
                                            <input type="text" class="form-control" value="$1,000,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>GENERAL AGGREGATE</label>
                                            <input type="text" class="form-control" value="$2,000,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>PRODUCTS - COMP/OP AGG</label>
                                            <input type="text" class="form-control" value="$2,000,000">
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Automobile Liability -->
                                <tr>
                                    <td><input type="text" class="form-control" style="width: 30px;"></td>
                                    <td>
                                        <label><input type="checkbox"> AUTOMOBILE LIABILITY</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> ANY AUTO</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> OWNED AUTOS ONLY</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> HIRED AUTOS ONLY</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> SCHEDULED AUTOS</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> NON-OWNED AUTOS ONLY</label>
                                    </td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="text" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td>
                                        <div class="limit-row">
                                            <label>COMBINED SINGLE LIMIT (Ea accident)</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>BODILY INJURY (Per person)</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>BODILY INJURY (Per accident)</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>PROPERTY DAMAGE (Per accident)</label>
                                            <input type="text" class="form-control">
                                        </div>
                                    </td>
                                </tr>

                                <!-- Umbrella/Excess -->
                                <tr>
                                    <td><input type="text" class="form-control" style="width: 30px;"></td>
                                    <td>
                                        <label><input type="checkbox"> UMBRELLA LIAB</label>
                                        <label><input type="checkbox"> OCCUR</label><br>
                                        <label><input type="checkbox"> EXCESS LIAB</label>
                                        <label><input type="checkbox"> CLAIMS-MADE</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> DED</label>
                                        <label><input type="checkbox"> RETENTION $</label>
                                        <input type="text" class="form-control" style="width: 100px; display: inline-block;">
                                    </td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="text" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td>
                                        <div class="limit-row">
                                            <label>EACH OCCURRENCE</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>AGGREGATE</label>
                                            <input type="text" class="form-control">
                                        </div>
                                    </td>
                                </tr>

                                <!-- Workers Compensation -->
                                <tr>
                                    <td><input type="text" class="form-control" style="width: 30px;"></td>
                                    <td>
                                        <label><input type="checkbox"> WORKERS COMPENSATION AND EMPLOYERS' LIABILITY</label><br>
                                        <label style="margin-left: 20px;">ANY PROPRIETOR/PARTNER/EXECUTIVE OFFICER/MEMBER EXCLUDED?</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> Yes</label>
                                        <label><input type="checkbox"> No</label><br>
                                        <small style="margin-left: 20px;">If yes, describe under DESCRIPTION OF OPERATIONS below</small>
                                    </td>
                                    <td>N/A</td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="text" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td>
                                        <div class="limit-row">
                                            <label><input type="checkbox"> PER STATUTE</label>
                                            <label style="margin-left: 20px;"><input type="checkbox"> OTHER</label>
                                        </div>
                                        <div class="limit-row">
                                            <label>E.L. EACH ACCIDENT</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>E.L. DISEASE - EA EMPLOYEE</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>E.L. DISEASE - POLICY LIMIT</label>
                                            <input type="text" class="form-control">
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Description of Operations -->
                    <div class="form-section">
                        <h3>DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES (ACORD 101, Additional Remarks Schedule, may be attached)</h3>
                        <div class="form-group">
                            <textarea id="operations" class="form-control" rows="4" placeholder="Describe the operations, locations, or vehicles"></textarea>
                        </div>
                    </div>

                    <!-- Certificate Holder -->
                    <div class="form-section">
                        <h3>CERTIFICATE HOLDER</h3>
                        <div class="form-row">
                            <div class="form-group" style="flex: 2;">
                                <label>Name & Address:</label>
                                <textarea id="holderInfo" class="form-control" rows="4" placeholder="Enter certificate holder name and complete address"></textarea>
                            </div>
                            <div class="form-group">
                                <label style="font-size: 11px;">
                                    <input type="checkbox"> ACORD 25 (2016/03)<br>
                                    The ACORD name and logo are registered marks of ACORD
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Cancellation Section -->
                    <div class="form-section">
                        <h3>CANCELLATION</h3>
                        <p style="font-size: 11px;">
                            SHOULD ANY OF THE ABOVE DESCRIBED POLICIES BE CANCELLED BEFORE THE EXPIRATION DATE THEREOF, NOTICE WILL BE DELIVERED IN
                            ACCORDANCE WITH THE POLICY PROVISIONS.
                        </p>
                    </div>

                    <!-- Authorized Representative -->
                    <div class="form-section">
                        <div class="form-row">
                            <div class="form-group">
                                <label>AUTHORIZED REPRESENTATIVE:</label>
                                <input type="text" class="form-control" placeholder="Signature (Type name)">
                                <small>Date: ${today}</small>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn-secondary" onclick="printCOI('${policyId}')">
                            <i class="fas fa-print"></i> Print
                        </button>
                        <button class="btn-secondary" onclick="saveCOI('${policyId}')">
                            <i class="fas fa-save"></i> Save Only
                        </button>
                        <button class="btn-primary" onclick="sendAndSaveCOI('${policyId}')">
                            <i class="fas fa-paper-plane"></i> Send & Save COI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Auto-populate fields based on policy
    populateCOIFields(policyId);
}

// Back to Policy List
function backToPolicyList() {
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) return;
    
    // Reset the viewer to show the policy list
    policyViewer.innerHTML = `
        <div class="policy-list" id="policyList">
            <!-- Policy list will be populated here -->
        </div>
    `;
    
    loadPolicyList();
}

// Send and Save COI
function sendAndSaveCOI(policyId) {
    // Get form data
    const holderName = document.getElementById('holderInfo').value.split('\n')[0];
    const holderAddress = document.getElementById('holderInfo').value;
    
    if (!holderName || !holderAddress) {
        alert('Please fill in required certificate holder information');
        return;
    }

    // Create email response modal
    const emailModal = document.createElement('div');
    emailModal.className = 'modal';
    emailModal.id = 'emailResponseModal';
    emailModal.innerHTML = `
        <div class="modal-content email-modal">
            <div class="modal-header">
                <h2>Send Certificate of Insurance</h2>
                <button class="close-btn" onclick="closeModal('emailResponseModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body modal-body-spacious">
                <div class="form-group">
                    <label>To:</label>
                    <input type="text" id="emailTo" class="form-control" value="${holderName.toLowerCase().replace(/\s+/g, '') + '@example.com'}" placeholder="Enter recipient email">
                </div>
                <div class="form-group">
                    <label>CC:</label>
                    <input type="text" id="emailCC" class="form-control" placeholder="Enter CC recipients (optional)">
                </div>
                <div class="form-group">
                    <label>Subject:</label>
                    <input type="text" id="emailSubject" class="form-control" value="Certificate of Insurance - ${policyId}">
                </div>
                <div class="form-group">
                    <label>Message:</label>
                    <textarea id="emailBody" class="form-control" rows="6">Hi,

Please see attached Certificate of Insurance as requested.

Policy Number: ${policyId}
Certificate Holder: ${holderName}

Please let me know if you need any additional information.

Thanks,
Vanguard Insurance Team</textarea>
                </div>
                <div class="form-group">
                    <div class="attachment-preview">
                        <i class="fas fa-file-pdf"></i>
                        <span>COI_${policyId}_${Date.now()}.pdf</span>
                        <span class="attachment-size">(Attached)</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeModal('emailResponseModal')">Cancel</button>
                    <button class="btn-primary" onclick="sendCOIEmail('${policyId}')">
                        <i class="fas fa-paper-plane"></i> Send Email
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(emailModal);
    emailModal.style.display = 'flex';
}

// Send COI Email
function sendCOIEmail(policyId) {
    // Show loading state
    const sendButton = event.target;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    sendButton.disabled = true;

    setTimeout(() => {
        closeModal('emailResponseModal');
        showNotification('COI sent successfully to recipient!', 'success');
        
        // Refresh inbox to show sent item
        loadCOIInbox();
    }, 1500);
}

// Save COI
function saveCOI(policyId) {
    showNotification('Certificate of Insurance saved successfully!', 'success');
    closeModal('coiModal');
}

// Populate COI Fields
function populateCOIFields(policyId) {
    // Auto-populate based on selected policy
    // This would normally fetch from a database
    console.log('Populating COI fields for policy:', policyId);
}

// Print COI
function printCOI(policyId) {
    window.print();
}

// Preview COI
function previewCOI(policyId) {
    window.open('https://www.acord.org/forms-store/form-information?formNumber=ACORD%2025', '_blank');
}

// Reply to Email
function replyToEmail(emailId) {
    alert('Reply functionality will open email composer with quoted message');
}

// Forward Email
function forwardEmail(emailId) {
    alert('Forward functionality will open email composer with original message');
}

// Filter COI Emails
function filterCOIEmails(filter) {
    const emails = document.querySelectorAll('.email-item');
    emails.forEach(email => {
        if (filter === 'unread') {
            email.style.display = email.classList.contains('unread') ? 'block' : 'none';
        } else {
            email.style.display = 'block';
        }
    });
}

// Refresh Policies
function refreshPolicies() {
    showNotification('Refreshing policy list...', 'info');
    setTimeout(() => {
        loadPolicyList();
        showNotification('Policy list updated!', 'success');
    }, 1000);
}

// Format Date Helper for relative time
function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
        }
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Format Premium Value Helper
function formatPremiumValue(value) {
    if (!value && value !== 0) return '0';
    
    // If it's already a number, format it
    if (typeof value === 'number') {
        return value.toLocaleString();
    }
    
    // If it's a string, clean it and parse it
    if (typeof value === 'string') {
        // Remove dollar signs, commas, and spaces
        const cleanValue = value.replace(/[$,\s]/g, '');
        const numValue = parseFloat(cleanValue);
        
        // Check if parsing was successful
        if (!isNaN(numValue)) {
            return numValue.toLocaleString();
        }
    }
    
    // Default return
    return '0';
}

// Format Date Helper for displaying dates in tables
function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    try {
        // Handle both Date objects and date strings
        let date;
        if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            date = new Date(dateInput);
        }
        
        if (isNaN(date.getTime())) return 'N/A';
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
        return 'N/A';
    }
}

// Telnyx Phone System Configuration
const TELNYX_API_KEY = 'YOUR_API_KEY_HERE';
const TELNYX_API_URL = 'https://api.telnyx.com/v2';

// Approved Telnyx Phone Numbers
const TELNYX_PHONE_NUMBERS = [
    { number: '+13303008092', location: 'ORRVILLE', status: 'approved', default: true },
    { number: '+13307652039', location: 'ORRVILLE', status: 'approved' },
    { number: '+13303553943', location: 'KINSMAN', status: 'approved' },
    { number: '+13304485974', location: 'SHARON', status: 'approved' },
    { number: '+13305169554', location: 'DALTON', status: 'approved' },
    { number: '+13305169588', location: 'DALTON', status: 'approved' },
    { number: '+13305309058', location: 'GIRARD', status: 'approved' },
    { number: '+13305309163', location: 'GIRARD', status: 'approved' },
    { number: '+13305309216', location: 'GIRARD', status: 'approved' },
    { number: '+13305674610', location: 'SHREVE', status: 'approved' }
];

// Get default phone number or first available
function getDefaultPhoneNumber() {
    const defaultNumber = TELNYX_PHONE_NUMBERS.find(n => n.default);
    return defaultNumber ? defaultNumber.number : TELNYX_PHONE_NUMBERS[0].number;
}

// Phone Tool Functions
function openPhoneTool() {
    const phoneModal = document.createElement('div');
    phoneModal.className = 'modal-overlay active';
    phoneModal.id = 'phoneToolModal';
    
    phoneModal.innerHTML = `
        <div class="modal-container" style="max-width: 900px; width: 90%; height: 85vh; display: flex; flex-direction: column;">
            <div class="modal-header" style="padding: 20px 25px; border-bottom: 2px solid #e5e7eb; flex-shrink: 0;">
                <h2 style="margin: 0; color: #111827; font-size: 24px; display: flex; align-items: center;">
                    <i class="fas fa-phone-alt" style="margin-right: 12px; color: #10b981;"></i>
                    Telnyx Phone System
                </h2>
                <button class="close-btn" onclick="closePhoneTool()" style="font-size: 28px;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 0; flex: 1; display: flex; overflow: hidden;">
                <!-- Left Panel - Dialer -->
                <div style="width: 380px; background: #f9fafb; padding: 25px; border-right: 2px solid #e5e7eb; display: flex; flex-direction: column;">
                    <!-- Caller ID Selection -->
                    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; color: #374151; font-size: 13px; font-weight: 600;">CALLING FROM:</label>
                        <select id="callerIdSelect" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="+13303008092" selected>ORRVILLE - (330) 300-8092</option>
                            <option value="+13307652039">ORRVILLE - (330) 765-2039</option>
                            <option value="+13303553943">KINSMAN - (330) 355-3943</option>
                            <option value="+13304485974">SHARON - (330) 448-5974</option>
                            <option value="+13305169554">DALTON - (330) 516-9554</option>
                            <option value="+13305169588">DALTON - (330) 516-9588</option>
                            <option value="+13305309058">GIRARD - (330) 530-9058</option>
                            <option value="+13305309163">GIRARD - (330) 530-9163</option>
                            <option value="+13305309216">GIRARD - (330) 530-9216</option>
                            <option value="+13305674610">SHREVE - (330) 567-4610</option>
                        </select>
                    </div>
                    
                    <!-- Number Display -->
                    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                        <input type="text" id="phoneNumber" placeholder="Enter number or select contact" 
                            style="width: 100%; font-size: 22px; padding: 12px; border: none; text-align: center; font-weight: 500;">
                    </div>
                    
                    <!-- Dial Pad -->
                    <div class="dial-pad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                        ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(digit => `
                            <button class="dial-btn" onclick="addDigit('${digit}')" 
                                style="padding: 20px; font-size: 24px; background: white; border: 2px solid #e5e7eb; 
                                border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                ${digit}
                            </button>
                        `).join('')}
                    </div>
                    
                    <!-- Call Actions -->
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <button onclick="makeCall()" class="btn-primary" 
                            style="flex: 1; padding: 15px; font-size: 16px; background: #10b981; border-radius: 10px;">
                            <i class="fas fa-phone"></i> Call
                        </button>
                        <button onclick="clearNumber()" class="btn-secondary" 
                            style="padding: 15px 20px; font-size: 16px; border-radius: 10px;">
                            <i class="fas fa-backspace"></i>
                        </button>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div style="background: white; border-radius: 10px; padding: 15px;">
                        <h4 style="margin: 0 0 15px 0; color: #374151; font-size: 14px; text-transform: uppercase;">Quick Actions</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <button onclick="sendSMS()" class="btn-secondary" style="padding: 10px; font-size: 14px;">
                                <i class="fas fa-sms"></i> Send SMS
                            </button>
                            <button onclick="showCallHistory()" class="btn-secondary" style="padding: 10px; font-size: 14px;">
                                <i class="fas fa-history"></i> Call History
                            </button>
                            <button onclick="showVoicemail()" class="btn-secondary" style="padding: 10px; font-size: 14px;">
                                <i class="fas fa-voicemail"></i> Voicemail
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Right Panel - Call Info & Contacts -->
                <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                    <!-- Call Status -->
                    <div id="callStatus" style="background: #f3f4f6; padding: 20px; border-bottom: 1px solid #e5e7eb; display: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">Active Call</p>
                                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 600;" id="activeCallNumber"></p>
                                <p style="margin: 5px 0 0 0; color: #10b981; font-size: 16px;" id="callDuration">00:00</p>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="holdCall()" class="btn-secondary" style="padding: 10px 15px;">
                                    <i class="fas fa-pause"></i> Hold
                                </button>
                                <button onclick="muteCall()" class="btn-secondary" style="padding: 10px 15px;">
                                    <i class="fas fa-microphone-slash"></i> Mute
                                </button>
                                <button onclick="endCall()" class="btn-primary" style="padding: 10px 15px; background: #dc2626;">
                                    <i class="fas fa-phone-slash"></i> End
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tabs -->
                    <div style="display: flex; background: white; border-bottom: 1px solid #e5e7eb;">
                        <button class="phone-tab active" onclick="switchPhoneTab('contacts')" 
                            style="flex: 1; padding: 15px; background: none; border: none; font-size: 15px; cursor: pointer;">
                            <i class="fas fa-address-book"></i> Contacts
                        </button>
                        <button class="phone-tab" onclick="switchPhoneTab('recent')" 
                            style="flex: 1; padding: 15px; background: none; border: none; font-size: 15px; cursor: pointer;">
                            <i class="fas fa-clock"></i> Recent
                        </button>
                        <button class="phone-tab" onclick="switchPhoneTab('sms')" 
                            style="flex: 1; padding: 15px; background: none; border: none; font-size: 15px; cursor: pointer;">
                            <i class="fas fa-comment"></i> Messages
                        </button>
                    </div>
                    
                    <!-- Tab Content -->
                    <div id="phoneTabContent" style="flex: 1; overflow-y: auto; padding: 20px;">
                        <!-- Contacts Tab -->
                        <div id="contactsTab" class="phone-tab-content">
                            <div style="margin-bottom: 15px;">
                                <input type="text" placeholder="Search contacts..." 
                                    style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                            </div>
                            <div id="contactsList">
                                ${generatePhoneContacts()}
                            </div>
                        </div>
                        
                        <!-- Recent Tab -->
                        <div id="recentTab" class="phone-tab-content" style="display: none;">
                            <div id="recentCallsList">
                                ${generateRecentCalls()}
                            </div>
                        </div>
                        
                        <!-- SMS Tab -->
                        <div id="smsTab" class="phone-tab-content" style="display: none;">
                            <div style="margin-bottom: 15px;">
                                <textarea id="smsMessage" placeholder="Type your message..." 
                                    style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; height: 100px;"></textarea>
                                <button onclick="sendSMSMessage()" class="btn-primary" style="margin-top: 10px; padding: 10px 20px;">
                                    <i class="fas fa-paper-plane"></i> Send SMS
                                </button>
                            </div>
                            <div id="messagesList">
                                ${generateMessages()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(phoneModal);
    addPhoneToolStyles();
}

function closePhoneTool() {
    const modal = document.getElementById('phoneToolModal');
    if (modal) modal.remove();
}

function addDigit(digit) {
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.value += digit;
    }
}

function clearNumber() {
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.value = phoneInput.value.slice(0, -1);
    }
}

function makeCall() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    if (!phoneNumber) {
        showNotification('Please enter a phone number', 'error');
        return;
    }
    
    // Show call status
    const callStatus = document.getElementById('callStatus');
    const activeCallNumber = document.getElementById('activeCallNumber');
    const callerIdSelect = document.getElementById('callerIdSelect');
    
    if (callStatus && activeCallNumber) {
        callStatus.style.display = 'block';
        const fromNumber = callerIdSelect ? callerIdSelect.value : getDefaultPhoneNumber();
        const selectedPhone = TELNYX_PHONE_NUMBERS.find(p => p.number === fromNumber);
        activeCallNumber.innerHTML = `
            <div>${phoneNumber}</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                From: ${selectedPhone ? selectedPhone.location : 'Unknown'} (${fromNumber.replace('+1', '')})
            </div>
        `;
        startCallTimer();
    }
    
    // Make actual Telnyx API call
    makeTelnyxCall(phoneNumber);
}

function makeTelnyxCall(phoneNumber) {
    // Get selected caller ID
    const callerIdSelect = document.getElementById('callerIdSelect');
    const fromNumber = callerIdSelect ? callerIdSelect.value : getDefaultPhoneNumber();
    
    // Format phone number for Telnyx (E.164 format)
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;
    
    // Telnyx Call Control API
    fetch(`${TELNYX_API_URL}/calls`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TELNYX_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            connection_id: 'default',
            to: e164Number,
            from: fromNumber,
            webhook_url: 'https://a3eaf804f020.ngrok-free.app/webhook/telnyx'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Call initiated:', data);
        showNotification(`Calling ${phoneNumber}...`, 'success');
    })
    .catch(error => {
        console.error('Error making call:', error);
        showNotification('Failed to initiate call. Please check your connection.', 'error');
    });
}

function endCall() {
    const callStatus = document.getElementById('callStatus');
    if (callStatus) {
        callStatus.style.display = 'none';
    }
    stopCallTimer();
    showNotification('Call ended', 'info');
}

function holdCall() {
    showNotification('Call on hold', 'info');
}

function muteCall() {
    showNotification('Call muted', 'info');
}

function sendSMS() {
    switchPhoneTab('sms');
}

function sendSMSMessage() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const message = document.getElementById('smsMessage').value;
    
    if (!phoneNumber || !message) {
        showNotification('Please enter phone number and message', 'error');
        return;
    }
    
    // Get selected caller ID
    const callerIdSelect = document.getElementById('callerIdSelect');
    const fromNumber = callerIdSelect ? callerIdSelect.value : getDefaultPhoneNumber();
    
    // Format phone number for Telnyx
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;
    
    // Telnyx SMS API
    fetch(`${TELNYX_API_URL}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TELNYX_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: fromNumber,
            to: e164Number,
            text: message
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('SMS sent:', data);
        showNotification('Message sent successfully!', 'success');
        document.getElementById('smsMessage').value = '';
    })
    .catch(error => {
        console.error('Error sending SMS:', error);
        showNotification('Failed to send message', 'error');
    });
}

function showCallHistory() {
    switchPhoneTab('recent');
}

function showVoicemail() {
    showNotification('Voicemail feature coming soon', 'info');
}

function switchPhoneTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.phone-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the correct tab button
    document.querySelectorAll('.phone-tab').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tab.toLowerCase()) || 
            (tab === 'contacts' && btn.textContent.includes('Contacts')) ||
            (tab === 'recent' && btn.textContent.includes('Recent')) ||
            (tab === 'sms' && btn.textContent.includes('Messages'))) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.phone-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const tabContent = document.getElementById(tab + 'Tab');
    if (tabContent) {
        tabContent.style.display = 'block';
    }
}

function generatePhoneContacts() {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    if (clients.length === 0) {
        return '<p style="text-align: center; color: #6b7280; padding: 20px;">No contacts available</p>';
    }
    
    return clients.map(client => `
        <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; cursor: pointer;"
            onclick="selectContact('${client.phone || ''}', '${client.name}')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="margin: 0; font-weight: 600;">${client.name}</p>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${client.phone || 'No phone'}</p>
                </div>
                <button onclick="selectContact('${client.phone || ''}', '${client.name}'); event.stopPropagation();" 
                    class="btn-icon" style="background: #10b981; color: white;">
                    <i class="fas fa-phone"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function generateRecentCalls() {
    // Sample recent calls - in production, this would come from Telnyx API
    const recentCalls = [
        { number: '(555) 123-4567', name: 'John Smith', time: '2 min ago', type: 'outgoing', duration: '5:23' },
        { number: '(555) 987-6543', name: 'Sarah Johnson', time: '1 hour ago', type: 'incoming', duration: '12:45' },
        { number: '(555) 456-7890', name: 'Mike Davis', time: '3 hours ago', type: 'missed', duration: '' }
    ];
    
    return recentCalls.map(call => `
        <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-${call.type === 'incoming' ? 'arrow-down' : call.type === 'outgoing' ? 'arrow-up' : 'phone-slash'}" 
                        style="color: ${call.type === 'missed' ? '#dc2626' : '#10b981'};"></i>
                    <div>
                        <p style="margin: 0; font-weight: 600;">${call.name}</p>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
                            ${call.number} • ${call.time} ${call.duration ? `• ${call.duration}` : ''}
                        </p>
                    </div>
                </div>
                <button onclick="selectContact('${call.number}', '${call.name}')" class="btn-icon">
                    <i class="fas fa-phone"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function generateMessages() {
    // Sample messages - in production, this would come from Telnyx API
    const messages = [
        { number: '(555) 123-4567', name: 'John Smith', message: 'Thanks for the quote!', time: '10 min ago' },
        { number: '(555) 987-6543', name: 'Sarah Johnson', message: 'Can we discuss the policy?', time: '2 hours ago' }
    ];
    
    return messages.map(msg => `
        <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <p style="margin: 0; font-weight: 600;">${msg.name}</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${msg.time}</p>
            </div>
            <p style="margin: 0; color: #374151;">${msg.message}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${msg.number}</p>
        </div>
    `).join('');
}

function selectContact(phone, name) {
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput && phone && phone !== 'No phone') {
        phoneInput.value = phone;
        showNotification(`Selected ${name}`, 'info');
    }
}

let callTimerInterval;
let callSeconds = 0;

function startCallTimer() {
    callSeconds = 0;
    callTimerInterval = setInterval(() => {
        callSeconds++;
        const minutes = Math.floor(callSeconds / 60);
        const seconds = callSeconds % 60;
        const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const callDuration = document.getElementById('callDuration');
        if (callDuration) {
            callDuration.textContent = duration;
        }
    }, 1000);
}

function stopCallTimer() {
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callSeconds = 0;
    }
}

function addPhoneToolStyles() {
    if (!document.getElementById('phone-tool-styles')) {
        const style = document.createElement('style');
        style.id = 'phone-tool-styles';
        style.textContent = `
            .dial-btn:hover {
                background: #10b981 !important;
                color: white !important;
                transform: scale(1.05);
            }
            .dial-btn:active {
                transform: scale(0.95);
            }
            .phone-tab.active {
                background: #f3f4f6 !important;
                border-bottom: 2px solid #10b981 !important;
            }
            .phone-tab:hover {
                background: #f9fafb;
            }
        `;
        document.head.appendChild(style);
    }
}

// Email Tool Functions
function openEmailTool() {
    showNotification('Email tool integration coming soon', 'info');
    // Future: Integrate with email service like SendGrid or AWS SES
}

// Notepad Tool Functions
function openNotepad() {
    const notepadModal = document.createElement('div');
    notepadModal.className = 'modal-overlay active';
    notepadModal.id = 'notepadModal';
    
    // Load saved notes from localStorage
    const savedNotes = localStorage.getItem('notepadContent') || '';
    
    notepadModal.innerHTML = `
        <div class="modal-container" style="max-width: 700px; width: 90%;">
            <div class="modal-header">
                <h2 style="margin: 0; display: flex; align-items: center;">
                    <i class="fas fa-sticky-note" style="margin-right: 10px; color: #f59e0b;"></i>
                    Quick Notepad
                </h2>
                <button class="close-btn" onclick="closeNotepad()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <textarea id="notepadContent" 
                    style="width: 100%; height: 400px; padding: 15px; border: 1px solid #e5e7eb; 
                    border-radius: 8px; font-size: 14px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    resize: vertical;" 
                    placeholder="Type your notes here...">${savedNotes}</textarea>
                <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="color: #6b7280; font-size: 14px;">
                        <i class="fas fa-info-circle"></i> Notes are automatically saved locally
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="clearNotepad()" class="btn-secondary">
                            <i class="fas fa-trash"></i> Clear
                        </button>
                        <button onclick="saveNotepad()" class="btn-primary">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notepadModal);
    
    // Auto-save notes as user types
    const notepadContent = document.getElementById('notepadContent');
    if (notepadContent) {
        notepadContent.addEventListener('input', () => {
            localStorage.setItem('notepadContent', notepadContent.value);
        });
    }
}

function closeNotepad() {
    const modal = document.getElementById('notepadModal');
    if (modal) {
        saveNotepad(); // Save before closing
        modal.remove();
    }
}

function saveNotepad() {
    const notepadContent = document.getElementById('notepadContent');
    if (notepadContent) {
        localStorage.setItem('notepadContent', notepadContent.value);
        showNotification('Notes saved successfully', 'success');
    }
}

function clearNotepad() {
    if (confirm('Are you sure you want to clear all notes?')) {
        const notepadContent = document.getElementById('notepadContent');
        if (notepadContent) {
            notepadContent.value = '';
            localStorage.setItem('notepadContent', '');
            showNotification('Notes cleared', 'info');
        }
    }
}

// Handle browser back/forward navigation
window.addEventListener('hashchange', function() {
    const hash = window.location.hash || '#dashboard';
    console.log('Hash changed to:', hash);
    loadContent(hash);
    updateActiveMenuItem(hash);
});

// Update active menu item
function updateActiveMenuItem(hash) {
    console.log('Updating active menu item for:', hash);
    
    // Remove active class from all menu items
    document.querySelectorAll('.sidebar li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Add active class to current menu item
    const activeLink = document.querySelector(`.sidebar a[href="${hash}"]`);
    if (activeLink) {
        activeLink.parentElement.classList.add('active');
        console.log('Set active:', hash);
    } else {
        console.log('Could not find menu item for:', hash);
    }
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Quick Action Functions
function showNewQuote() {
    showModal('ratingModal');
}

function showNewClient() {
    showModal('clientModal');
}

function showRatingEngine() {
    showModal('ratingModal');
}

function showRenewalsList() {
    // Simulate navigation to renewals page
    highlightMenuItem('renewals');
    loadRenewalsData();
}

function showClaims() {
    // Simulate navigation to claims page
    highlightMenuItem('claims');
    loadClaimsData();
}

function showReports() {
    // Simulate navigation to reports page
    highlightMenuItem('reports');
    generateReports();
}

// Rating Engine Functions
function getQuotes() {
    const quotesResults = document.getElementById('quotesResults');
    const button = event.target;
    
    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Quotes...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        quotesResults.style.display = 'block';
        button.innerHTML = '<i class="fas fa-search"></i> Get Quotes';
        button.disabled = false;
        
        // Animate quote cards
        const cards = quotesResults.querySelectorAll('.quote-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 2000);
}

// Panel Functions
function showPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'block';
        setTimeout(() => {
            panel.style.transform = 'translateX(0)';
        }, 10);
    }
}

function hidePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.transform = 'translateX(100%)';
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300);
    }
}

// Initialize Charts
function initializeCharts() {
    // Set default chart options to prevent infinite scaling
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    
    // Premium Growth Chart
    const premiumCtx = document.getElementById('premiumChart');
    if (premiumCtx) {
        // Set explicit dimensions on the canvas
        premiumCtx.style.maxHeight = '250px';
        premiumCtx.style.width = '100%';
        
        new Chart(premiumCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Premium ($)',
                    data: [850000, 920000, 980000, 1050000, 1100000, 1150000, 1200000, 1180000, 1220000, 1280000, 1350000, 1400000],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Policy Distribution Chart
    const policyCtx = document.getElementById('policyChart');
    if (policyCtx) {
        // Set explicit dimensions on the canvas
        policyCtx.style.maxHeight = '250px';
        policyCtx.style.width = '100%';
        
        new Chart(policyCtx, {
            type: 'doughnut',
            data: {
                labels: ['Auto', 'Homeowners', 'Commercial', 'Life', 'Other'],
                datasets: [{
                    data: [35, 28, 20, 12, 5],
                    backgroundColor: [
                        '#0066cc',
                        '#4d94ff',
                        '#8b5cf6',
                        '#10b981',
                        '#f59e0b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Close modals on click outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                setTimeout(() => {
                    this.style.display = 'none';
                }, 300);
            }
        });
    });
    
    // Sidebar menu items - removed since we handle navigation via hashchange event
    
    // Form submissions
    const newClientForm = document.getElementById('newClientForm');
    if (newClientForm) {
        newClientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveClient();
        });
    }
    
}

// Initialize Automation
function initializeAutomation() {
    // Toggle switches
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const workflowName = this.closest('.workflow-item').querySelector('h4').textContent;
            const status = this.checked ? 'enabled' : 'disabled';
            console.log(`Workflow "${workflowName}" ${status}`);
            
            // Show notification
            showNotification(`Workflow ${status}`, 'success');
        });
    });
}

// Load Content Based on Navigation
function loadContent(section) {
    // Get dashboard content area
    let dashboardContent = document.querySelector('.dashboard-content');
    
    if (!dashboardContent) {
        return;
    }
    
    
    switch(section) {
        case '':
        case '#':
        case '#dashboard':
            // Don't clear content, instead rebuild the dashboard structure
            loadFullDashboard();
            break;
        case '#leads':
            loadLeadsView();
            break;
        case '#clients':
            dashboardContent.innerHTML = ''; // Clear content
            loadClientsView();
            break;
        case '#policies':
            dashboardContent.innerHTML = ''; // Clear content
            loadPoliciesView();
            break;
        case '#renewals':
            dashboardContent.innerHTML = ''; // Clear content
            loadRenewalsView();
            break;
        case '#lead-generation':
            dashboardContent.innerHTML = ''; // Clear content
            loadLeadGenerationView();
            break;
        case '#rating':
        case '#rating-engine':
            dashboardContent.innerHTML = ''; // Clear content
            loadRatingEngineView();
            break;
        case '#automation':
            // Show automation panel on the side
            showPanel('automationPanel');
            // Keep current view
            break;
        case '#accounting':
            dashboardContent.innerHTML = ''; // Clear content
            loadAccountingView();
            break;
        case '#reports':
            dashboardContent.innerHTML = ''; // Clear content
            loadReportsView();
            break;
        case '#communications':
            dashboardContent.innerHTML = ''; // Clear content
            loadCommunicationsView();
            break;
        case '#carriers':
            dashboardContent.innerHTML = ''; // Clear content
            loadCarriersView();
            break;
        case '#producers':
            dashboardContent.innerHTML = ''; // Clear content
            loadProducersView();
            break;
        case '#settings':
            dashboardContent.innerHTML = ''; // Clear content
            loadSettingsView();
            break;
        case '#analytics':
            dashboardContent.innerHTML = ''; // Clear content
            loadAnalyticsView();
            break;
        case '#integrations':
            dashboardContent.innerHTML = ''; // Clear content
            loadIntegrationsView();
            break;
        case '#coi':
            dashboardContent.innerHTML = ''; // Clear content
            loadCOIView();
            break;
        default:
            // Default to dashboard
            loadDashboardView();
            break;
    }
}

// Save Client Function
function saveClient() {
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('newClientForm');
    
    // Get form data
    const formData = new FormData(form);
    
    // Create client object
    const firstName = formData.get('firstName') || '';
    const lastName = formData.get('lastName') || '';
    const clientName = `${firstName} ${lastName}`.trim();
    
    // Validate required fields
    if (!clientName || !formData.get('clientEmail') || !formData.get('clientPhone')) {
        alert('Please fill in all required fields (Name, Email, Phone)');
        return;
    }
    
    const newClient = {
        id: Date.now(),
        name: clientName,
        email: formData.get('clientEmail'),
        phone: formData.get('clientPhone'),
        address: formData.get('clientAddress') || '',
        type: formData.get('clientType') || 'Personal',
        status: 'Active',
        createdAt: new Date().toISOString(),
        policies: [],
        totalPremium: 0
    };
    
    console.log('New client created:', newClient);
    
    // Get existing clients
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    console.log('Existing clients:', clients.length);
    
    // Add new client
    clients.push(newClient);
    console.log('Total clients after adding:', clients.length);
    
    // Save to localStorage
    localStorage.setItem('insurance_clients', JSON.stringify(clients));
    console.log('Saved to localStorage');
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Reset form
        form.reset();
        
        // Close modal
        closeModal('clientModal');
        
        // Show success notification
        showNotification('Client added successfully!', 'success');
        
        // Add real activity for this client
        const activitiesList = document.querySelector('.activities-list');
        if (activitiesList) {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-icon success">
                    <i class="fas fa-user-plus"></i>
                </div>
                <div class="activity-details">
                    <p><strong>New Client Added</strong> - ${newClient.name}</p>
                    <span class="activity-time">Just now</span>
                </div>
            `;
            activitiesList.insertBefore(activityItem, activitiesList.firstChild);
            
            // Remove last item if too many
            if (activitiesList.children.length > 5) {
                activitiesList.removeChild(activitiesList.lastChild);
            }
        }
        
        // Reload clients view to show new client
        loadClientsView();
        
        // Update client count
        updateClientCount();
        
        // Reset button
        submitBtn.innerHTML = 'Add Client';
        submitBtn.disabled = false;
    }, 500);
}

// Update Dashboard Stats
function updateDashboardStats() {
    // Disabled automatic demo activity generation
    // Activities will now only be added when real actions occur
}

// Add New Activity
function addNewActivity() {
    const activities = [
        { icon: 'check', type: 'success', text: 'New Policy Issued', details: 'Auto Insurance', amount: '$1,500/year' },
        { icon: 'user', type: 'info', text: 'New Lead Captured', details: 'Web Form' },
        { icon: 'clock', type: 'warning', text: 'Policy Renewal Due', details: 'Homeowners', amount: '$2,800/year' },
        { icon: 'calculator', type: 'success', text: 'Quote Generated', details: 'Commercial Property' }
    ];
    
    const activity = activities[Math.floor(Math.random() * activities.length)];
    const activitiesList = document.querySelector('.activities-list');
    
    if (activitiesList) {
        const newItem = document.createElement('div');
        newItem.className = 'activity-item';
        newItem.style.opacity = '0';
        newItem.innerHTML = `
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-details">
                <p><strong>${activity.text}</strong> - ${activity.details}</p>
                <span class="activity-time">Just now</span>
            </div>
            ${activity.amount ? `<span class="activity-amount">${activity.amount}</span>` : ''}
        `;
        
        activitiesList.insertBefore(newItem, activitiesList.firstChild);
        
        // Animate in
        setTimeout(() => {
            newItem.style.transition = 'opacity 0.5s ease';
            newItem.style.opacity = '1';
        }, 10);
        
        // Remove last item if too many
        if (activitiesList.children.length > 5) {
            activitiesList.removeChild(activitiesList.lastChild);
        }
    }
}

// Load Upcoming Renewals
function loadUpcomingRenewals() {
    const container = document.getElementById('renewals-list-container');
    if (!container) return;
    
    // Get policies from localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    // Filter policies expiring within 30 days
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = policies.filter(policy => {
        if (policy.renewalDate || policy.expiryDate) {
            const renewalTime = new Date(policy.renewalDate || policy.expiryDate).getTime();
            return renewalTime <= thirtyDaysFromNow && renewalTime > Date.now();
        }
        return false;
    });
    
    if (upcomingRenewals.length === 0) {
        // Show no renewals message
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #999;">
                <i class="fas fa-calendar-check" style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;"></i>
                <p style="margin: 0; font-size: 16px;">No upcoming renewals in the next 30 days</p>
            </div>
        `;
    } else {
        // Build HTML for renewals
        const html = upcomingRenewals.slice(0, 4).map(policy => {
            const date = new Date(policy.renewalDate || policy.expiryDate);
            const daysLeft = Math.ceil((date - Date.now()) / (1000 * 60 * 60 * 24));
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
            });
            
            return `
                <div class="renewal-item">
                    <div class="renewal-info">
                        <p class="client-name">${policy.clientName || 'Unknown Client'}</p>
                        <p class="policy-type">${policy.type || 'Insurance'}</p>
                    </div>
                    <div class="renewal-date">
                        <span class="date">${formattedDate}</span>
                        <span class="days-left">${daysLeft} days</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles if not exists
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 90px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 3000;
                animation: slideIn 0.3s ease;
            }
            
            .notification.success {
                border-left: 4px solid #10b981;
            }
            
            .notification.info {
                border-left: 4px solid #0066cc;
            }
            
            .notification i {
                font-size: 1.25rem;
            }
            
            .notification.success i {
                color: #10b981;
            }
            
            .notification.info i {
                color: #0066cc;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Helper Functions
function highlightMenuItem(item) {
    document.querySelectorAll('.sidebar li').forEach(li => {
        li.classList.remove('active');
    });
    
    const menuItem = document.querySelector(`.sidebar a[href="#${item}"]`);
    if (menuItem) {
        menuItem.parentElement.classList.add('active');
    }
}

function updateClientCount() {
    const clientCount = document.querySelector('.sidebar a[href="#clients"] .count');
    if (clientCount) {
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        clientCount.textContent = clients.length;
    }
}

// View Loading Functions - Full Implementation

function loadFullDashboard() {
    console.log('Loading full dashboard...');
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        console.log('No dashboard content found');
        return;
    }
    
    // Rebuild the entire dashboard structure
    dashboardContent.innerHTML = `
        <!-- Statistics Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-details">
                    <h3>Active Clients</h3>
                    <p class="stat-number stat-value">0</p>
                    <span class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> 0% from last month
                    </span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <i class="fas fa-file-contract"></i>
                </div>
                <div class="stat-details">
                    <h3>Active Policies</h3>
                    <p class="stat-number stat-value">0</p>
                    <span class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> 0% from last month
                    </span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-details">
                    <h3>All Time Premium</h3>
                    <p class="stat-number stat-value">$0</p>
                    <span class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> 0% from last month
                    </span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-details">
                    <h3>Monthly Lead Premium</h3>
                    <p class="stat-number stat-value">$0</p>
                    <span class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> 0% from last month
                    </span>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
            <h2>Quick Actions</h2>
            <div class="actions-grid">
                <button class="action-btn" onclick="showNewQuote()">
                    <i class="fas fa-plus-circle"></i>
                    <span>New Quote</span>
                </button>
                <button class="action-btn" onclick="showNewClient()">
                    <i class="fas fa-user-plus"></i>
                    <span>Add Client</span>
                </button>
                <button class="action-btn" onclick="showRatingEngine()">
                    <i class="fas fa-calculator"></i>
                    <span>Compare Rates</span>
                </button>
                <button class="action-btn" onclick="showRenewalsList()">
                    <i class="fas fa-sync"></i>
                    <span>Renewals</span>
                </button>
                <button class="action-btn" onclick="showClaims()">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Claims</span>
                </button>
                <button class="action-btn" onclick="showReports()">
                    <i class="fas fa-chart-pie"></i>
                    <span>Reports</span>
                </button>
            </div>
        </div>

        <!-- Main Sections -->
        <div class="dashboard-sections">
            <!-- Recent Activities -->
            <div class="section-card">
                <div class="section-header">
                    <h2>Recent Activities</h2>
                    <a href="#" class="view-all">View All</a>
                </div>
                <div class="activities-list">
                    <!-- Activities will be added here when actions are performed -->
                </div>
            </div>

            <!-- Upcoming Renewals -->
            <div class="section-card">
                <div class="section-header">
                    <h2>Upcoming Renewals</h2>
                    <a href="#" class="view-all">View All</a>
                </div>
                <div class="renewals-list" id="renewals-list-container">
                    <!-- Renewals will be dynamically populated here -->
                </div>
            </div>
        </div>
    `;
    
    // Immediately update dashboard stats and activities after creating the structure
    if (window.DashboardStats) {
        const dashboardStats = new DashboardStats();
        dashboardStats.updateDashboard();
    }
    
    if (window.recentActivities) {
        window.recentActivities.updateDisplay();
    }
    
    if (window.dashboardRenewals) {
        window.dashboardRenewals.updateRenewalsList();
    }
    
    // Now call loadDashboardView to add the To-Do box after a short delay to ensure DOM is ready
    setTimeout(() => {
        loadDashboardView();
    }, 50);
}

function loadDashboardView() {
    console.log('Loading dashboard view...');
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        console.log('No dashboard content found');
        return;
    }
    
    // Check if To-Do box already exists by looking for the specific To-Do container
    const existingTodoContainer = document.querySelector('.todo-container');
    if (!existingTodoContainer) {
        console.log('Adding To-Do box...');
        // Find the dashboard-sections div that contains Recent Activities and Upcoming Renewals
        const dashboardSections = dashboardContent.querySelector('.dashboard-sections');
        
        if (dashboardSections) {
            console.log('Found dashboard-sections, modifying layout...');
            // Change the dashboard-sections to a 3-column grid layout
            dashboardSections.style.display = 'grid';
            dashboardSections.style.gridTemplateColumns = '1fr 1fr 1fr';
            dashboardSections.style.gap = '20px';
            
            // Find and scale the existing section cards
            const sectionCards = dashboardSections.querySelectorAll('.section-card');
            sectionCards.forEach(card => {
                card.style.width = '100%';
                card.style.marginBottom = '0';
            });
            
            // Create the To-Do box HTML
            const todoBoxHTML = `
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>To-Do List</h2>
                    <div style="display: flex; gap: 5px;">
                        <button id="personalTodoBtn" class="btn-sm active" onclick="switchTodoView('personal')" style="
                            padding: 5px 10px;
                            font-size: 0.8rem;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Personal</button>
                        <button id="agencyTodoBtn" class="btn-sm" onclick="switchTodoView('agency')" style="
                            padding: 5px 10px;
                            font-size: 0.8rem;
                            background: #e5e7eb;
                            color: #6b7280;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Agency</button>
                    </div>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="todoInput" placeholder="Add a new task..." 
                            style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px;"
                            onkeypress="if(event.key === 'Enter') addTodo()">
                    </div>
                    <div id="todoList" style="max-height: 320px; overflow-y: auto;">
                        <!-- To-do items will be loaded here -->
                    </div>
                </div>
            `;
            
            // Create the To-Do box as the third column
            const todoBox = document.createElement('div');
            todoBox.className = 'section-card todo-container';
            todoBox.innerHTML = todoBoxHTML;
            
            // Append the To-Do box as the third column
            dashboardSections.appendChild(todoBox);
            console.log('To-Do box added successfully!');
            
            // Force visible notification to confirm
            showNotification('To-Do List added to dashboard!', 'success');
        } else {
            console.log('ERROR: Could not find .dashboard-sections element! Dashboard structure may be different.');
            // Try alternative approach - add it directly after the stats grid
            const statsGrid = dashboardContent.querySelector('.stats-grid');
            if (statsGrid) {
                const todoSection = document.createElement('div');
                todoSection.className = 'dashboard-sections';
                todoSection.style.display = 'grid';
                todoSection.style.gridTemplateColumns = '1fr 1fr 1fr';
                todoSection.style.gap = '20px';
                todoSection.style.marginTop = '2rem';
                
                // Move existing dashboard-sections content if it exists elsewhere
                const existingSections = dashboardContent.querySelectorAll('.section-card');
                existingSections.forEach(card => {
                    todoSection.appendChild(card);
                });
                
                // Create and add the To-Do box
                const todoBox = document.createElement('div');
                todoBox.className = 'section-card todo-container';
                todoBox.innerHTML = todoBoxHTML;
                todoSection.appendChild(todoBox);
                
                // Insert after stats grid
                statsGrid.insertAdjacentElement('afterend', todoSection);
                console.log('To-Do box added using alternative method!');
                showNotification('To-Do List added to dashboard!', 'success');
            }
        }
    } else {
        console.log('To-Do list already exists');
    }
    
    // Reinitialize charts and todos after content load
    setTimeout(() => {
        if (typeof Chart !== 'undefined') {
            initializeCharts();
        }
        loadTodos(); // Load todos on dashboard initialization
    }, 100);
}

// To-Do List Management Functions
let currentTodoView = 'personal'; // Track current view
const currentUser = 'John Agent'; // In production, this would come from login system

// Make functions globally accessible
window.switchTodoView = function switchTodoView(view) {
    currentTodoView = view;
    
    // Update button styles
    const personalBtn = document.getElementById('personalTodoBtn');
    const agencyBtn = document.getElementById('agencyTodoBtn');
    
    if (personalBtn && agencyBtn) {
        if (view === 'personal') {
            personalBtn.style.background = '#3b82f6';
            personalBtn.style.color = 'white';
            agencyBtn.style.background = '#e5e7eb';
            agencyBtn.style.color = '#6b7280';
        } else {
            agencyBtn.style.background = '#3b82f6';
            agencyBtn.style.color = 'white';
            personalBtn.style.background = '#e5e7eb';
            personalBtn.style.color = '#6b7280';
        }
    }
    
    loadTodos();
}

window.loadTodos = function loadTodos() {
    const todoList = document.getElementById('todoList');
    if (!todoList) return;
    
    // Get todos from localStorage
    const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
    let agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
    
    // Add some default agency todos if none exist (for demo)
    if (agencyTodos.length === 0) {
        agencyTodos = [
            {
                text: 'Review quarterly reports',
                completed: false,
                date: new Date(Date.now() - 86400000).toISOString(),
                author: 'Sarah Manager'
            },
            {
                text: 'Update carrier contact list',
                completed: true,
                date: new Date(Date.now() - 172800000).toISOString(),
                author: 'Mike Sales',
                completedBy: 'John Agent',
                completedDate: new Date(Date.now() - 86400000).toISOString()
            },
            {
                text: 'Schedule team training session',
                completed: false,
                date: new Date(Date.now() - 259200000).toISOString(),
                author: 'Lisa HR'
            }
        ];
        localStorage.setItem('agencyTodos', JSON.stringify(agencyTodos));
    }
    
    const todosToShow = currentTodoView === 'personal' ? personalTodos : agencyTodos;
    
    if (todosToShow.length === 0) {
        todoList.innerHTML = `
            <div style="text-align: center; color: #9ca3af; padding: 20px;">
                <i class="fas fa-tasks" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No tasks yet. Add one above!</p>
            </div>
        `;
        return;
    }
    
    todoList.innerHTML = todosToShow.map((todo, index) => `
        <div class="todo-item" style="
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            margin-bottom: 8px;
            background: ${todo.completed ? '#f9fafb' : 'white'};
        ">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <input type="checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo(${index})"
                    style="margin-top: 3px; cursor: pointer;">
                <div style="flex: 1;">
                    <div style="${todo.completed ? 'text-decoration: line-through; color: #9ca3af;' : ''}">
                        ${todo.text}
                    </div>
                    ${currentTodoView === 'agency' ? `
                        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                            <small style="color: #6b7280; font-size: 0.75rem;">
                                <i class="fas fa-user"></i> ${todo.author}
                            </small>
                            <small style="color: #9ca3af; font-size: 0.75rem;">
                                ${new Date(todo.date).toLocaleDateString()}
                            </small>
                        </div>
                    ` : ''}
                </div>
                ${currentTodoView === 'personal' || todo.author === currentUser ? `
                    <button onclick="deleteTodo(${index})" style="
                        background: none;
                        border: none;
                        color: #ef4444;
                        cursor: pointer;
                        padding: 0;
                    ">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

window.addTodo = function addTodo() {
    const input = document.getElementById('todoInput');
    if (!input || !input.value.trim()) return;
    
    const newTodo = {
        text: input.value.trim(),
        completed: false,
        date: new Date().toISOString(),
        author: currentUser
    };
    
    if (currentTodoView === 'personal') {
        const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
        personalTodos.unshift(newTodo); // Add to beginning
        localStorage.setItem('personalTodos', JSON.stringify(personalTodos));
    } else {
        const agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
        agencyTodos.unshift(newTodo); // Add to beginning
        localStorage.setItem('agencyTodos', JSON.stringify(agencyTodos));
    }
    
    input.value = '';
    loadTodos();
}

window.toggleTodo = function toggleTodo(index) {
    if (currentTodoView === 'personal') {
        const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
        personalTodos[index].completed = !personalTodos[index].completed;
        localStorage.setItem('personalTodos', JSON.stringify(personalTodos));
    } else {
        const agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
        agencyTodos[index].completed = !agencyTodos[index].completed;
        // In agency view, also track who completed it
        if (agencyTodos[index].completed) {
            agencyTodos[index].completedBy = currentUser;
            agencyTodos[index].completedDate = new Date().toISOString();
        }
        localStorage.setItem('agencyTodos', JSON.stringify(agencyTodos));
    }
    
    loadTodos();
}

function deleteTodo(index) {
    if (currentTodoView === 'personal') {
        const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
        personalTodos.splice(index, 1);
        localStorage.setItem('personalTodos', JSON.stringify(personalTodos));
    } else {
        const agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
        // Only allow deleting own todos in agency view
        if (agencyTodos[index].author === currentUser) {
            agencyTodos.splice(index, 1);
            localStorage.setItem('agencyTodos', JSON.stringify(agencyTodos));
        }
    }
    
    loadTodos();
}

// Helper function to get stage HTML with colored badge
function getStageHtml(stage) {
    const stageColors = {
        'new': 'stage-new',
        'quoted': 'stage-quoted',
        'quote-sent-unaware': 'stage-quote-unaware',
        'quote-sent-aware': 'stage-quote-aware',
        'interested': 'stage-interested',
        'not-interested': 'stage-not-interested',
        'closed': 'stage-closed',
        'contacted': 'stage-contacted',
        'reviewed': 'stage-reviewed',
        'converted': 'stage-converted'
    };
    
    const stageLabels = {
        'new': 'New',
        'quoted': 'Quoted',
        'quote-sent-unaware': 'Quote Sent (Unaware)',
        'quote-sent-aware': 'Quote Sent (Aware)',
        'interested': 'Interested',
        'not-interested': 'Not Interested',
        'closed': 'Closed',
        'contacted': 'Contacted',
        'reviewed': 'Reviewed',
        'converted': 'Converted'
    };
    
    return `<span class="stage-badge ${stageColors[stage] || 'stage-default'}">${stageLabels[stage] || stage}</span>`;
}

// Helper function to generate lead rows
function generateSimpleLeadRows(leads) {
    if (!leads || leads.length === 0) {
        return '<tr><td colspan="10" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
    }
    
    return leads.map(lead => {
        // Truncate name to 15 characters max
        const displayName = lead.name && lead.name.length > 15 ? lead.name.substring(0, 15) + '...' : lead.name || '';

        return `
            <tr>
                <td>
                    <input type="checkbox" class="lead-checkbox" value="${lead.id}" data-lead='${JSON.stringify(lead).replace(/'/g, '&apos;')}'>
                </td>
                <td class="lead-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <strong style="cursor: pointer; color: #3b82f6; text-decoration: underline; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onclick="viewLead(${lead.id})" title="${lead.name}">${displayName}</strong>
                </td>
                <td>
                    <div class="contact-info" style="display: flex; gap: 10px; align-items: center;">
                        <a href="tel:${lead.phone}" title="${lead.phone}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                            <i class="fas fa-phone"></i>
                        </a>
                        <a href="mailto:${lead.email}" title="${lead.email}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                            <i class="fas fa-envelope"></i>
                        </a>
                    </div>
                </td>
                <td>${lead.product}</td>
                <td>$${(lead.premium || 0).toLocaleString()}</td>
                <td>${getStageHtml(lead.stage)}</td>
                <td>${lead.renewalDate || 'N/A'}</td>
                <td>${lead.assignedTo || 'Unassigned'}</td>
                <td>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewLead('${lead.id}')" title="View Lead"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="archiveLead('${lead.id}')" title="Archive Lead" style="color: #f59e0b;"><i class="fas fa-archive"></i></button>
                        <button class="btn-icon" onclick="convertLead('${lead.id}')" title="Convert to Client"><i class="fas fa-user-check"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Leads Management Functions
function loadLeadsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        return;
    }
    
    // Update dashboard stats with real data after view loads
    setTimeout(() => {
        if (window.DashboardStats) {
            const stats = new window.DashboardStats();
            stats.updateDashboard();
        }
    }, 500);
    
    try {
        // Run deduplication first to clean up any duplicates
        if (window.deduplicateData) {
            console.log('Running deduplication before loading leads...');
            window.deduplicateData();
        }
        
        // Get leads from localStorage with sample data
        let leads = JSON.parse(localStorage.getItem('leads') || '[]');
        if (leads.length === 0) {
            // Generate sample leads with renewal dates and new stages
            leads = [
                { id: 1, name: 'Robert Thompson', phone: '(555) 234-5678', email: 'robert.t@email.com', product: 'Commercial Auto', stage: 'quoted', assignedTo: 'John Smith', created: '12/26/2024', renewalDate: '01/26/2025', premium: 5200, quotes: [] },
                { id: 2, name: 'Jennifer Martinez', phone: '(555) 345-6789', email: 'j.martinez@email.com', product: 'Home + Auto', stage: 'interested', assignedTo: 'Sarah Johnson', created: '12/25/2024', renewalDate: '02/15/2025', premium: 3800, quotes: [] },
                { id: 3, name: 'Transport Solutions LLC', phone: '(555) 456-7890', email: 'info@transportsol.com', product: 'Commercial Fleet', stage: 'quote-sent-aware', assignedTo: 'Mike Wilson', created: '12/24/2024', renewalDate: '03/01/2025', premium: 12500, quotes: [] },
                { id: 4, name: 'Michael Chen', phone: '(555) 567-8901', email: 'm.chen@email.com', product: 'Life Insurance', stage: 'new', assignedTo: 'Lisa Anderson', created: '12/28/2024', renewalDate: '01/28/2025', premium: 2200, quotes: [] },
                { id: 5, name: 'Davis Construction', phone: '(555) 678-9012', email: 'admin@davisconst.com', product: 'Commercial Property', stage: 'quote-sent-unaware', assignedTo: 'John Smith', created: '12/22/2024', renewalDate: '04/10/2025', premium: 8900, quotes: [] },
                { id: 6, name: 'ABC Corp', phone: '(555) 111-2222', email: 'contact@abccorp.com', product: 'Commercial Auto', stage: 'not-interested', assignedTo: 'Sarah Johnson', created: '12/20/2024', renewalDate: '02/01/2025', premium: 4500, quotes: [] },
                { id: 7, name: 'Tech Startup Inc', phone: '(555) 333-4444', email: 'info@techstartup.com', product: 'Commercial Property', stage: 'closed', assignedTo: 'Mike Wilson', created: '12/15/2024', renewalDate: '01/15/2025', premium: 6700, quotes: [] },
            ];
            localStorage.setItem('leads', JSON.stringify(leads));
        }
        
        const totalLeads = leads.length;
        const newLeads = leads.filter(l => l.stage === 'new').length;
        const quotedLeads = leads.filter(l => l.stage === 'quoted').length;
        const quoteSentUnaware = leads.filter(l => l.stage === 'quote-sent-unaware').length;
        const quoteSentAware = leads.filter(l => l.stage === 'quote-sent-aware').length;
        const interestedLeads = leads.filter(l => l.stage === 'interested').length;
        const notInterestedLeads = leads.filter(l => l.stage === 'not-interested').length;
        const closedLeads = leads.filter(l => l.stage === 'closed').length;
        
        // Build HTML step by step
        let html = `
        <div class="leads-view">
            <header class="content-header">
                <h1>Lead Management</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="syncVicidialLeads()" style="background: #10b981; border-color: #10b981;">
                        <i class="fas fa-sync"></i> Sync Vicidial Now
                    </button>
                    <button class="btn-secondary" onclick="importLeads()">
                        <i class="fas fa-upload"></i> Import Leads
                    </button>
                    <button class="btn-secondary" onclick="exportLeads()">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn-secondary" onclick="sendLeadsToBlast()">
                        <i class="fas fa-envelope"></i> Send to Blast
                    </button>
                    <button class="btn-primary" onclick="showNewLead()">
                        <i class="fas fa-plus"></i> New Lead
                    </button>
                </div>
            </header>
            
            <!-- Lead Pipeline -->
            <div class="lead-pipeline">
                <div class="pipeline-stage" data-stage="new">
                    <div class="stage-header">
                        <h3>New</h3>
                        <span class="stage-count">${newLeads}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "new").reduce((sum, l) => sum + (l.premium || 0), 0).toLocaleString()}</div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? (newLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="quoted">
                    <div class="stage-header">
                        <h3>Quoted</h3>
                        <span class="stage-count">${quotedLeads}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "quoted").reduce((sum, l) => sum + (l.premium || 0), 0).toLocaleString()}</div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? (quotedLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="quote-sent">
                    <div class="stage-header">
                        <h3>Quote Sent</h3>
                        <span class="stage-count">${quoteSentUnaware + quoteSentAware}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "quote-sent-unaware" || l.stage === "quote-sent-aware").reduce((sum, l) => sum + (l.premium || 0), 0).toLocaleString()}</div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? ((quoteSentUnaware + quoteSentAware)/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="interested">
                    <div class="stage-header">
                        <h3>Interested</h3>
                        <span class="stage-count">${interestedLeads}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "interested").reduce((sum, l) => sum + (l.premium || 0), 0).toLocaleString()}</div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? (interestedLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="closed">
                    <div class="stage-header success">
                        <h3>Closed</h3>
                        <span class="stage-count">${closedLeads}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "closed").reduce((sum, l) => sum + (l.premium || 0), 0).toLocaleString()}</div>
                    <div class="stage-bar success" style="width: ${totalLeads > 0 ? (closedLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);"></div>
                </div>
            </div>
            
            <!-- Lead Stats -->
            <div class="lead-stats">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Total Leads</h4>
                        <p class="stat-number">${totalLeads}</p>
                        <span class="stat-trend positive">+12% this month</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Conversion Rate</h4>
                        <p class="stat-number">${totalLeads > 0 ? Math.round((closedLeads/totalLeads)*100) : 0}%</p>
                        <span class="stat-trend positive">+3% from last month</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Avg. Response Time</h4>
                        <p class="stat-number">2.3 hrs</p>
                        <span class="stat-trend positive">-15 min improvement</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Pipeline Value</h4>
                        <p class="stat-number">$${leads.reduce((sum, lead) => sum + (parseFloat(lead.premium) || 0), 0).toLocaleString()}</p>
                        <span class="stat-trend positive">+18% growth</span>
                    </div>
                </div>
            </div>
            
            <!-- Leads Table -->
            <div class="table-container">
                <table class="data-table" id="leadsTable">
                    <thead>
                        <tr>
                            <th style="width: 40px;">
                                <input type="checkbox" id="selectAllLeads" onclick="toggleAllLeads(this)">
                            </th>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Product Interest</th>
                            <th class="sortable" onclick="sortLeads('premium')" data-sort="premium">
                                Premium 
                                <span class="sort-arrow" id="sort-premium">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th class="sortable" onclick="sortLeads('stage')" data-sort="stage">
                                Stage 
                                <span class="sort-arrow" id="sort-stage">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th class="sortable" onclick="sortLeads('renewalDate')" data-sort="renewalDate">
                                Renewal Date 
                                <span class="sort-arrow" id="sort-renewalDate">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th>Assigned To</th>
                            <th class="sortable" onclick="sortLeads('created')" data-sort="created">
                                Created 
                                <span class="sort-arrow" id="sort-created">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="leadsTableBody">
                        ${generateSimpleLeadRows(leads)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
        
        // Set the HTML
        dashboardContent.innerHTML = html;
        
        // Scan for clickable phone numbers and emails with aggressive retry
        const scanLeadsContent = () => {
            if (window.scanForClickableContent) {
                console.log('Scanning Leads Management view for clickable content...');
                window.scanForClickableContent(dashboardContent);
                
                // Check if any clickable elements were created
                setTimeout(() => {
                    const clickables = dashboardContent.querySelectorAll('.clickable-phone, .clickable-email');
                    console.log(`Found ${clickables.length} clickable elements in Leads view`);
                    
                    // If none found, try again with contact-info divs
                    if (clickables.length === 0) {
                        console.log('No clickable elements found, scanning contact-info divs...');
                        const contactDivs = dashboardContent.querySelectorAll('.contact-info');
                        contactDivs.forEach((div, index) => {
                            console.log(`Processing contact-info ${index}`);
                            window.scanForClickableContent(div);
                        });
                    }
                }, 200);
            }
        };
        
        // Try multiple times with increasing delays
        setTimeout(scanLeadsContent, 100);
        setTimeout(scanLeadsContent, 300);
        setTimeout(scanLeadsContent, 600);
        setTimeout(scanLeadsContent, 1000);
        
    } catch (error) {
        console.error('Error in loadLeadsView:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        dashboardContent.innerHTML = `<div class="error-message">Error loading leads view: ${error.message}</div>`;
    }
}

// Moved to before generateSimpleLeadRows function

// Moved to before loadLeadsView function

// Lead Action Functions
function showNewLead() {
    // Create modal HTML with improved spacing and company field
    const modalHTML = `
        <div class="modal-overlay active" id="newLeadModal">
            <div class="modal-container" style="max-width: 800px; width: 90%;">
                <div class="modal-header" style="padding: 24px 30px; border-bottom: 1px solid #e5e7eb;">
                    <h2 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">Create New Lead</h2>
                    <button class="close-btn" onclick="closeNewLeadModal()" style="font-size: 28px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <form id="newLeadForm" onsubmit="saveNewLead(event)">
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Full Name <span style="color: #ef4444;">*</span></label>
                                <input type="text" class="form-control" id="leadName" required placeholder="Enter full name" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Company Name</label>
                                <input type="text" class="form-control" id="leadCompany" placeholder="Enter company name" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Phone Number <span style="color: #ef4444;">*</span></label>
                                <input type="tel" class="form-control" id="leadPhone" required placeholder="(555) 123-4567" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Email Address <span style="color: #ef4444;">*</span></label>
                                <input type="email" class="form-control" id="leadEmail" required placeholder="email@example.com" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Lead Source</label>
                                <select class="form-control" id="leadSource" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="Website">Website</option>
                                    <option value="Phone Call">Phone Call</option>
                                    <option value="Email">Email</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Social Media">Social Media</option>
                                    <option value="Walk-in">Walk-in</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Insurance Type</label>
                                <select class="form-control" id="leadInsuranceType" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="Auto">Auto</option>
                                    <option value="Commercial Auto">Commercial Auto</option>
                                    <option value="Home">Home</option>
                                    <option value="Life">Life</option>
                                    <option value="Health">Health</option>
                                    <option value="Business">Business</option>
                                    <option value="Bundle">Bundle</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Assigned To <span style="color: #ef4444;">*</span></label>
                                <select class="form-control" id="leadAssignedTo" required style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="">Select Agent</option>
                                    <option value="John Smith">John Smith</option>
                                    <option value="Sarah Johnson">Sarah Johnson</option>
                                    <option value="Michael Davis">Michael Davis</option>
                                    <option value="Emily Wilson">Emily Wilson</option>
                                    <option value="Robert Brown">Robert Brown</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Estimated Premium</label>
                                <input type="number" class="form-control" id="leadPremium" placeholder="$0.00" step="0.01" min="0" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Lead Stage</label>
                                <select class="form-control" id="leadStage" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="quoted">Quoted</option>
                                    <option value="negotiating">Negotiating</option>
                                </select>
                            </div>
                            
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Address</label>
                                <input type="text" class="form-control" id="leadAddress" placeholder="123 Main St, City, State ZIP" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Notes</label>
                                <textarea class="form-control" id="leadNotes" rows="4" placeholder="Add any additional notes about this lead..." style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; resize: vertical;"></textarea>
                            </div>
                        </div>
                        
                        <div class="modal-footer" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
                            <button type="button" class="btn-secondary" onclick="closeNewLeadModal()" style="padding: 12px 24px; font-size: 15px;">Cancel</button>
                            <button type="submit" class="btn-primary" style="padding: 12px 24px; font-size: 15px;">
                                <i class="fas fa-save" style="margin-right: 8px;"></i> Create Lead
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus on first field
    setTimeout(() => {
        document.getElementById('leadName')?.focus();
    }, 100);
}

function closeNewLeadModal() {
    const modal = document.getElementById('newLeadModal');
    if (modal) modal.remove();
}

function saveNewLead(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('leadName').value.trim();
    const company = document.getElementById('leadCompany').value.trim();
    const phone = document.getElementById('leadPhone').value.trim();
    const email = document.getElementById('leadEmail').value.trim();
    const source = document.getElementById('leadSource').value;
    const insuranceType = document.getElementById('leadInsuranceType').value;
    const assignedTo = document.getElementById('leadAssignedTo').value;
    const premium = parseFloat(document.getElementById('leadPremium').value) || 0;
    const stage = document.getElementById('leadStage').value;
    const address = document.getElementById('leadAddress').value.trim();
    const notes = document.getElementById('leadNotes').value.trim();
    
    // Validate required fields
    if (!name || !phone || !email || !assignedTo) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Get existing leads
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    // Create new lead object
    const newLead = {
        id: Date.now(),
        name,
        company,
        phone,
        email,
        source,
        insuranceType,
        assignedTo,
        premium,
        stage,
        address,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quotes: [],
        activities: [{
            type: 'created',
            date: new Date().toISOString(),
            note: 'Lead created'
        }]
    };
    
    // Add to leads array
    leads.push(newLead);
    
    // Save to localStorage
    localStorage.setItem('leads', JSON.stringify(leads));
    
    // Close modal
    closeNewLeadModal();
    
    // Show success notification
    showNotification(`Lead "${name}" created successfully!`, 'success');
    
    // Reload leads view to show new lead
    loadLeadsView();
}

function viewLead(leadId) {
    // Use the enhanced lead profile for commercial auto leads
    if (window.showLeadProfile) {
        window.showLeadProfile(leadId);
        return;
    }
    
    // Fallback to old view if enhanced profile not available
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    const dashboardContent = document.querySelector('.dashboard-content');
    dashboardContent.innerHTML = `
        <div class="lead-profile" data-lead-id="${lead.id}">
            <header class="content-header">
                <div>
                    <button class="btn-text" onclick="loadLeadsView()">
                        <i class="fas fa-arrow-left"></i> Back to Leads
                    </button>
                    <h1>Lead Profile: ${lead.name}</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="editLead(${lead.id})">
                        <i class="fas fa-edit"></i> Edit Lead
                    </button>
                    <button class="btn-danger" onclick="deleteLead(${lead.id})">
                        <i class="fas fa-trash"></i> Delete Lead
                    </button>
                    <button class="btn-primary" onclick="convertLead(${lead.id})">
                        <i class="fas fa-user-check"></i> Convert to Client
                    </button>
                </div>
            </header>
            
            <div class="profile-grid">
                <!-- Lead Information -->
                <div class="profile-section">
                    <h2><i class="fas fa-user"></i> Lead Information</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Name</label>
                            <p>${lead.name}</p>
                        </div>
                        <div class="info-item">
                            <label>Phone</label>
                            <p>${lead.phone}</p>
                        </div>
                        <div class="info-item">
                            <label>Email</label>
                            <p>${lead.email}</p>
                        </div>
                        <div class="info-item">
                            <label>Product Interest</label>
                            <p>${lead.product}</p>
                        </div>
                        <div class="info-item">
                            <label>Stage</label>
                            <p>${getStageHtml(lead.stage)}</p>
                        </div>
                        <div class="info-item">
                            <label>Assigned To</label>
                            <p>${lead.assignedTo || 'Unassigned'}</p>
                        </div>
                        <div class="info-item">
                            <label>Created Date</label>
                            <p>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <label>Renewal Date</label>
                            <p>${lead.renewalDate || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <label>Premium Amount</label>
                            <p class="premium-amount">$${(lead.premium || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Insurance Quotes Section -->
                <div class="profile-section quotes-section">
                    <div class="section-header">
                        <h2><i class="fas fa-file-invoice-dollar"></i> Insurance Quotes</h2>
                        <button class="btn-primary" onclick="addQuote(${lead.id})">
                            <i class="fas fa-plus"></i> Add Quote
                        </button>
                    </div>
                    
                    <div class="quotes-list" id="quotesList">
                        ${generateQuotesList(lead.quotes || [])}
                    </div>
                </div>
                
                <!-- Activity Timeline -->
                <div class="profile-section">
                    <h2><i class="fas fa-history"></i> Activity Timeline</h2>
                    <div class="timeline">
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Lead Created</h4>
                                <p>Lead was created on ${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</p>
                                <span class="timeline-date">${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</span>
                            </div>
                        </div>
                        ${lead.stage === 'quoted' ? `
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Quote Provided</h4>
                                <p>Insurance quote was provided to the lead</p>
                                <span class="timeline-date">1 day ago</span>
                            </div>
                        </div>
                        ` : ''}
                        ${lead.stage === 'contacted' ? `
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Initial Contact</h4>
                                <p>Lead was contacted by ${lead.assignedTo}</p>
                                <span class="timeline-date">2 days ago</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Notes Section -->
                <div class="profile-section">
                    <div class="section-header">
                        <h2><i class="fas fa-sticky-note"></i> Notes</h2>
                        <button class="btn-secondary" onclick="addNote(${lead.id})">
                            <i class="fas fa-plus"></i> Add Note
                        </button>
                    </div>
                    <div class="notes-list">
                        <div class="note-item">
                            <div class="note-header">
                                <strong>${lead.assignedTo}</strong>
                                <span class="note-date">Today at 10:30 AM</span>
                            </div>
                            <p>Initial contact made. Client interested in ${lead.product}. Scheduled follow-up for next week.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}


function editLead(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay active" id="editLeadModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>Edit Lead - ${lead.name}</h2>
                    <button class="close-btn" onclick="closeEditLeadModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editLeadForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Name *</label>
                                <input type="text" class="form-control" id="editLeadName" value="${lead.name}" required>
                            </div>
                            <div class="form-group">
                                <label>Stage *</label>
                                <select class="form-control" id="editLeadStage" required>
                                    <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                                    <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                                    <option value="quote-sent-unaware" ${lead.stage === 'quote-sent-unaware' ? 'selected' : ''}>Quote Sent (Unaware)</option>
                                    <option value="quote-sent-aware" ${lead.stage === 'quote-sent-aware' ? 'selected' : ''}>Quote Sent (Aware)</option>
                                    <option value="interested" ${lead.stage === 'interested' ? 'selected' : ''}>Interested</option>
                                    <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                                    <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone *</label>
                                <input type="tel" class="form-control" id="editLeadPhone" value="${lead.phone}" required>
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" class="form-control" id="editLeadEmail" value="${lead.email}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Product Interest</label>
                                <select class="form-control" id="editLeadProduct">
                                    <option value="Auto" ${lead.product === 'Auto' ? 'selected' : ''}>Auto</option>
                                    <option value="Home" ${lead.product === 'Home' ? 'selected' : ''}>Home</option>
                                    <option value="Life" ${lead.product === 'Life' ? 'selected' : ''}>Life Insurance</option>
                                    <option value="Commercial Auto" ${lead.product === 'Commercial Auto' ? 'selected' : ''}>Commercial Auto</option>
                                    <option value="Commercial Property" ${lead.product === 'Commercial Property' ? 'selected' : ''}>Commercial Property</option>
                                    <option value="Commercial Fleet" ${lead.product === 'Commercial Fleet' ? 'selected' : ''}>Commercial Fleet</option>
                                    <option value="Home + Auto" ${lead.product === 'Home + Auto' ? 'selected' : ''}>Home + Auto Bundle</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Premium Amount</label>
                                <input type="number" class="form-control" id="editLeadPremium" value="${lead.premium || ''}" placeholder="0.00">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Renewal Date</label>
                                <input type="date" class="form-control" id="editLeadRenewalDate" value="${lead.renewalDate ? lead.renewalDate.split('/').reverse().join('-') : ''}">
                            </div>
                            <div class="form-group">
                                <label>Assigned To</label>
                                <select class="form-control" id="editLeadAssignedTo">
                                    <option value="John Smith" ${lead.assignedTo === 'John Smith' ? 'selected' : ''}>John Smith</option>
                                    <option value="Sarah Johnson" ${lead.assignedTo === 'Sarah Johnson' ? 'selected' : ''}>Sarah Johnson</option>
                                    <option value="Mike Wilson" ${lead.assignedTo === 'Mike Wilson' ? 'selected' : ''}>Mike Wilson</option>
                                    <option value="Lisa Anderson" ${lead.assignedTo === 'Lisa Anderson' ? 'selected' : ''}>Lisa Anderson</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea class="form-control" id="editLeadNotes" rows="3" placeholder="Additional notes about this lead...">${lead.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeEditLeadModal()">Cancel</button>
                    <button class="btn-primary" onclick="saveLeadEdits(${leadId})">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function saveLeadEdits(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id === leadId);
    
    if (leadIndex === -1) return;
    
    // Update lead with new values
    leads[leadIndex] = {
        ...leads[leadIndex],
        name: document.getElementById('editLeadName').value,
        stage: document.getElementById('editLeadStage').value,
        phone: document.getElementById('editLeadPhone').value,
        email: document.getElementById('editLeadEmail').value,
        product: document.getElementById('editLeadProduct').value,
        premium: parseFloat(document.getElementById('editLeadPremium').value) || 0,
        renewalDate: document.getElementById('editLeadRenewalDate').value ? 
            document.getElementById('editLeadRenewalDate').value.split('-').reverse().join('/') : '',
        assignedTo: document.getElementById('editLeadAssignedTo').value,
        notes: document.getElementById('editLeadNotes').value
    };
    
    localStorage.setItem('leads', JSON.stringify(leads));
    closeEditLeadModal();
    viewLead(leadId); // Refresh the view
    showNotification('Lead updated successfully!', 'success');
}

function closeEditLeadModal() {
    const modal = document.getElementById('editLeadModal');
    if (modal) modal.remove();
}

function convertLead(leadId) {
    // Get the lead data
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    // Convert leadId to string for comparison since IDs might be stored as strings
    const lead = leads.find(l => String(l.id) === String(leadId));
    
    if (!lead) {
        showNotification('Lead not found', 'error');
        console.error('Lead not found with ID:', leadId, 'Available IDs:', leads.map(l => l.id));
        return;
    }
    
    // Create conversion modal
    const modalHTML = `
        <div class="modal-overlay active" id="convertLeadModal">
            <div class="modal-container" style="max-width: 700px; width: 90%;">
                <div class="modal-header" style="padding: 24px 30px; border-bottom: 1px solid #e5e7eb;">
                    <h2 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">Convert Lead to Client</h2>
                    <button class="close-btn" onclick="closeConvertModal()" style="font-size: 28px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0; color: #0369a1; font-size: 14px;">
                            <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                            Converting <strong>${lead.name}</strong> from lead to client. Please review and confirm the information below.
                        </p>
                    </div>
                    
                    <form id="convertLeadForm" onsubmit="confirmConvertLead(event, ${leadId})">
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Client Name</label>
                                <input type="text" class="form-control" id="clientName" value="${lead.name}" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Company</label>
                                <input type="text" class="form-control" id="clientCompany" value="${lead.company || ''}" 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Phone</label>
                                <input type="tel" class="form-control" id="clientPhone" value="${lead.phone}" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Email</label>
                                <input type="email" class="form-control" id="clientEmail" value="${lead.email}" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Client Type</label>
                                <select class="form-control" id="clientType" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="Personal">Personal</option>
                                    <option value="Commercial" ${lead.insuranceType === 'Business' || lead.insuranceType === 'Commercial Auto' ? 'selected' : ''}>Commercial</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Account Manager</label>
                                <select class="form-control" id="clientManager" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="${lead.assignedTo || ''}">${lead.assignedTo || 'Select Manager'}</option>
                                    <option value="John Smith">John Smith</option>
                                    <option value="Sarah Johnson">Sarah Johnson</option>
                                    <option value="Michael Davis">Michael Davis</option>
                                    <option value="Emily Wilson">Emily Wilson</option>
                                    <option value="Robert Brown">Robert Brown</option>
                                </select>
                            </div>
                            
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Address</label>
                                <input type="text" class="form-control" id="clientAddress" value="${lead.address || ''}" 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Conversion Notes</label>
                                <textarea class="form-control" id="conversionNotes" rows="3" 
                                    placeholder="Add any notes about this conversion..."
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; resize: vertical;"></textarea>
                            </div>
                        </div>
                        
                        ${lead.quotes && lead.quotes.length > 0 ? `
                        <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px;">
                            <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">
                                <i class="fas fa-file-invoice-dollar" style="margin-right: 8px;"></i>
                                This lead has ${lead.quotes.length} quote(s) that will be transferred to the client profile.
                            </p>
                        </div>
                        ` : ''}
                        
                        <div class="modal-footer" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                            <label style="display: flex; align-items: center; font-size: 14px; color: #374151;">
                                <input type="checkbox" id="deleteLead" checked style="margin-right: 8px;">
                                Delete lead after conversion
                            </label>
                            <div style="display: flex; gap: 12px;">
                                <button type="button" class="btn-secondary" onclick="closeConvertModal()" 
                                    style="padding: 12px 24px; font-size: 15px;">Cancel</button>
                                <button type="submit" class="btn-primary" 
                                    style="padding: 12px 24px; font-size: 15px; background: #10b981;">
                                    <i class="fas fa-user-check" style="margin-right: 8px;"></i> Convert to Client
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeConvertModal() {
    const modal = document.getElementById('convertLeadModal');
    if (modal) modal.remove();
}

function confirmConvertLead(event, leadId) {
    event.preventDefault();
    
    // Get form values
    const clientName = document.getElementById('clientName').value.trim();
    const clientCompany = document.getElementById('clientCompany').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const clientEmail = document.getElementById('clientEmail').value.trim();
    const clientType = document.getElementById('clientType').value;
    const clientManager = document.getElementById('clientManager').value;
    const clientAddress = document.getElementById('clientAddress').value.trim();
    const conversionNotes = document.getElementById('conversionNotes').value.trim();
    const shouldDeleteLead = document.getElementById('deleteLead').checked;
    
    // Get leads and find the specific lead
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id === leadId);
    
    if (leadIndex === -1) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    const lead = leads[leadIndex];
    
    // Get existing clients
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    
    // Create new client object
    const newClient = {
        id: Date.now(),
        name: clientName,
        company: clientCompany,
        type: clientType,
        phone: clientPhone,
        email: clientEmail,
        address: clientAddress,
        accountManager: clientManager,
        policies: [],
        claims: [],
        quotes: lead.quotes || [],
        totalPremium: lead.premium || 0,
        createdAt: new Date().toISOString(),
        convertedFrom: 'lead',
        leadId: leadId,
        conversionNotes: conversionNotes,
        notes: lead.notes || '',
        activities: [
            ...(lead.activities || []),
            {
                type: 'converted',
                date: new Date().toISOString(),
                note: `Converted from lead to client by ${clientManager || 'Admin'}`
            }
        ]
    };
    
    // Add to clients array
    clients.push(newClient);
    
    // Save clients
    localStorage.setItem('insurance_clients', JSON.stringify(clients));
    
    // Delete lead if requested
    if (shouldDeleteLead) {
        leads.splice(leadIndex, 1);
        localStorage.setItem('leads', JSON.stringify(leads));
    } else {
        // Mark lead as converted
        leads[leadIndex].converted = true;
        leads[leadIndex].convertedDate = new Date().toISOString();
        leads[leadIndex].clientId = newClient.id;
        leads[leadIndex].stage = 'converted';  // Set stage to converted
        leads[leadIndex].status = 'converted';  // Also set status for backward compatibility
        localStorage.setItem('leads', JSON.stringify(leads));
    }
    
    // Close modal
    closeConvertModal();
    
    // Show success notification
    showNotification(`Lead "${clientName}" has been successfully converted to a client!`, 'success');
    
    // Reload the current view
    if (document.querySelector('.leads-view')) {
        loadLeadsView();
    } else if (document.querySelector('.lead-profile')) {
        loadClientsView();
    }
}

// Lead Quote Management Functions
function generateQuotesList(quotes) {
    if (!quotes || quotes.length === 0) {
        return `
            <div class="empty-quotes">
                <i class="fas fa-file-invoice-dollar"></i>
                <p>No quotes added yet</p>
                <p class="text-muted">Click "Add Quote" to upload insurance quotes from different companies</p>
            </div>
        `;
    }
    
    return quotes.map((quote, index) => `
        <div class="quote-item" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9fafb;">
            <div class="quote-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div>
                    <h4 style="margin: 0; color: #111827; font-size: 18px;">
                        <i class="fas fa-building" style="color: #6b7280; margin-right: 8px;"></i>
                        ${quote.company}
                    </h4>
                    <p class="quote-date" style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                        <i class="fas fa-calendar"></i> Quoted on ${new Date(quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div class="quote-amount" style="text-align: right;">
                    <span class="label" style="color: #6b7280; font-size: 12px; display: block;">Premium</span>
                    <span class="amount" style="color: #059669; font-size: 24px; font-weight: bold;">$${quote.premium.toLocaleString()}</span>
                </div>
            </div>
            
            ${quote.notes ? `
                <div class="quote-notes" style="margin: 10px 0; padding: 10px; background: white; border-radius: 6px;">
                    <strong style="color: #374151; font-size: 13px;">Notes:</strong>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${quote.notes}</p>
                </div>
            ` : ''}
            
            ${quote.fileName ? `
                <div class="quote-file" style="margin: 10px 0;">
                    <i class="fas fa-file-pdf" style="color: #dc2626; margin-right: 5px;"></i>
                    <span style="color: #0066cc; text-decoration: underline; cursor: pointer; font-size: 14px;">
                        ${quote.fileName}
                    </span>
                </div>
            ` : ''}
            
            <div class="quote-actions" style="display: flex; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                <button class="btn-secondary btn-small" onclick="viewQuoteDetails(${index})" style="padding: 5px 10px; font-size: 13px;">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="btn-secondary btn-small" onclick="downloadQuote(${index})" style="padding: 5px 10px; font-size: 13px;">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn-secondary btn-small" onclick="deleteQuote(${index})" style="padding: 5px 10px; font-size: 13px; color: #dc2626;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function addQuote(leadId) {
    // Add styles for input group if not already present
    if (!document.getElementById('quote-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'quote-modal-styles';
        style.textContent = `
            .input-group {
                display: flex;
                align-items: stretch;
            }
            .input-group-text {
                padding: 10px 12px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-right: none;
                border-radius: 6px 0 0 6px;
                color: #6b7280;
                font-weight: 500;
            }
            .input-group .form-control {
                border-radius: 0 6px 6px 0;
                flex: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    const modalHTML = `
        <div class="modal-overlay active" id="quoteModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>Add Insurance Quote</h2>
                    <button class="close-btn" onclick="closeQuoteModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="quoteForm">
                        <div class="form-group">
                            <label>Insurance Company *</label>
                            <select class="form-control" id="quoteCompany" required>
                                <option value="">Select Insurance Company</option>
                                <option value="Progressive">Progressive</option>
                                <option value="State Farm">State Farm</option>
                                <option value="GEICO">GEICO</option>
                                <option value="Allstate">Allstate</option>
                                <option value="Liberty Mutual">Liberty Mutual</option>
                                <option value="Farmers">Farmers</option>
                                <option value="Nationwide">Nationwide</option>
                                <option value="USAA">USAA</option>
                                <option value="Travelers">Travelers</option>
                                <option value="American Family">American Family</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Quote Date *</label>
                                <input type="date" class="form-control" id="quoteDate" required value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Premium Amount *</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" class="form-control" id="quotePremium" required placeholder="0.00" step="0.01" min="0">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Upload Quote Document (PDF)</label>
                            <input type="file" class="form-control" id="quoteFile" accept=".pdf">
                            <small class="form-text">Upload the quote PDF from the insurance company</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea class="form-control" id="quoteNotes" rows="4" placeholder="Additional notes about this quote..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeQuoteModal()">Cancel</button>
                    <button class="btn-primary" onclick="saveQuote(${leadId})">Save Quote</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function saveQuote(leadId) {
    // Validate required fields
    const company = document.getElementById('quoteCompany').value;
    const date = document.getElementById('quoteDate').value;
    const premium = document.getElementById('quotePremium').value;
    
    if (!company || !date || !premium) {
        alert('Please fill in all required fields (Company, Date, and Premium Amount)');
        return;
    }
    
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
        alert('Lead not found');
        return;
    }
    
    // Handle file upload and convert to data URL for preview
    const fileInput = document.getElementById('quoteFile');
    let fileName = null;
    let fileData = null;
    
    // Create a promise to handle file reading
    const filePromise = new Promise((resolve) => {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            fileName = file.name;
            
            // Convert file to data URL for storage and preview
            const reader = new FileReader();
            reader.onload = function(e) {
                fileData = e.target.result;
                resolve();
            };
            reader.onerror = function() {
                console.error('Error reading file');
                resolve();
            };
            reader.readAsDataURL(file);
        } else {
            resolve();
        }
    });
    
    // Wait for file to be read before saving
    filePromise.then(() => {
    
        const quote = {
            id: Date.now(), // Add unique ID for each quote
            company: company,
            date: date,
            premium: parseFloat(premium),
            notes: document.getElementById('quoteNotes').value,
            fileName: fileName,
            fileData: fileData, // Store the file data URL
            createdAt: new Date().toISOString()
        };
        
        // Initialize quotes array if it doesn't exist
        if (!lead.quotes) {
            lead.quotes = [];
        }
        
        // Add the new quote
        lead.quotes.push(quote);
        
        // Update lead's premium with the latest quote premium
        lead.premium = quote.premium;
        
        // Save updated leads to localStorage
        localStorage.setItem('leads', JSON.stringify(leads));
        
        console.log('Quote saved:', quote);
        console.log('Updated lead:', lead);
        
        // Close modal and refresh view
        closeQuoteModal();
        viewLead(leadId); // Refresh the lead view to show new quote
        
        // Show success notification
        showNotification('Quote added successfully!', 'success');
    });
}

function closeQuoteModal() {
    const modal = document.getElementById('quoteModal');
    if (modal) modal.remove();
}

function deleteQuote(quoteIndex) {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    
    // Get the current lead ID from the view
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes) {
        lead.quotes.splice(quoteIndex, 1);
        localStorage.setItem('leads', JSON.stringify(leads));
        viewLead(leadId); // Refresh the view
        showNotification('Quote deleted successfully', 'success');
    }
}

function viewQuoteDetails(quoteIndex) {
    // Get the current lead and quote
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead || !lead.quotes || !lead.quotes[quoteIndex]) return;
    
    const quote = lead.quotes[quoteIndex];
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay active" id="quoteDetailsModal">
            <div class="modal-container" style="max-width: 1200px; width: 90%; height: 80vh;">
                <div class="modal-header">
                    <h2>Quote Details - ${quote.company}</h2>
                    <button class="close-btn" onclick="closeQuoteDetailsModal()">&times;</button>
                </div>
                <div class="modal-body" style="display: flex; gap: 20px; height: calc(100% - 60px); padding: 20px;">
                    ${quote.fileName ? `
                        <!-- PDF Preview Section -->
                        <div class="pdf-section" style="flex: 1.5; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                            <h3 style="margin-top: 0; margin-bottom: 15px; color: #374151; font-size: 16px;">
                                <i class="fas fa-file-pdf" style="color: #dc2626;"></i> Quote Document
                            </h3>
                            <div class="pdf-viewer" style="height: calc(100% - 40px); background: white; border: 1px solid #d1d5db; border-radius: 6px; position: relative; overflow: hidden;">
                                <!-- PDF.js Canvas Container -->
                                <div id="pdf-container-${quoteIndex}" style="width: 100%; height: 100%; overflow: auto;">
                                    <canvas id="pdf-canvas-${quoteIndex}" style="display: block; margin: 0 auto;"></canvas>
                                </div>
                                <!-- PDF Controls -->
                                <div id="pdf-controls-${quoteIndex}" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.7); border-radius: 6px; padding: 5px 10px; display: none; gap: 10px; align-items: center;">
                                    <button onclick="previousPage(${quoteIndex})" class="btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                    <span id="page-info-${quoteIndex}" style="color: white; font-size: 12px;">1 / 1</span>
                                    <button onclick="nextPage(${quoteIndex})" class="btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                                <!-- Loading indicator -->
                                <div id="pdf-loading-${quoteIndex}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                                    <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 15px; color: #6b7280;"></i>
                                    <p style="color: #6b7280;">Loading PDF...</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Quote Information Section -->
                    <div class="info-section" style="flex: 1; ${!quote.fileName ? 'max-width: 600px; margin: 0 auto;' : ''}">
                        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: white; height: 100%;">
                            <h3 style="margin-top: 0; margin-bottom: 20px; color: #111827; font-size: 18px;">
                                <i class="fas fa-info-circle" style="color: #0066cc;"></i> Quote Information
                            </h3>
                            
                            <div class="quote-detail-grid" style="display: grid; gap: 20px;">
                                <div class="detail-row">
                                    <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Insurance Company</label>
                                    <div style="font-size: 20px; color: #111827; font-weight: 600; margin-top: 5px;">
                                        <i class="fas fa-building" style="color: #6b7280; margin-right: 8px;"></i>
                                        ${quote.company}
                                    </div>
                                </div>
                                
                                <div class="detail-row">
                                    <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Quote Date</label>
                                    <div style="font-size: 18px; color: #374151; margin-top: 5px;">
                                        <i class="fas fa-calendar" style="color: #6b7280; margin-right: 8px;"></i>
                                        ${new Date(quote.date).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                </div>
                                
                                <div class="detail-row">
                                    <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Premium Amount</label>
                                    <div style="font-size: 32px; color: #059669; font-weight: bold; margin-top: 5px;">
                                        $${quote.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                
                                ${quote.notes ? `
                                    <div class="detail-row">
                                        <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Notes</label>
                                        <div style="font-size: 15px; color: #374151; margin-top: 8px; padding: 12px; background: #f9fafb; border-radius: 6px; line-height: 1.6;">
                                            ${quote.notes}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="detail-row">
                                    <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PDF Attachment</label>
                                    <div style="font-size: 15px; color: ${quote.fileName ? '#059669' : '#6b7280'}; margin-top: 5px;">
                                        <i class="fas ${quote.fileName ? 'fa-check-circle' : 'fa-times-circle'}" style="margin-right: 8px;"></i>
                                        ${quote.fileName || 'No PDF attached'}
                                    </div>
                                </div>
                                
                                ${quote.createdAt ? `
                                    <div class="detail-row">
                                        <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Added to System</label>
                                        <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                                            <i class="fas fa-clock" style="margin-right: 8px;"></i>
                                            ${new Date(quote.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 10px;">
                                <button class="btn-primary" onclick="editQuote(${quoteIndex})" style="flex: 1;">
                                    <i class="fas fa-edit"></i> Edit Quote
                                </button>
                                <button class="btn-secondary" onclick="printQuoteDetails(${quoteIndex})" style="flex: 1;">
                                    <i class="fas fa-print"></i> Print
                                </button>
                                <button class="btn-secondary" style="background: #fee2e2; color: #dc2626; border-color: #fecaca;" onclick="deleteQuoteFromModal(${quoteIndex})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles if not present
    if (!document.getElementById('quote-details-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'quote-details-modal-styles';
        style.textContent = `
            #quoteDetailsModal .modal-container {
                display: flex;
                flex-direction: column;
            }
            #quoteDetailsModal .modal-body {
                overflow-y: auto;
            }
            @media (max-width: 768px) {
                #quoteDetailsModal .modal-body {
                    flex-direction: column !important;
                }
                #quoteDetailsModal .pdf-section {
                    min-height: 400px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Load the PDF if it exists using PDF.js
    if (quote.fileData || quote.fileName) {
        setTimeout(() => {
            loadPDFWithPDFJS(quoteIndex, quote);
        }, 100);
    }
}

// PDF.js implementation
async function loadPDFWithPDFJS(quoteIndex, quote) {
    if (!quote.fileData) {
        console.log('No PDF data available');
        return;
    }
    
    try {
        // Configure PDF.js worker
        console.log('Starting PDF load for quote index:', quoteIndex);
        console.log('PDF.js available:', typeof pdfjsLib !== 'undefined');
        
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js library not loaded');
            throw new Error('PDF.js library not available');
        }
        
        // Set worker path if not already set
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
        }
        
        // Convert base64 to array buffer
        let pdfData = quote.fileData;
        if (pdfData.startsWith('data:')) {
            pdfData = pdfData.split(',')[1];
        }
        
        const pdfBytes = atob(pdfData);
        const buffer = new ArrayBuffer(pdfBytes.length);
        const array = new Uint8Array(buffer);
        for (let i = 0; i < pdfBytes.length; i++) {
            array[i] = pdfBytes.charCodeAt(i);
        }
        
        // Load the PDF document
        console.log('Loading PDF document with array buffer, size:', array.length);
        const loadingTask = pdfjsLib.getDocument({ data: array });
        const pdf = await loadingTask.promise;
        
        console.log('PDF loaded, pages:', pdf.numPages);
        
        // Store PDF document reference for navigation
        window[`pdfDoc_${quoteIndex}`] = pdf;
        window[`currentPage_${quoteIndex}`] = 1;
        
        // Render the first page
        await renderPage(quoteIndex, 1, pdf);
        
        // Show controls if multi-page
        if (pdf.numPages > 1) {
            const controls = document.getElementById(`pdf-controls-${quoteIndex}`);
            if (controls) {
                controls.style.display = 'flex';
                document.getElementById(`page-info-${quoteIndex}`).textContent = `1 / ${pdf.numPages}`;
            }
        }
        
        // Hide loading indicator
        const loading = document.getElementById(`pdf-loading-${quoteIndex}`);
        if (loading) loading.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading PDF with PDF.js:', error);
        const container = document.getElementById(`pdf-container-${quoteIndex}`);
        if (container) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 20px;"></i>
                    <h3 style="color: #374151; margin-bottom: 10px;">Error Loading PDF</h3>
                    <p style="color: #6b7280; margin-bottom: 20px;">
                        ${error.message}<br>
                        You can still download the file to view locally.
                    </p>
                    <button class="btn-primary" onclick="downloadQuoteWithData(${quoteIndex})" style="padding: 10px 20px;">
                        <i class="fas fa-download"></i> Download PDF
                    </button>
                </div>
            `;
        }
        const loading = document.getElementById(`pdf-loading-${quoteIndex}`);
        if (loading) loading.style.display = 'none';
    }
}

async function renderPage(quoteIndex, pageNum, pdf) {
    try {
        const page = await pdf.getPage(pageNum);
        const canvas = document.getElementById(`pdf-canvas-${quoteIndex}`);
        const container = document.getElementById(`pdf-container-${quoteIndex}`);
        
        if (!canvas || !container) return;
        
        const ctx = canvas.getContext('2d');
        
        // Calculate scale to fit container
        const containerWidth = container.clientWidth - 20; // Padding
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        const renderContext = {
            canvasContext: ctx,
            viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
        console.log(`Page ${pageNum} rendered for quote ${quoteIndex}`);
        
    } catch (error) {
        console.error('Error rendering PDF page:', error);
    }
}

function previousPage(quoteIndex) {
    const pdf = window[`pdfDoc_${quoteIndex}`];
    let currentPage = window[`currentPage_${quoteIndex}`] || 1;
    
    if (pdf && currentPage > 1) {
        currentPage--;
        window[`currentPage_${quoteIndex}`] = currentPage;
        renderPage(quoteIndex, currentPage, pdf);
        document.getElementById(`page-info-${quoteIndex}`).textContent = `${currentPage} / ${pdf.numPages}`;
    }
}

function nextPage(quoteIndex) {
    const pdf = window[`pdfDoc_${quoteIndex}`];
    let currentPage = window[`currentPage_${quoteIndex}`] || 1;
    
    if (pdf && currentPage < pdf.numPages) {
        currentPage++;
        window[`currentPage_${quoteIndex}`] = currentPage;
        renderPage(quoteIndex, currentPage, pdf);
        document.getElementById(`page-info-${quoteIndex}`).textContent = `${currentPage} / ${pdf.numPages}`;
    }
}

function downloadQuote(quoteIndex) {
    // In a real implementation, this would download the PDF
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        const quote = lead.quotes[quoteIndex];
        if (quote.fileName) {
            alert(`Downloading: ${quote.fileName}`);
        } else {
            alert('No PDF file attached to this quote');
        }
    }
}

function closeQuoteDetailsModal() {
    const modal = document.getElementById('quoteDetailsModal');
    if (modal) modal.remove();
}

function downloadQuotePDF(fileName) {
    // In a real implementation, this would download the actual PDF file
    alert(`Downloading: ${fileName}`);
}

function downloadQuoteWithData(quoteIndex) {
    // Get the current lead and quote
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        const quote = lead.quotes[quoteIndex];
        
        if (quote.fileData) {
            // Create a link element and trigger download
            const link = document.createElement('a');
            link.href = quote.fileData;
            link.download = quote.fileName || `quote-${quote.company}-${quote.date}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('No PDF file available for download');
        }
    }
}

function editQuote(quoteIndex) {
    // Close the details modal first
    closeQuoteDetailsModal();
    
    // Get the current lead and quote
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        const quote = lead.quotes[quoteIndex];
        
        // Open the edit modal with pre-filled values
        // For now, we'll just open the add quote modal
        // In a real implementation, you'd pre-fill the form
        alert('Edit functionality would open here with pre-filled quote data');
    }
}

function printQuoteDetails(quoteIndex) {
    // Get the current lead and quote
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        const quote = lead.quotes[quoteIndex];
        
        // Create a printable version
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Quote Details - ${quote.company}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #111827; }
                        .detail { margin: 15px 0; }
                        .label { font-weight: bold; color: #6b7280; }
                        .value { font-size: 18px; color: #111827; }
                        .premium { font-size: 24px; color: #059669; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Insurance Quote - ${quote.company}</h1>
                    <div class="detail">
                        <div class="label">Company:</div>
                        <div class="value">${quote.company}</div>
                    </div>
                    <div class="detail">
                        <div class="label">Date:</div>
                        <div class="value">${new Date(quote.date).toLocaleDateString()}</div>
                    </div>
                    <div class="detail">
                        <div class="label">Premium:</div>
                        <div class="value premium">$${quote.premium.toFixed(2)}</div>
                    </div>
                    ${quote.notes ? `
                        <div class="detail">
                            <div class="label">Notes:</div>
                            <div class="value">${quote.notes}</div>
                        </div>
                    ` : ''}
                    <div class="detail">
                        <div class="label">PDF Attachment:</div>
                        <div class="value">${quote.fileName || 'No PDF attached'}</div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

function deleteQuoteFromModal(quoteIndex) {
    if (confirm('Are you sure you want to delete this quote?')) {
        closeQuoteDetailsModal();
        deleteQuote(quoteIndex);
    }
}

function deleteLead(leadId) {
    if (confirm('Are you sure you want to delete this lead?')) {
        console.log('Deleting lead:', leadId);
        let leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const initialCount = leads.length;
        
        // Convert leadId to string for comparison since IDs might be stored as strings
        leads = leads.filter(l => String(l.id) !== String(leadId));
        
        const finalCount = leads.length;
        console.log(`Deleted ${initialCount - finalCount} lead(s)`);
        
        if (initialCount === finalCount) {
            console.error('Lead not found with ID:', leadId);
            console.log('Available lead IDs:', leads.map(l => l.id));
        }
        
        localStorage.setItem('leads', JSON.stringify(leads));
        loadLeadsView();
        showNotification('Lead deleted successfully', 'success');
    }
}

// Lead Sorting
let currentSort = { field: null, direction: 'asc' };

function sortLeads(field) {
    let leads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    // Toggle direction if same field, otherwise default to ascending
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    // Sort the leads
    leads.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle different field types
        if (field === 'premium') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        } else if (field === 'renewalDate' || field === 'created') {
            aVal = new Date(aVal || '2099-12-31');
            bVal = new Date(bVal || '2099-12-31');
        } else if (field === 'stage') {
            // Custom stage ordering
            const stageOrder = { 
                'new': 1, 
                'quoted': 2, 
                'quote-sent-unaware': 3, 
                'quote-sent-aware': 4, 
                'interested': 5, 
                'not-interested': 6, 
                'closed': 7,
                'contacted': 8,
                'reviewed': 9,
                'converted': 10
            };
            aVal = stageOrder[aVal] || 999;
            bVal = stageOrder[bVal] || 999;
        }
        
        // Compare values
        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Update the table body
    const tableBody = document.getElementById('leadsTableBody');
    if (tableBody) {
        tableBody.innerHTML = generateSimpleLeadRows(leads);
    }
    
    // Update sort arrows
    updateSortArrows(field, currentSort.direction);
}

function updateSortArrows(field, direction) {
    // Reset all arrows to neutral
    document.querySelectorAll('.sort-arrow i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    // Update the active column arrow
    const arrow = document.getElementById(`sort-${field}`);
    if (arrow) {
        const icon = arrow.querySelector('i');
        if (icon) {
            icon.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
    }
}

function generateClientRows() {
    // Get clients from localStorage
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    console.log('generateClientRows - Found clients:', clients.length, clients);
    
    // If no clients, show a message
    if (clients.length === 0) {
        return `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 16px; margin: 0;">No clients found</p>
                    <p style="font-size: 14px; margin-top: 8px;">Convert leads or add new clients to get started</p>
                </td>
            </tr>
        `;
    }
    
    // Generate rows for each client
    return clients.map(client => {
        // Get initials for avatar
        const nameParts = (client.name || 'Unknown').split(' ').filter(n => n);
        const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';
        
        // Determine badge color based on type
        const typeColor = client.type === 'Commercial' ? 'purple' : 'blue';
        
        // Count policies (if available)
        const policyCount = client.policies ? client.policies.length : 0;
        
        // Format premium
        const premium = client.totalPremium ? `$${client.totalPremium.toLocaleString()}/yr` : 'N/A';
        
        // Status - default to Active for converted leads
        const status = client.status || 'Active';
        
        return `
            <tr>
                <td class="client-name">
                    <div class="client-avatar">${initials}</div>
                    <span>${client.name}</span>
                </td>
                <td><span class="badge badge-${typeColor}">${client.type || 'Personal'}</span></td>
                <td>${client.phone}</td>
                <td>${client.email}</td>
                <td>${policyCount}</td>
                <td>${premium}</td>
                <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewClient('${client.id}')" title="View Client"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="editClient('${client.id}')" title="Edit Client"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="emailClient('${client.id}')" title="Email Client"><i class="fas fa-envelope"></i></button>
                        <button class="btn-icon" onclick="deleteClient('${client.id}')" title="Delete Client" style="color: #dc2626;"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function loadClientsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="clients-view">
            <header class="content-header">
                <h1>Clients Management</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="importClients()">
                        <i class="fas fa-upload"></i> Import
                    </button>
                    <button class="btn-primary" onclick="showNewClient()">
                        <i class="fas fa-plus"></i> New Client
                    </button>
                </div>
            </header>
            
            <div class="filters-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search clients by name, phone, email..." id="clientSearch" onkeyup="filterClients()">
                </div>
                <div class="filter-group">
                    <select class="filter-select">
                        <option>All Types</option>
                        <option>Personal Lines</option>
                        <option>Commercial Lines</option>
                        <option>Commercial Auto</option>
                        <option>Life & Health</option>
                    </select>
                    <select class="filter-select">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Prospect</option>
                        <option>Inactive</option>
                    </select>
                    <button class="btn-filter">
                        <i class="fas fa-filter"></i> More Filters
                    </button>
                </div>
            </div>
            
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Client Name <i class="fas fa-sort"></i></th>
                            <th>Type</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Policies</th>
                            <th>Premium</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="clientsTableBody">
                        <!-- Client rows will be dynamically loaded here -->
                    </tbody>
                </table>
            </div>
            
            <div class="table-footer">
                <div class="showing-info">
                    Showing 1-10 of 2,847 clients
                </div>
                <div class="pagination">
                    <button class="page-btn" disabled><i class="fas fa-chevron-left"></i></button>
                    <button class="page-btn active">1</button>
                    <button class="page-btn">2</button>
                    <button class="page-btn">3</button>
                    <span>...</span>
                    <button class="page-btn">285</button>
                    <button class="page-btn"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    `;
    
    // Populate the table with actual client data
    const tbody = document.getElementById('clientsTableBody');
    if (tbody) {
        tbody.innerHTML = generateClientRows();
    }
    
    // Update count in footer
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const footerInfo = dashboardContent.querySelector('.showing-info');
    if (footerInfo && clients.length > 0) {
        footerInfo.textContent = `Showing 1-${Math.min(10, clients.length)} of ${clients.length} clients`;
    } else if (footerInfo) {
        footerInfo.textContent = 'No clients to display';
    }
    
    // Scan for clickable phone numbers and emails with aggressive retry
    const scanContent = () => {
        if (window.scanForClickableContent) {
            console.log('Scanning Clients Management view for clickable content...');
            window.scanForClickableContent(dashboardContent);
            
            // Check if any clickable elements were created
            setTimeout(() => {
                const clickables = dashboardContent.querySelectorAll('.clickable-phone, .clickable-email');
                console.log(`Found ${clickables.length} clickable elements in Clients view`);
                
                // If none found, try again with individual cells
                if (clickables.length === 0) {
                    console.log('No clickable elements found, scanning individual cells...');
                    const cells = dashboardContent.querySelectorAll('td');
                    cells.forEach((td, index) => {
                        const text = td.textContent.trim();
                        if (text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || text.includes('@')) {
                            console.log(`Processing cell ${index}: ${text}`);
                            window.scanForClickableContent(td);
                        }
                    });
                }
            }, 200);
        }
    };
    
    // Try multiple times with increasing delays
    setTimeout(scanContent, 100);
    setTimeout(scanContent, 300);
    setTimeout(scanContent, 600);
    setTimeout(scanContent, 1000);
}

function loadPoliciesView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    // Calculate actual statistics
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const totalPolicies = policies.length;
    
    // Count active policies
    const activePolicies = policies.filter(p => {
        const status = (p.policyStatus || p.status || '').toLowerCase();
        return status === 'active' || status === 'in-force' || status === 'current';
    }).length;
    
    // Count pending renewal (policies expiring within 60 days)
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);
    
    const pendingRenewal = policies.filter(p => {
        if (!p.expirationDate) return false;
        const expDate = new Date(p.expirationDate);
        return expDate >= today && expDate <= sixtyDaysFromNow;
    }).length;
    
    // Calculate total premium
    let totalPremium = 0;
    policies.forEach(policy => {
        const premiumValue = policy.financial?.['Annual Premium'] || 
                           policy.financial?.['Premium'] || 
                           policy.premium || 
                           policy.annualPremium || 0;
        
        if (premiumValue) {
            let numValue = 0;
            if (typeof premiumValue === 'number') {
                numValue = premiumValue;
            } else if (typeof premiumValue === 'string') {
                const cleanValue = premiumValue.replace(/[$,\s]/g, '');
                numValue = parseFloat(cleanValue) || 0;
            }
            totalPremium += numValue;
        }
    });
    
    // Format total premium
    let formattedPremium = '$0';
    if (totalPremium >= 1000000) {
        formattedPremium = '$' + (totalPremium / 1000000).toFixed(1) + 'M';
    } else if (totalPremium >= 1000) {
        formattedPremium = '$' + (totalPremium / 1000).toFixed(0) + 'K';
    } else {
        formattedPremium = '$' + totalPremium.toFixed(0);
    }
    
    dashboardContent.innerHTML = `
        <div class="policies-view">
            <header class="content-header">
                <h1>Policy Management</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="exportPolicies()">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn-primary" onclick="showNewPolicy()">
                        <i class="fas fa-plus"></i> New Policy
                    </button>
                </div>
            </header>
            
            <div class="policy-stats">
                <div class="mini-stat">
                    <span class="mini-stat-value">${totalPolicies}</span>
                    <span class="mini-stat-label">Total Policies</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${activePolicies}</span>
                    <span class="mini-stat-label">Active</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${pendingRenewal}</span>
                    <span class="mini-stat-label">Pending Renewal</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${formattedPremium}</span>
                    <span class="mini-stat-label">Total Premium</span>
                </div>
            </div>
            
            <div class="filters-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search by policy number, client name...">
                </div>
                <div class="filter-group">
                    <select class="filter-select">
                        <option>All Lines</option>
                        <option>Auto</option>
                        <option>Homeowners</option>
                        <option>Commercial Auto</option>
                        <option>Commercial Property</option>
                        <option>General Liability</option>
                        <option>Life</option>
                    </select>
                    <select class="filter-select">
                        <option>All Carriers</option>
                        <option>Progressive</option>
                        <option>State Farm</option>
                        <option>Allstate</option>
                        <option>Liberty Mutual</option>
                    </select>
                    <select class="filter-select">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Pending</option>
                        <option>Cancelled</option>
                        <option>Expired</option>
                    </select>
                </div>
            </div>
            
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Policy #</th>
                            <th>Client</th>
                            <th>Type</th>
                            <th>Carrier</th>
                            <th>Effective Date</th>
                            <th>Expiration</th>
                            <th>Premium</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="policyTableBody">
                        ${generatePolicyRows()}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Global variable to store current renewal view
let currentRenewalView = 'month';
let selectedRenewalPolicyId = null;

function loadRenewalsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    // Get real policy data from localStorage
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    // Process policies for renewals
    const renewalPolicies = getRealRenewalPolicies(allPolicies, clients);
    
    // Calculate renewal statistics
    const stats = calculateRenewalStats(renewalPolicies);
    
    dashboardContent.innerHTML = `
        <div class="renewals-view">
            <header class="content-header">
                <h1>Policy Renewals</h1>
                <div class="header-actions">
                    <div class="view-toggle">
                        <button class="view-btn ${currentRenewalView === 'month' ? 'active' : ''}" onclick="switchRenewalView('month')">
                            <i class="fas fa-calendar-day"></i> Month View
                        </button>
                        <button class="view-btn ${currentRenewalView === 'year' ? 'active' : ''}" onclick="switchRenewalView('year')">
                            <i class="fas fa-calendar"></i> Year View
                        </button>
                    </div>
                    <button class="btn-primary" onclick="exportRenewals()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </header>
            
            <div class="renewal-stats">
                <div class="stat-card">
                    <h4>Due This Month</h4>
                    <span class="stat-value">${stats.dueThisMonth.count}</span>
                    <span class="stat-label">${stats.dueThisMonth.premium} Premium</span>
                </div>
                <div class="stat-card">
                    <h4>Due Next Month</h4>
                    <span class="stat-value">${stats.dueNextMonth.count}</span>
                    <span class="stat-label">${stats.dueNextMonth.premium} Premium</span>
                </div>
                <div class="stat-card urgent">
                    <h4>Overdue</h4>
                    <span class="stat-value">${stats.overdue.count}</span>
                    <span class="stat-label">${stats.overdue.premium === '$0' ? 'No overdue policies' : stats.overdue.premium + ' Total'}</span>
                </div>
                <div class="stat-card">
                    <h4>Renewal Rate</h4>
                    <span class="stat-value">${stats.renewalRate}</span>
                    <span class="stat-label">Last 12 Months</span>
                </div>
            </div>
            
            <div class="renewal-content">
                <div id="renewalListContainer" class="renewal-list-container">
                    ${currentRenewalView === 'month' ? renderMonthView(renewalPolicies) : renderYearView(renewalPolicies)}
                </div>
                
                <div id="renewalProfile" class="renewal-profile" style="display: none;">
                    <!-- Renewal profile will be inserted here when a policy is selected -->
                </div>
            </div>
        </div>
    `;
    
    // Add necessary styles
    addRenewalStyles();
}

function getRealRenewalPolicies(policies, clients) {
    const renewalPolicies = [];
    const today = new Date();
    const oneYearFromNow = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    policies.forEach(policy => {
        if (!policy.expirationDate && !policy.endDate) return;
        
        const expirationDate = new Date(policy.expirationDate || policy.endDate);
        if (isNaN(expirationDate.getTime())) return;
        
        // Get client info
        const client = clients.find(c => c.id === policy.clientId) || {};
        const clientName = client.name || policy.clientName || 'Unknown Client';
        
        // Get premium value
        let premiumValue = 0;
        const premium = policy.financial?.['Annual Premium'] || 
                       policy.financial?.['Premium'] || 
                       policy.premium || 
                       policy.annualPremium || 0;
        
        if (premium) {
            if (typeof premium === 'number') {
                premiumValue = premium;
            } else if (typeof premium === 'string') {
                const cleanValue = premium.replace(/[$,\s]/g, '');
                premiumValue = parseFloat(cleanValue) || 0;
            }
        }
        
        renewalPolicies.push({
            id: policy.id || `POL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            client: clientName,
            carrier: policy.carrier || policy.insuranceCarrier || 'Unknown Carrier',
            type: policy.policyType || policy.type || 'Commercial Auto',
            policyNumber: policy.policyNumber || policy.number || 'N/A',
            premium: premiumValue,
            expirationDate: expirationDate,
            effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate) : 
                          new Date(expirationDate.getFullYear() - 1, expirationDate.getMonth(), expirationDate.getDate()),
            status: getStatusFromDate(expirationDate),
            agent: policy.agent || 'Unassigned',
            phone: client.phone || policy.clientPhone || '',
            email: client.email || policy.clientEmail || ''
        });
    });
    
    // Sort by expiration date
    renewalPolicies.sort((a, b) => a.expirationDate - b.expirationDate);
    return renewalPolicies;
}

function calculateRenewalStats(policies) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    let dueThisMonth = { count: 0, total: 0 };
    let dueNextMonth = { count: 0, total: 0 };
    let overdue = { count: 0, total: 0 };
    let renewed = 0;
    let expired = 0;
    
    policies.forEach(policy => {
        const expDate = policy.expirationDate;
        
        if (expDate < today) {
            overdue.count++;
            overdue.total += policy.premium;
        } else if (expDate >= startOfMonth && expDate <= endOfMonth) {
            dueThisMonth.count++;
            dueThisMonth.total += policy.premium;
        } else if (expDate >= startOfNextMonth && expDate <= endOfNextMonth) {
            dueNextMonth.count++;
            dueNextMonth.total += policy.premium;
        }
        
        // Count renewals in last 12 months
        if (expDate >= oneYearAgo && expDate <= today) {
            if (policy.status === 'renewed') {
                renewed++;
            } else {
                expired++;
            }
        }
    });
    
    // Calculate renewal rate
    const totalPastDue = renewed + expired;
    const renewalRate = totalPastDue > 0 ? Math.round((renewed / totalPastDue) * 100) : 0;
    
    // Format premium amounts
    const formatPremium = (amount) => {
        if (amount >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return '$' + Math.round(amount / 1000) + 'K';
        } else {
            return '$' + Math.round(amount);
        }
    };
    
    return {
        dueThisMonth: {
            count: dueThisMonth.count,
            premium: formatPremium(dueThisMonth.total)
        },
        dueNextMonth: {
            count: dueNextMonth.count,
            premium: formatPremium(dueNextMonth.total)
        },
        overdue: {
            count: overdue.count,
            premium: formatPremium(overdue.total)
        },
        renewalRate: renewalRate + '%'
    };
}

function getStatusFromDate(date) {
    const today = new Date();
    const daysUntil = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 30) return 'urgent';
    if (daysUntil <= 60) return 'upcoming';
    if (daysUntil <= 90) return 'pending';
    return 'future';
}

function renderMonthView(policies) {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const monthPolicies = policies.filter(p => p.expirationDate <= thirtyDaysFromNow);
    
    return `
        <div class="month-view">
            <h3>Renewals Due Within 30 Days</h3>
            <div class="renewal-list">
                ${monthPolicies.map(policy => `
                    <div class="renewal-card ${policy.status} ${selectedRenewalPolicyId === policy.id ? 'selected' : ''}" 
                         onclick="showRenewalProfile('${policy.id}')"
                         id="renewal-card-${policy.id}">
                        <div class="renewal-header">
                            <div class="renewal-info">
                                <h4>${policy.client}</h4>
                                <p>${policy.type} - ${policy.carrier}</p>
                                <p class="policy-number">Policy #${policy.policyNumber}</p>
                            </div>
                            <div class="renewal-date">
                                <span class="date-label">Expires</span>
                                <span class="date-value">${formatDate(policy.expirationDate)}</span>
                                <span class="days-remaining">${getDaysRemaining(policy.expirationDate)}</span>
                            </div>
                        </div>
                        <div class="renewal-footer">
                            <span class="premium">$${policy.premium.toLocaleString()}/yr</span>
                            <span class="status-badge ${policy.status}">${policy.status.replace('-', ' ')}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderYearView(policies) {
    const months = {};
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Group policies by month
    policies.forEach(policy => {
        const monthKey = `${policy.expirationDate.getFullYear()}-${policy.expirationDate.getMonth()}`;
        if (!months[monthKey]) {
            months[monthKey] = {
                name: `${monthNames[policy.expirationDate.getMonth()]} ${policy.expirationDate.getFullYear()}`,
                policies: [],
                totalPremium: 0
            };
        }
        months[monthKey].policies.push(policy);
        months[monthKey].totalPremium += policy.premium;
    });
    
    return `
        <div class="year-view">
            <h3>Annual Renewal Calendar</h3>
            <div class="month-grid">
                ${Object.keys(months).slice(0, 12).map(key => `
                    <div class="month-card">
                        <h4>${months[key].name}</h4>
                        <div class="month-stats">
                            <span class="policy-count">${months[key].policies.length} Policies</span>
                            <span class="month-premium">$${months[key].totalPremium.toLocaleString()}</span>
                        </div>
                        <div class="month-policies">
                            ${months[key].policies.slice(0, 3).map(p => `
                                <div class="mini-policy ${selectedRenewalPolicyId === p.id ? 'selected' : ''}" 
                                     onclick="showRenewalProfile('${p.id}')"
                                     id="renewal-card-${p.id}">
                                    <span>${p.client}</span>
                                    <span class="mini-date">${p.expirationDate.getDate()}</span>
                                </div>
                            `).join('')}
                            ${months[key].policies.length > 3 ? `
                                <div class="more-policies">+${months[key].policies.length - 3} more</div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function showRenewalProfile(policyId) {
    const renewalProfile = document.getElementById('renewalProfile');
    const listContainer = document.getElementById('renewalListContainer');
    
    if (!renewalProfile) {
        console.error('Renewal profile element not found');
        return;
    }
    
    // Set the selected policy ID
    selectedRenewalPolicyId = policyId;
    
    // Remove selected class from all cards
    document.querySelectorAll('.renewal-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to the clicked card
    const selectedCard = document.getElementById(`renewal-card-${policyId}`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Get real policy data from localStorage
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const renewalPolicies = getRealRenewalPolicies(allPolicies, clients);
    
    // Find the selected policy
    let policy = renewalPolicies.find(p => p.id === policyId);
    
    // If not found in processed renewals, create a basic policy object
    if (!policy) {
        const rawPolicy = allPolicies.find(p => p.id === policyId);
        if (rawPolicy) {
            const client = clients.find(c => c.id === rawPolicy.clientId) || {};
            policy = {
                id: policyId,
                client: client.name || rawPolicy.clientName || 'Unknown Client',
                carrier: rawPolicy.carrier || rawPolicy.insuranceCarrier || 'Unknown Carrier',
                type: rawPolicy.policyType || rawPolicy.type || 'Commercial Auto',
                policyNumber: rawPolicy.policyNumber || rawPolicy.number || 'N/A',
                premium: rawPolicy.premium || 0,
                expirationDate: new Date(rawPolicy.expirationDate || rawPolicy.endDate),
                effectiveDate: new Date(rawPolicy.effectiveDate || rawPolicy.startDate),
                agent: rawPolicy.agent || 'Unassigned',
                phone: client.phone || '',
                email: client.email || ''
            };
        } else {
            console.error('Policy not found:', policyId);
            return;
        }
    }
    
    // Show profile and adjust layout
    listContainer.style.width = '40%';
    renewalProfile.style.display = 'block';
    renewalProfile.innerHTML = `
        <div class="profile-header">
            <h2>Renewal Profile</h2>
            <button class="close-btn" onclick="closeRenewalProfile()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="profile-layout">
            <div class="policy-info-panel">
                <h3>Policy Information</h3>
                <div class="info-group">
                    <label>Client:</label>
                    <span>${policy.client}</span>
                </div>
                <div class="info-group">
                    <label>Policy #:</label>
                    <span>${policy.policyNumber}</span>
                </div>
                <div class="info-group">
                    <label>Type:</label>
                    <span>${policy.type}</span>
                </div>
                <div class="info-group">
                    <label>Carrier:</label>
                    <span>${policy.carrier}</span>
                </div>
                <div class="info-group">
                    <label>Premium:</label>
                    <span>$${policy.premium.toLocaleString()}/yr</span>
                </div>
                <div class="info-group">
                    <label>Effective:</label>
                    <span>${formatDate(policy.effectiveDate)}</span>
                </div>
                <div class="info-group">
                    <label>Expiration:</label>
                    <span>${formatDate(policy.expirationDate)}</span>
                </div>
                <div class="info-group">
                    <label>Agent:</label>
                    <span>${policy.agent}</span>
                </div>
                <div class="info-group">
                    <label>Contact:</label>
                    <span>${policy.phone}</span>
                    <span>${policy.email}</span>
                </div>
            </div>
            
            <div class="profile-main-content">
                <div class="profile-tabs">
                    <button class="profile-tab active" onclick="switchProfileTab('tasks')">
                        <i class="fas fa-tasks"></i> Tasks
                    </button>
                    <button class="profile-tab" onclick="switchProfileTab('submissions')">
                        <i class="fas fa-file-alt"></i> Submissions
                    </button>
                </div>
                <div id="profileTabContent" class="tab-content">
                    ${renderTasksTab()}
                </div>
            </div>
        </div>
    `;
}

function renderTasksTab() {
    console.log('Rendering tasks tab');
    
    // Get saved tasks or use defaults
    const savedTasks = JSON.parse(localStorage.getItem('renewalTasks') || 'null');
    const defaultTasks = [
        { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
        { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
        { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
        { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
        { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
        { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
        { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
        { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
        { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
        { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
    ];
    
    const tasks = savedTasks || defaultTasks;
    
    const htmlContent = `
        <div class="tasks-tab">
            <div class="tasks-header">
                <h3>Renewal Tasks Checklist</h3>
                <div class="tasks-actions">
                    <button class="btn-small" onclick="clearAllTasks()">
                        <i class="fas fa-redo"></i> Reset Tasks
                    </button>
                    <button class="btn-small" onclick="addRenewalTask()">
                        <i class="fas fa-plus"></i> Add Task
                    </button>
                </div>
            </div>
            <div class="tasks-list">
                ${tasks.map((task, index) => `
                    <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id || index}">
                        <div class="task-checkbox">
                            <input type="checkbox" 
                                   id="task-${task.id || index}" 
                                   ${task.completed ? 'checked' : ''} 
                                   onchange="toggleTask(${task.id || index})">
                            <label for="task-${task.id || index}">
                                <span class="checkbox-custom"></span>
                                ${task.task}
                            </label>
                        </div>
                        <div class="task-status">
                            ${task.completed && task.completedAt ? 
                                `<span class="completion-time"><i class="fas fa-check"></i> ${task.completedAt}</span>` : 
                                '<span class="status-pending">Pending</span>'}
                        </div>
                        <div class="task-notes">
                            <textarea class="notes-input" 
                                      placeholder="Add notes..." 
                                      onblur="saveTaskNote(${task.id || index}, this.value)">${task.notes || ''}</textarea>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    console.log('Tasks HTML length:', htmlContent.length);
    return htmlContent;
}

function renderSubmissionsTab() {
    // Get saved submissions from localStorage
    const savedSubmissions = JSON.parse(localStorage.getItem('renewalSubmissions') || '[]');
    
    return `
        <div class="submissions-tab">
            <div id="submissionsList">
                <div class="submissions-header">
                    <h3>Quote Submissions</h3>
                    <button class="btn-primary" onclick="showAddSubmissionForm()">
                        <i class="fas fa-plus"></i> Add New Quote
                    </button>
                </div>
                
                ${savedSubmissions.length > 0 ? `
                    <div class="submissions-list">
                        ${savedSubmissions.map((submission, index) => `
                            <div class="submission-item">
                                <div class="submission-info">
                                    <h4>${submission.carrier} - ${submission.type}</h4>
                                    <div class="submission-details-row">
                                        <span><strong>Quote #:</strong> ${submission.quoteNumber}</span>
                                        <span><strong>Premium:</strong> $${submission.premium}/yr</span>
                                        <span><strong>Deductible:</strong> $${submission.deductible}</span>
                                        <span><strong>Coverage:</strong> ${submission.coverage}</span>
                                    </div>
                                    <div class="submission-meta">
                                        <span><i class="fas fa-calendar"></i> Submitted: ${new Date().toLocaleDateString()}</span>
                                        <span class="quote-status received">Quote Received</span>
                                    </div>
                                </div>
                                <div class="submission-actions">
                                    <button class="btn-icon" title="View Quote"><i class="fas fa-eye"></i></button>
                                    <button class="btn-icon" title="Download"><i class="fas fa-download"></i></button>
                                    <button class="btn-icon" onclick="removeSubmission(${index})" title="Delete"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-submissions">
                        <i class="fas fa-file-invoice" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                        <p style="color: #666;">No quote submissions yet</p>
                        <p style="color: #999; font-size: 14px;">Click "Add New Quote" to create your first submission</p>
                    </div>
                `}
                
                <div class="comparison-section">
                    <h4>Quote Comparison</h4>
                    ${savedSubmissions.length > 0 ? `
                        <table class="comparison-table">
                            <thead>
                                <tr>
                                    <th>Carrier</th>
                                    <th>Policy Type</th>
                                    <th>Premium</th>
                                    <th>Deductible</th>
                                    <th>Coverage</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${savedSubmissions.map((submission, index) => `
                                    <tr>
                                        <td><strong>${submission.carrier}</strong></td>
                                        <td>${submission.type}</td>
                                        <td class="premium-cell">$${submission.premium}</td>
                                        <td>$${submission.deductible}</td>
                                        <td>${submission.coverage}</td>
                                        <td><button class="btn-small ${index === 0 ? 'btn-success' : ''}" onclick="selectQuote(${index})">Select</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <p style="text-align: center; color: #666; padding: 20px;">Add multiple quotes to compare them side by side</p>
                    `}
                </div>
            </div>
            
            <div id="submissionForm" class="submission-form" style="display: none;">
                <div class="form-card">
                    <div class="form-header">
                        <button class="back-btn" onclick="hideAddSubmissionForm()" title="Back to Submissions">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h4>Add New Quote Submission</h4>
                    </div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Insurance Company</label>
                            <select class="form-control" id="submissionCarrier">
                                <option value="">Select Carrier</option>
                                <option value="Progressive">Progressive</option>
                                <option value="State Farm">State Farm</option>
                                <option value="Hartford">Hartford</option>
                                <option value="Travelers">Travelers</option>
                                <option value="Liberty Mutual">Liberty Mutual</option>
                                <option value="Nationwide">Nationwide</option>
                                <option value="Allstate">Allstate</option>
                                <option value="GEICO">GEICO</option>
                                <option value="Farmers">Farmers</option>
                                <option value="USAA">USAA</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Policy Type</label>
                            <select class="form-control" id="submissionType">
                                <option value="">Select Type</option>
                                <option value="Commercial Auto">Commercial Auto</option>
                                <option value="General Liability">General Liability</option>
                                <option value="Workers Comp">Workers Compensation</option>
                                <option value="Property">Commercial Property</option>
                                <option value="Umbrella">Commercial Umbrella</option>
                                <option value="Professional">Professional Liability</option>
                                <option value="Cyber">Cyber Liability</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Annual Premium <span style="color: red;">*</span></label>
                            <input type="text" class="form-control" id="submissionPremium" placeholder="$0.00" required>
                        </div>
                        <div class="form-group">
                            <label>Deductible</label>
                            <input type="text" class="form-control" id="submissionDeductible" placeholder="$0.00">
                        </div>
                        <div class="form-group">
                            <label>Coverage Limit</label>
                            <input type="text" class="form-control" id="submissionLimit" placeholder="e.g., $1M/$2M">
                        </div>
                        <div class="form-group">
                            <label>Quote Number</label>
                            <input type="text" class="form-control" id="submissionQuoteNum" placeholder="Quote #">
                        </div>
                    </div>
                    
                    <div class="upload-section">
                        <label>Upload Quote Document</label>
                        <div class="upload-area" onclick="document.getElementById('quoteFile').click()">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>Click to upload or drag and drop</p>
                            <span>PDF, DOC, DOCX (Max 10MB)</span>
                            <input type="file" id="quoteFile" style="display: none;" accept=".pdf,.doc,.docx" onchange="handleQuoteUpload(this)">
                        </div>
                        <div id="uploadedFile" class="uploaded-file" style="display: none;">
                            <i class="fas fa-file-pdf"></i>
                            <span id="fileName"></span>
                            <button onclick="removeUploadedFile()" class="remove-file">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn-secondary" onclick="hideAddSubmissionForm()">Cancel</button>
                        <button class="btn-primary" onclick="saveSubmission()">Save Quote</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function switchRenewalView(view) {
    currentRenewalView = view;
    loadRenewalsView();
}

function switchProfileTab(tab) {
    const tabContent = document.getElementById('profileTabContent');
    if (!tabContent) return;
    
    // Update active tab
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(tab)) {
            btn.classList.add('active');
        }
    });
    
    // Update content
    if (tab === 'tasks') {
        tabContent.innerHTML = renderTasksTab();
    } else if (tab === 'submissions') {
        tabContent.innerHTML = renderSubmissionsTab();
    }
}

function closeRenewalProfile() {
    const renewalProfile = document.getElementById('renewalProfile');
    const listContainer = document.getElementById('renewalListContainer');
    
    if (renewalProfile) {
        renewalProfile.style.display = 'none';
        listContainer.style.width = '100%';
        
        // Clear selection
        selectedRenewalPolicyId = null;
        document.querySelectorAll('.renewal-card.selected, .mini-policy.selected').forEach(card => {
            card.classList.remove('selected');
        });
    }
}

function getDaysRemaining(date) {
    const today = new Date();
    const days = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
}

function toggleTask(taskId) {
    const tasks = JSON.parse(localStorage.getItem('renewalTasks') || '[]');
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
        // If no saved tasks yet, get defaults and update
        const defaultTasks = [
            { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
            { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
            { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
            { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
            { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
            { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
            { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
            { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
            { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
            { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
        ];
        
        const task = defaultTasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toLocaleString() : '';
            localStorage.setItem('renewalTasks', JSON.stringify(defaultTasks));
        }
    } else {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].completedAt = tasks[taskIndex].completed ? new Date().toLocaleString() : '';
        localStorage.setItem('renewalTasks', JSON.stringify(tasks));
    }
    
    // Refresh the tasks tab
    const tabContent = document.getElementById('profileTabContent');
    if (tabContent) {
        tabContent.innerHTML = renderTasksTab();
    }
}

function saveTaskNote(taskId, note) {
    let tasks = JSON.parse(localStorage.getItem('renewalTasks') || '[]');
    
    if (tasks.length === 0) {
        // Initialize with defaults if no saved tasks
        tasks = [
            { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
            { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
            { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
            { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
            { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
            { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
            { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
            { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
            { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
            { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
        ];
    }
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].notes = note;
        localStorage.setItem('renewalTasks', JSON.stringify(tasks));
    }
}

function clearAllTasks() {
    if (confirm('Are you sure you want to reset all tasks? This will clear all checkmarks and timestamps.')) {
        localStorage.removeItem('renewalTasks');
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent) {
            tabContent.innerHTML = renderTasksTab();
        }
    }
}

function addRenewalTask() {
    const taskName = prompt('Enter the new task name:');
    if (taskName && taskName.trim()) {
        let tasks = JSON.parse(localStorage.getItem('renewalTasks') || '[]');
        
        if (tasks.length === 0) {
            // Initialize with defaults if empty
            tasks = [
                { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
                { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
                { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
                { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
                { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
                { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
                { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
                { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
                { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
                { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
            ];
        }
        
        const newId = Math.max(...tasks.map(t => t.id || 0)) + 1;
        tasks.push({
            id: newId,
            task: taskName.trim(),
            completed: false,
            completedAt: '',
            notes: ''
        });
        
        localStorage.setItem('renewalTasks', JSON.stringify(tasks));
        
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent) {
            tabContent.innerHTML = renderTasksTab();
        }
    }
}

function showAddSubmissionForm() {
    const form = document.getElementById('submissionForm');
    const list = document.getElementById('submissionsList');
    if (form && list) {
        form.style.display = 'block';
        list.style.display = 'none';
    }
}

function hideAddSubmissionForm() {
    const form = document.getElementById('submissionForm');
    const list = document.getElementById('submissionsList');
    if (form && list) {
        form.style.display = 'none';
        list.style.display = 'block';
    }
    // Clear form fields safely
    const fields = ['submissionCarrier', 'submissionType', 'submissionPremium', 
                   'submissionDeductible', 'submissionLimit', 'submissionQuoteNum'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
    
    // Also clear file upload
    removeUploadedFile();
}

function handleQuoteUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileName = document.getElementById('fileName');
        const uploadedFile = document.getElementById('uploadedFile');
        
        if (fileName && uploadedFile) {
            fileName.textContent = file.name;
            uploadedFile.style.display = 'flex';
        }
    }
}

function removeUploadedFile() {
    const uploadedFile = document.getElementById('uploadedFile');
    const quoteFile = document.getElementById('quoteFile');
    
    if (uploadedFile) uploadedFile.style.display = 'none';
    if (quoteFile) quoteFile.value = '';
}

function saveSubmission() {
    // Get form values with better error handling
    const carrierEl = document.getElementById('submissionCarrier');
    const typeEl = document.getElementById('submissionType');
    const premiumEl = document.getElementById('submissionPremium');
    const deductibleEl = document.getElementById('submissionDeductible');
    const coverageEl = document.getElementById('submissionLimit');
    const quoteNumberEl = document.getElementById('submissionQuoteNum');
    
    // Debug logging
    console.log('Form elements found:', {
        carrier: carrierEl ? 'Yes' : 'No',
        type: typeEl ? 'Yes' : 'No',
        premium: premiumEl ? 'Yes' : 'No'
    });
    
    const carrier = carrierEl?.value || '';
    const type = typeEl?.value || '';
    const premiumRaw = premiumEl?.value || '';
    const premium = premiumRaw.replace(/[^0-9.]/g, '');
    
    console.log('Form values:', { carrier, type, premium, premiumRaw });
    
    if (!carrier || carrier === '' || !type || type === '' || !premium || premium === '') {
        alert(`Please fill in all required fields:\n- Insurance Company: ${carrier || 'Missing'}\n- Policy Type: ${type || 'Missing'}\n- Premium: ${premiumRaw || 'Missing'}`);
        return;
    }
    
    const deductible = deductibleEl?.value.replace(/[^0-9.]/g, '');
    const coverage = coverageEl?.value;
    const quoteNumber = quoteNumberEl?.value;
    
    // Create submission object
    const newSubmission = {
        carrier,
        type,
        premium,
        deductible: deductible || '0',
        coverage: coverage || 'N/A',
        quoteNumber: quoteNumber || `${carrier.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString()
    };
    
    // Get existing submissions
    const submissions = JSON.parse(localStorage.getItem('renewalSubmissions') || '[]');
    submissions.push(newSubmission);
    
    // Save to localStorage
    localStorage.setItem('renewalSubmissions', JSON.stringify(submissions));
    
    // Hide form and refresh view
    hideAddSubmissionForm();
    
    // Refresh the submissions tab
    const tabContent = document.getElementById('profileTabContent');
    if (tabContent) {
        tabContent.innerHTML = renderSubmissionsTab();
    }
}

function removeSubmission(index) {
    if (confirm('Are you sure you want to delete this submission?')) {
        const submissions = JSON.parse(localStorage.getItem('renewalSubmissions') || '[]');
        submissions.splice(index, 1);
        localStorage.setItem('renewalSubmissions', JSON.stringify(submissions));
        
        // Refresh the submissions tab
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent) {
            tabContent.innerHTML = renderSubmissionsTab();
        }
    }
}

function selectQuote(index) {
    const submissions = JSON.parse(localStorage.getItem('renewalSubmissions') || '[]');
    if (submissions[index]) {
        alert(`Selected ${submissions[index].carrier} quote with premium $${submissions[index].premium}/yr`);
    }
}

function exportRenewals() {
    // Implementation for exporting renewals
    alert('Export functionality would generate a report here');
}

function addRenewalStyles() {
    // Check if styles already exist
    if (document.getElementById('renewal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'renewal-styles';
    style.textContent = `
        .renewals-view {
            padding: 20px;
        }
        
        .view-toggle {
            display: flex;
            gap: 10px;
            margin-right: 15px;
        }
        
        .view-btn {
            padding: 8px 16px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .view-btn.active {
            background: #0066cc;
            color: white;
            border-color: #0066cc;
        }
        
        .renewal-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-card.urgent {
            background: #fff5f5;
            border-left: 4px solid #ff4444;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            display: block;
            margin: 10px 0;
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        
        .renewal-content {
            display: flex;
            gap: 20px;
            margin-top: 20px;
            overflow: visible;
        }
        
        .renewal-list-container {
            flex: 1;
            transition: width 0.3s;
        }
        
        .renewal-profile {
            width: 60%;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            height: 600px;
            overflow: visible;
        }
        
        .renewal-card {
            background: white;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s;
            border-left: 4px solid transparent;
        }
        
        .renewal-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .renewal-card.selected {
            background: #e8f2ff;
            border: 2px solid #0066cc;
            box-shadow: 0 4px 12px rgba(0,102,204,0.2);
        }
        
        .renewal-card.overdue {
            border-left-color: #ff4444;
        }
        
        .renewal-card.urgent {
            border-left-color: #ff9800;
        }
        
        .renewal-card.upcoming {
            border-left-color: #2196f3;
        }
        
        .renewal-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .renewal-date {
            text-align: right;
        }
        
        .date-label {
            display: block;
            font-size: 12px;
            color: #666;
        }
        
        .date-value {
            display: block;
            font-size: 18px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .days-remaining {
            font-size: 12px;
            color: #ff9800;
        }
        
        .renewal-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .premium {
            font-size: 16px;
            font-weight: 600;
            color: #0066cc;
        }
        
        .month-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 20px;
        }
        
        .month-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .month-stats {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 14px;
        }
        
        .policy-count {
            color: #666;
        }
        
        .month-premium {
            color: #0066cc;
            font-weight: 600;
        }
        
        .mini-policy {
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
            margin-bottom: 5px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            font-size: 13px;
        }
        
        .mini-policy:hover {
            background: #e8e8e8;
        }
        
        .mini-policy.selected {
            background: #0066cc;
            color: white;
        }
        
        .mini-policy.selected .mini-date {
            background: white;
            color: #0066cc;
        }
        
        .mini-date {
            background: #0066cc;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
        }
        
        .more-policies {
            text-align: center;
            padding: 5px;
            color: #666;
            font-size: 12px;
        }
        
        .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
            flex-shrink: 0;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
        }
        
        .profile-tabs {
            display: flex;
            gap: 10px;
            padding: 0 20px;
            border-bottom: 1px solid #eee;
            background: white;
        }
        
        .profile-tab {
            padding: 12px 20px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .profile-tab.active {
            border-bottom-color: #0066cc;
            color: #0066cc;
        }
        
        .profile-layout {
            display: flex;
            flex: 1;
            background: white;
            height: 100%;
            overflow: visible;
        }
        
        .policy-info-panel {
            width: 250px;
            padding: 20px;
            background: #f9f9f9;
            border-right: 1px solid #eee;
            overflow-y: auto;
            flex-shrink: 0;
        }
        
        .profile-main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: visible;
        }
        
        .info-group {
            margin-bottom: 15px;
        }
        
        .info-group label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .info-group span {
            display: block;
            font-size: 14px;
            color: #333;
        }
        
        .tab-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: white;
            display: block !important;
            visibility: visible !important;
        }
        
        .tasks-tab, .submissions-tab {
            display: block !important;
            visibility: visible !important;
        }
        
        .tasks-header, .submissions-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .tasks-actions {
            display: flex;
            gap: 10px;
        }
        
        .tasks-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .task-item {
            display: grid;
            grid-template-columns: 2fr 1fr 2fr;
            gap: 20px;
            padding: 15px;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            transition: all 0.3s;
        }
        
        .task-item:hover {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .task-item.completed {
            background: #f9f9f9;
            opacity: 0.8;
        }
        
        .task-checkbox {
            display: flex;
            align-items: center;
        }
        
        .task-checkbox input[type="checkbox"] {
            display: none;
        }
        
        .task-checkbox label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 14px;
            color: #333;
            user-select: none;
        }
        
        .checkbox-custom {
            width: 20px;
            height: 20px;
            border: 2px solid #0066cc;
            border-radius: 4px;
            margin-right: 12px;
            position: relative;
            transition: all 0.3s;
            flex-shrink: 0;
        }
        
        .task-checkbox input:checked + label .checkbox-custom {
            background: #0066cc;
        }
        
        .task-checkbox input:checked + label .checkbox-custom::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 14px;
            font-weight: bold;
        }
        
        .task-checkbox input:checked + label {
            text-decoration: line-through;
            color: #666;
        }
        
        .task-status {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .completion-time {
            font-size: 12px;
            color: #4caf50;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .status-pending {
            font-size: 12px;
            color: #999;
            padding: 4px 8px;
            background: #f5f5f5;
            border-radius: 4px;
        }
        
        .task-notes {
            display: flex;
            align-items: center;
        }
        
        .notes-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
            resize: none;
            min-height: 35px;
            max-height: 80px;
            font-family: inherit;
        }
        
        .notes-input:focus {
            outline: none;
            border-color: #0066cc;
            box-shadow: 0 0 0 2px rgba(0,102,204,0.1);
        }
        
        .submission-form {
            margin-bottom: 20px;
        }
        
        .form-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        .form-group label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .form-control {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .upload-section {
            margin: 20px 0;
        }
        
        .upload-section label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .upload-area {
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .upload-area:hover {
            border-color: #0066cc;
            background: #f0f7ff;
        }
        
        .upload-area i {
            font-size: 48px;
            color: #0066cc;
            margin-bottom: 10px;
        }
        
        .upload-area p {
            margin: 10px 0 5px;
            font-size: 14px;
            color: #333;
        }
        
        .upload-area span {
            font-size: 12px;
            color: #666;
        }
        
        .uploaded-file {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
            margin-top: 10px;
        }
        
        .uploaded-file i {
            color: #dc3545;
            font-size: 20px;
        }
        
        .remove-file {
            margin-left: auto;
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .submissions-list {
            margin-bottom: 30px;
        }
        
        .submission-item {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        
        .submission-logo {
            width: 100px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #eee;
            padding-right: 20px;
        }
        
        .submission-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .submission-info {
            flex: 1;
        }
        
        .submission-info h4 {
            margin: 0 0 10px;
            color: #333;
        }
        
        .submission-details-row {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
            font-size: 13px;
        }
        
        .submission-meta {
            display: flex;
            gap: 20px;
            align-items: center;
            font-size: 12px;
            color: #666;
        }
        
        .submission-actions {
            display: flex;
            gap: 10px;
        }
        
        .quote-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .quote-status.pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .quote-status.received {
            background: #d4edda;
            color: #155724;
        }
        
        .submission-details {
            margin-bottom: 15px;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .detail-row label {
            color: #666;
        }
        
        .submission-actions {
            display: flex;
            gap: 10px;
        }
        
        .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .comparison-table th {
            background: #f5f5f5;
            padding: 10px;
            text-align: left;
            font-size: 13px;
        }
        
        .comparison-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        
        .btn-small {
            padding: 6px 12px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        
        .btn-small:hover {
            background: #0052a3;
        }
        
        .btn-secondary {
            padding: 8px 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .btn-success {
            background: #28a745 !important;
        }
        
        .btn-success:hover {
            background: #218838 !important;
        }
        
        .premium-cell {
            font-weight: 600;
            color: #0066cc;
        }
        
        .rating {
            background: #ffc107;
            color: #000;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
            font-size: 12px;
        }
        
        .comparison-section {
            margin-top: 30px;
        }
        
        .comparison-section h4 {
            margin-bottom: 15px;
        }
        
        .empty-submissions {
            text-align: center;
            padding: 60px 20px;
            background: #f9f9f9;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .form-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .back-btn {
            background: #f5f5f5;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .back-btn:hover {
            background: #e0e0e0;
            transform: translateX(-2px);
        }
        
        .back-btn i {
            font-size: 16px;
            color: #333;
        }
    `;
    document.head.appendChild(style);
}

window.loadLeadGenerationView = function loadLeadGenerationView(activeTab = 'lookup') {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="lead-generation-view">
            <header class="content-header">
                <h1>Lead Generation Database</h1>
            </header>
            
            <!-- Folder-style tabs -->
            <div class="folder-tabs">
                <button class="folder-tab ${activeTab === 'lookup' ? 'active' : ''}" onclick="switchLeadSection('lookup')">
                    <i class="fas fa-search"></i> Carrier Lookup
                </button>
                <button class="folder-tab ${activeTab === 'generate' ? 'active' : ''}" onclick="switchLeadSection('generate')">
                    <i class="fas fa-magic"></i> Generate Leads
                </button>
            </div>
            
            <div class="lead-gen-container">
                <!-- Carrier Lookup Section -->
                <div id="carrierLookupSection" class="tab-section" style="display: ${activeTab === 'lookup' ? 'block' : 'none'};">
                    <div class="search-section">
                    <h3>Search Carriers</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>USDOT Number</label>
                                <input type="text" class="form-control" id="usdotSearch" placeholder="Enter USDOT #">
                            </div>
                            <div class="form-group">
                                <label>MC Number</label>
                                <input type="text" class="form-control" id="mcSearch" placeholder="Enter MC #">
                            </div>
                            <div class="form-group">
                                <label>Company Name</label>
                                <input type="text" class="form-control" id="companySearch" placeholder="Enter company name">
                            </div>
                            <div class="form-group">
                                <label>State</label>
                                <select class="form-control" id="stateSearch">
                                    <option value="">All States</option>
                                    <option value="CA">California</option>
                                    <option value="TX">Texas</option>
                                    <option value="FL">Florida</option>
                                    <option value="NY">New York</option>
                                    <option value="IL">Illinois</option>
                                    <option value="OH">Ohio</option>
                                </select>
                            </div>
                        </div>
                    
                    <div class="search-actions">
                        <button class="btn-primary" onclick="performLeadSearch()">
                            <i class="fas fa-search"></i> Search Database
                        </button>
                        <button class="btn-secondary" onclick="clearLeadFilters()">
                            <i class="fas fa-eraser"></i> Clear Filters
                        </button>
                    </div>
                </div>
                
                <!-- Results Section -->
                <div class="lead-results-section" id="leadResults">
                    <div class="results-header">
                        <h3>Search Results</h3>
                        <span class="results-count">0 leads found</span>
                    </div>
                    
                    <div class="lead-results-table">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" onclick="selectAllLeads(this)"></th>
                                    <th>USDOT #</th>
                                    <th>Company Name</th>
                                    <th>Location</th>
                                    <th>Fleet Size</th>
                                    <th>Insurance Status</th>
                                    <th>Expiry Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="leadResultsBody">
                                <tr>
                                    <td colspan="8" class="text-center">No results. Use the search form above to find leads.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="results-pagination">
                        <button class="btn-small" disabled><i class="fas fa-chevron-left"></i> Previous</button>
                        <span class="page-info">Page 1 of 1</span>
                        <button class="btn-small" disabled>Next <i class="fas fa-chevron-right"></i></button>
                    </div>
                    </div>
                </div>
                
                <!-- Generate Leads Section -->
                <div id="generateLeadsSection" class="tab-section" style="display: ${activeTab === 'generate' ? 'block' : 'none'};">
                    ${getGenerateLeadsContent()}
                </div>
            </div>
        </div>
    `;
    
    // Initialize lead generation specific features
    initializeLeadGeneration();
}

function loadRatingEngineView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="rating-engine-view">
            <header class="content-header">
                <h1>Multi-Carrier Rating Engine</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="loadQuoteTemplate()">
                        <i class="fas fa-file-import"></i> Load Template
                    </button>
                </div>
            </header>
            
            <div class="rating-container">
                <div class="rating-form-section">
                    <h3>Quote Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Product Line</label>
                            <select class="form-control">
                                <option>Auto Insurance</option>
                                <option>Homeowners</option>
                                <option>Commercial Auto</option>
                                <option>Commercial Property</option>
                                <option>General Liability</option>
                                <option>Life Insurance</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Effective Date</label>
                            <input type="date" class="form-control">
                        </div>
                    </div>
                    
                    <h3>Client Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Client Name</label>
                            <input type="text" class="form-control" placeholder="Enter client name">
                        </div>
                        <div class="form-group">
                            <label>Date of Birth</label>
                            <input type="date" class="form-control">
                        </div>
                    </div>
                    
                    <h3>Coverage Details</h3>
                    <div class="coverage-options">
                        <div class="coverage-item">
                            <label>
                                <input type="checkbox" checked> Bodily Injury Liability
                            </label>
                            <select class="form-control">
                                <option>$100k/$300k</option>
                                <option>$250k/$500k</option>
                                <option>$500k/$1M</option>
                            </select>
                        </div>
                        <div class="coverage-item">
                            <label>
                                <input type="checkbox" checked> Property Damage
                            </label>
                            <select class="form-control">
                                <option>$50,000</option>
                                <option>$100,000</option>
                                <option>$250,000</option>
                            </select>
                        </div>
                        <div class="coverage-item">
                            <label>
                                <input type="checkbox" checked> Comprehensive
                            </label>
                            <select class="form-control">
                                <option>$500 deductible</option>
                                <option>$1,000 deductible</option>
                            </select>
                        </div>
                        <div class="coverage-item">
                            <label>
                                <input type="checkbox" checked> Collision
                            </label>
                            <select class="form-control">
                                <option>$500 deductible</option>
                                <option>$1,000 deductible</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn-primary" onclick="runRating()">
                            <i class="fas fa-search"></i> Get Quotes from All Carriers
                        </button>
                    </div>
                </div>
                
                <div class="rating-results-section" id="ratingResults" style="display: none;">
                    <h3>Available Quotes</h3>
                    <div class="carrier-quotes">
                        <!-- Results will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadAccountingView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="accounting-view">
            <header class="content-header">
                <h1>Accounting & Commissions</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="runReconciliation()">
                        <i class="fas fa-balance-scale"></i> Reconcile
                    </button>
                    <button class="btn-primary" onclick="createInvoice()">
                        <i class="fas fa-file-invoice"></i> New Invoice
                    </button>
                </div>
            </header>
            
            <div class="accounting-stats">
                <div class="stat-card">
                    <div class="stat-content">
                        <span class="stat-value">$142,500</span>
                        <span class="stat-label">Total Commissions (YTD)</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-content">
                        <span class="stat-value">$28,750</span>
                        <span class="stat-label">Pending Payments</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-content">
                        <span class="stat-value">$8,200</span>
                        <span class="stat-label">Overdue</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-content">
                        <span class="stat-value">94%</span>
                        <span class="stat-label">Collection Rate</span>
                    </div>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active">Commissions</button>
                <button class="tab-btn">Invoices</button>
                <button class="tab-btn">Payments</button>
                <button class="tab-btn">Direct Bill</button>
                <button class="tab-btn">Claims</button>
            </div>
            
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Policy #</th>
                            <th>Client</th>
                            <th>Carrier</th>
                            <th>Premium</th>
                            <th>Commission %</th>
                            <th>Commission</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>12/28/2024</td>
                            <td>POL-2024-0523</td>
                            <td>John Doe</td>
                            <td>Progressive</td>
                            <td>$1,200</td>
                            <td>15%</td>
                            <td>$180</td>
                            <td><span class="status-badge paid">Paid</span></td>
                        </tr>
                        <tr>
                            <td>12/27/2024</td>
                            <td>POL-2024-0522</td>
                            <td>Smith Agency</td>
                            <td>Liberty Mutual</td>
                            <td>$8,500</td>
                            <td>12%</td>
                            <td>$1,020</td>
                            <td><span class="status-badge pending">Pending</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadReportsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="reports-view">
            <header class="content-header">
                <h1>Reports & Analytics</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="scheduleReport()">
                        <i class="fas fa-clock"></i> Schedule
                    </button>
                    <button class="btn-primary" onclick="createCustomReport()">
                        <i class="fas fa-plus"></i> Custom Report
                    </button>
                </div>
            </header>
            
            <div class="reports-grid">
                <div class="report-card" onclick="runReport('production')">
                    <div class="report-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3>Production Report</h3>
                    <p>New business and renewal production metrics</p>
                </div>
                
                <div class="report-card" onclick="runReport('loss-ratio')">
                    <div class="report-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <h3>Loss Ratio Analysis</h3>
                    <p>Claims vs premium analysis by line</p>
                </div>
                
                <div class="report-card" onclick="runReport('commission')">
                    <div class="report-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <h3>Commission Report</h3>
                    <p>Detailed commission breakdown by carrier</p>
                </div>
                
                <div class="report-card" onclick="runReport('renewal')">
                    <div class="report-icon">
                        <i class="fas fa-sync"></i>
                    </div>
                    <h3>Renewal Forecast</h3>
                    <p>Upcoming renewals and retention metrics</p>
                </div>
                
                <div class="report-card" onclick="runReport('marketing')">
                    <div class="report-icon">
                        <i class="fas fa-bullhorn"></i>
                    </div>
                    <h3>Marketing ROI</h3>
                    <p>Campaign performance and lead conversion</p>
                </div>
                
                <div class="report-card" onclick="runReport('carrier')">
                    <div class="report-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <h3>Carrier Performance</h3>
                    <p>Quote-to-bind ratios by carrier</p>
                </div>
            </div>
            
            <div class="recent-reports">
                <h3>Recent Reports</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Report Name</th>
                            <th>Type</th>
                            <th>Generated</th>
                            <th>Generated By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>December Production Report</td>
                            <td>Production</td>
                            <td>12/28/2024 09:15 AM</td>
                            <td>Admin</td>
                            <td>
                                <button class="btn-icon"><i class="fas fa-download"></i></button>
                                <button class="btn-icon"><i class="fas fa-eye"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadCommunicationsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    // Get saved campaigns or use defaults
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    
    dashboardContent.innerHTML = `
        <div class="communications-view">
            <header class="content-header">
                <h1>Communications Hub</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="showEmailBlast()">
                        <i class="fas fa-envelope"></i> Email Blast
                    </button>
                    <button class="btn-secondary" onclick="showSMSBlast()">
                        <i class="fas fa-sms"></i> SMS Blast
                    </button>
                    <button class="btn-primary" onclick="showAICampaignModal()">
                        <i class="fas fa-robot"></i> AI Caller Campaign
                    </button>
                    <button class="btn-primary" onclick="createNewCampaign()">
                        <i class="fas fa-paper-plane"></i> New Campaign
                    </button>
                </div>
            </header>
            
            <div class="comm-stats">
                <div class="mini-stat">
                    <span class="mini-stat-value">${localStorage.getItem('emailsSent') || '0'}</span>
                    <span class="mini-stat-label">Emails Sent (Month)</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${localStorage.getItem('emailOpenRate') || '0'}%</span>
                    <span class="mini-stat-label">Open Rate</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${localStorage.getItem('smsSent') || '0'}</span>
                    <span class="mini-stat-label">SMS Sent</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${campaigns.filter(c => c.status === 'active').length}</span>
                    <span class="mini-stat-label">Active Campaigns</span>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active" onclick="loadCommunicationTab('campaigns')">Campaigns</button>
                <button class="tab-btn" onclick="loadCommunicationTab('email')">Email Blast</button>
                <button class="tab-btn" onclick="loadCommunicationTab('sms')">SMS Blast</button>
                <button class="tab-btn" onclick="loadCommunicationTab('templates')">Templates</button>
                <button class="tab-btn" onclick="loadCommunicationTab('history')">History</button>
            </div>
            
            <div id="communicationTabContent">
                ${renderCampaignsTab()}
            </div>
        </div>
    `;
    
    // Add communication styles
    addCommunicationStyles();
}

function renderCampaignsTab() {
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    const aiCampaigns = JSON.parse(localStorage.getItem('aiCampaigns') || '[]');
    
    if (campaigns.length === 0 && aiCampaigns.length === 0) {
        // Add default campaigns if none exist
        const defaultCampaigns = [
            {
                id: 1,
                name: 'Renewal Reminders',
                status: 'active',
                sent: 234,
                opened: 156,
                clicked: 45,
                type: 'email',
                schedule: 'Monthly'
            },
            {
                id: 2,
                name: 'Welcome Series',
                status: 'paused',
                sent: 89,
                opened: 72,
                clicked: 28,
                type: 'email',
                schedule: 'On Signup'
            }
        ];
        localStorage.setItem('campaigns', JSON.stringify(defaultCampaigns));
        campaigns.push(...defaultCampaigns);
    }
    
    return `
        <div class="campaigns-container">
            ${aiCampaigns.length > 0 ? `
                <div style="margin-bottom: 30px;">
                    <h2 style="margin-bottom: 15px; color: #111827;">
                        <i class="fas fa-robot" style="margin-right: 10px; color: #0066cc;"></i>
                        AI Caller Campaigns
                    </h2>
                    <div class="campaigns-grid">
                        ${aiCampaigns.map(campaign => `
                            <div class="campaign-card ai-campaign" data-campaign-id="${campaign.id}">
                                <div class="campaign-header">
                                    <h3>${campaign.name}</h3>
                                    <span class="status-badge ${campaign.status}">${campaign.status}</span>
                                </div>
                                <div class="campaign-stats">
                                    <div class="stat">
                                        <span class="stat-label">Total Calls</span>
                                        <span class="stat-value">${campaign.stats?.totalCalls || 0}</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">Interested</span>
                                        <span class="stat-value" style="color: #10b981;">${campaign.stats?.interested || 0}</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">Leads</span>
                                        <span class="stat-value">${campaign.leadList?.length || 0}</span>
                                    </div>
                                </div>
                                <div class="campaign-footer">
                                    <button class="btn-small" onclick="viewAICampaignDetails('${campaign.id}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    ${campaign.status === 'draft' ? `
                                        <button class="btn-small btn-primary" onclick="startAICampaign('${campaign.id}')">
                                            <i class="fas fa-play"></i> Start
                                        </button>
                                    ` : campaign.status === 'active' ? `
                                        <button class="btn-small btn-secondary" onclick="pauseAICampaign('${campaign.id}')">
                                            <i class="fas fa-pause"></i> Pause
                                        </button>
                                    ` : ''}
                                    <button class="btn-small" onclick="showManualCallModal('${campaign.id}')">
                                        <i class="fas fa-phone"></i> Manual Call
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <h2 style="margin-bottom: 15px; color: #111827;">
                <i class="fas fa-bullhorn" style="margin-right: 10px; color: #0066cc;"></i>
                Marketing Campaigns
            </h2>
            <div class="campaigns-grid">
                ${campaigns.map(campaign => `
                    <div class="campaign-card" data-campaign-id="${campaign.id}">
                        <div class="campaign-header">
                            <h3>${campaign.name}</h3>
                            <span class="status-badge ${campaign.status}">${campaign.status}</span>
                        </div>
                        <div class="campaign-info">
                            <span class="campaign-type"><i class="fas fa-${campaign.type === 'sms' ? 'sms' : 'envelope'}"></i> ${campaign.type.toUpperCase()}</span>
                            <span class="campaign-schedule"><i class="fas fa-clock"></i> ${campaign.schedule}</span>
                        </div>
                        <div class="campaign-stats">
                            <div>
                                <span class="stat-label">Sent</span>
                                <span class="stat-value">${campaign.sent}</span>
                            </div>
                            <div>
                                <span class="stat-label">Opened</span>
                                <span class="stat-value">${campaign.opened} (${Math.round(campaign.opened/campaign.sent*100)}%)</span>
                            </div>
                            <div>
                                <span class="stat-label">Clicked</span>
                                <span class="stat-value">${campaign.clicked} (${Math.round(campaign.clicked/campaign.sent*100)}%)</span>
                            </div>
                        </div>
                        <div class="campaign-actions">
                            <button class="btn-small" onclick="viewCampaignDetails(${campaign.id})">
                                <i class="fas fa-eye"></i> Details
                            </button>
                            ${campaign.status === 'active' ? 
                                `<button class="btn-small btn-warning" onclick="toggleCampaign(${campaign.id})">
                                    <i class="fas fa-pause"></i> Pause
                                </button>` :
                                `<button class="btn-small btn-success" onclick="toggleCampaign(${campaign.id})">
                                    <i class="fas fa-play"></i> Start
                                </button>`
                            }
                            <button class="btn-small btn-danger" onclick="deleteCampaign(${campaign.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderEmailBlastTab() {
    return `
        <div class="blast-container">
            <div class="blast-form">
                <h3>Send Email Blast</h3>
                
                <div class="form-section">
                    <label>Upload Recipients CSV</label>
                    <div class="upload-area" onclick="document.getElementById('recipientFile').click()">
                        <i class="fas fa-file-csv"></i>
                        <p>Click to upload CSV file</p>
                        <span>Must contain email addresses</span>
                        <input type="file" id="recipientFile" style="display: none;" accept=".csv" onchange="handleRecipientUpload(this, 'email')">
                    </div>
                    <div id="recipientMapping" style="display: none;">
                        <h4>Map CSV Columns to Fields</h4>
                        <div id="mappingFields"></div>
                    </div>
                </div>
                
                <div class="form-section">
                    <label>Subject Line</label>
                    <input type="text" class="form-control" id="emailSubject" placeholder="Enter email subject">
                </div>
                
                <div class="form-section">
                    <label>Email Template</label>
                    <div class="template-variables">
                        <p>Available variables (click to insert):</p>
                        <div id="availableVars" class="variable-buttons">
                            <button class="var-btn" onclick="insertVariable('email', '[name]')">[name]</button>
                            <button class="var-btn" onclick="insertVariable('email', '[company]')">[company]</button>
                            <button class="var-btn" onclick="insertVariable('email', '[policy_type]')">[policy_type]</button>
                            <button class="var-btn" onclick="insertVariable('email', '[expiration_date]')">[expiration_date]</button>
                        </div>
                    </div>
                    <textarea id="emailTemplate" class="form-control" rows="10" placeholder="Hi [name],

Your [policy_type] insurance is approaching its expiration date on [expiration_date].

We'd love to help you renew your policy and ensure continuous coverage.

Best regards,
Vanguard Insurance Group"></textarea>
                </div>
                
                <div class="form-section">
                    <label>Schedule</label>
                    <div class="schedule-options">
                        <label class="radio-option">
                            <input type="radio" name="emailSchedule" value="now" checked>
                            Send Immediately
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="emailSchedule" value="later">
                            Schedule for Later
                            <input type="datetime-local" id="emailScheduleTime" class="form-control" style="margin-left: 10px;">
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn-secondary" onclick="previewEmailBlast()">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn-primary" onclick="sendEmailBlast()">
                        <i class="fas fa-paper-plane"></i> Send Email Blast
                    </button>
                </div>
            </div>
            
            <div class="preview-panel" id="emailPreview" style="display: none;">
                <h3>Email Preview</h3>
                <div class="preview-content"></div>
            </div>
        </div>
    `;
}

function renderSMSBlastTab() {
    return `
        <div class="blast-container">
            <div class="blast-form">
                <h3>Send SMS Blast</h3>
                
                <div class="form-section">
                    <label>Upload Recipients CSV</label>
                    <div class="upload-area" onclick="document.getElementById('smsRecipientFile').click()">
                        <i class="fas fa-file-csv"></i>
                        <p>Click to upload CSV file</p>
                        <span>Must contain phone numbers</span>
                        <input type="file" id="smsRecipientFile" style="display: none;" accept=".csv" onchange="handleRecipientUpload(this, 'sms')">
                    </div>
                    <div id="smsRecipientMapping" style="display: none;">
                        <h4>Map CSV Columns to Fields</h4>
                        <div id="smsMappingFields"></div>
                    </div>
                </div>
                
                <div class="form-section">
                    <label>SMS Message</label>
                    <div class="template-variables">
                        <p>Available variables (click to insert):</p>
                        <div id="smsAvailableVars" class="variable-buttons">
                            <button class="var-btn" onclick="insertVariable('sms', '[name]')">[name]</button>
                            <button class="var-btn" onclick="insertVariable('sms', '[company]')">[company]</button>
                            <button class="var-btn" onclick="insertVariable('sms', '[policy_type]')">[policy_type]</button>
                            <button class="var-btn" onclick="insertVariable('sms', '[expiration_date]')">[expiration_date]</button>
                        </div>
                    </div>
                    <textarea id="smsTemplate" class="form-control" rows="5" placeholder="Hi [name], your [policy_type] insurance expires on [expiration_date]. Reply YES to renew or call us at 555-0123." maxlength="160"></textarea>
                    <div class="char-count">
                        <span id="smsCharCount">0</span> / 160 characters
                    </div>
                </div>
                
                <div class="form-section">
                    <label>Schedule</label>
                    <div class="schedule-options">
                        <label class="radio-option">
                            <input type="radio" name="smsSchedule" value="now" checked>
                            Send Immediately
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="smsSchedule" value="later">
                            Schedule for Later
                            <input type="datetime-local" id="smsScheduleTime" class="form-control" style="margin-left: 10px;">
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn-secondary" onclick="previewSMSBlast()">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn-primary" onclick="sendSMSBlast()">
                        <i class="fas fa-paper-plane"></i> Send SMS Blast
                    </button>
                </div>
            </div>
            
            <div class="preview-panel" id="smsPreview" style="display: none;">
                <h3>SMS Preview</h3>
                <div class="preview-content"></div>
            </div>
        </div>
    `;
}

function loadCommunicationTab(tabName) {
    // Update active tab
    const tabs = document.querySelectorAll('.tabs .tab-btn');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase() === tabName.toLowerCase() || 
            (tabName === 'email' && tab.textContent === 'Email') ||
            (tabName === 'sms' && tab.textContent === 'SMS')) {
            tab.classList.add('active');
        }
    });
    
    const contentArea = document.getElementById('communicationTabContent');
    if (!contentArea) return;
    
    let content = '';
    
    switch(tabName) {
        case 'email':
            content = `
                <div class="email-view">
                    <div class="email-composer">
                        <h3>Compose Email</h3>
                        <div class="form-group">
                            <label>To:</label>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="text" class="form-control" id="emailToField" placeholder="Select recipients or enter email addresses" style="flex: 1;">
                                <button class="btn-secondary" onclick="selectRecipients('email', 'leads')">Leads</button>
                                <button class="btn-secondary" onclick="selectRecipients('email', 'clients')">Clients</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Subject:</label>
                            <input type="text" class="form-control" id="emailSubject" placeholder="Enter email subject">
                        </div>
                        <div class="form-group">
                            <label>Message:</label>
                            <textarea class="form-control" id="emailMessage" rows="8" placeholder="Type your message here..."></textarea>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="btn-secondary" onclick="improveWithAI('email')">
                                    <i class="fas fa-magic"></i> AI Improve
                                </button>
                                <button class="btn-secondary" onclick="attachFile('email')">
                                    <i class="fas fa-paperclip"></i> Attach File
                                </button>
                            </div>
                            <div id="emailAttachments" style="margin-top: 10px;"></div>
                        </div>
                        <div class="form-actions">
                            <button class="btn-secondary">Save as Draft</button>
                            <button class="btn-primary">Send Email</button>
                        </div>
                    </div>
                    <div class="recent-emails">
                        <h3>Recent Emails</h3>
                        <div class="email-list">
                            <div class="email-item">
                                <div class="email-from">john.doe@example.com</div>
                                <div class="email-subject">Policy Renewal Reminder</div>
                                <div class="email-time">2 hours ago</div>
                            </div>
                            <div class="email-item">
                                <div class="email-from">sarah.smith@example.com</div>
                                <div class="email-subject">Quote Request</div>
                                <div class="email-time">5 hours ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'sms':
            content = `
                <div class="sms-view">
                    <div class="sms-composer">
                        <h3>Send SMS</h3>
                        <div class="form-group">
                            <label>To:</label>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="text" class="form-control" id="smsToField" placeholder="Enter phone number or select from contacts" style="flex: 1;">
                                <button class="btn-secondary" onclick="selectRecipients('sms', 'leads')">Leads</button>
                                <button class="btn-secondary" onclick="selectRecipients('sms', 'clients')">Clients</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Message:</label>
                            <textarea class="form-control" id="smsMessage" rows="4" placeholder="Type your SMS message (160 characters max)..." maxlength="160"></textarea>
                            <small class="char-count">0 / 160 characters</small>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="btn-secondary" onclick="improveWithAI('sms')">
                                    <i class="fas fa-magic"></i> AI Improve
                                </button>
                                <button class="btn-secondary" onclick="attachFile('sms')">
                                    <i class="fas fa-link"></i> Attach Link
                                </button>
                            </div>
                            <div id="smsAttachments" style="margin-top: 10px;"></div>
                        </div>
                        <div class="form-actions">
                            <button class="btn-secondary">Save Template</button>
                            <button class="btn-primary">Send SMS</button>
                        </div>
                    </div>
                    <div class="recent-sms">
                        <h3>Recent SMS Messages</h3>
                        <div class="sms-list">
                            <div class="sms-item">
                                <div class="sms-to">(555) 123-4567</div>
                                <div class="sms-message">Your policy renewal is due in 30 days. Contact us to review your coverage.</div>
                                <div class="sms-time">1 hour ago</div>
                            </div>
                            <div class="sms-item">
                                <div class="sms-to">(555) 987-6543</div>
                                <div class="sms-message">Thank you for your payment. Your policy is now active.</div>
                                <div class="sms-time">3 hours ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'campaigns':
            content = `
                <div class="campaigns-grid">
                    <div class="campaign-card">
                        <div class="campaign-header">
                            <h3>Renewal Reminders</h3>
                            <span class="status-badge active">Active</span>
                        </div>
                        <div class="campaign-stats">
                            <div>
                                <span class="stat-label">Sent</span>
                                <span class="stat-value">234</span>
                            </div>
                            <div>
                                <span class="stat-label">Opened</span>
                                <span class="stat-value">156 (67%)</span>
                            </div>
                            <div>
                                <span class="stat-label">Clicked</span>
                                <span class="stat-value">45 (19%)</span>
                            </div>
                        </div>
                        <div class="campaign-actions">
                            <button class="btn-secondary">View Details</button>
                            <button class="btn-secondary">Pause</button>
                        </div>
                    </div>
                    
                    <div class="campaign-card">
                        <div class="campaign-header">
                            <h3>Welcome Series</h3>
                            <span class="status-badge active">Active</span>
                        </div>
                        <div class="campaign-stats">
                            <div>
                                <span class="stat-label">Sent</span>
                                <span class="stat-value">89</span>
                            </div>
                            <div>
                                <span class="stat-label">Opened</span>
                                <span class="stat-value">72 (81%)</span>
                            </div>
                            <div>
                                <span class="stat-label">Clicked</span>
                                <span class="stat-value">28 (31%)</span>
                            </div>
                        </div>
                        <div class="campaign-actions">
                            <button class="btn-secondary">View Details</button>
                            <button class="btn-secondary">Pause</button>
                        </div>
                    </div>
                    
                    <div class="campaign-card">
                        <div class="campaign-header">
                            <h3>Holiday Greetings</h3>
                            <span class="status-badge pending">Scheduled</span>
                        </div>
                        <div class="campaign-stats">
                            <div>
                                <span class="stat-label">Recipients</span>
                                <span class="stat-value">1,245</span>
                            </div>
                            <div>
                                <span class="stat-label">Send Date</span>
                                <span class="stat-value">Dec 15</span>
                            </div>
                        </div>
                        <div class="campaign-actions">
                            <button class="btn-secondary">Edit</button>
                            <button class="btn-primary">Preview</button>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'templates':
            content = `
                <div class="templates-view">
                    <div class="template-actions">
                        <button class="btn-primary" onclick="createNewTemplate()">
                            <i class="fas fa-plus"></i> Create Template
                        </button>
                    </div>
                    <div class="templates-grid">
                        <div class="template-card">
                            <h4>Welcome Email</h4>
                            <p>Sent to new clients after signup</p>
                            <div class="template-meta">
                                <span>Email</span>
                                <span>Used 45 times</span>
                            </div>
                            <div class="template-actions">
                                <button class="btn-secondary">Edit</button>
                                <button class="btn-secondary">Duplicate</button>
                                <button class="btn-secondary">Preview</button>
                            </div>
                        </div>
                        
                        <div class="template-card">
                            <h4>Renewal Reminder</h4>
                            <p>30-day policy renewal notification</p>
                            <div class="template-meta">
                                <span>Email</span>
                                <span>Used 234 times</span>
                            </div>
                            <div class="template-actions">
                                <button class="btn-secondary">Edit</button>
                                <button class="btn-secondary">Duplicate</button>
                                <button class="btn-secondary">Preview</button>
                            </div>
                        </div>
                        
                        <div class="template-card">
                            <h4>Payment Confirmation</h4>
                            <p>SMS confirmation for payment received</p>
                            <div class="template-meta">
                                <span>SMS</span>
                                <span>Used 89 times</span>
                            </div>
                            <div class="template-actions">
                                <button class="btn-secondary">Edit</button>
                                <button class="btn-secondary">Duplicate</button>
                                <button class="btn-secondary">Preview</button>
                            </div>
                        </div>
                        
                        <div class="template-card">
                            <h4>Birthday Wishes</h4>
                            <p>Annual birthday greeting to clients</p>
                            <div class="template-meta">
                                <span>Email</span>
                                <span>Used 156 times</span>
                            </div>
                            <div class="template-actions">
                                <button class="btn-secondary">Edit</button>
                                <button class="btn-secondary">Duplicate</button>
                                <button class="btn-secondary">Preview</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'history':
            content = `
                <div class="history-view">
                    <div class="history-filters">
                        <select class="form-control">
                            <option>All Types</option>
                            <option>Email</option>
                            <option>SMS</option>
                            <option>Campaigns</option>
                        </select>
                        <input type="date" class="form-control" placeholder="From Date">
                        <input type="date" class="form-control" placeholder="To Date">
                        <button class="btn-secondary">Filter</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date/Time</th>
                                <th>Type</th>
                                <th>Recipient</th>
                                <th>Subject/Message</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2024-01-15 10:30 AM</td>
                                <td><span class="badge">Email</span></td>
                                <td>john.doe@example.com</td>
                                <td>Policy Renewal Reminder</td>
                                <td><span class="status-badge active">Delivered</span></td>
                                <td><button class="btn-icon"><i class="fas fa-eye"></i></button></td>
                            </tr>
                            <tr>
                                <td>2024-01-15 09:15 AM</td>
                                <td><span class="badge">SMS</span></td>
                                <td>(555) 123-4567</td>
                                <td>Payment confirmation for policy #12345</td>
                                <td><span class="status-badge active">Sent</span></td>
                                <td><button class="btn-icon"><i class="fas fa-eye"></i></button></td>
                            </tr>
                            <tr>
                                <td>2024-01-14 03:45 PM</td>
                                <td><span class="badge">Campaign</span></td>
                                <td>245 recipients</td>
                                <td>Welcome Series - Email 1</td>
                                <td><span class="status-badge active">Completed</span></td>
                                <td><button class="btn-icon"><i class="fas fa-chart-bar"></i></button></td>
                            </tr>
                            <tr>
                                <td>2024-01-14 11:20 AM</td>
                                <td><span class="badge">Email</span></td>
                                <td>sarah.smith@example.com</td>
                                <td>Quote Request Response</td>
                                <td><span class="status-badge pending">Bounced</span></td>
                                <td><button class="btn-icon"><i class="fas fa-redo"></i></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
            break;
    }
    
    contentArea.innerHTML = content;
    
    // Add event listener for SMS character count if SMS tab
    if (tabName === 'sms') {
        const textarea = document.getElementById('smsMessage');
        const charCount = contentArea.querySelector('.char-count');
        if (textarea && charCount) {
            textarea.addEventListener('input', function() {
                charCount.textContent = `${this.value.length} / 160 characters`;
            });
        }
    }
}

function selectRecipients(type, source) {
    // Get leads and clients data
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    
    let recipients = source === 'leads' ? leads : clients;
    let title = source === 'leads' ? 'Select Leads' : 'Select Clients';
    
    // Create modal overlay for recipient selection
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    modalOverlay.innerHTML = `
        <div class="modal-container" style="
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div class="modal-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
            ">
                <h2 style="margin: 0;">${title}</h2>
                <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="
                padding: 1.5rem;
                overflow-y: auto;
                flex: 1;
            ">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <input type="text" class="form-control" id="recipientSearch" 
                           placeholder="Search ${source}..." 
                           onkeyup="filterRecipients('${source}')"
                           style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 6px;">
                </div>
                <div class="recipient-list" id="recipientList" style="max-height: 400px; overflow-y: auto;">
                    ${recipients.map(recipient => {
                        const name = recipient.name || `${recipient.firstName} ${recipient.lastName}`;
                        const contact = type === 'email' ? recipient.email : recipient.phone;
                        const display = contact || (type === 'email' ? 'No email' : 'No phone');
                        
                        // Check if this is a lead and if they have quotes
                        // Quotes might be stored directly or need to be checked from the quotes array
                        let hasQuotes = false;
                        let recipientQuotes = [];
                        
                        if (source === 'leads') {
                            // Check if quotes exist on the lead object
                            if (recipient.quotes && recipient.quotes.length > 0) {
                                hasQuotes = true;
                                recipientQuotes = recipient.quotes;
                            } else {
                                // Check if there are quotes in the quotes storage that match this lead
                                const allQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
                                const leadQuotes = allQuotes.filter(q => 
                                    q.leadId === recipient.id || 
                                    q.leadName === name || 
                                    q.clientName === name
                                );
                                if (leadQuotes.length > 0) {
                                    hasQuotes = true;
                                    recipientQuotes = leadQuotes;
                                    // Store quotes on the lead for future use
                                    recipient.quotes = leadQuotes;
                                }
                            }
                        }
                        
                        return `
                            <div class="recipient-item" style="
                                padding: 10px;
                                border: 1px solid #e0e0e0;
                                margin-bottom: 5px;
                                border-radius: 4px;
                                transition: background-color 0.2s;
                            "
                                 onmouseover="this.style.backgroundColor='#f5f5f5'" 
                                 onmouseout="this.style.backgroundColor='white'">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="flex: 1; cursor: pointer;" onclick="addRecipient('${type}', '${contact || ''}', '${name}')">
                                        <div style="font-weight: 500;">${name}</div>
                                        <div style="font-size: 0.9em; color: #666;">${display}</div>
                                        ${source === 'leads' ? `
                                            <div style="font-size: 0.8em; color: #9ca3af;">
                                                ${hasQuotes ? `${recipientQuotes.length} quote(s) available` : 'No quotes'}
                                            </div>
                                        ` : ''}
                                    </div>
                                    ${hasQuotes ? `
                                        <button class="btn-secondary" style="
                                            padding: 5px 10px;
                                            font-size: 0.85rem;
                                            margin-left: 10px;
                                            background: #3b82f6;
                                            color: white;
                                            border: none;
                                            border-radius: 4px;
                                            cursor: pointer;
                                        " 
                                        onmouseover="this.style.backgroundColor='#2563eb'"
                                        onmouseout="this.style.backgroundColor='#3b82f6'"
                                        onclick="event.stopPropagation(); attachLeadQuote('${type}', '${recipient.id || name}', '${name.replace(/'/g, "\\'")}')">
                                            <i class="fas fa-file-invoice"></i> Attach Quote
                                        </button>
                                    ` : source === 'leads' ? `
                                        <button class="btn-secondary" disabled style="
                                            padding: 5px 10px;
                                            font-size: 0.85rem;
                                            margin-left: 10px;
                                            background: #e5e7eb;
                                            color: #9ca3af;
                                            border: none;
                                            border-radius: 4px;
                                            cursor: not-allowed;
                                        ">
                                            <i class="fas fa-file-invoice"></i> No Quotes
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Add click outside to close
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
    
    document.body.appendChild(modalOverlay);
}

function filterRecipients(source) {
    const searchTerm = document.getElementById('recipientSearch').value.toLowerCase();
    const recipientItems = document.querySelectorAll('.recipient-item');
    
    recipientItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function addRecipient(type, contact, name) {
    if (!contact) {
        alert(`This ${type === 'email' ? 'contact has no email address' : 'contact has no phone number'}`);
        return;
    }
    
    const field = type === 'email' ? 
        document.getElementById('emailToField') : 
        document.getElementById('smsToField');
    
    if (field) {
        // Add to existing recipients if there are any
        const currentValue = field.value.trim();
        if (currentValue) {
            field.value = currentValue + ', ' + contact;
        } else {
            field.value = contact;
        }
    }
    
    // Close the modal
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

function improveWithAI(type) {
    const messageField = type === 'email' ? 
        document.getElementById('emailMessage') : 
        document.getElementById('smsMessage');
    
    const subjectField = type === 'email' ? 
        document.getElementById('emailSubject') : null;
    
    if (!messageField) return;
    
    const originalMessage = messageField.value.trim();
    
    if (!originalMessage) {
        alert('Please write a message first');
        return;
    }
    
    // Simulate AI improvement (in production, this would call an actual AI service)
    let improvedMessage = originalMessage;
    
    // Basic improvements
    improvedMessage = improvedMessage.charAt(0).toUpperCase() + improvedMessage.slice(1);
    
    // Add professional tone
    if (type === 'email') {
        // Email improvements
        if (!improvedMessage.includes('Dear') && !improvedMessage.includes('Hello') && !improvedMessage.includes('Hi')) {
            improvedMessage = 'Dear Valued Client,\n\n' + improvedMessage;
        }
        
        if (!improvedMessage.includes('Sincerely') && !improvedMessage.includes('Best regards') && !improvedMessage.includes('Thank you')) {
            improvedMessage += '\n\nBest regards,\nVanguard Insurance Group';
        }
        
        // Auto-generate subject if empty
        if (subjectField && !subjectField.value.trim()) {
            // Extract key topic from message
            if (improvedMessage.toLowerCase().includes('renewal')) {
                subjectField.value = 'Important: Policy Renewal Information';
            } else if (improvedMessage.toLowerCase().includes('quote')) {
                subjectField.value = 'Your Insurance Quote from Vanguard';
            } else if (improvedMessage.toLowerCase().includes('claim')) {
                subjectField.value = 'Update on Your Insurance Claim';
            } else if (improvedMessage.toLowerCase().includes('payment')) {
                subjectField.value = 'Payment Confirmation - Vanguard Insurance';
            } else if (improvedMessage.toLowerCase().includes('policy')) {
                subjectField.value = 'Your Policy Information';
            } else {
                subjectField.value = 'Message from Vanguard Insurance Group';
            }
        }
    } else {
        // SMS improvements (keep it concise)
        // Remove extra spaces and ensure proper punctuation
        improvedMessage = improvedMessage.replace(/\s+/g, ' ');
        
        if (!improvedMessage.endsWith('.') && !improvedMessage.endsWith('!') && !improvedMessage.endsWith('?')) {
            improvedMessage += '.';
        }
        
        // Add company identifier if not present
        if (!improvedMessage.includes('Vanguard')) {
            improvedMessage += ' - Vanguard Insurance';
        }
        
        // Ensure it fits SMS limits
        if (improvedMessage.length > 160) {
            improvedMessage = improvedMessage.substring(0, 157) + '...';
        }
    }
    
    // Apply the improved message
    messageField.value = improvedMessage;
    
    // Update character count for SMS
    if (type === 'sms') {
        const charCount = document.querySelector('.char-count');
        if (charCount) {
            charCount.textContent = `${improvedMessage.length} / 160 characters`;
        }
    }
    
    // Visual feedback
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Improved!';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = '';
        button.style.color = '';
    }, 2000);
}

// File attachment functionality
let attachedFiles = {
    email: [],
    sms: []
};

function attachFile(type) {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    
    if (type === 'email') {
        // Email can accept various file types
        fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv';
    } else {
        // SMS typically sends links to files rather than attachments
        fileInput.accept = '.pdf,.png,.jpg,.jpeg';
    }
    
    fileInput.onchange = function(e) {
        const files = e.target.files;
        const attachmentContainer = document.getElementById(type + 'Attachments');
        
        if (!attachmentContainer) return;
        
        for (let file of files) {
            // Add to attached files array
            attachedFiles[type].push(file);
            
            // Create attachment display element
            const attachmentDiv = document.createElement('div');
            attachmentDiv.style.cssText = `
                display: inline-flex;
                align-items: center;
                background: #f3f4f6;
                padding: 5px 10px;
                border-radius: 4px;
                margin-right: 10px;
                margin-bottom: 5px;
            `;
            
            const fileIcon = getFileIcon(file.name);
            const fileSize = formatFileSize(file.size);
            
            attachmentDiv.innerHTML = `
                <i class="${fileIcon}" style="margin-right: 5px; color: #6b7280;"></i>
                <span style="margin-right: 5px;">${file.name}</span>
                <small style="color: #9ca3af; margin-right: 10px;">(${fileSize})</small>
                <button onclick="removeAttachment('${type}', '${file.name}')" style="
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    padding: 0;
                ">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            attachmentContainer.appendChild(attachmentDiv);
            
            // For SMS, show as link since SMS can't have true attachments
            if (type === 'sms') {
                const messageField = document.getElementById('smsMessage');
                if (messageField) {
                    // Add a shortened link placeholder to the message
                    const linkText = `\n[File: ${file.name}]`;
                    if ((messageField.value.length + linkText.length) <= 160) {
                        messageField.value += linkText;
                        // Update character count
                        const charCount = document.querySelector('.char-count');
                        if (charCount) {
                            charCount.textContent = `${messageField.value.length} / 160 characters`;
                        }
                    } else {
                        alert('Adding file link would exceed SMS character limit');
                        removeAttachment(type, file.name);
                    }
                }
            }
        }
    };
    
    fileInput.click();
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch(ext) {
        case 'pdf': return 'fas fa-file-pdf';
        case 'doc':
        case 'docx': return 'fas fa-file-word';
        case 'xls':
        case 'xlsx': return 'fas fa-file-excel';
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif': return 'fas fa-file-image';
        case 'txt': return 'fas fa-file-alt';
        case 'csv': return 'fas fa-file-csv';
        default: return 'fas fa-file';
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576 * 10) / 10 + ' MB';
}

function removeAttachment(type, filename) {
    // Remove from attachedFiles array
    attachedFiles[type] = attachedFiles[type].filter(f => f.name !== filename);
    
    // Remove from UI
    const attachmentContainer = document.getElementById(type + 'Attachments');
    if (attachmentContainer) {
        const attachments = attachmentContainer.querySelectorAll('div');
        attachments.forEach(div => {
            if (div.innerHTML.includes(filename)) {
                div.remove();
            }
        });
    }
    
    // For SMS, remove from message
    if (type === 'sms') {
        const messageField = document.getElementById('smsMessage');
        if (messageField) {
            const linkText = `[File: ${filename}]`;
            messageField.value = messageField.value.replace('\n' + linkText, '').replace(linkText, '');
            // Update character count
            const charCount = document.querySelector('.char-count');
            if (charCount) {
                charCount.textContent = `${messageField.value.length} / 160 characters`;
            }
        }
    }
}

function attachLeadQuote(type, leadId, leadName) {
    // Get the lead's quotes
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId || l.name === leadName);
    
    let quotesToShow = [];
    
    // First check if lead has quotes directly
    if (lead && lead.quotes && lead.quotes.length > 0) {
        quotesToShow = lead.quotes;
    } else {
        // Otherwise check the quotes storage
        const allQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
        quotesToShow = allQuotes.filter(q => 
            q.leadId === leadId || 
            q.leadName === leadName || 
            q.clientName === leadName
        );
    }
    
    if (quotesToShow.length === 0) {
        alert('No quotes found for this lead');
        return;
    }
    
    // Show quote selection modal
    const quoteModal = document.createElement('div');
    quoteModal.className = 'modal-overlay active';
    quoteModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    quoteModal.innerHTML = `
        <div class="modal-container" style="
            background: white;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 60vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div class="modal-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
            ">
                <h3 style="margin: 0;">Select Quote to Attach</h3>
                <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="
                padding: 1.5rem;
                overflow-y: auto;
                flex: 1;
            ">
                ${quotesToShow.map((quote, index) => `
                    <div style="
                        padding: 15px;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        margin-bottom: 10px;
                        cursor: pointer;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.backgroundColor='#f5f5f5'; this.style.borderColor='#3b82f6';" 
                    onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#e0e0e0';"
                    onclick="selectQuoteToAttach('${type}', '${leadName}', ${index})">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong>Quote #${quote.quoteNumber || index + 1}</strong>
                            <span style="color: #10b981; font-weight: 500;">$${quote.premium || '0'}/mo</span>
                        </div>
                        <div style="color: #6b7280; font-size: 0.9em;">
                            <div>Coverage: $${quote.coverage || '0'}</div>
                            <div>Type: ${quote.type || 'Auto Insurance'}</div>
                            <div>Created: ${quote.date || new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(quoteModal);
}

function selectQuoteToAttach(type, leadName, quoteIndex) {
    // Close quote modal
    const quoteModal = document.querySelectorAll('.modal-overlay');
    if (quoteModal.length > 1) {
        quoteModal[quoteModal.length - 1].remove();
    }
    
    // Get the quote from either source
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.name === leadName);
    
    let quote;
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        quote = lead.quotes[quoteIndex];
    } else {
        // Get from quotes storage
        const allQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
        const leadQuotes = allQuotes.filter(q => 
            q.leadName === leadName || 
            q.clientName === leadName
        );
        if (leadQuotes[quoteIndex]) {
            quote = leadQuotes[quoteIndex];
        }
    }
    
    if (!quote) return;
    const attachmentContainer = document.getElementById(type + 'Attachments');
    
    if (attachmentContainer) {
        // Create quote attachment display
        const quoteDiv = document.createElement('div');
        quoteDiv.style.cssText = `
            display: inline-flex;
            align-items: center;
            background: #dbeafe;
            padding: 5px 10px;
            border-radius: 4px;
            margin-right: 10px;
            margin-bottom: 5px;
            border: 1px solid #3b82f6;
        `;
        
        quoteDiv.innerHTML = `
            <i class="fas fa-file-invoice" style="margin-right: 5px; color: #3b82f6;"></i>
            <span style="margin-right: 5px;">Quote #${quote.quoteNumber || quoteIndex + 1} - ${leadName}</span>
            <small style="color: #1e40af; margin-right: 10px;">($${quote.premium}/mo)</small>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: #ef4444;
                cursor: pointer;
                padding: 0;
            ">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        attachmentContainer.appendChild(quoteDiv);
        
        // For SMS, add a note about the quote
        if (type === 'sms') {
            const messageField = document.getElementById('smsMessage');
            if (messageField) {
                const quoteText = `\n[Quote #${quote.quoteNumber || quoteIndex + 1}]`;
                if ((messageField.value.length + quoteText.length) <= 160) {
                    messageField.value += quoteText;
                    // Update character count
                    const charCount = document.querySelector('.char-count');
                    if (charCount) {
                        charCount.textContent = `${messageField.value.length} / 160 characters`;
                    }
                }
            }
        }
    }
}

function loadCarriersView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    // Get carriers from localStorage or use defaults
    let carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
    if (carriers.length === 0) {
        carriers = [
            { id: 1, name: 'Progressive', commission: '15%', products: 'Auto, Home', policies: 892, premium: '$1.2M', logo: 'https://via.placeholder.com/120x60', portalUrl: 'https://www.progressive.com/agent' },
            { id: 2, name: 'State Farm', commission: '12%', products: 'Auto, Home, Life', policies: 1245, premium: '$2.1M', logo: 'https://via.placeholder.com/120x60', portalUrl: 'https://www.statefarm.com/agent' },
            { id: 3, name: 'Liberty Mutual', commission: '14%', products: 'Commercial, GL', policies: 456, premium: '$3.5M', logo: 'https://via.placeholder.com/120x60', portalUrl: 'https://business.libertymutual.com' }
        ];
        localStorage.setItem('carriers', JSON.stringify(carriers));
    }
    
    dashboardContent.innerHTML = `
        <div class="carriers-view">
            <header class="content-header">
                <h1>Carrier Management</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="addCarrier()">
                        <i class="fas fa-plus"></i> Add Carrier
                    </button>
                </div>
            </header>
            
            <div class="carriers-grid">
                ${carriers.map(carrier => `
                <div class="carrier-card" data-carrier-id="${carrier.id}">
                    <div class="carrier-logo">
                        <img src="${carrier.logo}" alt="${carrier.name}">
                    </div>
                    <h3>${carrier.name}</h3>
                    <div class="carrier-info">
                        <div class="info-row">
                            <span>Commission:</span>
                            <strong>${carrier.commission}</strong>
                        </div>
                        <div class="info-row">
                            <span>Products:</span>
                            <strong>${carrier.products}</strong>
                        </div>
                        <div class="info-row">
                            <span>Active Policies:</span>
                            <strong>${carrier.policies}</strong>
                        </div>
                        <div class="info-row">
                            <span>YTD Premium:</span>
                            <strong>${carrier.premium}</strong>
                        </div>
                    </div>
                    <div class="carrier-actions">
                        <button class="btn-secondary" onclick="openCarrierPortal(${carrier.id})">Portal Login</button>
                        <button class="btn-secondary" onclick="viewCarrierDetails(${carrier.id})">View Details</button>
                        <button class="btn-icon" onclick="deleteCarrier(${carrier.id})" title="Delete Carrier" style="color: #ff4444; margin-left: 10px;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    `;
}

function loadProducersView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="producers-view">
            <header class="content-header">
                <h1>Producers & Team</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="addProducer()">
                        <i class="fas fa-user-plus"></i> Add Producer
                    </button>
                </div>
            </header>
            
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>License #</th>
                            <th>Clients</th>
                            <th>YTD Sales</th>
                            <th>Commission</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">JM</div>
                                    <span>James Miller</span>
                                </div>
                            </td>
                            <td>Senior Producer</td>
                            <td>LIC-123456</td>
                            <td>342</td>
                            <td>$450,000</td>
                            <td>$67,500</td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <button class="btn-icon" onclick="editProducer(1, 'James Miller')"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon" onclick="viewProducerStats(1, 'James Miller')"><i class="fas fa-chart-line"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">SJ</div>
                                    <span>Sarah Johnson</span>
                                </div>
                            </td>
                            <td>Producer</td>
                            <td>LIC-234567</td>
                            <td>256</td>
                            <td>$320,000</td>
                            <td>$48,000</td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <button class="btn-icon" onclick="editProducer(2, 'Sarah Johnson')"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon" onclick="viewProducerStats(2, 'Sarah Johnson')"><i class="fas fa-chart-line"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadAnalyticsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="analytics-view">
            <header class="content-header">
                <h1>Analytics Dashboard</h1>
                <div class="header-actions">
                    <select class="filter-select" style="margin-right: 1rem;">
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>Year to Date</option>
                        <option>Last Year</option>
                    </select>
                    <button class="btn-secondary" onclick="exportAnalytics()">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                    <button class="btn-primary" onclick="refreshAnalytics()">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </header>
            
            <!-- KPI Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Total Premium</h3>
                        <span class="trend positive">+12.5%</span>
                    </div>
                    <div class="stat-value">$8.4M</div>
                    <div class="stat-chart">
                        <canvas id="premiumMiniChart"></canvas>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Policy Count</h3>
                        <span class="trend positive">+8.3%</span>
                    </div>
                    <div class="stat-value">5,234</div>
                    <div class="stat-chart">
                        <canvas id="policyMiniChart"></canvas>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Retention Rate</h3>
                        <span class="trend positive">+2.1%</span>
                    </div>
                    <div class="stat-value">94.2%</div>
                    <div class="stat-chart">
                        <canvas id="retentionMiniChart"></canvas>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Loss Ratio</h3>
                        <span class="trend negative">+5.2%</span>
                    </div>
                    <div class="stat-value">58.7%</div>
                    <div class="stat-chart">
                        <canvas id="lossMiniChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Charts Section -->
            <div class="charts-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="chart-card">
                    <h3>Premium Growth Trend</h3>
                    <canvas id="premiumTrendChart" style="max-height: 300px;"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Policy Distribution by Type</h3>
                    <canvas id="policyTypeChart" style="max-height: 300px;"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Top Performing Producers</h3>
                    <canvas id="producerChart" style="max-height: 300px;"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Carrier Performance</h3>
                    <canvas id="carrierChart" style="max-height: 300px;"></canvas>
                </div>
            </div>
            
            <!-- Detailed Metrics Table -->
            <div class="metrics-section" style="margin-top: 2rem;">
                <h3>Detailed Metrics</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Current Period</th>
                            <th>Previous Period</th>
                            <th>Change</th>
                            <th>YTD</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>New Business Premium</td>
                            <td>$892,450</td>
                            <td>$756,320</td>
                            <td class="positive">+18.0%</td>
                            <td>$3,245,780</td>
                        </tr>
                        <tr>
                            <td>Renewal Premium</td>
                            <td>$1,456,890</td>
                            <td>$1,398,230</td>
                            <td class="positive">+4.2%</td>
                            <td>$5,123,450</td>
                        </tr>
                        <tr>
                            <td>Average Policy Size</td>
                            <td>$2,845</td>
                            <td>$2,650</td>
                            <td class="positive">+7.4%</td>
                            <td>$2,756</td>
                        </tr>
                        <tr>
                            <td>Quote-to-Bind Ratio</td>
                            <td>68.5%</td>
                            <td>65.2%</td>
                            <td class="positive">+3.3%</td>
                            <td>67.8%</td>
                        </tr>
                        <tr>
                            <td>Client Acquisition Cost</td>
                            <td>$245</td>
                            <td>$278</td>
                            <td class="positive">-11.9%</td>
                            <td>$256</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Initialize analytics charts after DOM is ready
    setTimeout(() => {
        initializeAnalyticsCharts();
    }, 100);
}

function loadIntegrationsView() {
    // Use the configuration view if available
    if (window.loadIntegrationsConfig) {
        window.loadIntegrationsConfig();
        return;
    }
    
    // Use the new integrations view if available
    if (window.loadIntegrationsViewNew) {
        window.loadIntegrationsViewNew();
        return;
    }
    
    // Fallback - just show loading message
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    dashboardContent.innerHTML = `
        <div class="integrations-view">
            <header class="content-header">
                <h1>Integrations</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="addIntegration()">
                        <i class="fas fa-plus"></i> Add Integration
                    </button>
                </div>
            </header>
            <div style="text-align: center; padding: 3rem;">
                <p>Click 'Add Integration' to get started</p>
            </div>
        </div>
    `;
}

function loadSettingsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="settings-view">
            <header class="content-header">
                <h1>Settings</h1>
            </header>
            
            <div class="settings-grid">
                <div class="settings-section">
                    <h3>Agency Information</h3>
                    <div class="form-group">
                        <label>Agency Name</label>
                        <input type="text" class="form-control" value="Vanguard Insurance Group">
                    </div>
                    <div class="form-group">
                        <label>License Number</label>
                        <input type="text" class="form-control" value="AGY-789012">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <input type="text" class="form-control" value="123 Insurance Ave, Suite 100">
                    </div>
                    <button class="btn-primary">Save Changes</button>
                </div>
                
                <div class="settings-section">
                    <h3>Integration Settings</h3>
                    <div class="integration-list">
                        <div class="integration-item">
                            <span>ACORD Forms</span>
                            <button class="btn-secondary">Configure</button>
                        </div>
                        <div class="integration-item">
                            <span>Email Integration</span>
                            <button class="btn-secondary">Configure</button>
                        </div>
                        <div class="integration-item">
                            <span>Document Management</span>
                            <button class="btn-secondary">Configure</button>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>User Preferences</h3>
                    <div class="form-group">
                        <label>Default View</label>
                        <select class="form-control">
                            <option>Dashboard</option>
                            <option>Clients</option>
                            <option>Policies</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Email Notifications</label>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <button class="btn-primary">Save Preferences</button>
                </div>
            </div>
        </div>
    `;
}

function loadRenewalsData() {
    console.log('Loading renewals data...');
    // This would load renewal-specific view
}

function loadClaimsData() {
    console.log('Loading claims data...');
    // This would load claims-specific view
}

function generateReports() {
    console.log('Generating reports...');
    loadReportsView();
}

// Additional Helper Functions for All Views

// Client Management Helper Functions
function generateClientPoliciesList(policies) {
    if (!policies || policies.length === 0) {
        return `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                <p style="font-size: 16px; margin: 0;">No policies found</p>
                <p style="font-size: 14px; margin-top: 8px;">Click "Add Policy" to create a new policy</p>
            </div>
        `;
    }
    
    return policies.map((policy, index) => {
        // Get the policy type label
        const typeLabel = getPolicyTypeLabel(policy.policyType || policy.type || 'unknown');
        
        // Get the premium value from various possible locations
        const premiumValue = policy.financial?.['Annual Premium'] || 
                            policy.financial?.['Premium'] || 
                            policy.financial?.['Monthly Premium'] ||
                            policy.premium || 
                            policy.monthlyPremium ||
                            policy.annualPremium || 0;
        
        // Format the premium for display
        let formattedPremium = '0';
        if (premiumValue) {
            if (typeof premiumValue === 'number') {
                formattedPremium = premiumValue.toLocaleString();
            } else if (typeof premiumValue === 'string') {
                // Remove formatting characters and parse
                const cleanValue = premiumValue.replace(/[$,\s]/g, '');
                const numValue = parseFloat(cleanValue);
                if (!isNaN(numValue)) {
                    formattedPremium = numValue.toLocaleString();
                }
            }
        }
        
        // Format status
        const status = policy.policyStatus || policy.status || 'Active';
        const statusClass = getStatusClass(status);
        
        return `
            <div class="policy-item">
                <div class="policy-header">
                    <span class="policy-number">${policy.policyNumber || `POL-${Date.now()}-${index}`}</span>
                    <span class="status-badge ${statusClass}">${formatStatus(status)}</span>
                </div>
                <div class="policy-details">
                    <p><strong>${typeLabel}</strong></p>
                    <p>${policy.carrier || 'N/A'} • $${formattedPremium}/year</p>
                    <p>Expires: ${formatDate(policy.expirationDate) || 'N/A'}</p>
                </div>
                <div class="policy-actions">
                    <button class="btn-small" onclick="viewPolicy('${policy.id || policy.policyNumber}')">View Details</button>
                    <button class="btn-small" onclick="renewPolicy('${policy.id || policy.policyNumber}')">Renew</button>
                    <button class="btn-small" onclick="confirmDeletePolicy('${policy.id || policy.policyNumber}', '${policy.policyNumber}', '${window.currentViewingClientId || ''}')" style="background: #dc2626; color: white;">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function addPolicyToClient(clientId) {
    // Store the client ID globally for the policy modal to use
    window.currentClientId = clientId;
    
    // Get client data
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id == clientId);
    
    if (!client) {
        showNotification('Client not found', 'error');
        return;
    }
    
    // Store client info for policy creation
    window.currentClientInfo = client;
    
    // Use the same policy modal as the main policies tab
    if (typeof showPolicyModal === 'function') {
        showPolicyModal();
        
        // Update the modal to show it's for a specific client
        setTimeout(() => {
            const modalHeader = document.querySelector('.modal-header h2');
            if (modalHeader) {
                modalHeader.innerHTML = `Create New Policy for ${client.name}`;
            }
            
            // Override the save function to link to client
            window.originalSavePolicy = window.savePolicy;
            window.savePolicy = function() {
                savePolicyForClient(clientId);
            };
        }, 100);
    } else {
        console.error('Policy modal script not loaded');
        showNotification('Policy creation feature not available', 'error');
    }
}

function savePolicyForClient(clientId) {
    // This function saves the policy data from the tabbed modal and links it to the client
    
    // Get the policy data from the modal (using the same structure as savePolicy in policy-modal.js)
    const policyData = collectPolicyData();
    
    if (!policyData) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Add client link and generate policy number
    policyData.clientId = clientId;
    policyData.id = Date.now();
    policyData.policyNumber = policyData.policyNumber || `POL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    policyData.createdAt = new Date().toISOString();
    
    // Get clients and update the specific client
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const clientIndex = clients.findIndex(c => c.id == clientId);
    
    if (clientIndex === -1) {
        showNotification('Client not found', 'error');
        return;
    }
    
    // Add policy to client
    if (!clients[clientIndex].policies) {
        clients[clientIndex].policies = [];
    }
    clients[clientIndex].policies.push(policyData);
    
    // Update total premium
    const premium = policyData.financial?.['Annual Premium'] || policyData.premium || 0;
    clients[clientIndex].totalPremium = clients[clientIndex].policies.reduce((sum, p) => {
        const pPremium = p.financial?.['Annual Premium'] || p.premium || 0;
        return sum + (typeof pPremium === 'string' ? parseFloat(pPremium.replace(/[$,]/g, '')) || 0 : pPremium);
    }, 0);
    
    // Save updated clients
    localStorage.setItem('insurance_clients', JSON.stringify(clients));
    
    // Also save to global policies list (use insurance_policies for consistency)
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    // Add client name to policy data for display
    policyData.clientName = clients[clientIndex].name;
    policyData.insured = policyData.insured || {};
    policyData.insured['Name/Business Name'] = clients[clientIndex].name;
    
    policies.push(policyData);
    localStorage.setItem('insurance_policies', JSON.stringify(policies));
    
    // Close modal
    closePolicyModal();
    
    // Restore original save function
    if (window.originalSavePolicy) {
        window.savePolicy = window.originalSavePolicy;
        delete window.originalSavePolicy;
    }
    
    // Show success notification
    showNotification(`Policy ${policyData.policyNumber} added successfully!`, 'success');
    
    // Refresh the client view
    viewClient(clientId);
}

function collectPolicyData() {
    // Collect all the policy data from the tabbed form
    // This mirrors the structure used in policy-modal.js
    
    const data = {
        ...currentPolicyData, // Basic policy info from initial creation
        insured: {},
        contact: {},
        coverage: {},
        financial: {},
        vehicles: [],
        drivers: [],
        property: {},
        operations: {},
        documents: [],
        notes: {}
    };
    
    // Collect data from each active tab
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        if (!tab) return;
        
        const tabId = tab.id?.replace('-content', '');
        
        switch(tabId) {
            case 'insured':
                tab.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.id && field.value) {
                        const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.id;
                        data.insured[fieldName] = field.value;
                    }
                });
                break;
                
            case 'contact':
                tab.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.id && field.value) {
                        const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.id;
                        data.contact[fieldName] = field.value;
                    }
                });
                break;
                
            case 'coverage':
                tab.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.id && field.value) {
                        const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.id;
                        data.coverage[fieldName] = field.value;
                    }
                });
                break;
                
            case 'financial':
                tab.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.id && field.value) {
                        const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.id;
                        data.financial[fieldName] = field.value;
                    }
                });
                break;
                
            case 'vehicles':
                // Collect vehicle and trailer data for commercial auto
                const vehicleEntries = tab.querySelectorAll('.vehicle-entry');
                vehicleEntries.forEach(entry => {
                    const vehicle = {};
                    const inputs = entry.querySelectorAll('input, select');
                    
                    // Map fields based on their position and placeholder
                    inputs.forEach((field, index) => {
                        if (field.value) {
                            // Map placeholders to proper field names
                            let fieldName = field.placeholder || '';
                            
                            // Clean up field names
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
                        data.vehicles.push(vehicle);
                    }
                });
                
                // Collect trailer data separately
                const trailerEntries = tab.querySelectorAll('.trailer-entry');
                trailerEntries.forEach(entry => {
                    const trailer = {};
                    const inputs = entry.querySelectorAll('input');
                    
                    inputs.forEach((field, index) => {
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
                        data.vehicles.push(trailer);
                    }
                });
                break;
                
            case 'drivers':
                // Collect driver data
                const driverEntries = tab.querySelectorAll('.driver-entry');
                driverEntries.forEach(entry => {
                    const driver = {};
                    entry.querySelectorAll('input, select').forEach(field => {
                        if (field.value) {
                            const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.placeholder || 'unknown';
                            driver[fieldName] = field.value;
                        }
                    });
                    // Collect endorsements for CDL drivers
                    const endorsements = [];
                    entry.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                        endorsements.push(checkbox.parentElement.textContent.trim());
                    });
                    if (endorsements.length > 0) {
                        driver.endorsements = endorsements;
                    }
                    if (Object.keys(driver).length > 0) {
                        data.drivers.push(driver);
                    }
                });
                break;
                
            case 'notes':
                const notesField = tab.querySelector('textarea');
                if (notesField && notesField.value) {
                    data.notes.content = notesField.value;
                }
                break;
        }
    });
    
    return data;
}

function renewPolicy(policyId) {
    console.log('Renewing policy:', policyId);
    showNotification('Policy renewal feature coming soon!', 'info');
}

// Policy Delete Functions
function confirmDeletePolicy(policyId, policyNumber, clientId) {
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'deleteConfirmModal';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 500px;">
            <div class="modal-header" style="background: #dc2626;">
                <h2 style="color: white;">Confirm Delete</h2>
                <button class="close-btn" onclick="document.getElementById('deleteConfirmModal').remove()" style="color: white;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 30px;">
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc2626; margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px;">Are you sure you want to delete this policy?</h3>
                    <p style="color: #6b7280; margin-bottom: 20px;">Policy Number: <strong>${policyNumber}</strong></p>
                    <p style="color: #dc2626; font-weight: 500;">This action cannot be undone!</p>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; justify-content: center; padding: 20px;">
                <button class="btn-secondary" onclick="document.getElementById('deleteConfirmModal').remove()">
                    Cancel
                </button>
                <button class="btn-primary" onclick="deletePolicy('${policyId}', '${clientId || ''}')" style="background: #dc2626; border-color: #dc2626;">
                    <i class="fas fa-trash"></i> Delete Policy
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function deletePolicy(policyId, clientId) {
    // Remove the confirmation modal
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.remove();
    
    // Get policies from localStorage
    let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    // Convert policyId to string for comparison
    const idStr = String(policyId);
    
    // Filter out the policy to delete
    const initialCount = policies.length;
    policies = policies.filter(p => {
        // Check various ID formats
        if (String(p.id) === idStr) return false;
        if (p.policyNumber === idStr) return false;
        if (p.policyNumber && p.policyNumber.includes(idStr)) return false;
        if (p.policyNumber && p.policyNumber.endsWith(idStr)) return false;
        return true;
    });
    
    // Check if a policy was actually deleted
    if (policies.length === initialCount) {
        showNotification('Policy not found', 'error');
        return;
    }
    
    // Save updated policies
    localStorage.setItem('insurance_policies', JSON.stringify(policies));
    
    // Also update clients' policies arrays if needed
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    clients.forEach(client => {
        if (client.policies && Array.isArray(client.policies)) {
            client.policies = client.policies.filter(p => {
                if (String(p.id) === idStr) return false;
                if (p.policyNumber === idStr) return false;
                return true;
            });
        }
    });
    localStorage.setItem('insurance_clients', JSON.stringify(clients));
    
    // Show success notification
    showNotification('Policy deleted successfully', 'success');
    
    // Refresh the current view
    // Use the passed clientId if available, otherwise try to determine from context
    const refreshClientId = clientId || window.currentViewingClientId;
    
    if (refreshClientId) {
        // Refresh the client view
        viewClient(refreshClientId);
    } else if (window.location.hash === '#policies') {
        // If we're in the policies view, refresh it
        loadPoliciesView();
    } else {
        // Try to detect if we're in a client view
        const clientProfileView = document.querySelector('.client-profile-view');
        if (clientProfileView) {
            // Try to find client ID from localStorage by matching policies
            const allClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            for (const client of allClients) {
                if (client.policies && client.policies.some(p => p.id === policyId || p.policyNumber === policyId)) {
                    viewClient(client.id);
                    return;
                }
            }
            // Fallback: reload the page if we can't determine the client
            location.reload();
        }
    }
}

// Client Management Functions
function viewClient(id) {
    console.log('Viewing client:', id);
    // Store the current client ID globally for other functions to use
    window.currentViewingClientId = id;
    
    // Get actual client data from localStorage
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id == id);
    
    if (!client) {
        showNotification('Client not found', 'error');
        loadClientsView();
        return;
    }
    
    // Get all policies for this client from insurance_policies storage
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    // Filter policies that belong to this client
    // Check by client ID, client name, or insured name
    const clientPolicies = allPolicies.filter(policy => {
        // Check if policy has a clientId that matches
        if (policy.clientId && String(policy.clientId) === String(id)) return true;
        
        // Check if the insured name matches the client name
        const insuredName = policy.insured?.['Name/Business Name'] || 
                           policy.insured?.['Primary Named Insured'] || 
                           policy.insuredName;
        if (insuredName && client.name && insuredName.toLowerCase() === client.name.toLowerCase()) return true;
        
        // Check if policy is in the client's policies array (by ID or policy number)
        if (client.policies && Array.isArray(client.policies)) {
            return client.policies.some(p => {
                if (typeof p === 'string') {
                    return p === policy.id || p === policy.policyNumber;
                }
                if (typeof p === 'object' && p) {
                    return p.id === policy.id || p.policyNumber === policy.policyNumber;
                }
                return false;
            });
        }
        
        return false;
    });
    
    // Calculate total premium from all client policies
    let calculatedTotalPremium = 0;
    clientPolicies.forEach(policy => {
        // Get premium value from various possible locations
        const premiumValue = policy.financial?.['Annual Premium'] || 
                            policy.financial?.['Premium'] || 
                            policy.financial?.['Monthly Premium'] ||
                            policy.premium || 
                            policy.monthlyPremium ||
                            policy.annualPremium || 0;
        
        // Convert to number and add to total
        const numericPremium = typeof premiumValue === 'string' ? 
            parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 : 
            parseFloat(premiumValue) || 0;
        
        // If it's monthly, multiply by 12 for annual
        if (policy.financial?.['Monthly Premium'] || policy.monthlyPremium) {
            calculatedTotalPremium += numericPremium * 12;
        } else {
            calculatedTotalPremium += numericPremium;
        }
    });
    
    // Format client data for display
    const clientData = {
        name: client.name,
        type: client.type || 'Personal',
        phone: client.phone,
        email: client.email,
        address: client.address || 'No address on file',
        company: client.company || '',
        accountManager: client.accountManager || 'Unassigned',
        clientSince: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A',
        totalPremium: calculatedTotalPremium > 0 ? `$${calculatedTotalPremium.toLocaleString()}/yr` : '$0/yr',
        policies: clientPolicies, // Use the filtered policies from insurance_policies
        quotes: client.quotes || [],
        claims: client.claims || [],
        notes: client.notes || client.conversionNotes || 'No notes on file',
        convertedFrom: client.convertedFrom || null
    };
    
    // Load the client profile view
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    dashboardContent.innerHTML = `
        <div class="client-profile-view">
            <header class="content-header">
                <div class="header-back">
                    <button class="btn-back" onclick="loadClientsView()">
                        <i class="fas fa-arrow-left"></i> Back to Clients
                    </button>
                    <h1>Client Profile</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="editClient('${id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-secondary" onclick="addPolicyToClient('${id}')">
                        <i class="fas fa-file-contract"></i> Add Policy
                    </button>
                    <button class="btn-primary" onclick="showNewQuote()">
                        <i class="fas fa-plus"></i> New Quote
                    </button>
                </div>
            </header>
            
            <div class="client-profile-grid">
                <!-- Client Information Card -->
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="profile-avatar">${clientData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                        <div class="profile-title">
                            <h2>${clientData.name}</h2>
                            ${clientData.company ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">${clientData.company}</p>` : ''}
                            <span class="badge badge-${clientData.type === 'Commercial' ? 'purple' : 'blue'}">${clientData.type}</span>
                            ${clientData.convertedFrom === 'lead' ? '<span class="badge badge-green" style="margin-left: 8px;">Converted Lead</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Contact Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Phone</label>
                                <p>${clientData.phone}</p>
                            </div>
                            <div class="info-item">
                                <label>Email</label>
                                <p>${clientData.email}</p>
                            </div>
                            <div class="info-item">
                                <label>Address</label>
                                <p>${clientData.address}</p>
                            </div>
                            <div class="info-item">
                                <label>Account Manager</label>
                                <p>${clientData.accountManager}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Account Details</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Client Since</label>
                                <p>${clientData.clientSince}</p>
                            </div>
                            <div class="info-item">
                                <label>Total Premium</label>
                                <p class="text-primary">${clientData.totalPremium}</p>
                            </div>
                            <div class="info-item">
                                <label>Active Policies</label>
                                <p>${clientData.policies.length}</p>
                            </div>
                            <div class="info-item">
                                <label>Claims History</label>
                                <p>${clientData.claims.length} claims</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Notes</h3>
                        <p class="notes-text">${clientData.notes}</p>
                    </div>
                </div>
                
                <!-- Policies Section -->
                <div class="profile-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">Active Policies</h3>
                        <button class="btn-primary" onclick="addPolicyToClient('${id}')" style="padding: 8px 16px; font-size: 14px;">
                            <i class="fas fa-plus"></i> Add Policy
                        </button>
                    </div>
                    <div class="policies-list">
                        ${generateClientPoliciesList(clientData.policies)}
                        ${client.policies > 1 ? `
                        <div class="policy-item">
                            <div class="policy-header">
                                <span class="policy-number">POL-2024-0389</span>
                                <span class="status-badge active">Active</span>
                            </div>
                            <div class="policy-details">
                                <p><strong>${client.type === 'Commercial Auto' ? 'Cargo Insurance' : client.type === 'Commercial' ? 'Property' : 'Homeowners'}</strong></p>
                                <p>Liberty Mutual • $${client.type === 'Commercial Auto' ? '8,000' : client.type === 'Commercial' ? '4,300' : '900'}/year</p>
                                <p>Expires: 03/20/2025</p>
                            </div>
                            <div class="policy-actions">
                                <button class="btn-small">View Details</button>
                                <button class="btn-small">Renew</button>
                                <button class="btn-small" style="background: #dc2626; color: white;">Delete</button>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="profile-card">
                    <h3>Recent Activity</h3>
                    <div class="timeline">
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p><strong>Policy Renewed</strong></p>
                                <p class="text-muted">Auto Insurance policy renewed</p>
                                <span class="timeline-date">2 days ago</span>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p><strong>Payment Received</strong></p>
                                <p class="text-muted">Monthly premium payment of $${client.type === 'Commercial Auto' ? '3,750' : '287.50'}</p>
                                <span class="timeline-date">1 week ago</span>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p><strong>Quote Generated</strong></p>
                                <p class="text-muted">New quote for additional coverage</p>
                                <span class="timeline-date">2 weeks ago</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Documents Section -->
                <div class="profile-card">
                    <h3>Documents</h3>
                    <div class="documents-list">
                        <div class="document-item">
                            <i class="fas fa-file-pdf"></i>
                            <div class="document-info">
                                <p>Current Policy Declaration</p>
                                <span class="text-muted">Updated 1 month ago</span>
                            </div>
                            <button class="btn-icon"><i class="fas fa-download"></i></button>
                        </div>
                        <div class="document-item">
                            <i class="fas fa-file-pdf"></i>
                            <div class="document-info">
                                <p>Insurance ID Cards</p>
                                <span class="text-muted">Updated 2 months ago</span>
                            </div>
                            <button class="btn-icon"><i class="fas fa-download"></i></button>
                        </div>
                        <div class="document-item">
                            <i class="fas fa-file-alt"></i>
                            <div class="document-info">
                                <p>Application Form</p>
                                <span class="text-muted">Submitted ${client.clientSince}</span>
                            </div>
                            <button class="btn-icon"><i class="fas fa-download"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function editClient(id) {
    console.log('Editing client:', id);
    showModal('clientModal');
}

function emailClient(id) {
    console.log('Emailing client:', id);
    // Would open email compose modal
}

function deleteClient(id) {
    // Get client data first to show their name
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id === id);
    
    if (!client) {
        alert('Client not found');
        return;
    }
    
    if (confirm(`Are you sure you want to delete client "${client.name}"? This action cannot be undone.`)) {
        // Remove client from array
        const updatedClients = clients.filter(c => c.id !== id);
        
        // Save updated clients list
        localStorage.setItem('insurance_clients', JSON.stringify(updatedClients));
        
        // Show success notification
        showNotification(`Client "${client.name}" has been deleted successfully`, 'success');
        
        // Reload the clients view
        loadClientsView();
        
        // Update dashboard stats if needed
        if (window.DashboardStats) {
            const dashboardStats = new DashboardStats();
            dashboardStats.updateDashboard();
        }
    }
}

function importClients() {
    console.log('Importing clients');
    // Would open import wizard
}

function filterClients() {
    const searchValue = document.getElementById('clientSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#clientsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? '' : 'none';
    });
}

// Policy Management Functions
function viewPolicy(policyId) {
    console.log('Viewing policy:', policyId);
    
    // Get policy from localStorage (use insurance_policies)
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    // Convert policyId to string for comparison
    const idStr = String(policyId);
    
    // Try to find policy by ID, policy number, or even just the number part
    let policy = policies.find(p => {
        // Check exact ID match
        if (String(p.id) === idStr) return true;
        // Check policy number match
        if (p.policyNumber === idStr) return true;
        // Check if the ID is just a number and matches part of the policy number
        if (p.policyNumber && p.policyNumber.includes(idStr)) return true;
        // Check if the policy number ends with the provided ID
        if (p.policyNumber && p.policyNumber.endsWith(idStr)) return true;
        return false;
    });
    
    if (!policy) {
        console.error('Policy not found. Looking for ID:', policyId);
        console.error('Available policies:', policies.map(p => ({ id: p.id, policyNumber: p.policyNumber })));
        showNotification('Policy not found', 'error');
        return;
    }
    
    // Show the policy details in a tabbed modal
    showPolicyDetailsModal(policy);
}

function showPolicyDetailsModal(policy) {
    const policyType = policy.policyType || 'general';
    
    // Generate tabs based on policy type
    const tabs = generateViewTabsForPolicyType(policyType);
    
    // Create modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.id = 'policyViewModal';
    
    // Determine policy type label for header badge
    const policyTypeLabel = policyType === 'commercial-auto' ? 'Commercial Auto' :
                            policyType === 'personal-auto' ? 'Personal Auto' :
                            policyType ? policyType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
    
    modalOverlay.innerHTML = `
        <div class="modal-container large" style="max-width: 1400px; width: 92%; padding: 0; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border-radius: 12px;">
            <div class="modal-header" style="padding: 32px 40px; border-bottom: 2px solid #e5e7eb; background: linear-gradient(135deg, #0066cc 0%, #004999 100%);">
                <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                    ${policyTypeLabel ? `<span class="policy-type-badge" style="background: rgba(255, 255, 255, 0.2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid rgba(255, 255, 255, 0.3);">${policyTypeLabel}</span>` : ''}
                    <h2 style="margin: 0; color: white; font-size: 28px; font-weight: 600; letter-spacing: -0.025em;">Policy Details - ${policy.policyNumber}</h2>
                </div>
                <button class="close-btn" onclick="document.getElementById('policyViewModal').remove()" style="background: rgba(255, 255, 255, 0.9); border: 2px solid white; color: #0066cc; font-size: 24px; font-weight: bold; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 75vh; overflow-y: auto; padding: 40px; background: #ffffff;">
                <!-- Policy Status Bar -->
                <div style="background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%); padding: 24px 30px; border-radius: 12px; margin-bottom: 35px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);">
                    <div>
                        <span class="status-badge ${(policy.policyStatus || policy.status || 'active').toLowerCase()}" style="margin-right: 15px; padding: 10px 18px; font-size: 14px; border-radius: 6px; font-weight: 500;">
                            ${policy.policyStatus || policy.status || 'Active'}
                        </span>
                        <span style="margin-left: 10px; color: #6b7280; font-size: 15px; font-weight: 500;">
                            <i class="fas fa-building"></i> ${policy.carrier || 'N/A'}
                        </span>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn-secondary" onclick="editPolicy('${policy.id || policy.policyNumber}')" style="padding: 12px 24px; font-size: 14px; border-radius: 8px; transition: all 0.2s;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-secondary" onclick="printPolicy('${policy.id || policy.policyNumber}')" style="padding: 12px 24px; font-size: 14px; border-radius: 8px; transition: all 0.2s;">
                            <i class="fas fa-print"></i> Print
                        </button>
                    </div>
                </div>
                
                <!-- Tab Navigation -->
                <div class="policy-tabs" style="margin-bottom: 30px; padding: 5px; background: #f3f4f6; border-radius: 10px;">
                    ${tabs.map((tab, index) => `
                        <button class="tab-btn ${index === 0 ? 'active' : ''}" data-tab="${tab.id}" onclick="switchViewTab('${tab.id}')" style="padding: 14px 24px; font-size: 14px; border-radius: 8px; transition: all 0.2s; margin: 2px;">
                            <i class="${tab.icon}" style="margin-right: 6px;"></i> ${tab.name}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Tab Contents -->
                <div class="tab-contents" style="padding: 35px; background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                    ${tabs.map((tab, index) => `
                        <div id="${tab.id}-view-content" class="tab-content ${index === 0 ? 'active' : ''}" style="padding: 15px;">
                            ${generateViewTabContent(tab.id, policy)}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
}

function generateViewTabsForPolicyType(policyType) {
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
            { id: 'property', name: 'Property', icon: 'fas fa-home' }
        );
    }
    
    return baseTabs;
}

function generateViewTabContent(tabId, policy) {
    switch(tabId) {
        case 'overview':
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Policy Overview</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Policy Number</label>
                            <p style="font-size: 17px; font-weight: 600; margin: 0; color: #111827;">${policy.policyNumber || 'N/A'}</p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Policy Type</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${getPolicyTypeLabel(policy.policyType) || 'N/A'}</p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Carrier</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${policy.carrier || 'N/A'}</p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Status</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">
                                <span class="status-badge ${(policy.policyStatus || 'active').toLowerCase()}">
                                    ${policy.policyStatus || 'Active'}
                                </span>
                            </p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Effective Date</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${formatDate(policy.effectiveDate) || 'N/A'}</p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Expiration Date</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${formatDate(policy.expirationDate) || 'N/A'}</p>
                        </div>
                        ${policy.clientName ? `
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Client</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${policy.clientName}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
        case 'insured':
            const insuredData = policy.insured || {};
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Named Insured Information</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        ${Object.entries(insuredData).map(([key, value]) => `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                <p style="font-size: 17px; margin: 0; color: #374151;">${value || 'N/A'}</p>
                            </div>
                        `).join('')}
                        ${Object.keys(insuredData).length === 0 ? '<p style="color: #6b7280;">No insured information available</p>' : ''}
                    </div>
                </div>
            `;
            
        case 'contact':
            const contactData = policy.contact || {};
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Contact Information</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        ${Object.entries(contactData).map(([key, value]) => `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                <p style="font-size: 17px; margin: 0; color: #374151;">${value || 'N/A'}</p>
                            </div>
                        `).join('')}
                        ${Object.keys(contactData).length === 0 ? '<p style="color: #6b7280;">No contact information available</p>' : ''}
                    </div>
                </div>
            `;
            
        case 'vehicles':
            const vehicles = Array.isArray(policy.vehicles) ? policy.vehicles : [];
            if (vehicles.length === 0) {
                return `
                    <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                        <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Vehicles & Trailers</h3>
                        <p style="color: #6b7280; font-size: 16px;">No vehicles or trailers on this policy</p>
                    </div>
                `;
            }
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Vehicles & Trailers</h3>
                    ${vehicles.map((vehicle, index) => `
                        <div style="background: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                            <h4 style="margin-top: 0; color: #374151;">
                                ${vehicle.Type === 'Trailer' ? 'Trailer' : 'Vehicle'} ${index + 1}
                            </h4>
                            <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                ${Object.entries(vehicle).map(([key, value]) => `
                                    <div class="view-item">
                                        <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                        <p style="font-size: 14px; margin: 0;">${value || 'N/A'}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'drivers':
            const drivers = Array.isArray(policy.drivers) ? policy.drivers : [];
            if (drivers.length === 0) {
                return `
                    <div class="form-section" style="padding: 20px; background: #f9fafb; border-radius: 8px;">
                        <h3 style="margin-top: 0; margin-bottom: 25px; color: #111827; font-size: 20px;">Drivers</h3>
                        <p style="color: #6b7280; font-size: 15px;">No drivers on this policy</p>
                    </div>
                `;
            }
            return `
                <div class="form-section" style="padding: 20px; background: #f9fafb; border-radius: 8px;">
                    <h3 style="margin-top: 0; margin-bottom: 25px; color: #111827; font-size: 20px;">Drivers</h3>
                    ${drivers.map((driver, index) => `
                        <div style="background: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                            <h4 style="margin-top: 0; color: #374151;">Driver ${index + 1}</h4>
                            <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                ${Object.entries(driver).filter(([key]) => key !== 'endorsements').map(([key, value]) => `
                                    <div class="view-item">
                                        <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                        <p style="font-size: 14px; margin: 0;">${value || 'N/A'}</p>
                                    </div>
                                `).join('')}
                                ${driver.endorsements ? `
                                    <div class="view-item" style="grid-column: span 2;">
                                        <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Endorsements</label>
                                        <p style="font-size: 14px; margin: 0;">${driver.endorsements.join(', ')}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'coverage':
            const coverageData = policy.coverage || {};
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Coverage Details</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        ${Object.entries(coverageData).map(([key, value]) => `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                <p style="font-size: 17px; margin: 0; font-weight: 600; color: #059669;">${value || 'N/A'}</p>
                            </div>
                        `).join('')}
                        ${Object.keys(coverageData).length === 0 ? '<p style="color: #6b7280;">No coverage information available</p>' : ''}
                    </div>
                </div>
            `;
            
        case 'financial':
            const financialData = policy.financial || {};
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Financial Information</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        ${Object.entries(financialData).map(([key, value]) => `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                <p style="font-size: 17px; margin: 0; ${key.toLowerCase().includes('premium') ? 'font-weight: 600; color: #2563eb;' : 'color: #374151;'}">${value || 'N/A'}</p>
                            </div>
                        `).join('')}
                        ${Object.keys(financialData).length === 0 ? `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Annual Premium</label>
                                <p style="font-size: 16px; margin: 0; font-weight: 600; color: #2563eb;">${policy.premium ? `$${policy.premium}` : 'N/A'}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
        case 'documents':
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Policy Documents</h3>
                    <p style="color: #6b7280; font-size: 16px; margin-bottom: 25px;">No documents uploaded for this policy</p>
                    <button class="btn-secondary" style="margin-top: 20px; padding: 12px 24px; font-size: 14px; border-radius: 8px;">
                        <i class="fas fa-upload"></i> Upload Document
                    </button>
                </div>
            `;
            
        case 'notes':
            const notes = policy.notes?.content || policy.notes || '';
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Policy Notes</h3>
                    <div style="background: #ffffff; padding: 30px; border-radius: 12px; min-height: 150px; border: 2px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                        <p style="margin: 0; white-space: pre-wrap; font-size: 16px; line-height: 1.6; color: #374151;">${notes || 'No notes for this policy'}</p>
                    </div>
                </div>
            `;
            
        default:
            return '<p>No information available for this section</p>';
    }
}

function switchViewTab(tabId) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('#policyViewModal .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('#policyViewModal .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`#policyViewModal .tab-btn[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`${tabId}-view-content`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
}

function getPolicyTypeBadgeColor(policyType) {
    if (policyType === 'commercial-auto') return 'orange';
    if (policyType?.includes('commercial')) return 'purple';
    if (policyType?.includes('life')) return 'green';
    return 'blue';
}

function getPolicyTypeLabel(policyType) {
    const labels = {
        'personal-auto': 'Personal Auto',
        'commercial-auto': 'Commercial Auto',
        'homeowners': 'Homeowners',
        'commercial-property': 'Commercial Property',
        'general-liability': 'General Liability',
        'professional-liability': 'Professional Liability',
        'workers-comp': 'Workers Compensation',
        'umbrella': 'Umbrella',
        'life': 'Life',
        'health': 'Health'
    };
    return labels[policyType] || policyType || 'General';
}


function editPolicy(policyId) {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const idStr = String(policyId);
    const policy = policies.find(p => String(p.id) === idStr || p.policyNumber === idStr);
    
    if (policy) {
        // Open the policy modal in edit mode with the existing policy data
        if (typeof showPolicyModal === 'function') {
            showPolicyModal(policy);
        } else {
            showNotification('Edit feature coming soon', 'info');
        }
    } else {
        showNotification('Policy not found', 'error');
    }
}

function deletePolicy(policyId) {
    if (confirm('Are you sure you want to delete this policy?')) {
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const idStr = String(policyId);
        const updatedPolicies = policies.filter(p => String(p.id) !== idStr && p.policyNumber !== idStr);
        localStorage.setItem('insurance_policies', JSON.stringify(updatedPolicies));
        
        // Close modal
        const modal = document.getElementById('policyViewModal');
        if (modal) modal.remove();
        
        showNotification('Policy deleted successfully', 'success');
        
        // Refresh current view
        if (document.querySelector('.policies-view')) {
            loadPoliciesView();
        }
    }
}



function printPolicy(policyId) {
    console.log('Printing policy:', policyId);
    window.print();
}

function downloadPolicy(policyId) {
    console.log('Downloading policy:', policyId);
    showNotification('Preparing policy documents for download...', 'info');
}

function showNewPolicy() {
    // Use the new tabbed policy modal from policy-modal.js
    if (typeof showPolicyModal === 'function') {
        showPolicyModal();
    } else {
        console.error('Policy modal script not loaded');
    }
}

// Policy modal functions have been moved to policy-modal.js
// The new implementation includes tabbed organization and enhanced vehicle/trailer fields

function generatePolicyRows() {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    if (policies.length === 0) {
        // Show message when no policies exist
        return `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 16px; margin: 0;">No policies found</p>
                    <p style="font-size: 14px; margin-top: 8px;">Click "New Policy" to create your first policy</p>
                </td>
            </tr>
        `;
    }
    
    // Generate rows for actual saved policies
    return policies.map(policy => {
        // Ensure policy type is available - check multiple possible locations
        const policyType = policy.policyType || policy.type || (policy.overview && policy.overview['Policy Type'] ? 
            policy.overview['Policy Type'].toLowerCase().replace(/\s+/g, '-') : 'unknown');
        const typeLabel = getPolicyTypeLabel(policyType);
        const badgeClass = getBadgeClass(policyType);
        const statusClass = getStatusClass(policy.policyStatus || policy.status);
        // Check multiple possible locations for the premium
        const premiumValue = policy.financial?.['Annual Premium'] || 
                            policy.financial?.['Premium'] || 
                            policy.financial?.['Monthly Premium'] ||
                            policy.premium || 
                            policy.monthlyPremium ||
                            policy.annualPremium ||
                            0;
        
        // Format the premium value
        const premium = typeof premiumValue === 'number' ? 
                       `$${premiumValue.toLocaleString()}` : 
                       (premiumValue?.toString().startsWith('$') ? premiumValue : `$${premiumValue || '0.00'}`);
        const insuredName = policy.insured?.['Name/Business Name'] || policy.insured?.['Primary Named Insured'] || 'N/A';
        
        return `
            <tr>
                <td class="policy-number">${policy.policyNumber}</td>
                <td>${insuredName}</td>
                <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
                <td>${policy.carrier}</td>
                <td>${formatDate(policy.effectiveDate)}</td>
                <td>${formatDate(policy.expirationDate)}</td>
                <td>${premium}/yr</td>
                <td><span class="status-badge ${statusClass}">${formatStatus(policy.policyStatus)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewPolicy('${policy.id}')"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="editPolicy('${policy.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="renewPolicy('${policy.id}')"><i class="fas fa-sync"></i></button>
                        <button class="btn-icon btn-icon-danger" onclick="deletePolicy('${policy.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getPolicyTypeLabel(type) {
    if (!type || type === 'unknown') return 'Unknown';
    
    // Normalize the type to lowercase for matching
    const normalizedType = type.toString().toLowerCase();
    
    const labels = {
        'personal-auto': 'Personal Auto',
        'commercial-auto': 'Commercial Auto',
        'homeowners': 'Homeowners',
        'commercial-property': 'Commercial Property',
        'general-liability': 'General Liability',
        'professional-liability': 'Professional',
        'workers-comp': 'Workers Comp',
        'workers-compensation': 'Workers Comp',
        'umbrella': 'Umbrella',
        'life': 'Life',
        'health': 'Health'
    };
    
    // Try to match the normalized type
    if (labels[normalizedType]) {
        return labels[normalizedType];
    }
    
    // If no match, capitalize the first letter of each word
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getBadgeClass(type) {
    if (!type) return 'badge-gray';
    const typeStr = type.toString().toLowerCase();
    if (typeStr.includes('commercial')) return 'badge-orange';
    if (typeStr.includes('auto')) return 'badge-blue';
    if (typeStr.includes('home')) return 'badge-green';
    if (typeStr.includes('liability')) return 'badge-purple';
    return 'badge-gray';
}

function getStatusClass(status) {
    if (!status) return 'active'; // Default to active if no status
    const statusLower = status.toLowerCase();
    if (statusLower === 'active' || statusLower === 'in-force') return 'active';
    if (statusLower === 'pending') return 'pending';
    if (statusLower === 'expired' || statusLower === 'cancelled' || statusLower === 'non-renewed') return 'expired';
    return 'active';
}

function formatStatus(status) {
    if (!status) return 'Active';
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}


function exportPolicies() {
    console.log('Exporting policies');
    showNotification('Exporting policies to CSV...', 'info');
}

// Rating Engine Functions
function runRating() {
    const resultsSection = document.getElementById('ratingResults');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.innerHTML = `
            <h3>Available Quotes</h3>
            <div class="carrier-quotes">
                <div class="quote-result">
                    <div class="carrier-name">Progressive</div>
                    <div class="quote-premium">$1,245/year</div>
                    <button class="btn-primary">Select</button>
                </div>
                <div class="quote-result">
                    <div class="carrier-name">State Farm</div>
                    <div class="quote-premium">$1,189/year</div>
                    <button class="btn-primary">Select</button>
                </div>
                <div class="quote-result">
                    <div class="carrier-name">Liberty Mutual</div>
                    <div class="quote-premium">$1,367/year</div>
                    <button class="btn-primary">Select</button>
                </div>
            </div>
        `;
    }
}

function loadQuoteTemplate() {
    console.log('Loading quote template');
    // Would populate form with template data
}

// Accounting Functions
function runReconciliation() {
    console.log('Running reconciliation');
    showNotification('Reconciliation started', 'info');
}

function createInvoice() {
    console.log('Creating invoice');
    // Would open invoice creation modal
}

// Reports Functions
function runReport(type) {
    console.log('Running report:', type);
    showNotification(`Generating ${type} report...`, 'info');
    
    // Simulate report generation
    setTimeout(() => {
        showNotification('Report generated successfully', 'success');
    }, 2000);
}

function scheduleReport() {
    console.log('Scheduling report');
    // Would open scheduling modal
}

function createCustomReport() {
    console.log('Creating custom report');
    // Would open report builder
}

// Communications Functions
function createTemplate() {
    console.log('Creating template');
    // Would open template editor
}

function composeCampaign() {
    console.log('Composing campaign');
    // Would open campaign composer
}

// Carrier Functions
// Carrier Management Functions
function addCarrier() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>Add New Carrier</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <form id="addCarrierForm">
                    <div class="form-group">
                        <label>Carrier Name</label>
                        <input type="text" id="carrierName" required>
                    </div>
                    <div class="form-group">
                        <label>Commission Rate (%)</label>
                        <input type="text" id="carrierCommission" placeholder="e.g., 15%" required>
                    </div>
                    <div class="form-group">
                        <label>Products</label>
                        <input type="text" id="carrierProducts" placeholder="e.g., Auto, Home, Life" required>
                    </div>
                    <div class="form-group">
                        <label>Portal URL</label>
                        <input type="url" id="carrierPortal" placeholder="https://..." required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Add Carrier</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('addCarrierForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
        const newCarrier = {
            id: Date.now(),
            name: document.getElementById('carrierName').value,
            commission: document.getElementById('carrierCommission').value,
            products: document.getElementById('carrierProducts').value,
            policies: 0,
            premium: '$0',
            logo: 'https://via.placeholder.com/120x60',
            portalUrl: document.getElementById('carrierPortal').value
        };
        carriers.push(newCarrier);
        localStorage.setItem('carriers', JSON.stringify(carriers));
        modal.remove();
        loadCarriersView();
        showNotification('Carrier added successfully!', 'success');
    });
}

function deleteCarrier(carrierId) {
    if (confirm('Are you sure you want to delete this carrier?')) {
        let carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
        carriers = carriers.filter(c => c.id !== carrierId);
        localStorage.setItem('carriers', JSON.stringify(carriers));
        loadCarriersView();
        showNotification('Carrier deleted successfully!', 'success');
    }
}

function openCarrierPortal(carrierId) {
    const carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
    const carrier = carriers.find(c => c.id === carrierId);
    if (carrier && carrier.portalUrl) {
        window.open(carrier.portalUrl, '_blank');
    } else {
        showNotification('Portal URL not configured for this carrier', 'warning');
    }
}

function viewCarrierDetails(carrierId) {
    const carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
    const carrier = carriers.find(c => c.id === carrierId);
    if (!carrier) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 600px;">
            <div class="modal-header">
                <h2>${carrier.name} Details</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="carrier-detail-grid">
                    <div class="detail-row">
                        <label>Carrier Name:</label>
                        <span>${carrier.name}</span>
                    </div>
                    <div class="detail-row">
                        <label>Commission Rate:</label>
                        <span>${carrier.commission}</span>
                    </div>
                    <div class="detail-row">
                        <label>Products:</label>
                        <span>${carrier.products}</span>
                    </div>
                    <div class="detail-row">
                        <label>Active Policies:</label>
                        <span>${carrier.policies}</span>
                    </div>
                    <div class="detail-row">
                        <label>YTD Premium:</label>
                        <span>${carrier.premium}</span>
                    </div>
                    <div class="detail-row">
                        <label>Portal URL:</label>
                        <span><a href="${carrier.portalUrl}" target="_blank">${carrier.portalUrl}</a></span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="editCarrier(${carrier.id})">Edit</button>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function editCarrier(carrierId) {
    const carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
    const carrier = carriers.find(c => c.id === carrierId);
    if (!carrier) return;
    
    // Close any existing modal
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>Edit ${carrier.name}</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <form id="editCarrierForm">
                    <div class="form-group">
                        <label>Carrier Name</label>
                        <input type="text" id="editCarrierName" value="${carrier.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Commission Rate</label>
                        <input type="text" id="editCarrierCommission" value="${carrier.commission}" required>
                    </div>
                    <div class="form-group">
                        <label>Products</label>
                        <input type="text" id="editCarrierProducts" value="${carrier.products}" required>
                    </div>
                    <div class="form-group">
                        <label>Portal URL</label>
                        <input type="url" id="editCarrierPortal" value="${carrier.portalUrl}" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editCarrierForm').addEventListener('submit', function(e) {
        e.preventDefault();
        carrier.name = document.getElementById('editCarrierName').value;
        carrier.commission = document.getElementById('editCarrierCommission').value;
        carrier.products = document.getElementById('editCarrierProducts').value;
        carrier.portalUrl = document.getElementById('editCarrierPortal').value;
        
        localStorage.setItem('carriers', JSON.stringify(carriers));
        modal.remove();
        loadCarriersView();
        showNotification('Carrier updated successfully!', 'success');
    });
}

// Producer Functions
function addProducer() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>Add New Producer</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <form id="addProducerForm">
                    <div class="form-group" style="text-align: center;">
                        <label>Profile Picture</label>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin: 1rem 0;">
                            <div class="user-avatar" id="previewAvatar" style="width: 80px; height: 80px; min-width: 80px; min-height: 80px; font-size: 1.5rem;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('avatarUpload').click()">
                                    <i class="fas fa-upload"></i> Upload Photo
                                </button>
                                <button type="button" class="btn-secondary" onclick="selectAvatarColor(0)">
                                    <i class="fas fa-palette"></i> Choose Color
                                </button>
                                <input type="file" id="avatarUpload" accept="image/*" style="display: none;" onchange="previewAvatar(event)">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="producerName" required onkeyup="updateAvatarInitials(this.value)">
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="producerRole" required>
                            <option value="">Select Role</option>
                            <option value="Producer">Producer</option>
                            <option value="Senior Producer">Senior Producer</option>
                            <option value="Account Manager">Account Manager</option>
                            <option value="CSR">CSR</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>License Number</label>
                        <input type="text" id="producerLicense" placeholder="LIC-XXXXXX" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="producerEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="producerPhone" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Add Producer</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('addProducerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Producer added successfully!', 'success');
        modal.remove();
        loadProducersView();
    });
}

function editProducer(id, name) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>Edit Producer: ${name}</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <form id="editProducerForm">
                    <div class="form-group" style="text-align: center;">
                        <label>Profile Picture</label>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin: 1rem 0;">
                            <div class="user-avatar" id="previewAvatar" style="width: 80px; height: 80px; min-width: 80px; min-height: 80px; font-size: 1.5rem;">
                                ${name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('avatarUpload').click()">
                                    <i class="fas fa-upload"></i> Upload Photo
                                </button>
                                <button type="button" class="btn-secondary" onclick="selectAvatarColor(${id})">
                                    <i class="fas fa-palette"></i> Change Color
                                </button>
                                <input type="file" id="avatarUpload" accept="image/*" style="display: none;" onchange="previewAvatar(event)">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="producerName" value="${name}" required onkeyup="updateAvatarInitials(this.value)">
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="producerRole" required>
                            <option value="Producer" ${id === 2 ? 'selected' : ''}>Producer</option>
                            <option value="Senior Producer" ${id === 1 ? 'selected' : ''}>Senior Producer</option>
                            <option value="Account Manager">Account Manager</option>
                            <option value="CSR">CSR</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>License Number</label>
                        <input type="text" id="producerLicense" value="LIC-${id === 1 ? '123456' : '234567'}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="producerEmail" value="${name.toLowerCase().replace(' ', '.')}@vanguardins.com" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="producerPhone" value="(555) ${id === 1 ? '123-4567' : '234-5678'}" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editProducerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Producer updated successfully!', 'success');
        modal.remove();
        loadProducersView();
    });
}

// Avatar helper functions
function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatar = document.getElementById('previewAvatar');
            avatar.style.backgroundImage = `url(${e.target.result})`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.innerHTML = ''; // Clear initials when image is set
        };
        reader.readAsDataURL(file);
    }
}

function updateAvatarInitials(name) {
    const avatar = document.getElementById('previewAvatar');
    if (!avatar.style.backgroundImage || avatar.style.backgroundImage === 'none') {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatar.innerHTML = initials;
    }
}

function selectAvatarColor(producerId) {
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    ];
    
    const colorModal = document.createElement('div');
    colorModal.className = 'modal-overlay active';
    colorModal.style.zIndex = '10001'; // Higher than parent modal
    colorModal.innerHTML = `
        <div class="modal-container" style="max-width: 400px;">
            <div class="modal-header">
                <h2>Select Avatar Color</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: 1rem;">
                    ${colors.map((color, index) => `
                        <div 
                            style="width: 60px; height: 60px; background: ${color}; border-radius: 50%; cursor: pointer; transition: transform 0.2s;"
                            onclick="applyAvatarColor('${color.replace(/'/g, "\\'")}'); this.closest('.modal-overlay').remove();"
                            onmouseover="this.style.transform='scale(1.1)'"
                            onmouseout="this.style.transform='scale(1)'"
                        ></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(colorModal);
}

function applyAvatarColor(color) {
    const avatar = document.getElementById('previewAvatar');
    avatar.style.background = color;
    avatar.style.backgroundImage = 'none'; // Clear any uploaded image
    // Re-set initials if needed
    const nameInput = document.getElementById('producerName');
    if (nameInput && nameInput.value) {
        updateAvatarInitials(nameInput.value);
    }
}

function viewProducerStats(id, name) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 800px;">
            <div class="modal-header">
                <h2>${name} - Performance Stats</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    <div class="stat-card">
                        <h4>YTD Sales</h4>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #0066cc;">$${id === 1 ? '450,000' : '320,000'}</p>
                        <span style="color: green;">+${id === 1 ? '15' : '12'}% from last year</span>
                    </div>
                    <div class="stat-card">
                        <h4>Active Clients</h4>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #0066cc;">${id === 1 ? '342' : '256'}</p>
                        <span style="color: green;">+${id === 1 ? '28' : '19'} this month</span>
                    </div>
                    <div class="stat-card">
                        <h4>Commission Earned</h4>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #0066cc;">$${id === 1 ? '67,500' : '48,000'}</p>
                        <span style="color: green;">15% average rate</span>
                    </div>
                </div>
                
                <h3>Recent Activity</h3>
                <table class="data-table" style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Policy Type</th>
                            <th>Premium</th>
                            <th>Commission</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>12/28/2024</td>
                            <td>ABC Corp</td>
                            <td>Commercial Auto</td>
                            <td>$12,000</td>
                            <td>$1,800</td>
                        </tr>
                        <tr>
                            <td>12/27/2024</td>
                            <td>Johnson LLC</td>
                            <td>General Liability</td>
                            <td>$8,500</td>
                            <td>$1,275</td>
                        </tr>
                        <tr>
                            <td>12/26/2024</td>
                            <td>Smith Family</td>
                            <td>Auto + Home</td>
                            <td>$3,200</td>
                            <td>$480</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="modal-footer" style="margin-top: 2rem;">
                    <button class="btn-secondary" onclick="window.print()">Print Report</button>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Analytics Functions
function initializeAnalyticsCharts() {
    // Premium Mini Chart
    const premiumMiniCtx = document.getElementById('premiumMiniChart');
    if (premiumMiniCtx) {
        new Chart(premiumMiniCtx, {
            type: 'line',
            data: {
                labels: ['W1', 'W2', 'W3', 'W4'],
                datasets: [{
                    data: [1.8, 2.1, 2.0, 2.3],
                    borderColor: '#0066cc',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }
    
    // Premium Trend Chart
    const premiumTrendCtx = document.getElementById('premiumTrendChart');
    if (premiumTrendCtx) {
        new Chart(premiumTrendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Premium ($M)',
                    data: [6.2, 6.8, 7.1, 7.5, 7.9, 8.4],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Policy Type Chart
    const policyTypeCtx = document.getElementById('policyTypeChart');
    if (policyTypeCtx) {
        new Chart(policyTypeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Auto', 'Home', 'Commercial', 'Life', 'Other'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        '#0066cc',
                        '#4d94ff',
                        '#8b5cf6',
                        '#10b981',
                        '#f59e0b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function exportAnalytics() {
    showNotification('Exporting analytics data...', 'info');
}

function refreshAnalytics() {
    showNotification('Refreshing analytics...', 'info');
    loadAnalyticsView();
}

// Integration Functions
function addIntegration() {
    openIntegrationMarketplace();
}

function openIntegrationMarketplace() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 1200px; height: 90vh;">
            <div class="modal-header">
                <h2>Integration Marketplace</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body" style="overflow-y: auto;">
                <div style="display: flex; gap: 2rem; margin-bottom: 2rem;">
                    <input type="text" id="integrationSearch" placeholder="Search integrations..." 
                           style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px;"
                           onkeyup="filterIntegrations(this.value)">
                    <select id="categoryFilter" onchange="filterByCategory(this.value)" 
                            style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="">All Categories</option>
                        <option value="Carriers">Carriers</option>
                        <option value="Dialer & Communication">Dialer & Communication</option>
                        <option value="Forms & Documents">Forms & Documents</option>
                        <option value="CRM & Sales">CRM & Sales</option>
                        <option value="Accounting">Accounting</option>
                        <option value="E-Signature">E-Signature</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Comparative Rating">Comparative Rating</option>
                        <option value="Agency Management">Agency Management</option>
                        <option value="Communication">Communication</option>
                        <option value="Data & Analytics">Data & Analytics</option>
                    </select>
                </div>
                
                <div id="integrationsList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
                    <!-- ViciBox/Vicidial -->
                    <div class="marketplace-card" data-category="Dialer & Communication" data-name="ViciBox">
                        <div class="card-header" style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 2rem;">📞</span>
                            <div>
                                <h3>ViciBox/Vicidial</h3>
                                <span class="category-badge">Dialer & Communication</span>
                            </div>
                        </div>
                        <p>Open-source contact center suite with predictive dialing, IVR, and call recording</p>
                        <div class="features-list" style="margin: 1rem 0;">
                            <span class="feature-tag">Predictive Dialing</span>
                            <span class="feature-tag">Call Recording</span>
                            <span class="feature-tag">Real-time Reporting</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #666;">Setup: 30 min</span>
                            <button class="btn-primary" onclick="setupIntegration('vicidial')">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                    
                    <!-- ACORD Forms -->
                    <div class="marketplace-card" data-category="Forms & Documents" data-name="ACORD">
                        <div class="card-header" style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 2rem;">📋</span>
                            <div>
                                <h3>ACORD Forms</h3>
                                <span class="category-badge">Forms & Documents</span>
                            </div>
                        </div>
                        <p>Industry-standard insurance forms with auto-fill capabilities</p>
                        <div class="features-list" style="margin: 1rem 0;">
                            <span class="feature-tag">125+ Forms</span>
                            <span class="feature-tag">Auto-fill</span>
                            <span class="feature-tag">E-signature Ready</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #666;">Setup: 10 min</span>
                            <button class="btn-primary" onclick="setupIntegration('acord')">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                    
                    <!-- More integrations will be loaded dynamically -->
                    ${window.integrationMarketplace ? window.integrationMarketplace.slice(2).map(integration => `
                        <div class="marketplace-card" data-category="${integration.category}" data-name="${integration.name}">
                            <div class="card-header" style="display: flex; align-items: center; gap: 1rem;">
                                <span style="font-size: 2rem;">${integration.icon}</span>
                                <div>
                                    <h3>${integration.name}</h3>
                                    <span class="category-badge">${integration.category}</span>
                                </div>
                            </div>
                            <p>${integration.description}</p>
                            <div class="features-list" style="margin: 1rem 0;">
                                ${integration.features.slice(0, 3).map(f => `<span class="feature-tag">${f}</span>`).join('')}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #666;">Setup: ${integration.setupTime}</span>
                                <button class="btn-primary" onclick="setupIntegration('${integration.id}')">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            </div>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function removeIntegration(integrationId) {
    if (confirm('Are you sure you want to remove this integration?')) {
        let activeIntegrations = JSON.parse(localStorage.getItem('activeIntegrations') || '[]');
        activeIntegrations = activeIntegrations.filter(i => i.id !== integrationId);
        localStorage.setItem('activeIntegrations', JSON.stringify(activeIntegrations));
        loadIntegrationsView();
        showNotification('Integration removed successfully', 'success');
    }
}

function disconnectIntegration(integrationId) {
    let activeIntegrations = JSON.parse(localStorage.getItem('activeIntegrations') || '[]');
    const integration = activeIntegrations.find(i => i.id === integrationId);
    if (integration) {
        integration.status = 'disconnected';
        localStorage.setItem('activeIntegrations', JSON.stringify(activeIntegrations));
        loadIntegrationsView();
        showNotification('Integration disconnected', 'info');
    }
}

function reconnectIntegration(integrationId) {
    let activeIntegrations = JSON.parse(localStorage.getItem('activeIntegrations') || '[]');
    const integration = activeIntegrations.find(i => i.id === integrationId);
    if (integration) {
        integration.status = 'connected';
        integration.lastSync = 'Just now';
        localStorage.setItem('activeIntegrations', JSON.stringify(activeIntegrations));
        loadIntegrationsView();
        showNotification('Integration reconnected successfully', 'success');
    }
}

function filterIntegrations(searchTerm) {
    const cards = document.querySelectorAll('.marketplace-card');
    cards.forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const category = card.dataset.category.toLowerCase();
        const match = name.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase());
        card.style.display = match ? 'block' : 'none';
    });
}

function filterByCategory(category) {
    const cards = document.querySelectorAll('.marketplace-card');
    cards.forEach(card => {
        const match = !category || card.dataset.category === category;
        card.style.display = match ? 'block' : 'none';
    });
}

function testIntegration(name) {
    showNotification(`Testing ${name} connection...`, 'info');
    setTimeout(() => {
        showNotification(`${name} connection successful!`, 'success');
    }, 2000);
}

function configureIntegration(integrationId) {
    if (integrationId === 'vicidial') {
        showViciDialConfiguration();
    } else {
        showNotification(`Opening ${integrationId} configuration...`, 'info');
    }
}

// Show ViciDial configuration modal
function showViciDialConfiguration() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'viciConfigModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Configure ViciDial Integration</h2>
                <button class="close-btn" onclick="closeModal('viciConfigModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div class="integration-header" style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 48px;">📞</span>
                        <div>
                            <h3>ViciDial API Connection</h3>
                            <p style="color: #666;">Automatically import sales leads from your ViciDial campaigns</p>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>API Configuration</h4>
                    <div class="form-group">
                        <label>ViciDial Server URL:</label>
                        <input type="text" id="viciUrl" class="form-control" 
                               placeholder="http://your-server/vicidial/non_agent_api.php"
                               value="${localStorage.getItem('vici_api_url') || ''}">
                        <small style="color: #666;">Enter your ViciDial server API endpoint</small>
                    </div>
                    <div class="form-group">
                        <label>API Username:</label>
                        <input type="text" id="viciUser" class="form-control" 
                               placeholder="Enter API username"
                               value="${localStorage.getItem('vici_api_user') || ''}">
                    </div>
                    <div class="form-group">
                        <label>API Password:</label>
                        <input type="password" id="viciPass" class="form-control" 
                               placeholder="Enter API password">
                    </div>
                </div>

                <div class="form-section">
                    <h4>Sync Settings</h4>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="autoSync" checked> 
                            Enable automatic synchronization
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Sync Interval (minutes):</label>
                        <select id="syncInterval" class="form-control">
                            <option value="5">Every 5 minutes</option>
                            <option value="10">Every 10 minutes</option>
                            <option value="15" selected>Every 15 minutes</option>
                            <option value="30">Every 30 minutes</option>
                            <option value="60">Every hour</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Import Lead Status:</label>
                        <div style="margin-top: 10px;">
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" checked disabled> SALE (Always imported)
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" id="importCallback"> CALLBACK
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" id="importInterested"> INTERESTED
                            </label>
                        </div>
                    </div>
                </div>

                <div id="connectionStatus" style="padding: 15px; background: #f9f9f9; border-radius: 8px; margin-top: 20px; display: none;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-spinner fa-spin" id="statusIcon"></i>
                        <span id="statusMessage">Testing connection...</span>
                    </div>
                </div>

                <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn-secondary" onclick="testViciConnection()">
                        <i class="fas fa-plug"></i> Test Connection
                    </button>
                    <button class="btn-primary" onclick="saveViciConfiguration()">
                        <i class="fas fa-save"></i> Save & Connect
                    </button>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <h4>Current Sync Status</h4>
                    <div id="syncStatus" style="margin-top: 15px;">
                        <!-- Sync status will be displayed here -->
                    </div>
                    <button class="btn-secondary" onclick="manualViciSync()" style="margin-top: 10px;">
                        <i class="fas fa-sync"></i> Manual Sync Now
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Load current sync status
    updateViciSyncStatus();
}

// Test ViciDial connection
async function testViciConnection() {
    const url = document.getElementById('viciUrl').value;
    const user = document.getElementById('viciUser').value;
    const pass = document.getElementById('viciPass').value;
    
    if (!url || !user || !pass) {
        showNotification('Please fill in all connection details', 'error');
        return;
    }
    
    const statusDiv = document.getElementById('connectionStatus');
    const statusIcon = document.getElementById('statusIcon');
    const statusMessage = document.getElementById('statusMessage');
    
    statusDiv.style.display = 'block';
    statusIcon.className = 'fas fa-spinner fa-spin';
    statusMessage.textContent = 'Testing connection...';
    
    // Test the connection - use proxy URL if available
    const proxyUrl = window.VICIDIAL_PROXY_URL || url;
    const result = await window.viciDialAPI.init({
        apiUrl: proxyUrl,
        apiUser: user,
        apiPass: pass
    });
    
    if (result.success) {
        statusIcon.className = 'fas fa-check-circle';
        statusIcon.style.color = '#10b981';
        statusMessage.textContent = 'Connection successful!';
        showNotification('ViciDial connection test successful!', 'success');
    } else {
        statusIcon.className = 'fas fa-exclamation-circle';
        statusIcon.style.color = '#ef4444';
        statusMessage.textContent = 'Connection failed. Please check your credentials.';
        showNotification('ViciDial connection test failed', 'error');
    }
}

// Save ViciDial configuration
async function saveViciConfiguration() {
    const url = document.getElementById('viciUrl').value;
    const user = document.getElementById('viciUser').value;
    const pass = document.getElementById('viciPass').value;
    const autoSync = document.getElementById('autoSync').checked;
    const syncInterval = parseInt(document.getElementById('syncInterval').value);
    
    if (!url || !user || !pass) {
        showNotification('Please fill in all connection details', 'error');
        return;
    }
    
    // Save configuration
    localStorage.setItem('vici_api_url', url);
    localStorage.setItem('vici_api_user', user);
    localStorage.setItem('vici_auto_sync', autoSync);
    localStorage.setItem('vici_sync_interval', syncInterval);
    
    // Initialize connection - use proxy URL if available
    const proxyUrl = window.VICIDIAL_PROXY_URL || url;
    const result = await window.viciDialAPI.init({
        apiUrl: proxyUrl,
        apiUser: user,
        apiPass: pass
    });
    
    if (result.success) {
        // Start auto-sync if enabled
        if (autoSync) {
            window.viciDialAPI.startAutoSync(syncInterval);
        }
        
        showNotification('ViciDial integration configured successfully!', 'success');
        closeModal('viciConfigModal');
        
        // Update integration status
        setupIntegration('vicidial');
    } else {
        showNotification('Failed to connect to ViciDial', 'error');
    }
}

// Manual sync from ViciDial
async function manualViciSync() {
    showNotification('Starting manual sync from ViciDial...', 'info');
    
    const result = await window.viciDialAPI.syncSalesLeads();
    
    if (result.success) {
        showNotification(`Imported ${result.imported} new leads from ViciDial`, 'success');
        updateViciSyncStatus();
    } else {
        showNotification('Sync failed: ' + result.error, 'error');
    }
}

// Update ViciDial sync status display
function updateViciSyncStatus() {
    const syncStatusDiv = document.getElementById('syncStatus');
    if (!syncStatusDiv) return;
    
    const status = window.viciDialAPI.getSyncStatus();
    
    syncStatusDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <label style="font-weight: 600;">Connection Status:</label>
                <p>${status.connected ? 
                    '<i class="fas fa-circle" style="color: #10b981;"></i> Connected' : 
                    '<i class="fas fa-circle" style="color: #ef4444;"></i> Disconnected'}</p>
            </div>
            <div>
                <label style="font-weight: 600;">Auto-Sync:</label>
                <p>${status.autoSync ? 
                    '<i class="fas fa-check" style="color: #10b981;"></i> Enabled' : 
                    '<i class="fas fa-times" style="color: #999;"></i> Disabled'}</p>
            </div>
            <div>
                <label style="font-weight: 600;">Last Sync:</label>
                <p>${status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}</p>
            </div>
            <div>
                <label style="font-weight: 600;">API Server:</label>
                <p style="font-size: 12px; word-break: break-all;">${status.apiUrl || 'Not configured'}</p>
            </div>
        </div>
    `;
}

function setupIntegration(integrationId) {
    // Find the integration details
    const marketplaceData = {
        'vicidial': { name: 'ViciBox/Vicidial', icon: '📞', category: 'Dialer & Communication', description: 'Open-source contact center suite' },
        'acord': { name: 'ACORD Forms', icon: '📋', category: 'Forms & Documents', description: 'Industry-standard insurance forms' },
        'progressive': { name: 'Progressive', icon: '🏢', category: 'Carriers', description: 'Direct carrier integration' },
        'salesforce': { name: 'Salesforce CRM', icon: '☁️', category: 'CRM & Sales', description: 'Complete CRM integration' },
        'quickbooks': { name: 'QuickBooks', icon: '💰', category: 'Accounting', description: 'Automated bookkeeping' },
        'docusign': { name: 'DocuSign', icon: '✍️', category: 'E-Signature', description: 'Electronic signatures' }
    };
    
    const integration = marketplaceData[integrationId] || { name: integrationId, icon: '🔌' };
    
    // Get current active integrations
    let activeIntegrations = JSON.parse(localStorage.getItem('activeIntegrations') || '[]');
    
    // Check if already added
    if (activeIntegrations.find(i => i.id === integrationId)) {
        showNotification(`${integration.name} is already integrated`, 'warning');
        return;
    }
    
    // Add new integration
    activeIntegrations.push({
        id: integrationId,
        name: integration.name,
        status: 'connected',
        connectedDate: new Date().toLocaleDateString(),
        lastSync: 'Just now',
        stats: getIntegrationStats(integrationId)
    });
    
    localStorage.setItem('activeIntegrations', JSON.stringify(activeIntegrations));
    
    // Close modal if open
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    
    // Reload integrations view
    loadIntegrationsView();
    
    showNotification(`${integration.name} added successfully!`, 'success');
}

function getIntegrationStats(integrationId) {
    const stats = {
        'vicidial': { label: 'Calls Today', value: '0' },
        'acord': { label: 'Forms Generated', value: '0' },
        'progressive': { label: 'Active Quotes', value: '0' },
        'salesforce': { label: 'Contacts Synced', value: '0' },
        'quickbooks': { label: 'Invoices', value: '0' },
        'docusign': { label: 'Documents Sent', value: '0' }
    };
    return stats[integrationId];
}

function syncNow(name) {
    showNotification(`Syncing ${name} data...`, 'info');
}

function connectIntegration(name) {
    showNotification(`Connecting to ${name}...`, 'info');
}

function learnMore(name) {
    showNotification(`Opening ${name} documentation...`, 'info');
}

function copyApiKey() {
    const apiKey = document.getElementById('apiKey').textContent;
    navigator.clipboard.writeText(apiKey);
    showNotification('API key copied to clipboard!', 'success');
}

function regenerateApiKey() {
    if (confirm('Are you sure you want to regenerate your API key? This will invalidate the current key.')) {
        showNotification('New API key generated!', 'success');
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N = New Quote
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showNewQuote();
    }
    
    // Ctrl/Cmd + K = Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Implement search functionality
    }
    
    // ESC = Close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }
});

console.log('Vanguard Insurance Software initialized successfully!');

// Lead Generation Functions
function initializeLeadGeneration() {
    console.log('Initializing lead generation module');
    // Add event listeners for lead generation features
}

function switchLeadTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab items
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    const tabMap = {
        'profile': 'profileTab',
        'advanced': 'advancedTab',
        'carrier': 'carrierTab'
    };
    
    const selectedTab = document.getElementById(tabMap[tabName]);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Add active class to clicked tab
    event.target.closest('.tab-item').classList.add('active');
    
    // If switching to lookup tab, show some default results
    if (section === 'lookup') {
        setTimeout(() => {
            // Auto-populate with Ohio carriers by default
            const stateSearch = document.getElementById('stateSearch');
            if (stateSearch && !stateSearch.value) {
                stateSearch.value = 'OH';
                performLeadSearch();
            }
        }, 100);
    }
}

function performLeadSearch() {
    const usdot = document.getElementById('usdotSearch')?.value || '';
    const mc = document.getElementById('mcSearch')?.value || '';
    const company = document.getElementById('companySearch')?.value || '';
    const state = document.getElementById('stateSearch')?.value || '';
    
    // Show loading state
    const resultsBody = document.getElementById('leadResultsBody');
    if (resultsBody) {
        resultsBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <i class="fas fa-spinner fa-spin"></i> Searching 2.2M carrier database...
                </td>
            </tr>
        `;
    }
    
    // Generate realistic results based on search criteria
    setTimeout(() => {
        let results = [];
        
        // Generate results based on search parameters
        if (state === 'OH' || (!state && !usdot && !mc && !company)) {
            // Ohio carriers or default search
            results = [
                {
                    usdot: '1234567',
                    company: 'ABC Trucking LLC',
                    location: 'Columbus, OH',
                    fleet: '15',
                    status: 'Active',
                    expiry: '2025-03-15'
                },
                {
                    usdot: '2345678',
                    company: 'XYZ Transport Inc',
                    location: 'Cleveland, OH',
                    fleet: '32',
                    status: 'Active',
                    expiry: '2025-01-20'
                },
                {
                    usdot: '3456789',
                    company: 'Quick Logistics Corp',
                    location: 'Cincinnati, OH',
                    fleet: '8',
                    status: 'Active',
                    expiry: '2025-05-01'
                },
                {
                    usdot: '4567890',
                    company: 'Eagle Carriers LLC',
                    location: 'Toledo, OH',
                    fleet: '25',
                    status: 'Active',
                    expiry: '2025-02-28'
                },
                {
                    usdot: '5678901',
                    company: 'Premier Shipping Co',
                    location: 'Akron, OH',
                    fleet: '12',
                    status: 'Active',
                    expiry: '2025-04-15'
                },
                {
                    usdot: '6789012',
                    company: 'Midwest Freight Solutions',
                    location: 'Dayton, OH',
                    fleet: '18',
                    status: 'Active',
                    expiry: '2025-03-30'
                },
                {
                    usdot: '7890123',
                    company: 'Ohio Valley Transport',
                    location: 'Youngstown, OH',
                    fleet: '22',
                    status: 'Active',
                    expiry: '2025-04-10'
                },
                {
                    usdot: '8901234',
                    company: 'Buckeye Express LLC',
                    location: 'Canton, OH',
                    fleet: '14',
                    status: 'Active',
                    expiry: '2025-02-15'
                }
            ];
        } else if (state) {
            // Other states
            const stateData = {
                'TX': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
                'CA': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
                'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
                'NY': ['New York', 'Buffalo', 'Rochester', 'Albany']
            };
            
            const cities = stateData[state] || ['City A', 'City B', 'City C'];
            const companies = ['Regional Transport', 'Express Logistics', 'State Carriers', 'Local Freight'];
            
            for (let i = 0; i < 5; i++) {
                results.push({
                    usdot: Math.floor(Math.random() * 9000000 + 1000000).toString(),
                    company: `${companies[i % companies.length]} ${state}`,
                    location: `${cities[i % cities.length]}, ${state}`,
                    fleet: Math.floor(Math.random() * 50 + 5).toString(),
                    status: 'Active',
                    expiry: `2025-0${(i % 6) + 1}-${15 + i}`
                });
            }
        }
        
        // Filter by company name if provided
        if (company) {
            results = results.filter(r => 
                r.company.toLowerCase().includes(company.toLowerCase())
            );
        }
        
        // Filter by USDOT if provided
        if (usdot) {
            results = results.filter(r => r.usdot.includes(usdot));
        }
        
        // Filter by MC if provided
        if (mc) {
            results = results.filter(r => r.usdot.includes(mc));
        }
        
        displayLeadResults(results);
        
        // Update stats display
        const statsHtml = `
            <div style="background: #f0f9ff; border: 1px solid #0284c7; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem;">
                <strong>Database: </strong>2.2M carriers | 
                <strong>Ohio: </strong>51,296 | 
                <strong>With Insurance: </strong>600K+ | 
                <strong>Monthly Leads: </strong>5,129
            </div>
        `;
        
        const searchForm = document.querySelector('.search-form');
        if (searchForm && !document.querySelector('.db-stats')) {
            const statsDiv = document.createElement('div');
            statsDiv.className = 'db-stats';
            statsDiv.innerHTML = statsHtml;
            searchForm.parentNode.insertBefore(statsDiv, searchForm);
        }
    }, 1000);
}

function displayLeadResults(results) {
    const resultsBody = document.getElementById('leadResultsBody');
    const resultsCount = document.querySelector('.results-count');
    
    if (results.length === 0) {
        resultsBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No results found. Try adjusting your search criteria.</td>
            </tr>
        `;
        resultsCount.textContent = '0 leads found';
        return;
    }
    
    resultsCount.textContent = `${results.length} leads found`;
    
    resultsBody.innerHTML = results.map(result => `
        <tr>
            <td><input type="checkbox" class="lead-checkbox" value="${result.usdot}"></td>
            <td class="font-mono">${result.usdot}</td>
            <td><strong>${result.company}</strong></td>
            <td>${result.location}</td>
            <td>${result.fleet} vehicles</td>
            <td>
                <span class="status-badge ${result.status === 'Active' ? 'status-active' : 'status-warning'}">
                    ${result.status}
                </span>
            </td>
            <td>${result.expiry}</td>
            <td>
                <button class="btn-small btn-icon" onclick="viewLeadDetails('${result.usdot}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-small btn-icon" onclick="contactLead('${result.usdot}')" title="Contact">
                    <i class="fas fa-envelope"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function clearLeadFilters() {
    document.getElementById('usdotSearch').value = '';
    document.getElementById('mcSearch').value = '';
    document.getElementById('companySearch').value = '';
    document.getElementById('stateSearch').value = '';
    
    // Clear checkboxes
    document.querySelectorAll('.checkbox-group input').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Clear results
    document.getElementById('leadResultsBody').innerHTML = `
        <tr>
            <td colspan="8" class="text-center">No results. Use the search form above to find leads.</td>
        </tr>
    `;
    document.querySelector('.results-count').textContent = '0 leads found';
}

function selectAllLeads(checkbox) {
    document.querySelectorAll('.lead-checkbox').forEach(cb => {
        cb.checked = checkbox.checked;
    });
}

function viewLeadDetails(usdot) {
    // Show lead details modal or navigate to details page
    alert(`View details for USDOT: ${usdot}`);
}

function contactLead(usdot) {
    // Open communication modal
    alert(`Contact lead with USDOT: ${usdot}`);
}

function exportLeads() {
    // Export selected leads
    const selected = document.querySelectorAll('.lead-checkbox:checked');
    if (selected.length === 0) {
        alert('Please select leads to export');
        return;
    }
    
    // Get the lead data from the table rows
    const exportData = [];
    selected.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const cells = row.querySelectorAll('td');
        
        exportData.push({
            usdot_number: cells[1].textContent.trim(),
            company_name: cells[2].textContent.trim(),
            location: cells[3].textContent.trim(),
            fleet_size: cells[4].textContent.replace(' vehicles', '').trim(),
            status: cells[5].textContent.trim(),
            expiry: cells[6].textContent.trim()
        });
    });
    
    // Create CSV content
    let csv = 'USDOT Number,Company Name,Location,Fleet Size,Status,Insurance Expiry\n';
    
    exportData.forEach(lead => {
        csv += `"${lead.usdot_number}","${lead.company_name}","${lead.location}","${lead.fleet_size}","${lead.status}","${lead.expiry}"\n`;
    });
    
    // Download the CSV file
    const timestamp = new Date().toISOString().split('T')[0];
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_leads_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    message.innerHTML = `
        <strong>✅ Export Successful!</strong><br>
        ${selected.length} leads exported to CSV
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

function searchLeads() {
    // Trigger search with current filters
    performLeadSearch();
}

function getGenerateLeadsContent() {
    return `
        <div class="generate-leads-container">
                <!-- Statistics Section - Always Visible at Top -->
                <div id="generatedLeadsResults" style="margin-bottom: 1rem;">
                    <div class="results-summary">
                        <div id="successMessage" style="display: none; margin-bottom: 0.75rem;">
                            <h3 style="color: #059669; font-size: 1.1rem;">
                                <i class="fas fa-check-circle"></i> Leads Generated Successfully!
                            </h3>
                        </div>
                        <div class="stats-row">
                            <div class="stat-box" style="background: #f0fdf4;">
                                <span style="color: #16a34a;">Total Leads Found</span>
                                <p style="font-weight: bold; color: #15803d;">
                                    <span id="totalLeadsCount">-</span>
                                </p>
                            </div>
                            <div class="stat-box" style="background: #fef3c7;">
                                <span style="color: #d97706;">Expiring Soon</span>
                                <p style="font-weight: bold; color: #d97706;">
                                    <span id="expiringSoonCount">-</span>
                                </p>
                            </div>
                            <div class="stat-box" style="background: #dbeafe;">
                                <span style="color: #2563eb;">With Contact Info</span>
                                <p style="font-weight: bold; color: #1d4ed8;">
                                    <span id="withContactCount">-</span>
                                </p>
                            </div>
                        </div>
                        <div class="export-options" style="margin-top: 0.75rem;">
                            <div class="export-buttons" style="display: flex; gap: 0.75rem; align-items: center;">
                                <span style="font-weight: 600; margin-right: 0.5rem;">Export:</span>
                                <button class="btn-success" onclick="exportGeneratedLeads('excel')" style="background: #10b981; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-excel"></i> Excel
                                </button>
                                <button class="btn-info" onclick="exportGeneratedLeads('json')" style="background: #3b82f6; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-code"></i> JSON
                                </button>
                                <button class="btn-primary" onclick="viewGeneratedLeads()" style="padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="filter-section">
                    <h3>Select Lead Criteria</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>State <span class="required">*</span></label>
                            <select class="form-control" id="genState">
                                <option value="">Select State</option>
                                <option value="AL">Alabama</option>
                                <option value="AK">Alaska</option>
                                <option value="AZ">Arizona</option>
                                <option value="AR">Arkansas</option>
                                <option value="CA">California</option>
                                <option value="CO">Colorado</option>
                                <option value="CT">Connecticut</option>
                                <option value="DE">Delaware</option>
                                <option value="FL">Florida</option>
                                <option value="GA">Georgia</option>
                                <option value="HI">Hawaii</option>
                                <option value="ID">Idaho</option>
                                <option value="IL">Illinois</option>
                                <option value="IN">Indiana</option>
                                <option value="IA">Iowa</option>
                                <option value="KS">Kansas</option>
                                <option value="KY">Kentucky</option>
                                <option value="LA">Louisiana</option>
                                <option value="ME">Maine</option>
                                <option value="MD">Maryland</option>
                                <option value="MA">Massachusetts</option>
                                <option value="MI">Michigan</option>
                                <option value="MN">Minnesota</option>
                                <option value="MS">Mississippi</option>
                                <option value="MO">Missouri</option>
                                <option value="MT">Montana</option>
                                <option value="NE">Nebraska</option>
                                <option value="NV">Nevada</option>
                                <option value="NH">New Hampshire</option>
                                <option value="NJ">New Jersey</option>
                                <option value="NM">New Mexico</option>
                                <option value="NY">New York</option>
                                <option value="NC">North Carolina</option>
                                <option value="ND">North Dakota</option>
                                <option value="OH">Ohio</option>
                                <option value="OK">Oklahoma</option>
                                <option value="OR">Oregon</option>
                                <option value="PA">Pennsylvania</option>
                                <option value="RI">Rhode Island</option>
                                <option value="SC">South Carolina</option>
                                <option value="SD">South Dakota</option>
                                <option value="TN">Tennessee</option>
                                <option value="TX">Texas</option>
                                <option value="UT">Utah</option>
                                <option value="VT">Vermont</option>
                                <option value="VA">Virginia</option>
                                <option value="WA">Washington</option>
                                <option value="WV">West Virginia</option>
                                <option value="WI">Wisconsin</option>
                                <option value="WY">Wyoming</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Insurance Expiring Within</label>
                            <select class="form-control" id="genExpiry">
                                <option value="30">30 Days</option>
                                <option value="45">45 Days</option>
                                <option value="60">60 Days</option>
                                <option value="90">90 Days</option>
                                <option value="120">120 Days</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Minimum Fleet Size</label>
                            <input type="number" class="form-control" id="minFleet" placeholder="e.g., 1" value="1">
                        </div>
                        <div class="form-group">
                            <label>Maximum Fleet Size</label>
                            <input type="number" class="form-control" id="maxFleet" placeholder="e.g., 999" value="999">
                        </div>
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Operating Status</label>
                            <select class="form-control" id="genStatus">
                                <option value="">All</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="OUT_OF_SERVICE">Out of Service</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Safety Rating</label>
                            <select class="form-control" id="genSafety">
                                <option value="">All Ratings</option>
                                <option value="SATISFACTORY">Satisfactory</option>
                                <option value="CONDITIONAL">Conditional</option>
                                <option value="UNSATISFACTORY">Unsatisfactory</option>
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: span 3;">
                            <label>Insurance Companies</label>
                            <div class="insurance-checkbox-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; max-height: 120px; overflow-y: auto;">
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="PROGRESSIVE"> Progressive
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="GEICO"> GEICO
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="GREAT_WEST"> Great West Casualty
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CANAL"> Canal Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ACUITY"> Acuity
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="NORTHLAND"> Northland
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CINCINNATI"> Cincinnati Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="AUTO_OWNERS"> Auto Owners
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="SENTRY"> Sentry Select
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ERIE"> Erie Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="TRAVELERS"> Travelers
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="BITCO"> Bitco General
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CAROLINA"> Carolina Casualty
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="STATE_FARM"> State Farm
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ALLSTATE"> Allstate
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="NATIONWIDE"> Nationwide
                            </label>
                            </div>
                            <div style="margin-top: 0.5rem; display: flex; gap: 0.75rem;">
                                <button type="button" class="btn-small" onclick="selectAllInsurance()" style="padding: 4px 10px; font-size: 0.8rem;">Select All</button>
                                <button type="button" class="btn-small" onclick="clearAllInsurance()" style="padding: 4px 10px; font-size: 0.8rem;">Clear All</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="genHazmat"> Hazmat Only
                        </label>
                    </div>
                    <div class="form-actions" style="margin-top: 1rem;">
                        <button class="btn-primary" onclick="generateLeadsFromForm()" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-magic"></i> Generate Leads Now
                        </button>
                        <button class="btn-success" onclick="uploadToVicidialWithCriteria()" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-upload"></i> Upload to Vicidial
                        </button>
                        <button class="btn-secondary" onclick="resetGenerateForm()" style="padding: 10px 20px;">
                            <i class="fas fa-redo"></i> Reset Form
                        </button>
                    </div>
                </div>
        </div>
    `;
}

function switchLeadSection(section) {
    // Hide all sections
    document.getElementById('carrierLookupSection').style.display = 'none';
    document.getElementById('generateLeadsSection').style.display = 'none';
    
    // Remove active class from all tabs
    document.querySelectorAll('.folder-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected section and activate tab
    if (section === 'lookup') {
        document.getElementById('carrierLookupSection').style.display = 'block';
        document.querySelectorAll('.folder-tab')[0].classList.add('active');
    } else if (section === 'generate') {
        document.getElementById('generateLeadsSection').style.display = 'block';
        document.querySelectorAll('.folder-tab')[1].classList.add('active');
    }
}

function showGenerateLeadsForm() {
    // Load the lead generation view with the generate tab active
    loadLeadGenerationView('generate');
}

// Store generated leads globally for export
let generatedLeadsData = [];

// Display generated leads in the results table
function displayGeneratedLeads(leads) {
    // Don't switch tabs - stay on Generate Leads tab
    // Update the lead count on the Generate Leads tab
    const genLeadsCount = document.querySelector('#generateLeads .lead-count');
    if (genLeadsCount) {
        genLeadsCount.textContent = `${leads.length} total leads found`;
    }
    
    // Store the generated leads for when user switches to lookup tab
    window.generatedLeads = leads;
    
    // Use the existing displayLeadResults function
    const formattedLeads = leads.map(lead => ({
        usdot: lead.usdot_number,
        company: lead.legal_name || lead.dba_name,
        location: lead.location,
        fleet: lead.fleet || lead.power_units || '0',
        status: lead.status || 'Active',
        expiry: lead.expiry || lead.policy_renewal_date || 'N/A',
        insurance: lead.insurance_on_file || 0,
        insurance_carrier: lead.insurance_carrier,
        lead_score: lead.lead_score || 50
    }));
    
    displayLeadResults(formattedLeads);
    
    // Update the results count
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
        resultsCount.textContent = `${leads.length} qualified leads generated (filtered by insurance criteria)`;
    }
}

async function generateLeadsFromForm() {
    const state = document.getElementById('genState').value;
    const expiry = document.getElementById('genExpiry').value;
    const minFleet = document.getElementById('minFleet').value;
    const maxFleet = document.getElementById('maxFleet').value;
    const status = document.getElementById('genStatus').value;
    const safety = document.getElementById('genSafety').value;
    const hazmat = document.getElementById('genHazmat').checked;
    
    if (!state) {
        alert('Please select a state to generate leads');
        return;
    }
    
    // Get selected insurance companies and map to actual database names
    const insuranceCompanyMap = {
        'PROGRESSIVE': 'Progressive Commercial',
        'GEICO': 'GEICO Commercial',
        'GREAT_WEST': 'Great West Casualty Company',
        'CANAL': 'Canal Insurance Company',
        'ACUITY': 'Acuity',
        'NORTHLAND': 'Northland Insurance Company',
        'CINCINNATI': 'Cincinnati Insurance',
        'AUTO_OWNERS': 'Auto Owners',
        'SENTRY': 'Sentry Insurance',
        'ERIE': 'Erie Insurance',
        'TRAVELERS': 'Travelers',
        'BITCO': 'Bitco General',
        'CAROLINA': 'Carolina Casualty',
        'STATE_FARM': 'State Farm',
        'ALLSTATE': 'Allstate Business Insurance',
        'NATIONWIDE': 'Nationwide'
    };
    
    const insuranceCompanies = [];
    document.querySelectorAll('input[name="insurance"]:checked').forEach(checkbox => {
        const mappedName = insuranceCompanyMap[checkbox.value] || checkbox.value;
        insuranceCompanies.push(mappedName);
    });
    
    // Show loading state - get the actual button, not the icon
    const btn = event.target.closest('button') || event.target;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Leads...';
    btn.disabled = true;
    
    try {
        // Build criteria object for API
        const criteria = {
            state: state,
            expiryDays: parseInt(expiry),
            minFleet: parseInt(minFleet),
            maxFleet: parseInt(maxFleet),
            status: status || undefined,
            safety: safety || undefined,
            hazmat: hazmat || undefined,
            insuranceCompanies: insuranceCompanies.length > 0 ? insuranceCompanies : undefined,
            limit: 2000  // Limit to 2000 to prevent storage overflow
        };
        
        // Call real API
        const data = await apiService.generateLeads(criteria);
        
        // Store the criteria for Vicidial upload (with ALL insurance companies)
        lastGeneratedCriteria = {
            state: state,
            insuranceCompanies: insuranceCompanies,  // Pass ALL selected companies
            daysUntilExpiry: parseInt(expiry) || 30
        };
        
        // Store generated leads data for export - use data.leads not data.carriers
        generatedLeadsData = (data.leads || []).map(carrier => ({
            usdot_number: carrier.usdotNumber || carrier.usdot_number || carrier.dot_number,
            mc_number: carrier.mcNumber || carrier.mc_number || 'N/A',
            legal_name: carrier.name || carrier.legal_name || carrier.dba_name || 'N/A',
            representative_name: carrier.contact || carrier.principal_name || carrier.representative_1_name || 'N/A',
            city: carrier.city || carrier.physical_city || 'N/A',
            state: carrier.state || carrier.physical_state || state,
            phone: carrier.phone || 'N/A',
            email: carrier.email || 'N/A',
            fleet_size: carrier.powerUnits || carrier.power_units || 0,
            insurance_expiry: carrier.renewalDate || carrier.insurance_expiry_date || carrier.policy_renewal_date || carrier.expiry || 'N/A',
            insurance_company: carrier.insuranceCompany || carrier.insurance_company || carrier.insurance_carrier || 'Unknown',
            insurance_amount: carrier.premium || carrier.liability_insurance_amount || carrier.bipd_insurance_on_file_amount || carrier.insurance_on_file || 0,
            policy_number: carrier.policy_number || 'N/A',
            safety_rating: carrier.safety_rating || 'None',
            operating_status: carrier.operating_status || carrier.status || 'Unknown'
        }));
        
        // Calculate statistics
        const leadCount = data.total || generatedLeadsData.length;
        const expiringSoon = generatedLeadsData.filter(lead => {
            if (!lead.insurance_expiry || lead.insurance_expiry === 'N/A') return false;
            const expiryDate = new Date(lead.insurance_expiry);
            const daysUntilExpiry = (expiryDate - new Date()) / (1000 * 60 * 60 * 24);
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        }).length;
        const withContact = generatedLeadsData.filter(lead => 
            lead.phone !== 'N/A' || lead.email !== 'N/A'
        ).length;
        
        // Update the statistics
        document.getElementById('totalLeadsCount').textContent = leadCount.toLocaleString();
        document.getElementById('expiringSoonCount').textContent = expiringSoon.toLocaleString();
        document.getElementById('withContactCount').textContent = withContact.toLocaleString();
        
        // Display the generated leads in the search results table
        displayGeneratedLeads(data.leads || []);
        
        // Show success message
        document.getElementById('successMessage').style.display = 'block';
        
        // Reset button
        btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads Now';
        btn.disabled = false;
        
        // Scroll to top to show results
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.style.display = 'none';
            }
        }, 5000);
        
    } catch (error) {
        console.error('Error generating leads:', error);
        alert('Error generating leads. Please try again.');
        
        // Reset button
        btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads Now';
        btn.disabled = false;
    }
}

function generateMockLeadData(count, state, expiry) {
    const leads = [];
    const companies = ['ABC Transport', 'XYZ Logistics', 'Quick Freight', 'Eagle Carriers', 'Premier Shipping', 'Global Transport', 'Swift Logistics'];
    const cities = {
        'CA': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
        'TX': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
        'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
        'NY': ['New York', 'Buffalo', 'Rochester', 'Albany'],
        'IL': ['Chicago', 'Springfield', 'Rockford', 'Peoria'],
        'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo']
    };
    
    const selectedCities = cities[state] || ['City A', 'City B', 'City C'];
    
    for (let i = 0; i < count; i++) {
        const companyName = companies[Math.floor(Math.random() * companies.length)] + ' ' + (i + 1);
        const usdot = Math.floor(Math.random() * 9000000) + 1000000;
        const mc = Math.floor(Math.random() * 900000) + 100000;
        const fleet = Math.floor(Math.random() * 100) + 1;
        const city = selectedCities[Math.floor(Math.random() * selectedCities.length)];
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * parseInt(expiry)));
        
        leads.push({
            usdot_number: usdot.toString(),
            mc_number: 'MC-' + mc,
            legal_name: companyName,
            city: city,
            state: state,
            phone: '555-' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000),
            email: companyName.toLowerCase().replace(/\s+/g, '') + '@example.com',
            fleet_size: fleet,
            insurance_expiry: expiryDate.toISOString().split('T')[0],
            insurance_company: ['Progressive', 'GEICO', 'Great West', 'Canal'][Math.floor(Math.random() * 4)],
            safety_rating: ['Satisfactory', 'Conditional', 'None'][Math.floor(Math.random() * 3)],
            operating_status: 'Active'
        });
    }
    
    return leads;
}

function resetGenerateForm() {
    document.getElementById('genState').value = '';
    document.getElementById('genExpiry').value = '90';
    document.getElementById('minFleet').value = '1';
    document.getElementById('maxFleet').value = '999';
    document.getElementById('genStatus').value = '';
    document.getElementById('genSafety').value = '';
    document.getElementById('genHazmat').checked = false;
    
    // Clear all insurance checkboxes
    document.querySelectorAll('input[name="insurance"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset statistics to dashes
    document.getElementById('totalLeadsCount').textContent = '-';
    document.getElementById('expiringSoonCount').textContent = '-';
    document.getElementById('withContactCount').textContent = '-';
    
    // Hide success message
    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
        successMsg.style.display = 'none';
    }
    
    // Clear generated data
    generatedLeadsData = [];
}

function selectAllInsurance() {
    document.querySelectorAll('input[name="insurance"]').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function clearAllInsurance() {
    document.querySelectorAll('input[name="insurance"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function exportGeneratedLeads(format) {
    if (!generatedLeadsData || generatedLeadsData.length === 0) {
        alert('No leads to export. Please generate leads first.');
        return;
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const state = document.getElementById('genState').value;
    
    if (format === 'json') {
        // Export as JSON
        const jsonData = JSON.stringify(generatedLeadsData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_${state}_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        showExportSuccess('JSON', generatedLeadsData.length);
        
    } else if (format === 'excel') {
        // Export as CSV (Excel-compatible) - including ALL fields with representative
        let csv = 'USDOT Number,MC Number,Company Name,Representative Name,City,State,Phone,Email,Fleet Size,Insurance Amount,Insurance Expiry,Insurance Company,Safety Rating,Operating Status\n';
        
        generatedLeadsData.forEach(lead => {
            csv += `"${lead.usdot_number}","${lead.mc_number}","${lead.legal_name}","${lead.representative_name}","${lead.city}","${lead.state}","${lead.phone}","${lead.email}","${lead.fleet_size}","${lead.insurance_amount}","${lead.insurance_expiry}","${lead.insurance_company}","${lead.safety_rating}","${lead.operating_status}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_${state}_${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        showExportSuccess('Excel/CSV', generatedLeadsData.length);
    }
}

function showExportSuccess(format, count) {
    const message = document.createElement('div');
    message.className = 'export-success-message';
    message.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 1rem 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; animation: slideIn 0.3s ease;';
    message.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <i class="fas fa-check-circle" style="font-size: 1.5rem;"></i>
            <div>
                <strong>Export Successful!</strong><br>
                <small>${count} leads exported as ${format}</small>
            </div>
        </div>
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(message);
        }, 300);
    }, 3000);
}

function viewGeneratedLeads() {
    // Load lead generation view and populate with generated leads
    loadLeadGenerationView();
    
    // After view loads, display the generated leads
    setTimeout(() => {
        if (generatedLeadsData && generatedLeadsData.length > 0) {
            const resultsBody = document.getElementById('leadResultsBody');
            const resultsCount = document.querySelector('.results-count');
            
            if (resultsBody && resultsCount) {
                resultsCount.textContent = `${generatedLeadsData.length} leads found`;
                
                resultsBody.innerHTML = generatedLeadsData.slice(0, 50).map(lead => `
                    <tr>
                        <td><input type="checkbox" class="lead-checkbox" value="${lead.usdot_number}"></td>
                        <td class="font-mono">${lead.usdot_number}</td>
                        <td><strong>${lead.legal_name}</strong></td>
                        <td>${lead.city}, ${lead.state}</td>
                        <td>${lead.fleet_size} vehicles</td>
                        <td>
                            <span class="status-badge status-active">Active</span>
                        </td>
                        <td>${lead.insurance_expiry}</td>
                        <td>
                            <button class="btn-small btn-icon" onclick="viewLeadDetails('${lead.usdot_number}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-small btn-icon" onclick="contactLead('${lead.usdot_number}')" title="Contact">
                                <i class="fas fa-envelope"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    }, 100);
}

// Tools Menu Functions moved to tool-windows.js for draggable windows

// Communications Hub Supporting Functions
function toggleCampaign(campaignId) {
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (campaign) {
        campaign.status = campaign.status === 'active' ? 'paused' : 'active';
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
        
        // Update button in UI
        const btn = document.querySelector(`button[onclick="toggleCampaign('${campaignId}')"]`);
        if (btn) {
            if (campaign.status === 'active') {
                btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                btn.className = 'btn-warning';
                showNotification(`Campaign "${campaign.name}" started`, 'success');
            } else {
                btn.innerHTML = '<i class="fas fa-play"></i> Start';
                btn.className = 'btn-success';
                showNotification(`Campaign "${campaign.name}" paused`, 'info');
            }
        }
        
        // Update status badge
        const statusBadge = btn.closest('tr').querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = `status-badge status-${campaign.status}`;
            statusBadge.textContent = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
        }
    }
}

function handleRecipientUpload(type) {
    const fileInput = document.getElementById(type === 'email' ? 'emailRecipientFile' : 'smsRecipientFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a CSV file', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            showNotification('CSV file appears to be empty', 'error');
            return;
        }
        
        // Parse CSV headers
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Show column mapping modal
        showColumnMappingModal(headers, type);
        
        // Store CSV data temporarily
        window.tempCsvData = {
            headers: headers,
            rows: lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                return row;
            })
        };
        
        showNotification(`Loaded ${lines.length - 1} recipients from CSV`, 'success');
    };
    
    reader.onerror = function() {
        showNotification('Error reading CSV file', 'error');
    };
    
    reader.readAsText(file);
}

function showColumnMappingModal(headers, type) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h3>Map CSV Columns to Template Variables</h3>
            <p>Map your CSV columns to template variables for personalization:</p>
            <div class="column-mapping">
                ${headers.map(header => `
                    <div class="form-group">
                        <label>${header}:</label>
                        <select class="form-control" data-csv-column="${header}">
                            <option value="">-- Don't use --</option>
                            <option value="{first_name}">First Name</option>
                            <option value="{last_name}">Last Name</option>
                            <option value="{company}">Company</option>
                            <option value="{email}">Email</option>
                            <option value="{phone}">Phone</option>
                            <option value="{policy_number}">Policy Number</option>
                            <option value="{expiry_date}">Expiry Date</option>
                            <option value="{custom_1}">Custom Field 1</option>
                            <option value="{custom_2}">Custom Field 2</option>
                        </select>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button class="btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
                <button class="btn-primary" onclick="applyColumnMapping('${type}')">Apply Mapping</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function applyColumnMapping(type) {
    const mappings = {};
    const selects = document.querySelectorAll('.column-mapping select');
    
    selects.forEach(select => {
        const csvColumn = select.dataset.csvColumn;
        const templateVar = select.value;
        if (templateVar) {
            mappings[templateVar] = csvColumn;
        }
    });
    
    // Store mappings
    window.tempCsvData.mappings = mappings;
    
    // Update recipient count display
    const recipientCount = window.tempCsvData.rows.length;
    const countDisplay = document.getElementById(type === 'email' ? 'emailRecipientCount' : 'smsRecipientCount');
    if (countDisplay) {
        countDisplay.textContent = `${recipientCount} recipients loaded`;
        countDisplay.style.color = '#28a745';
    }
    
    // Close modal
    document.querySelector('.modal-backdrop').remove();
    
    showNotification('Column mapping applied successfully', 'success');
}

function insertVariable(type) {
    const variables = [
        '{first_name}',
        '{last_name}',
        '{company}',
        '{email}',
        '{phone}',
        '{policy_number}',
        '{expiry_date}'
    ];
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>Insert Variable</h3>
            <p>Select a variable to insert:</p>
            <div class="variable-list">
                ${variables.map(v => `
                    <button class="btn-secondary" style="margin: 5px; width: calc(50% - 10px);" 
                            onclick="insertVariableText('${type}', '${v}')">${v}</button>
                `).join('')}
            </div>
            <div style="text-align: right; margin-top: 20px;">
                <button class="btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function insertVariableText(type, variable) {
    const textarea = document.getElementById(type === 'email' ? 'emailBlastMessage' : 'smsBlastMessage');
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        textarea.value = before + variable + after;
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
    }
    document.querySelector('.modal-backdrop').remove();
}

function sendEmailBlast() {
    const subject = document.getElementById('emailBlastSubject').value;
    const message = document.getElementById('emailBlastMessage').value;
    
    if (!subject || !message) {
        showNotification('Please fill in subject and message', 'error');
        return;
    }
    
    if (!window.tempCsvData || !window.tempCsvData.rows.length) {
        showNotification('Please upload recipient list first', 'error');
        return;
    }
    
    // Simulate sending emails
    const totalRecipients = window.tempCsvData.rows.length;
    let sentCount = 0;
    
    // Show progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-backdrop';
    progressModal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>Sending Email Blast</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="emailProgress" style="width: 0%"></div>
            </div>
            <p id="emailProgressText">Sending to 0 of ${totalRecipients} recipients...</p>
        </div>
    `;
    document.body.appendChild(progressModal);
    
    // Simulate sending process
    const interval = setInterval(() => {
        sentCount += Math.min(10, totalRecipients - sentCount);
        const progress = (sentCount / totalRecipients) * 100;
        
        document.getElementById('emailProgress').style.width = progress + '%';
        document.getElementById('emailProgressText').textContent = 
            `Sending to ${sentCount} of ${totalRecipients} recipients...`;
        
        if (sentCount >= totalRecipients) {
            clearInterval(interval);
            progressModal.remove();
            
            // Save to history
            const blastHistory = JSON.parse(localStorage.getItem('emailBlasts') || '[]');
            blastHistory.push({
                id: 'blast_' + Date.now(),
                subject: subject,
                message: message,
                recipients: totalRecipients,
                sentAt: new Date().toISOString(),
                status: 'completed'
            });
            localStorage.setItem('emailBlasts', JSON.stringify(blastHistory));
            
            showNotification(`Email blast sent to ${totalRecipients} recipients!`, 'success');
            
            // Clear form
            document.getElementById('emailBlastSubject').value = '';
            document.getElementById('emailBlastMessage').value = '';
            document.getElementById('emailRecipientFile').value = '';
            document.getElementById('emailRecipientCount').textContent = '';
            window.tempCsvData = null;
        }
    }, 100);
}

function sendSMSBlast() {
    const message = document.getElementById('smsBlastMessage').value;
    
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    if (!window.tempCsvData || !window.tempCsvData.rows.length) {
        showNotification('Please upload recipient list first', 'error');
        return;
    }
    
    // Check message length
    const charCount = message.length;
    if (charCount > 160) {
        const segments = Math.ceil(charCount / 153);
        if (!confirm(`This message will be sent as ${segments} segments. Continue?`)) {
            return;
        }
    }
    
    // Simulate sending SMS
    const totalRecipients = window.tempCsvData.rows.length;
    let sentCount = 0;
    
    // Show progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-backdrop';
    progressModal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>Sending SMS Blast</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="smsProgress" style="width: 0%"></div>
            </div>
            <p id="smsProgressText">Sending to 0 of ${totalRecipients} recipients...</p>
        </div>
    `;
    document.body.appendChild(progressModal);
    
    // Simulate sending process
    const interval = setInterval(() => {
        sentCount += Math.min(15, totalRecipients - sentCount);
        const progress = (sentCount / totalRecipients) * 100;
        
        document.getElementById('smsProgress').style.width = progress + '%';
        document.getElementById('smsProgressText').textContent = 
            `Sending to ${sentCount} of ${totalRecipients} recipients...`;
        
        if (sentCount >= totalRecipients) {
            clearInterval(interval);
            progressModal.remove();
            
            // Save to history
            const blastHistory = JSON.parse(localStorage.getItem('smsBlasts') || '[]');
            blastHistory.push({
                id: 'sms_' + Date.now(),
                message: message,
                recipients: totalRecipients,
                sentAt: new Date().toISOString(),
                status: 'completed'
            });
            localStorage.setItem('smsBlasts', JSON.stringify(blastHistory));
            
            showNotification(`SMS blast sent to ${totalRecipients} recipients!`, 'success');
            
            // Clear form
            document.getElementById('smsBlastMessage').value = '';
            document.getElementById('smsRecipientFile').value = '';
            document.getElementById('smsRecipientCount').textContent = '';
            document.getElementById('charCount').textContent = '0 / 160';
            window.tempCsvData = null;
        }
    }, 100);
}

function updateCharCount() {
    const textarea = document.getElementById('smsBlastMessage');
    const charCount = document.getElementById('charCount');
    if (textarea && charCount) {
        const count = textarea.value.length;
        const segments = count <= 160 ? 1 : Math.ceil(count / 153);
        charCount.textContent = `${count} / 160${segments > 1 ? ` (${segments} segments)` : ''}`;
        charCount.style.color = count > 160 ? '#ff6b6b' : '#666';
    }
}

function addCommunicationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .ai-campaign {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .ai-campaign .campaign-header h3 {
            color: white;
        }
        
        .ai-campaign .stat-label {
            color: #374151;
        }
        
        .ai-campaign .stat-value {
            color: #111827;
            font-weight: bold;
        }
        
        .ai-campaign .btn-small {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .ai-campaign .btn-small:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .progress-bar {
            width: 100%;
            height: 30px;
            background-color: #f0f0f0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #45a049);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .column-mapping {
            max-height: 400px;
            overflow-y: auto;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 5px;
        }
        
        .variable-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            max-height: 80vh;
            overflow-y: auto;
        }
        
        #emailRecipientCount,
        #smsRecipientCount {
            display: inline-block;
            margin-left: 10px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}

// Initialize communication styles
addCommunicationStyles();

// Lead Import and Blast Functions
function importLeads() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = event.target.result;
                let leads = [];
                
                if (file.name.endsWith('.csv')) {
                    // Parse CSV
                    const lines = data.split('\n').filter(line => line.trim());
                    if (lines.length < 2) {
                        showNotification('CSV file appears to be empty', 'error');
                        return;
                    }
                    
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim());
                        const lead = {};
                        
                        headers.forEach((header, index) => {
                            const value = values[index] || '';
                            // Map common header names
                            if (header.includes('name') || header.includes('company')) {
                                lead.name = value;
                            } else if (header.includes('phone') || header.includes('tel')) {
                                lead.phone = value;
                            } else if (header.includes('email') || header.includes('mail')) {
                                lead.email = value;
                            } else if (header.includes('product') || header.includes('interest')) {
                                lead.product = value;
                            } else if (header.includes('premium') || header.includes('amount')) {
                                lead.premium = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                            } else if (header.includes('renewal') || header.includes('expiry')) {
                                lead.renewalDate = value;
                            } else if (header.includes('assigned')) {
                                lead.assignedTo = value;
                            } else {
                                lead[header] = value;
                            }
                        });
                        
                        // Set defaults
                        lead.id = Date.now() + i;
                        lead.stage = lead.stage || 'new';
                        lead.createdAt = new Date().toISOString();
                        lead.product = lead.product || 'General Insurance';
                        
                        if (lead.name && (lead.email || lead.phone)) {
                            leads.push(lead);
                        }
                    }
                } else {
                    showNotification('Excel file import requires additional library. Please use CSV format.', 'warning');
                    return;
                }
                
                if (leads.length > 0) {
                    // Add to existing leads
                    const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
                    const updatedLeads = [...existingLeads, ...leads];
                    localStorage.setItem('leads', JSON.stringify(updatedLeads));
                    
                    showNotification(`Successfully imported ${leads.length} leads`, 'success');
                    loadLeadsView();
                } else {
                    showNotification('No valid leads found in file', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                showNotification('Error importing file: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    input.click();
}

function exportLeads() {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    if (leads.length === 0) {
        showNotification('No leads to export', 'warning');
        return;
    }
    
    // Create CSV content
    const headers = ['Name', 'Phone', 'Email', 'Product', 'Premium', 'Stage', 'Renewal Date', 'Assigned To', 'Created'];
    const rows = leads.map(lead => [
        lead.name,
        lead.phone,
        lead.email,
        lead.product,
        lead.premium || 0,
        lead.stage,
        lead.renewalDate || '',
        lead.assignedTo || '',
        lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || ''
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${leads.length} leads`, 'success');
}

function toggleAllLeads(checkbox) {
    const checkboxes = document.querySelectorAll('.lead-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

function sendLeadsToBlast() {
    const selectedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showNotification('Please select leads to send', 'warning');
        return;
    }
    
    // Gather selected leads
    const selectedLeads = [];
    selectedCheckboxes.forEach(checkbox => {
        try {
            const leadData = JSON.parse(checkbox.dataset.lead);
            selectedLeads.push(leadData);
        } catch (e) {
            console.error('Error parsing lead data:', e);
        }
    });
    
    // Show modal to choose blast type
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3>Send ${selectedLeads.length} Leads to Blast</h3>
            <p>Choose how you want to communicate with these leads:</p>
            
            <div style="display: flex; gap: 20px; margin: 30px 0;">
                <button class="btn-primary" style="flex: 1; padding: 20px;" onclick="prepareEmailBlast(${JSON.stringify(selectedLeads).replace(/"/g, '&quot;')})">
                    <i class="fas fa-envelope" style="font-size: 24px; display: block; margin-bottom: 10px;"></i>
                    Email Blast
                </button>
                <button class="btn-primary" style="flex: 1; padding: 20px;" onclick="prepareSMSBlast(${JSON.stringify(selectedLeads).replace(/"/g, '&quot;')})">
                    <i class="fas fa-sms" style="font-size: 24px; display: block; margin-bottom: 10px;"></i>
                    SMS Blast
                </button>
            </div>
            
            <div style="text-align: right;">
                <button class="btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function prepareEmailBlast(leads) {
    // Close modal
    document.querySelector('.modal-backdrop').remove();
    
    // Store leads for blast
    window.tempCsvData = {
        headers: ['name', 'email', 'phone', 'product', 'premium'],
        rows: leads.map(lead => ({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            product: lead.product,
            premium: lead.premium
        })),
        mappings: {
            '{first_name}': 'name',
            '{email}': 'email',
            '{phone}': 'phone',
            '{company}': 'name'
        }
    };
    
    // Navigate to Communications Hub - Email Blast
    window.location.hash = '#communications';
    setTimeout(() => {
        loadCommunicationTab('email-blast');
        showNotification(`${leads.length} leads ready for email blast`, 'success');
    }, 100);
}

function prepareSMSBlast(leads) {
    // Close modal
    document.querySelector('.modal-backdrop').remove();
    
    // Store leads for blast
    window.tempCsvData = {
        headers: ['name', 'phone', 'email', 'product', 'premium'],
        rows: leads.map(lead => ({
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            product: lead.product,
            premium: lead.premium
        })),
        mappings: {
            '{first_name}': 'name',
            '{phone}': 'phone',
            '{company}': 'name'
        }
    };
    
    // Navigate to Communications Hub - SMS Blast
    window.location.hash = '#communications';
    setTimeout(() => {
        loadCommunicationTab('sms-blast');
        showNotification(`${leads.length} leads ready for SMS blast`, 'success');
    }, 100);
}


// Store the last generated lead criteria
let lastGeneratedCriteria = null;

// Function to pass lead generation criteria to Vicidial uploader
function uploadToVicidialWithCriteria() {
    // Use the stored criteria from the last generation
    if (!lastGeneratedCriteria) {
        alert('Please generate leads first before uploading to Vicidial');
        return;
    }
    
    // Call vicidialUploader with the exact criteria used for generation
    if (window.vicidialUploader) {
        window.vicidialUploader.showUploadDialog(lastGeneratedCriteria);
    } else {
        alert('Vicidial uploader not loaded');
    }
}

// Make function globally accessible
window.uploadToVicidialWithCriteria = uploadToVicidialWithCriteria;

