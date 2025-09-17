// Carrier Profile Modal - Complete Carrier Information Display
class CarrierProfileModal {
    constructor() {
        this.modal = null;
        this.createModal();
    }

    createModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="carrierProfileModal" class="carrier-modal" style="display:none;">
                <div class="carrier-modal-content">
                    <div class="carrier-modal-header">
                        <h2 id="modalCarrierName">Carrier Profile</h2>
                        <span class="carrier-modal-close">&times;</span>
                    </div>
                    <div class="carrier-modal-body">
                        <div class="carrier-profile-loading" style="display: block; text-align: center; padding: 40px;">
                            <div class="spinner"></div>
                            <p>Loading carrier information...</p>
                        </div>
                        <div class="carrier-profile-content" style="display: none;"></div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('carrierProfileModal');

        // Add modal styles
        this.addStyles();

        // Setup event listeners
        this.setupEventListeners();
    }

    addStyles() {
        if (!document.getElementById('carrierModalStyles')) {
            const styles = `
                <style id="carrierModalStyles">
                    .carrier-modal {
                        position: fixed;
                        z-index: 10000;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0,0,0,0.5);
                        animation: fadeIn 0.3s;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .carrier-modal-content {
                        position: relative;
                        background-color: #fefefe;
                        margin: 2% auto;
                        padding: 0;
                        border-radius: 10px;
                        width: 90%;
                        max-width: 900px;
                        max-height: 90vh;
                        overflow: hidden;
                        box-shadow: 0 5px 30px rgba(0,0,0,0.3);
                        animation: slideIn 0.3s;
                    }

                    @keyframes slideIn {
                        from { transform: translateY(-30px); }
                        to { transform: translateY(0); }
                    }

                    .carrier-modal-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        position: relative;
                    }

                    .carrier-modal-header h2 {
                        margin: 0;
                        font-size: 24px;
                    }

                    .carrier-modal-close {
                        position: absolute;
                        right: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 30px;
                        font-weight: bold;
                        color: white;
                        cursor: pointer;
                        transition: transform 0.2s;
                    }

                    .carrier-modal-close:hover {
                        transform: translateY(-50%) scale(1.2);
                    }

                    .carrier-modal-body {
                        padding: 20px;
                        max-height: calc(90vh - 80px);
                        overflow-y: auto;
                    }

                    .carrier-info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin-bottom: 20px;
                    }

                    .carrier-info-section {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        border: 1px solid #e0e0e0;
                    }

                    .carrier-info-section h3 {
                        margin: 0 0 15px 0;
                        color: #333;
                        font-size: 18px;
                        border-bottom: 2px solid #667eea;
                        padding-bottom: 5px;
                    }

                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }

                    .info-row:last-child {
                        border-bottom: none;
                    }

                    .info-label {
                        font-weight: 600;
                        color: #555;
                        flex: 0 0 40%;
                    }

                    .info-value {
                        color: #333;
                        flex: 1;
                        text-align: right;
                    }

                    .info-value.na {
                        color: #999;
                        font-style: italic;
                    }

                    .status-badge {
                        display: inline-block;
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 600;
                    }

                    .status-active {
                        background: #d4edda;
                        color: #155724;
                    }

                    .status-inactive {
                        background: #f8d7da;
                        color: #721c24;
                    }

                    .insurance-alert {
                        background: #fff3cd;
                        border: 1px solid #ffc107;
                        padding: 10px;
                        border-radius: 5px;
                        margin-top: 10px;
                    }

                    .spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #667eea;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    .error-message {
                        background: #f8d7da;
                        color: #721c24;
                        padding: 15px;
                        border-radius: 5px;
                        text-align: center;
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    setupEventListeners() {
        // Close modal when clicking X
        const closeBtn = this.modal.querySelector('.carrier-modal-close');
        closeBtn.onclick = () => this.hide();

        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        };

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.hide();
            }
        });
    }

    async show(dotNumber) {
        this.modal.style.display = 'block';
        const loadingDiv = this.modal.querySelector('.carrier-profile-loading');
        const contentDiv = this.modal.querySelector('.carrier-profile-content');

        loadingDiv.style.display = 'block';
        contentDiv.style.display = 'none';

        try {
            // Get API base URL
            const apiBase = window.apiService ? await window.apiService.getAPIBaseURL() : 'https://api.vigagency.com';

            // Fetch carrier profile
            const response = await fetch(`${apiBase}/api/carrier/profile/${dotNumber}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch carrier profile');
            }

            const carrier = await response.json();

            // Update modal header
            const headerTitle = this.modal.querySelector('#modalCarrierName');
            headerTitle.textContent = carrier.legal_name || `Carrier #${dotNumber}`;

            // Display carrier information
            this.displayCarrierInfo(carrier);

            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';

        } catch (error) {
            console.error('Error loading carrier profile:', error);
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = `
                <div class="error-message">
                    <p>Failed to load carrier profile. Please try again.</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }

    displayCarrierInfo(carrier) {
        const contentDiv = this.modal.querySelector('.carrier-profile-content');

        // Format values helper
        const formatValue = (value) => {
            if (value === null || value === undefined || value === '') {
                return '<span class="info-value na">N/A</span>';
            }
            return value;
        };

        // Format currency
        const formatCurrency = (value) => {
            if (!value) return '<span class="info-value na">N/A</span>';
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        };

        // Build the HTML content
        const html = `
            <div class="carrier-info-grid">
                <!-- Basic Information -->
                <div class="carrier-info-section">
                    <h3>📋 Basic Information</h3>
                    <div class="info-row">
                        <span class="info-label">DOT Number:</span>
                        <span class="info-value"><strong>${carrier.dot_number}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Legal Name:</span>
                        <span class="info-value">${formatValue(carrier.legal_name)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">DBA Name:</span>
                        <span class="info-value">${formatValue(carrier.dba_name)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Entity Type:</span>
                        <span class="info-value">${formatValue(carrier.entity_type)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Operating Status:</span>
                        <span class="info-value">
                            ${carrier.operating_status === 'Active'
                                ? '<span class="status-badge status-active">Active</span>'
                                : '<span class="status-badge status-inactive">' + (carrier.operating_status || 'Unknown') + '</span>'
                            }
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Docket Number:</span>
                        <span class="info-value">${formatValue(carrier.docket)}</span>
                    </div>
                </div>

                <!-- Contact Information -->
                <div class="carrier-info-section">
                    <h3>📞 Contact Information</h3>
                    <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${formatValue(carrier.phone)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${formatValue(carrier.email_address)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Street:</span>
                        <span class="info-value">${formatValue(carrier.street)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">City:</span>
                        <span class="info-value">${formatValue(carrier.city)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">State:</span>
                        <span class="info-value">${formatValue(carrier.state)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Zip Code:</span>
                        <span class="info-value">${formatValue(carrier.zip_code)}</span>
                    </div>
                </div>

                <!-- Fleet Information -->
                <div class="carrier-info-section">
                    <h3>🚚 Fleet Information</h3>
                    <div class="info-row">
                        <span class="info-label">Drivers:</span>
                        <span class="info-value">${formatValue(carrier.drivers)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Power Units:</span>
                        <span class="info-value">${formatValue(carrier.power_units)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Carrier Operation:</span>
                        <span class="info-value">${formatValue(carrier.carrier_operation)}</span>
                    </div>
                </div>

                <!-- Insurance Information -->
                <div class="carrier-info-section">
                    <h3>🛡️ Insurance Information</h3>
                    <div class="info-row">
                        <span class="info-label">Insurance Carrier:</span>
                        <span class="info-value">${formatValue(carrier.insurance_carrier)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Policy Number:</span>
                        <span class="info-value">${formatValue(carrier.policy_number)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">BIPD Required:</span>
                        <span class="info-value">${formatCurrency(carrier.bipd_insurance_required_amount)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">BIPD On File:</span>
                        <span class="info-value">${formatCurrency(carrier.bipd_insurance_on_file_amount)}</span>
                    </div>
                    ${carrier.bipd_insurance_required_amount > carrier.bipd_insurance_on_file_amount
                        ? `<div class="insurance-alert">
                            ⚠️ Insurance on file is below required amount
                          </div>`
                        : ''
                    }
                </div>

                <!-- Additional Data (if any) -->
                ${this.displayAdditionalData(carrier)}
            </div>

            <!-- Action Buttons -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center;">
                <button onclick="window.createLeadFromCarrier(${carrier.dot_number})" style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 0 5px;
                    font-size: 14px;
                ">📝 Create Lead</button>

                <button onclick="window.open('tel:${carrier.phone}')" style="
                    background: #17a2b8;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 0 5px;
                    font-size: 14px;
                " ${!carrier.phone ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>📞 Call</button>

                <button onclick="window.open('mailto:${carrier.email_address}')" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 0 5px;
                    font-size: 14px;
                " ${!carrier.email_address ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>✉️ Email</button>
            </div>
        `;

        contentDiv.innerHTML = html;
    }

    displayAdditionalData(carrier) {
        // Check for any additional fields not already displayed
        const displayedFields = [
            'id', 'dot_number', 'legal_name', 'dba_name', 'docket', 'street', 'city',
            'state', 'zip_code', 'phone', 'email_address', 'entity_type', 'operating_status',
            'carrier_operation', 'bipd_insurance_required_amount', 'bipd_insurance_on_file_amount',
            'insurance_carrier', 'policy_number', 'drivers', 'power_units'
        ];

        const additionalFields = Object.keys(carrier).filter(key => !displayedFields.includes(key));

        if (additionalFields.length === 0) return '';

        const formatValue = (value) => {
            if (value === null || value === undefined || value === '') {
                return '<span class="info-value na">N/A</span>';
            }
            return value;
        };

        let html = '<div class="carrier-info-section"><h3>📊 Additional Information</h3>';

        additionalFields.forEach(field => {
            const label = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            html += `
                <div class="info-row">
                    <span class="info-label">${label}:</span>
                    <span class="info-value">${formatValue(carrier[field])}</span>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    hide() {
        this.modal.style.display = 'none';
    }
}

// Initialize modal when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.carrierProfileModal = new CarrierProfileModal();
    });
} else {
    window.carrierProfileModal = new CarrierProfileModal();
}

// Helper function to create lead from carrier
window.createLeadFromCarrier = function(dotNumber) {
    // Close the modal
    if (window.carrierProfileModal) {
        window.carrierProfileModal.hide();
    }

    // You can implement lead creation logic here
    alert(`Creating lead for DOT #${dotNumber}`);
    // This would typically call your lead creation API
};