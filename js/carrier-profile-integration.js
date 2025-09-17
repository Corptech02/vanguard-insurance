// Carrier Profile Integration
// Links the eye icon to show detailed carrier profile with inspection data

// Override the viewLeadDetails function to show carrier profile
window.viewLeadDetails = function(usdotNumber) {
    console.log('Viewing carrier profile for USDOT:', usdotNumber);

    // Extract DOT number (remove any prefixes)
    let dotNumber = usdotNumber;
    if (typeof dotNumber === 'string') {
        dotNumber = dotNumber.replace(/\D/g, ''); // Remove non-digits
    }

    // Check if CarrierProfileModal class exists
    if (typeof CarrierProfileModal !== 'undefined') {
        // Create new instance if needed
        if (!window.carrierProfile) {
            window.carrierProfile = new CarrierProfileModal();
        }
        window.carrierProfile.showProfile(dotNumber);
    } else {
        console.error('CarrierProfileModal class not loaded yet');
        // Try to load it dynamically
        setTimeout(() => {
            if (typeof CarrierProfileModal !== 'undefined') {
                if (!window.carrierProfile) {
                    window.carrierProfile = new CarrierProfileModal();
                }
                window.carrierProfile.showProfile(dotNumber);
            } else {
                alert('Carrier profile viewer is loading. Please try again in a moment.');
            }
        }, 500);
    }
};

// Also handle viewLead function for lead tables
window.viewLead = function(leadId) {
    // Try to extract DOT number from lead
    const lead = getLeadById(leadId);
    if (lead && lead.usdotNumber) {
        viewLeadDetails(lead.usdotNumber);
    } else {
        // Fallback to original lead view behavior
        console.log('Viewing lead:', leadId);
        showLeadDetailsModal(leadId);
    }
};

// Helper function to get lead by ID
function getLeadById(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    return leads.find(lead => lead.id === leadId);
}

// Fallback modal for leads without DOT numbers
function showLeadDetailsModal(leadId) {
    const lead = getLeadById(leadId);
    if (!lead) {
        alert('Lead not found');
        return;
    }

    // Create a simple modal for lead details
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Lead Details</h5>
                    <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <dl class="row">
                        <dt class="col-sm-4">Name:</dt>
                        <dd class="col-sm-8">${lead.name || 'N/A'}</dd>

                        <dt class="col-sm-4">Company:</dt>
                        <dd class="col-sm-8">${lead.company || 'N/A'}</dd>

                        <dt class="col-sm-4">Phone:</dt>
                        <dd class="col-sm-8">${lead.phone || 'N/A'}</dd>

                        <dt class="col-sm-4">Email:</dt>
                        <dd class="col-sm-8">${lead.email || 'N/A'}</dd>

                        <dt class="col-sm-4">Status:</dt>
                        <dd class="col-sm-8">${lead.stage || 'N/A'}</dd>

                        <dt class="col-sm-4">Premium:</dt>
                        <dd class="col-sm-8">$${lead.premium || 0}</dd>

                        ${lead.usdotNumber ? `
                            <dt class="col-sm-4">DOT Number:</dt>
                            <dd class="col-sm-8">${lead.usdotNumber}</dd>
                        ` : ''}
                    </dl>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    ${lead.usdotNumber ? `
                        <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove(); viewLeadDetails('${lead.usdotNumber}')">
                            <i class="fas fa-truck"></i> View Full Carrier Profile
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Carrier profile integration initialized');

    // Wait a moment for all scripts to load, then initialize
    setTimeout(() => {
        if (typeof CarrierProfileModal !== 'undefined' && !window.carrierProfile) {
            window.carrierProfile = new CarrierProfileModal();
            console.log('CarrierProfileModal instance created');
        }
    }, 1000);
});

// Also try to initialize immediately if the modal class is already available
if (typeof CarrierProfileModal !== 'undefined' && !window.carrierProfile) {
    window.carrierProfile = new CarrierProfileModal();
    console.log('CarrierProfileModal instance created immediately');
}

console.log('Carrier profile integration loaded');