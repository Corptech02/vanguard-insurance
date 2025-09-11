// Final fix for the lead profile modal issue
console.log('Applying final profile fix...');

// Store the original functions
const originalViewLead = window.viewLead;
const originalShowLeadProfile = window.showLeadProfile;

// Create a flag to prevent multiple opens
let profileIsOpen = false;

// Completely override the viewLead function
window.viewLead = function(leadId) {
    console.log('Fixed viewLead called with ID:', leadId);
    
    // Prevent multiple opens
    if (profileIsOpen) {
        console.log('Profile already open, closing first');
        closeLeadProfile();
        setTimeout(() => {
            window.viewLead(leadId);
        }, 100);
        return false;
    }
    
    // Parse the lead ID
    leadId = parseInt(leadId);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId || parseInt(l.id) === leadId);
    
    if (!lead) {
        console.error('Lead not found:', leadId);
        alert('Lead not found');
        return false;
    }
    
    console.log('Opening profile for:', lead.name);
    
    // Set flag
    profileIsOpen = true;
    
    // Create the modal directly here instead of calling showLeadProfile
    createEnhancedProfile(lead);
    
    return false;
};

// Create the enhanced profile modal
function createEnhancedProfile(lead) {
    // Remove any existing modals
    const existing = document.getElementById('lead-profile-container');
    if (existing) {
        existing.remove();
    }
    
    // Initialize data if needed
    if (!lead.vehicles) lead.vehicles = [];
    if (!lead.trailers) lead.trailers = [];
    if (!lead.drivers) lead.drivers = [];
    if (!lead.transcriptText) lead.transcriptText = '';
    
    const isCommercialAuto = lead.product && (
        lead.product.toLowerCase().includes('commercial') || 
        lead.product.toLowerCase().includes('fleet') ||
        lead.product.toLowerCase().includes('trucking')
    );
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'lead-profile-container';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 1200px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        position: relative;
    `;
    
    // Build the HTML based on whether it's commercial auto
    let profileHTML = '';
    
    if (isCommercialAuto) {
        profileHTML = `
            <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h2 style="margin: 0; font-size: 24px;"><i class="fas fa-truck"></i> Commercial Auto Lead Profile</h2>
                <button class="close-btn" id="profile-close-btn" style="position: absolute; top: 20px; right: 20px; font-size: 30px; background: none; border: none; cursor: pointer;">&times;</button>
            </div>
            
            <div style="padding: 20px;">
                <!-- Lead Status and Stage -->
                <div class="profile-section" style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-chart-line"></i> Lead Status & Stage</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Lead Stage:</label>
                            <select id="lead-stage-${lead.id}" onchange="updateLeadStage('${lead.id}', this.value)" 
                                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                                <option value="qualified" ${lead.stage === 'qualified' ? 'selected' : ''}>Qualified</option>
                                <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                                <option value="quote_sent" ${lead.stage === 'quote_sent' || lead.stage === 'quoted sent' ? 'selected' : ''}>Quote Sent</option>
                                <option value="interested" ${lead.stage === 'interested' || lead.stage === 'intested' ? 'selected' : ''}>Interested</option>
                                <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Lead Status:</label>
                            <select id="lead-status-${lead.id}" onchange="updateLeadStatus('${lead.id}', this.value)" 
                                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="active" ${lead.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="hot_lead" ${lead.status === 'hot_lead' ? 'selected' : ''}>Hot Lead 🔥</option>
                                <option value="warm" ${lead.status === 'warm' ? 'selected' : ''}>Warm</option>
                                <option value="cold" ${lead.status === 'cold' ? 'selected' : ''}>Cold</option>
                                <option value="inactive" ${lead.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Priority:</label>
                            <select id="lead-priority-${lead.id}" onchange="updateLeadPriority('${lead.id}', this.value)" 
                                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="low" ${lead.priority === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${lead.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${lead.priority === 'high' ? 'selected' : ''}>High</option>
                                <option value="urgent" ${lead.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Lead Score:</label>
                            <input type="number" id="lead-score-${lead.id}" value="${lead.leadScore || 85}" min="0" max="100" 
                                   onchange="updateLeadScore('${lead.id}', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>
                
                <!-- Company Information -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>Company Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Company Name:</label>
                            <input type="text" value="${lead.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Contact:</label>
                            <input type="text" value="${lead.contact || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Phone:</label>
                            <input type="text" value="${lead.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Email:</label>
                            <input type="text" value="${lead.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">DOT Number:</label>
                            <input type="text" value="${lead.dotNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">MC Number:</label>
                            <input type="text" value="${lead.mcNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Years in Business:</label>
                            <input type="text" value="${lead.yearsInBusiness || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Fleet Size:</label>
                            <input type="text" value="${lead.fleetSize || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>
                
                <!-- Operation Details -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>Operation Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Radius of Operation:</label>
                            <input type="text" value="${lead.radiusOfOperation || ''}" placeholder="e.g., 500 miles" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Commodity Hauled:</label>
                            <input type="text" value="${lead.commodityHauled || ''}" placeholder="e.g., General Freight" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Operating States:</label>
                            <input type="text" value="${lead.operatingStates || ''}" placeholder="e.g., TX, LA, OK" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>
                
                <!-- Vehicles -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-truck"></i> Vehicles (${lead.vehicles.length})</h3>
                    ${lead.vehicles.length > 0 ? lead.vehicles.map((v, i) => `
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            <strong>Vehicle #${i + 1}</strong>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                                <input type="text" value="${v.year || ''}" placeholder="Year" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.make || ''}" placeholder="Make" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.model || ''}" placeholder="Model" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.vin || ''}" placeholder="VIN" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.value || ''}" placeholder="Value" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.type || ''}" placeholder="Type" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.gvwr || ''}" placeholder="GVWR" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                            </div>
                        </div>
                    `).join('') : '<p style="color: #9ca3af; text-align: center; padding: 20px;">No vehicles added yet</p>'}
                </div>
                
                <!-- Trailers -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-trailer"></i> Trailers (${lead.trailers.length})</h3>
                    ${lead.trailers.length > 0 ? lead.trailers.map((t, i) => `
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            <strong>Trailer #${i + 1}</strong>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                                <input type="text" value="${t.year || ''}" placeholder="Year" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.make || ''}" placeholder="Make" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.type || ''}" placeholder="Type" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.vin || ''}" placeholder="VIN" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.length || ''}" placeholder="Length" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.value || ''}" placeholder="Value" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                            </div>
                        </div>
                    `).join('') : '<p style="color: #9ca3af; text-align: center; padding: 20px;">No trailers added yet</p>'}
                </div>
                
                <!-- Drivers -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-id-card"></i> Drivers (${lead.drivers.length})</h3>
                    ${lead.drivers.length > 0 ? lead.drivers.map((d, i) => `
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            <strong>Driver #${i + 1}</strong>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                                <input type="text" value="${d.name || ''}" placeholder="Name" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.license || ''}" placeholder="License #" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.cdlType || ''}" placeholder="CDL Type" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.experience || ''}" placeholder="Experience" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.endorsements || ''}" placeholder="Endorsements" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.mvr || ''}" placeholder="MVR Status" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.violations || ''}" placeholder="Violations" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                            </div>
                        </div>
                    `).join('') : '<p style="color: #9ca3af; text-align: center; padding: 20px;">No drivers added yet</p>'}
                </div>
                
                <!-- Call Transcript -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-microphone"></i> Call Transcript</h3>
                    <textarea style="width: 100%; min-height: 150px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace;">${lead.transcriptText || ''}</textarea>
                </div>
                
                <!-- Quote Submissions -->
                <div class="profile-section" style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-file-contract"></i> Quote Submissions</h3>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="createQuoteApplication('${lead.id}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-file-alt"></i> Quote Application
                            </button>
                            <button onclick="addQuoteSubmission('${lead.id}')" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-plus"></i> Add Quote
                            </button>
                        </div>
                    </div>
                    <div id="quote-submissions-container">
                        ${generateQuoteSubmissionsHTML(lead)}
                    </div>
                </div>
                
                <!-- Notes -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-sticky-note"></i> Notes</h3>
                    <textarea style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px;">${lead.notes || ''}</textarea>
                </div>
            </div>
        `;
    } else {
        // Standard lead profile
        profileHTML = `
            <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h2 style="margin: 0; font-size: 24px;"><i class="fas fa-user"></i> Lead Profile</h2>
                <button class="close-btn" id="profile-close-btn" style="position: absolute; top: 20px; right: 20px; font-size: 30px; background: none; border: none; cursor: pointer;">&times;</button>
            </div>
            
            <div style="padding: 20px;">
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                    <h3>Contact Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Name:</label>
                            <input type="text" value="${lead.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Phone:</label>
                            <input type="text" value="${lead.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Email:</label>
                            <input type="text" value="${lead.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Product:</label>
                            <input type="text" value="${lead.product || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    modalContent.innerHTML = profileHTML;
    modalContainer.appendChild(modalContent);
    
    // Add to page
    document.body.appendChild(modalContainer);
    
    // Set up close handlers
    setTimeout(() => {
        // Close button
        const closeBtn = document.getElementById('profile-close-btn');
        if (closeBtn) {
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                closeLeadProfile();
            };
        }
        
        // Click outside to close
        modalContainer.onclick = function(e) {
            if (e.target === modalContainer) {
                closeLeadProfile();
            }
        };
        
        // Prevent clicks inside modal from closing
        modalContent.onclick = function(e) {
            e.stopPropagation();
        };
    }, 100);
}

// Override close function
window.closeLeadProfile = function() {
    console.log('Closing lead profile');
    const container = document.getElementById('lead-profile-container');
    if (container) {
        container.remove();
    }
    profileIsOpen = false;
};

// Fix all eye icon buttons when DOM changes
function fixAllEyeIcons() {
    const buttons = document.querySelectorAll('button[onclick*="viewLead"]');
    console.log(`Fixing ${buttons.length} eye icon buttons`);
    
    buttons.forEach(btn => {
        // Get the lead ID from onclick attribute
        const onclickStr = btn.getAttribute('onclick');
        if (onclickStr) {
            const match = onclickStr.match(/viewLead\((\d+)\)/);
            if (match) {
                const leadId = parseInt(match[1]);
                
                // Remove old onclick
                btn.removeAttribute('onclick');
                
                // Add new handler
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    console.log('Eye button clicked for lead:', leadId);
                    window.viewLead(leadId);
                    return false;
                };
            }
        }
    });
}

// Run fix after page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixAllEyeIcons, 1000);
});

// Monitor for DOM changes and reapply fixes
const observer = new MutationObserver(function(mutations) {
    for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if leads table was added
            for (let node of mutation.addedNodes) {
                if (node.nodeType === 1 && (node.id === 'leadsTableBody' || node.querySelector && node.querySelector('#leadsTableBody'))) {
                    console.log('Leads table detected, fixing eye icons');
                    setTimeout(fixAllEyeIcons, 100);
                    break;
                }
            }
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Quote submission functions
function generateQuoteSubmissionsHTML(lead) {
    if (!lead.quoteSubmissions) {
        lead.quoteSubmissions = [];
    }
    
    if (lead.quoteSubmissions.length === 0) {
        return '<p style="color: #9ca3af; text-align: center; padding: 20px;">No quotes submitted yet</p>';
    }
    
    return lead.quoteSubmissions.map((quote, index) => `
        <div class="quote-submission" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #1f2937;">Quote #${index + 1}</h4>
                <button onclick="deleteQuoteSubmission('${lead.id}', ${index})" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Insurance Company:</label>
                    <input type="text" value="${quote.insuranceCompany || ''}" onchange="updateQuoteField('${lead.id}', ${index}, 'insuranceCompany', this.value)" 
                           style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Premium ($):</label>
                    <input type="number" value="${quote.premium || ''}" onchange="updateQuoteField('${lead.id}', ${index}, 'premium', this.value)" 
                           style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;" placeholder="0.00">
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Deductible ($):</label>
                    <input type="number" value="${quote.deductible || ''}" onchange="updateQuoteField('${lead.id}', ${index}, 'deductible', this.value)" 
                           style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;" placeholder="0.00">
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Coverage Amount ($):</label>
                    <input type="text" value="${quote.coverageAmount || ''}" onchange="updateQuoteField('${lead.id}', ${index}, 'coverageAmount', this.value)" 
                           style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;" placeholder="e.g., $1,000,000">
                </div>
            </div>
            <div style="margin-top: 10px;">
                <label style="font-weight: 600; font-size: 12px; color: #374151;">Quote File:</label>
                <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
                    <input type="file" id="quote-file-${lead.id}-${index}" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                           onchange="handleQuoteFileUpload('${lead.id}', ${index}, this)" 
                           style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                    ${quote.fileName ? `
                        <span style="color: #10b981; font-size: 12px;">
                            <i class="fas fa-file"></i> ${quote.fileName}
                        </span>
                        <button onclick="downloadQuoteFile('${lead.id}', ${index})" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div style="margin-top: 10px;">
                <label style="font-weight: 600; font-size: 12px; color: #374151;">Notes:</label>
                <textarea onchange="updateQuoteField('${lead.id}', ${index}, 'notes', this.value)" 
                          style="width: 100%; min-height: 60px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; margin-top: 5px;" 
                          placeholder="Add any notes about this quote...">${quote.notes || ''}</textarea>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                Submitted: ${quote.dateSubmitted || new Date().toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

window.addQuoteSubmission = function(leadId) {
    console.log('Adding quote submission for lead:', leadId);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex === -1) {
        alert('Lead not found');
        return;
    }
    
    // Initialize quoteSubmissions if not exists
    if (!leads[leadIndex].quoteSubmissions) {
        leads[leadIndex].quoteSubmissions = [];
    }
    
    // Add new quote submission
    const newQuote = {
        id: Date.now(),
        insuranceCompany: '',
        premium: '',
        deductible: '',
        coverageAmount: '',
        fileName: '',
        fileData: '',
        notes: '',
        dateSubmitted: new Date().toLocaleDateString()
    };
    
    leads[leadIndex].quoteSubmissions.push(newQuote);
    
    // Save back to localStorage
    localStorage.setItem('leads', JSON.stringify(leads));
    
    // Refresh the quote submissions section
    const container = document.getElementById('quote-submissions-container');
    if (container) {
        container.innerHTML = generateQuoteSubmissionsHTML(leads[leadIndex]);
    }
};

window.deleteQuoteSubmission = function(leadId, quoteIndex) {
    if (confirm('Are you sure you want to delete this quote submission?')) {
        console.log('Deleting quote submission:', leadId, quoteIndex);
        
        // Get leads from localStorage
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const leadIndex = leads.findIndex(l => l.id == leadId);
        
        if (leadIndex !== -1 && leads[leadIndex].quoteSubmissions) {
            leads[leadIndex].quoteSubmissions.splice(quoteIndex, 1);
            
            // Save back to localStorage
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Refresh the quote submissions section
            const container = document.getElementById('quote-submissions-container');
            if (container) {
                container.innerHTML = generateQuoteSubmissionsHTML(leads[leadIndex]);
            }
        }
    }
};

window.updateQuoteField = function(leadId, quoteIndex, field, value) {
    console.log('Updating quote field:', leadId, quoteIndex, field, value);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex !== -1 && leads[leadIndex].quoteSubmissions && leads[leadIndex].quoteSubmissions[quoteIndex]) {
        leads[leadIndex].quoteSubmissions[quoteIndex][field] = value;
        
        // Save back to localStorage
        localStorage.setItem('leads', JSON.stringify(leads));
    }
};

window.handleQuoteFileUpload = function(leadId, quoteIndex, input) {
    const file = input.files[0];
    if (!file) return;
    
    console.log('Uploading quote file:', file.name);
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        input.value = '';
        return;
    }
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = function(e) {
        // Get leads from localStorage
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const leadIndex = leads.findIndex(l => l.id == leadId);
        
        if (leadIndex !== -1 && leads[leadIndex].quoteSubmissions && leads[leadIndex].quoteSubmissions[quoteIndex]) {
            leads[leadIndex].quoteSubmissions[quoteIndex].fileName = file.name;
            leads[leadIndex].quoteSubmissions[quoteIndex].fileData = e.target.result;
            leads[leadIndex].quoteSubmissions[quoteIndex].fileSize = file.size;
            
            // Save back to localStorage
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Refresh the quote submissions section
            const container = document.getElementById('quote-submissions-container');
            if (container) {
                container.innerHTML = generateQuoteSubmissionsHTML(leads[leadIndex]);
            }
            
            alert('File uploaded successfully!');
        }
    };
    
    reader.readAsDataURL(file);
};

// Function to create quote application from lead
window.createQuoteApplication = function(leadId) {
    console.log('Creating quote application for lead:', leadId);
    
    // Get the lead data
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
        alert('Lead not found');
        return;
    }
    
    // Use the QuoteApplication class if available
    if (typeof QuoteApplication !== 'undefined') {
        const app = new QuoteApplication();
        app.createApplicationFromLead(lead);
    } else {
        console.error('QuoteApplication class not loaded');
        alert('Quote Application feature is not available yet. Please refresh the page.');
    }
};

window.downloadQuoteFile = function(leadId, quoteIndex) {
    console.log('Downloading quote file:', leadId, quoteIndex);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex !== -1 && leads[leadIndex].quoteSubmissions && leads[leadIndex].quoteSubmissions[quoteIndex]) {
        const quote = leads[leadIndex].quoteSubmissions[quoteIndex];
        
        if (quote.fileData && quote.fileName) {
            // Create download link
            const link = document.createElement('a');
            link.href = quote.fileData;
            link.download = quote.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('No file available for download');
        }
    }
};

// Lead stage and status update functions
window.updateLeadStage = function(leadId, newStage) {
    console.log('Updating lead stage:', leadId, newStage);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex !== -1) {
        leads[leadIndex].stage = newStage;
        
        // Save back to localStorage
        localStorage.setItem('leads', JSON.stringify(leads));
        
        // Show success message
        showNotification('Lead stage updated to: ' + newStage, 'success');
        
        // If the leads view is active, refresh it
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                setTimeout(() => {
                    window.loadLeadsView();
                }, 500);
            }
        }
    }
};

