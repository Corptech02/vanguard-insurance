// Original Simple Client Profile Design
window.viewClientOriginal = function(id) {
    console.log('Loading original client profile for:', id);

    // Get client data
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id == id);

    if (!client) {
        showNotification('Client not found', 'error');
        loadClientsView();
        return;
    }

    // Get policies for this client
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const clientPolicies = allPolicies.filter(policy => {
        if (policy.clientId && String(policy.clientId) === String(id)) return true;
        const insuredName = policy.insured?.['Name/Business Name'] ||
                           policy.insured?.['Primary Named Insured'] ||
                           policy.insuredName;
        if (insuredName && client.name && insuredName.toLowerCase() === client.name.toLowerCase()) return true;
        return false;
    });

    // Calculate total premium
    let totalPremium = 0;
    clientPolicies.forEach(policy => {
        const premiumValue = policy.financial?.['Annual Premium'] ||
                            policy.financial?.['Premium'] ||
                            policy.premium || 0;
        const numericPremium = typeof premiumValue === 'string' ?
            parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 :
            parseFloat(premiumValue) || 0;
        totalPremium += numericPremium;
    });

    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="client-profile-view">
            <header class="content-header">
                <div class="header-back">
                    <button class="btn-back" onclick="loadClientsView()">
                        <i class="fas fa-arrow-left"></i> Back to Clients
                    </button>
                    <h1>${client.name}</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="editClient('${id}')">
                        <i class="fas fa-edit"></i> Edit Client
                    </button>
                    <button class="btn-primary" onclick="addPolicyToClient('${id}')">
                        <i class="fas fa-plus"></i> Add Policy
                    </button>
                </div>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px;">
                <!-- Client Information - Left Side -->
                <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h2 style="margin: 0 0 24px 0; color: #1f2937; font-size: 20px;">
                        <i class="fas fa-user" style="margin-right: 8px; color: #3b82f6;"></i>
                        Client Information
                    </h2>

                    <div style="display: grid; gap: 20px;">
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Full Name</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937;">${client.name || 'N/A'}</p>
                        </div>

                        ${client.company ? `
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Company</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937;">${client.company}</p>
                        </div>
                        ` : ''}

                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Phone</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937;">
                                <a href="tel:${client.phone}" style="color: #3b82f6; text-decoration: none;">
                                    ${client.phone || 'N/A'}
                                </a>
                            </p>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Email</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937;">
                                <a href="mailto:${client.email}" style="color: #3b82f6; text-decoration: none;">
                                    ${client.email || 'N/A'}
                                </a>
                            </p>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Address</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937;">${client.address || 'N/A'}</p>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Client Since</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937;">
                                ${client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Total Annual Premium</label>
                            <p style="margin: 0; font-size: 24px; color: #059669; font-weight: bold;">
                                $${totalPremium.toLocaleString()}
                            </p>
                        </div>

                        ${client.notes ? `
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Notes</label>
                            <p style="margin: 0; font-size: 14px; color: #4b5563; background: #f9fafb; padding: 12px; border-radius: 6px;">
                                ${client.notes}
                            </p>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Policies - Right Side -->
                <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h2 style="margin: 0 0 24px 0; color: #1f2937; font-size: 20px;">
                        <i class="fas fa-file-contract" style="margin-right: 8px; color: #3b82f6;"></i>
                        Active Policies (${clientPolicies.length})
                    </h2>

                    <div style="display: grid; gap: 16px;">
                        ${clientPolicies.length > 0 ? clientPolicies.map(policy => {
                            const premium = policy.financial?.['Annual Premium'] ||
                                          policy.financial?.['Premium'] ||
                                          policy.premium || 0;
                            const formattedPremium = typeof premium === 'string' ?
                                premium : `$${Number(premium).toLocaleString()}`;

                            return `
                            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #fafafa;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                    <div>
                                        <p style="margin: 0; font-weight: bold; color: #3b82f6; font-size: 14px;">
                                            ${policy.policyNumber || 'No Policy Number'}
                                        </p>
                                        <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">
                                            ${policy.policyType || policy.type || 'Unknown Type'}
                                        </p>
                                    </div>
                                    <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                        ${policy.policyStatus || policy.status || 'Active'}
                                    </span>
                                </div>

                                <div style="display: grid; gap: 8px; font-size: 14px; color: #4b5563;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Carrier:</span>
                                        <span style="color: #1f2937; font-weight: 500;">${policy.carrier || 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Premium:</span>
                                        <span style="color: #059669; font-weight: bold;">${formattedPremium}/yr</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Effective:</span>
                                        <span style="color: #1f2937;">${policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Expires:</span>
                                        <span style="color: #1f2937;">${policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div style="display: flex; gap: 8px; margin-top: 12px;">
                                    <button onclick="viewPolicy('${policy.id}')" style="flex: 1; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                        View Details
                                    </button>
                                    <button onclick="deletePolicy('${policy.id}')" style="padding: 6px 12px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            `;
                        }).join('') : `
                            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                                <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                                <p style="margin: 0 0 16px 0; font-size: 16px;">No policies found</p>
                                <button onclick="addPolicyToClient('${id}')" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    <i class="fas fa-plus"></i> Add First Policy
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- Bottom Activity Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 20px 20px;">
                <!-- Recent Activity - Bottom Left -->
                <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px;">
                        <i class="fas fa-history" style="margin-right: 8px; color: #3b82f6;"></i>
                        Recent Activity
                    </h3>
                    <div style="display: grid; gap: 16px;">
                        <div style="padding-left: 20px; border-left: 2px solid #e5e7eb;">
                            <p style="margin: 0; font-weight: 500; color: #1f2937;">Policy Added</p>
                            <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">New policy created</p>
                            <p style="margin: 4px 0; font-size: 12px; color: #9ca3af;">2 days ago</p>
                        </div>
                        <div style="padding-left: 20px; border-left: 2px solid #e5e7eb;">
                            <p style="margin: 0; font-weight: 500; color: #1f2937;">Client Updated</p>
                            <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">Contact information updated</p>
                            <p style="margin: 4px 0; font-size: 12px; color: #9ca3af;">1 week ago</p>
                        </div>
                    </div>
                </div>

                <!-- Documents - Bottom Right -->
                <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px;">
                        <i class="fas fa-folder" style="margin-right: 8px; color: #3b82f6;"></i>
                        Documents
                    </h3>
                    <div style="display: grid; gap: 12px;">
                        <div style="display: flex; align-items: center; padding: 12px; background: #f9fafb; border-radius: 6px;">
                            <i class="fas fa-file-pdf" style="color: #dc2626; margin-right: 12px; font-size: 20px;"></i>
                            <div style="flex: 1;">
                                <p style="margin: 0; font-weight: 500; color: #1f2937; font-size: 14px;">Policy Documents</p>
                                <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">Last updated 1 month ago</p>
                            </div>
                            <button style="padding: 6px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Override the current viewClient function with the original simple design
window.viewClient = window.viewClientOriginal;

console.log('Original client profile design restored');