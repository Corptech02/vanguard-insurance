// Enhanced Lead Profile Display for Commercial Auto Leads
// Shows detailed vehicle, driver, and transcript information

function showLeadProfile(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
        alert('Lead not found');
        return;
    }
    
    // Initialize lead data structure if not present
    if (!lead.vehicles) lead.vehicles = [];
    if (!lead.trailers) lead.trailers = [];
    if (!lead.drivers) lead.drivers = [];
    if (!lead.transcriptText) lead.transcriptText = '';
    
    // Check if this is a commercial auto lead
    const isCommercialAuto = lead.product && (
        lead.product.toLowerCase().includes('commercial') || 
        lead.product.toLowerCase().includes('fleet') ||
        lead.product.toLowerCase().includes('trucking')
    );
    
    let profileHTML = '';
    
    if (isCommercialAuto) {
        // Commercial Auto Lead Profile
        profileHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) closeLeadProfile()">
                <div class="modal-content lead-profile-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2><i class="fas fa-truck"></i> Commercial Auto Lead Profile</h2>
                        <button class="close-btn" onclick="closeLeadProfile()">&times;</button>
                    </div>
                    
                    <div class="lead-profile-content">
                        <!-- Company Information -->
                        <div class="profile-section">
                            <h3>Company Information</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Company Name:</label>
                                    <input type="text" id="lead-company" value="${lead.name || ''}" onchange="updateLeadField(${leadId}, 'name', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Contact:</label>
                                    <input type="text" id="lead-contact" value="${lead.contact || ''}" onchange="updateLeadField(${leadId}, 'contact', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Phone:</label>
                                    <input type="text" id="lead-phone" value="${lead.phone || ''}" onchange="updateLeadField(${leadId}, 'phone', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Email:</label>
                                    <input type="text" id="lead-email" value="${lead.email || ''}" onchange="updateLeadField(${leadId}, 'email', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>DOT Number:</label>
                                    <input type="text" id="lead-dot" value="${lead.dotNumber || ''}" onchange="updateLeadField(${leadId}, 'dotNumber', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>MC Number:</label>
                                    <input type="text" id="lead-mc" value="${lead.mcNumber || ''}" onchange="updateLeadField(${leadId}, 'mcNumber', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Stage:</label>
                                    <select id="lead-stage" onchange="updateLeadField(${leadId}, 'stage', this.value)">
                                        <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                                        <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                                        <option value="interested" ${lead.stage === 'interested' ? 'selected' : ''}>Interested</option>
                                        <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                                        <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                                    </select>
                                </div>
                                <div class="info-item">
                                    <label>Premium Estimate:</label>
                                    <input type="text" id="lead-premium" value="${lead.premium ? '$' + lead.premium.toLocaleString() : ''}" onchange="updateLeadPremium(${leadId}, this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Years in Business:</label>
                                    <input type="text" id="lead-years" value="${lead.yearsInBusiness || ''}" onchange="updateLeadField(${leadId}, 'yearsInBusiness', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Fleet Size:</label>
                                    <input type="text" id="lead-fleet" value="${lead.fleetSize || ''}" onchange="updateLeadField(${leadId}, 'fleetSize', this.value)">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Operation Details -->
                        <div class="profile-section">
                            <h3>Operation Details</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Radius of Operation:</label>
                                    <input type="text" id="lead-radius" value="${lead.radiusOfOperation || ''}" onchange="updateLeadField(${leadId}, 'radiusOfOperation', this.value)" placeholder="e.g., 500 miles">
                                </div>
                                <div class="info-item">
                                    <label>Commodity Hauled:</label>
                                    <input type="text" id="lead-commodity" value="${lead.commodityHauled || ''}" onchange="updateLeadField(${leadId}, 'commodityHauled', this.value)" placeholder="e.g., General Freight, Steel">
                                </div>
                                <div class="info-item">
                                    <label>Operating States:</label>
                                    <input type="text" id="lead-states" value="${lead.operatingStates || ''}" onchange="updateLeadField(${leadId}, 'operatingStates', this.value)" placeholder="e.g., TX, LA, OK">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Vehicles Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-truck"></i> Vehicles (${lead.vehicles.length})</h3>
                                <button class="btn-add" onclick="addVehicle(${leadId})">
                                    <i class="fas fa-plus"></i> Add Vehicle
                                </button>
                            </div>
                            <div class="vehicles-grid">
                                ${lead.vehicles.length > 0 ? lead.vehicles.map((vehicle, idx) => `
                                    <div class="vehicle-card">
                                        <div class="vehicle-header">
                                            <span>Vehicle #${idx + 1}</span>
                                            <button class="btn-remove" onclick="removeVehicle(${leadId}, ${idx})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <div class="vehicle-details">
                                            <input type="text" placeholder="Year" value="${vehicle.year || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'year', this.value)">
                                            <input type="text" placeholder="Make" value="${vehicle.make || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'make', this.value)">
                                            <input type="text" placeholder="Model" value="${vehicle.model || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'model', this.value)">
                                            <input type="text" placeholder="VIN" value="${vehicle.vin || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'vin', this.value)">
                                            <input type="text" placeholder="Value ($)" value="${vehicle.value || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'value', this.value)">
                                            <input type="text" placeholder="Deductible ($)" value="${vehicle.deductible || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'deductible', this.value)">
                                            <select onchange="updateVehicle(${leadId}, ${idx}, 'type', this.value)">
                                                <option value="">Select Type</option>
                                                <option value="Box Truck" ${vehicle.type === 'Box Truck' ? 'selected' : ''}>Box Truck</option>
                                                <option value="Semi Truck" ${vehicle.type === 'Semi Truck' ? 'selected' : ''}>Semi Truck</option>
                                                <option value="Flatbed" ${vehicle.type === 'Flatbed' ? 'selected' : ''}>Flatbed</option>
                                                <option value="Pickup" ${vehicle.type === 'Pickup' ? 'selected' : ''}>Pickup</option>
                                                <option value="Van" ${vehicle.type === 'Van' ? 'selected' : ''}>Van</option>
                                            </select>
                                            <input type="text" placeholder="GVWR" value="${vehicle.gvwr || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'gvwr', this.value)">
                                        </div>
                                    </div>
                                `).join('') : '<p class="no-data">No vehicles added yet</p>'}
                            </div>
                        </div>
                        
                        <!-- Trailers Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-trailer"></i> Trailers (${lead.trailers.length})</h3>
                                <button class="btn-add" onclick="addTrailer(${leadId})">
                                    <i class="fas fa-plus"></i> Add Trailer
                                </button>
                            </div>
                            <div class="trailers-grid">
                                ${lead.trailers.length > 0 ? lead.trailers.map((trailer, idx) => `
                                    <div class="trailer-card">
                                        <div class="trailer-header">
                                            <span>Trailer #${idx + 1}</span>
                                            <button class="btn-remove" onclick="removeTrailer(${leadId}, ${idx})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <div class="trailer-details">
                                            <input type="text" placeholder="Year" value="${trailer.year || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'year', this.value)">
                                            <input type="text" placeholder="Make" value="${trailer.make || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'make', this.value)">
                                            <input type="text" placeholder="Type" value="${trailer.type || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'type', this.value)">
                                            <input type="text" placeholder="VIN" value="${trailer.vin || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'vin', this.value)">
                                            <input type="text" placeholder="Length" value="${trailer.length || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'length', this.value)">
                                            <input type="text" placeholder="Value ($)" value="${trailer.value || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'value', this.value)">
                                            <input type="text" placeholder="Deductible ($)" value="${trailer.deductible || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'deductible', this.value)">
                                        </div>
                                    </div>
                                `).join('') : '<p class="no-data">No trailers added yet</p>'}
                            </div>
                        </div>
                        
                        <!-- Drivers Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-id-card"></i> Drivers (${lead.drivers.length})</h3>
                                <button class="btn-add" onclick="addDriver(${leadId})">
                                    <i class="fas fa-plus"></i> Add Driver
                                </button>
                            </div>
                            <div class="drivers-grid">
                                ${lead.drivers.length > 0 ? lead.drivers.map((driver, idx) => `
                                    <div class="driver-card">
                                        <div class="driver-header">
                                            <span>Driver #${idx + 1}</span>
                                            <button class="btn-remove" onclick="removeDriver(${leadId}, ${idx})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <div class="driver-details">
                                            <input type="text" placeholder="Name" value="${driver.name || ''}" onchange="updateDriver(${leadId}, ${idx}, 'name', this.value)">
                                            <input type="text" placeholder="License #" value="${driver.license || ''}" onchange="updateDriver(${leadId}, ${idx}, 'license', this.value)">
                                            <input type="text" placeholder="CDL Type" value="${driver.cdlType || ''}" onchange="updateDriver(${leadId}, ${idx}, 'cdlType', this.value)">
                                            <input type="date" placeholder="DOB" value="${driver.dob || ''}" onchange="updateDriver(${leadId}, ${idx}, 'dob', this.value)">
                                            <input type="text" placeholder="Years Experience" value="${driver.experience || ''}" onchange="updateDriver(${leadId}, ${idx}, 'experience', this.value)">
                                            <input type="text" placeholder="Endorsements" value="${driver.endorsements || ''}" onchange="updateDriver(${leadId}, ${idx}, 'endorsements', this.value)">
                                            <select onchange="updateDriver(${leadId}, ${idx}, 'mvr', this.value)">
                                                <option value="">MVR Status</option>
                                                <option value="Clean" ${driver.mvr === 'Clean' ? 'selected' : ''}>Clean</option>
                                                <option value="Minor Violations" ${driver.mvr === 'Minor Violations' ? 'selected' : ''}>Minor Violations</option>
                                                <option value="Major Violations" ${driver.mvr === 'Major Violations' ? 'selected' : ''}>Major Violations</option>
                                            </select>
                                            <input type="text" placeholder="Violations/Notes" value="${driver.violations || ''}" onchange="updateDriver(${leadId}, ${idx}, 'violations', this.value)">
                                        </div>
                                    </div>
                                `).join('') : '<p class="no-data">No drivers added yet</p>'}
                            </div>
                        </div>
                        
                        <!-- Call Transcript Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-microphone"></i> Call Transcript</h3>
                                <button class="btn-save" onclick="saveTranscript(${leadId})">
                                    <i class="fas fa-save"></i> Save Transcript
                                </button>
                            </div>
                            <textarea id="lead-transcript" class="transcript-area" placeholder="Paste or type call transcript here..." onchange="updateLeadField(${leadId}, 'transcriptText', this.value)">${lead.transcriptText || ''}</textarea>
                        </div>
                        
                        <!-- Notes Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-sticky-note"></i> Notes</h3>
                            </div>
                            <textarea class="notes-area" placeholder="Additional notes..." onchange="updateLeadField(${leadId}, 'notes', this.value)">${lead.notes || ''}</textarea>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="profile-actions">
                            <button class="btn-primary" onclick="generateQuote(${leadId})">
                                <i class="fas fa-file-invoice-dollar"></i> Generate Quote
                            </button>
                            <button class="btn-secondary" onclick="exportLeadData(${leadId})">
                                <i class="fas fa-download"></i> Export Data
                            </button>
                            <button class="btn-secondary" onclick="closeLeadProfile()">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Standard Lead Profile (non-commercial)
        profileHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) closeLeadProfile()">
                <div class="modal-content lead-profile-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2><i class="fas fa-user"></i> Lead Profile</h2>
                        <button class="close-btn" onclick="closeLeadProfile()">&times;</button>
                    </div>
                    
                    <div class="lead-profile-content">
                        <div class="profile-section">
                            <h3>Contact Information</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Name:</label>
                                    <input type="text" value="${lead.name || ''}" onchange="updateLeadField(${leadId}, 'name', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Phone:</label>
                                    <input type="text" value="${lead.phone || ''}" onchange="updateLeadField(${leadId}, 'phone', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Email:</label>
                                    <input type="text" value="${lead.email || ''}" onchange="updateLeadField(${leadId}, 'email', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Product:</label>
                                    <input type="text" value="${lead.product || ''}" onchange="updateLeadField(${leadId}, 'product', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Stage:</label>
                                    <select onchange="updateLeadField(${leadId}, 'stage', this.value)">
                                        <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                                        <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                                        <option value="interested" ${lead.stage === 'interested' ? 'selected' : ''}>Interested</option>
                                        <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                                        <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                                    </select>
                                </div>
                                <div class="info-item">
                                    <label>Assigned To:</label>
                                    <input type="text" value="${lead.assignedTo || ''}" onchange="updateLeadField(${leadId}, 'assignedTo', this.value)">
                                </div>
                            </div>
                        </div>
                        
                        <div class="profile-section">
                            <h3>Notes</h3>
                            <textarea class="notes-area" onchange="updateLeadField(${leadId}, 'notes', this.value)">${lead.notes || ''}</textarea>
                        </div>
                        
                        <div class="profile-actions">
                            <button class="btn-primary" onclick="generateQuote(${leadId})">Generate Quote</button>
                            <button class="btn-secondary" onclick="closeLeadProfile()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Add the modal to the page
    const modalContainer = document.createElement('div');
    modalContainer.id = 'lead-profile-container';
    modalContainer.innerHTML = profileHTML;
    document.body.appendChild(modalContainer);
    
    // Add styles if not already present
    if (!document.getElementById('lead-profile-styles')) {
        const styles = document.createElement('style');
        styles.id = 'lead-profile-styles';
        styles.innerHTML = `
            #lead-profile-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 99999 !important;
            }
            
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999 !important;
            }
            
            .lead-profile-modal {
                max-width: 1200px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                position: relative;
                z-index: 100000 !important;
            }
            
            .profile-section {
                background: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .info-item {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .info-item label {
                font-weight: 600;
                color: #374151;
                font-size: 12px;
                text-transform: uppercase;
            }
            
            .info-item input, .info-item select {
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .vehicles-grid, .trailers-grid, .drivers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .vehicle-card, .trailer-card, .driver-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
            }
            
            .vehicle-header, .trailer-header, .driver-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                font-weight: 600;
            }
            
            .vehicle-details, .trailer-details, .driver-details {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .vehicle-details input, .trailer-details input, .driver-details input,
            .vehicle-details select, .trailer-details select, .driver-details select {
                padding: 6px 10px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-size: 13px;
            }
            
            .btn-add {
                background: #10b981;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .btn-remove {
                background: #ef4444;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .btn-save {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .transcript-area, .notes-area {
                width: 100%;
                min-height: 150px;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-family: monospace;
                font-size: 13px;
                resize: vertical;
            }
            
            .no-data {
                color: #9ca3af;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }
            
            .profile-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Helper functions
function updateLeadField(leadId, field, value) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
        lead[field] = value;
        localStorage.setItem('leads', JSON.stringify(leads));
    }
}

function updateLeadPremium(leadId, value) {
    const numValue = parseInt(value.replace(/[^0-9]/g, ''));
    updateLeadField(leadId, 'premium', numValue || 0);
}

function addVehicle(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
        if (!lead.vehicles) lead.vehicles = [];
        lead.vehicles.push({
            year: '',
            make: '',
            model: '',
            vin: '',
            value: '',
            deductible: '',
            type: ''
        });
        localStorage.setItem('leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function updateVehicle(leadId, vehicleIdx, field, value) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.vehicles && lead.vehicles[vehicleIdx]) {
        lead.vehicles[vehicleIdx][field] = value;
        localStorage.setItem('leads', JSON.stringify(leads));
    }
}

function removeVehicle(leadId, vehicleIdx) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.vehicles) {
        lead.vehicles.splice(vehicleIdx, 1);
        localStorage.setItem('leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function addTrailer(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
        if (!lead.trailers) lead.trailers = [];
        lead.trailers.push({
            year: '',
            make: '',
            type: '',
            vin: '',
            value: '',
            deductible: ''
        });
        localStorage.setItem('leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function updateTrailer(leadId, trailerIdx, field, value) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.trailers && lead.trailers[trailerIdx]) {
        lead.trailers[trailerIdx][field] = value;
        localStorage.setItem('leads', JSON.stringify(leads));
    }
}

function removeTrailer(leadId, trailerIdx) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.trailers) {
        lead.trailers.splice(trailerIdx, 1);
        localStorage.setItem('leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function addDriver(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
        if (!lead.drivers) lead.drivers = [];
        lead.drivers.push({
            name: '',
            license: '',
            cdlType: '',
            dob: '',
            experience: '',
            mvr: ''
        });
        localStorage.setItem('leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function updateDriver(leadId, driverIdx, field, value) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.drivers && lead.drivers[driverIdx]) {
        lead.drivers[driverIdx][field] = value;
        localStorage.setItem('leads', JSON.stringify(leads));
    }
}

function removeDriver(leadId, driverIdx) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.drivers) {
        lead.drivers.splice(driverIdx, 1);
        localStorage.setItem('leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function saveTranscript(leadId) {
    const transcriptValue = document.getElementById('lead-transcript').value;
    updateLeadField(leadId, 'transcriptText', transcriptValue);
    
    // Show success message
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
    btn.style.background = '#10b981';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '#3b82f6';
    }, 2000);
}

function closeLeadProfile() {
    const container = document.getElementById('lead-profile-container');
    if (container) {
        container.remove();
    }
}

function generateQuote(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
        alert(`Generating quote for ${lead.name}...`);
        // Here you would integrate with your quote generation system
    }
}

function exportLeadData(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
        const dataStr = JSON.stringify(lead, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `lead_${lead.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Make function globally available
window.showLeadProfile = showLeadProfile;
window.updateLeadField = updateLeadField;
window.updateLeadPremium = updateLeadPremium;
window.addVehicle = addVehicle;
window.updateVehicle = updateVehicle;
window.removeVehicle = removeVehicle;
window.addTrailer = addTrailer;
window.updateTrailer = updateTrailer;
window.removeTrailer = removeTrailer;
window.addDriver = addDriver;
window.updateDriver = updateDriver;
window.removeDriver = removeDriver;
window.saveTranscript = saveTranscript;
window.closeLeadProfile = closeLeadProfile;
window.generateQuote = generateQuote;
window.exportLeadData = exportLeadData;