window.updateLeadStatus = function(leadId, newStatus) {
    console.log('Updating lead status:', leadId, newStatus);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex !== -1) {
        leads[leadIndex].status = newStatus;
        
        // Save back to localStorage
        localStorage.setItem('leads', JSON.stringify(leads));
        
        // Show success message
        showNotification('Lead status updated to: ' + newStatus, 'success');
        
        // If the leads view is active, refresh it
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                setTimeout(() => {
                    window.loadLeadsView();
                }, 500);
            }
        }
    }
};

window.updateLeadPriority = function(leadId, newPriority) {
    console.log('Updating lead priority:', leadId, newPriority);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex !== -1) {
        leads[leadIndex].priority = newPriority;
        
        // Save back to localStorage
        localStorage.setItem('leads', JSON.stringify(leads));
        
        // Show success message
        showNotification('Lead priority updated to: ' + newPriority, 'success');
    }
};

window.updateLeadScore = function(leadId, newScore) {
    console.log('Updating lead score:', leadId, newScore);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex !== -1) {
        leads[leadIndex].leadScore = parseInt(newScore);
        
        // Save back to localStorage
        localStorage.setItem('leads', JSON.stringify(leads));
        
        // Show success message
        showNotification('Lead score updated to: ' + newScore + '%', 'success');
        
        // If the leads view is active, refresh it
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                setTimeout(() => {
                    window.loadLeadsView();
                }, 500);
            }
        }
    }
};

// Helper function to show notifications
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.getElementById('notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'notification-toast';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    notification.innerHTML = `<span style="font-size: 18px;">${icon}</span> ${message}`;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add animation styles if not already present
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
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
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('Final profile fix applied successfully');