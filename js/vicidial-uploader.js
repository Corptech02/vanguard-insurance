// Vicidial Lead Uploader - Push leads FROM database TO Vicidial
// Reverses the traditional flow

const vicidialUploader = {
    // Test connection to Vicidial
    testConnection: async function() {
        try {
            const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8897' : 'http://72.23.167.167:8897';
            const response = await fetch(`${API_URL}/api/vicidial/test`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error testing Vicidial connection:', error);
            return {
                connected: false,
                error: error.message
            };
        }
    },

    // Upload leads to Vicidial
    uploadLeads: async function(criteria) {
        try {
            console.log('Uploading leads to Vicidial with criteria:', criteria);
            
            const params = new URLSearchParams({
                state: criteria.state || '',
                insurance_company: criteria.insuranceCompany || '',
                days_until_expiry: criteria.daysUntilExpiry || 30,
                limit: criteria.limit || 100,
                list_name: criteria.listName || '',
                campaign_id: criteria.campaignId || 'TEST'
            });
            
            const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8897' : 'http://72.23.167.167:8897';
            const response = await fetch(`${API_URL}/api/vicidial/upload?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error uploading leads to Vicidial:', error);
            throw error;
        }
    },

    // Get existing Vicidial lists
    getVicidialLists: async function() {
        try {
            const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8897' : 'http://72.23.167.167:8897';
            const response = await fetch(`${API_URL}/api/vicidial/lists`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            return data.lists || [];
        } catch (error) {
            console.error('Error getting Vicidial lists:', error);
            return [];
        }
    },

    // Overwrite existing list
    overwriteList: async function(listId, criteria) {
        try {
            console.log('Overwriting Vicidial list:', listId, 'with criteria:', criteria);
            
            // Build params ensuring no undefined values
            const params = new URLSearchParams({
                list_id: listId,
                state: criteria.state || '',
                insurance_company: criteria.insuranceCompany || '',
                days_until_expiry: String(criteria.daysUntilExpiry || 30),
                limit: String(criteria.limit || 100)
            });
            
            console.log('Request URL:', `/api/vicidial/overwrite?${params.toString()}`);
            
            const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8897' : 'http://72.23.167.167:8897';
            const response = await fetch(`${API_URL}/api/vicidial/overwrite?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error || errorData.detail) {
                        errorMessage = errorData.error || errorData.detail;
                    }
                } catch (e) {
                    // Response wasn't JSON
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error overwriting Vicidial list:', error);
            throw error;
        }
    },

    // Show upload dialog
    showUploadDialog: async function(criteria = null) {
        // Create modal HTML
        const modalHtml = `
            <div id="vicidialUploadModal" class="modal">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-upload"></i> Upload Leads to Vicidial</h2>
                        <span class="close" onclick="vicidialUploader.closeDialog()">&times;</span>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Connection Status -->
                        <div id="vicidialConnectionStatus" class="alert alert-info">
                            <i class="fas fa-spinner fa-spin"></i> Scanning Vicidial lists...
                        </div>
                        
                        <!-- List Selection -->
                        <div id="vicidialListSelection" style="display: none;">
                            <div class="form-section">
                                <h3><i class="fas fa-list"></i> Select Vicidial List to Overwrite</h3>
                                <div id="vicidialListsContainer" style="
                                    max-height: 200px;
                                    overflow-y: auto;
                                    border: 1px solid #dee2e6;
                                    border-radius: 6px;
                                    padding: 10px;
                                    background: #f8f9fa;
                                ">
                                    <div class="text-center">
                                        <i class="fas fa-spinner fa-spin"></i> Loading lists...
                                    </div>
                                </div>
                                <div style="margin-top: 10px; color: #dc3545;">
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    <strong>Warning:</strong> Selected list will be completely replaced with new leads!
                                </div>
                            </div>
                        </div>
                        
                        <!-- Upload Form -->
                        <form id="vicidialUploadForm">
                            <div class="form-section">
                                <h3>Lead Selection Criteria</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>State</label>
                                        <select id="vicidialState" class="form-control">
                                            <option value="">All States</option>
                                            <option value="OH">Ohio</option>
                                            <option value="PA">Pennsylvania</option>
                                            <option value="FL">Florida</option>
                                            <option value="TX">Texas</option>
                                            <option value="CA">California</option>
                                            <option value="IL">Illinois</option>
                                            <option value="NY">New York</option>
                                            <option value="GA">Georgia</option>
                                            <option value="NC">North Carolina</option>
                                            <option value="MI">Michigan</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Insurance Company</label>
                                        <select id="vicidialInsuranceCompany" class="form-control">
                                            <option value="">All Companies</option>
                                            <option value="Progressive Commercial">Progressive Commercial</option>
                                            <option value="GEICO Commercial">GEICO Commercial</option>
                                            <option value="Great West Casualty Company">Great West Casualty Company</option>
                                            <option value="Canal Insurance Company">Canal Insurance Company</option>
                                            <option value="Acuity">Acuity</option>
                                            <option value="Carolina Casualty">Carolina Casualty</option>
                                            <option value="State Farm">State Farm</option>
                                            <option value="Allstate">Allstate</option>
                                            <option value="Nationwide">Nationwide</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group" style="width: 100%;">
                                        <label>Insurance Expiring Within (Days)</label>
                                        <input type="number" id="vicidialExpiryDays" 
                                               class="form-control" value="30" min="1" max="365">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" 
                                        onclick="vicidialUploader.closeDialog()">
                                    Cancel
                                </button>
                                <button type="button" class="btn btn-primary" 
                                        onclick="vicidialUploader.performUpload()"
                                        id="vicidialUploadBtn" disabled>
                                    <i class="fas fa-upload"></i> Overwrite Selected List
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page if not exists
        if (!document.getElementById('vicidialUploadModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        // Show modal
        document.getElementById('vicidialUploadModal').style.display = 'block';
        
        // Pre-fill form if criteria provided
        if (criteria) {
            setTimeout(() => {
                if (criteria.state && document.getElementById('vicidialState')) {
                    document.getElementById('vicidialState').value = criteria.state;
                }
                if (criteria.insuranceCompany && document.getElementById('vicidialInsuranceCompany')) {
                    // Try to find matching option
                    const insuranceSelect = document.getElementById('vicidialInsuranceCompany');
                    const options = Array.from(insuranceSelect.options);
                    const matchingOption = options.find(opt => 
                        opt.value.toLowerCase().includes(criteria.insuranceCompany.toLowerCase().split(' ')[0])
                    );
                    if (matchingOption) {
                        insuranceSelect.value = matchingOption.value;
                    }
                }
                if (criteria.daysUntilExpiry && document.getElementById('vicidialExpiryDays')) {
                    document.getElementById('vicidialExpiryDays').value = criteria.daysUntilExpiry;
                }
            }, 100);
        }
        
        // Load Vicidial lists and test connection
        this.loadVicidialLists();
    },

    // Load Vicidial lists
    loadVicidialLists: async function() {
        const statusDiv = document.getElementById('vicidialConnectionStatus');
        const listsContainer = document.getElementById('vicidialListsContainer');
        const listSelection = document.getElementById('vicidialListSelection');
        
        // Test connection first
        const connectionResult = await this.testConnection();
        
        if (!connectionResult.connected) {
            statusDiv.className = 'alert alert-danger';
            statusDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 
                Cannot connect to Vicidial: ${connectionResult.error || 'Connection failed'}
            `;
            return;
        }
        
        // Get lists
        const lists = await this.getVicidialLists();
        
        if (lists && lists.length > 0) {
            statusDiv.className = 'alert alert-success';
            statusDiv.innerHTML = `
                <i class="fas fa-check-circle"></i> 
                Connected! Found ${lists.length} Vicidial lists
            `;
            
            // Show list selection
            listSelection.style.display = 'block';
            
            // Build list selection HTML
            let listsHtml = '';
            lists.forEach((list, index) => {
                listsHtml += `
                    <div class="list-item" style="
                        padding: 10px;
                        margin: 5px 0;
                        background: white;
                        border: 2px solid #dee2e6;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onclick="vicidialUploader.selectList('${list.list_id}', this)">
                        <input type="radio" name="vicidialList" value="${list.list_id}" 
                               id="list_${list.list_id}" style="margin-right: 10px;">
                        <label for="list_${list.list_id}" style="cursor: pointer; margin: 0;">
                            <strong>List ${list.list_id}</strong> - ${list.list_name || 'Unnamed List'}
                            ${list.campaign ? `<span style="color: #6c757d; margin-left: 10px;">[Campaign: ${list.campaign}]</span>` : ''}
                        </label>
                    </div>
                `;
            });
            
            listsContainer.innerHTML = listsHtml;
        } else {
            statusDiv.className = 'alert alert-warning';
            statusDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                No Vicidial lists found. Using default list 1006.
            `;
            
            // Show default list
            listSelection.style.display = 'block';
            listsContainer.innerHTML = `
                <div class="list-item" style="
                    padding: 10px;
                    background: white;
                    border: 2px solid #28a745;
                    border-radius: 6px;
                " onclick="vicidialUploader.selectList('1006', this)">
                    <input type="radio" name="vicidialList" value="1006" 
                           id="list_1006" checked style="margin-right: 10px;">
                    <label for="list_1006" style="cursor: pointer; margin: 0;">
                        <strong>List 1006</strong> - Default Insurance Leads List
                    </label>
                </div>
            `;
            
            this.selectedListId = '1006';
            document.getElementById('vicidialUploadBtn').disabled = false;
        }
    },
    
    // Select a list
    selectList: function(listId, element) {
        // Remove selected class from all items
        document.querySelectorAll('.list-item').forEach(item => {
            item.style.border = '2px solid #dee2e6';
            item.style.background = 'white';
        });
        
        // Add selected class to clicked item
        element.style.border = '2px solid #28a745';
        element.style.background = '#f0fdf4';
        
        // Check the radio button
        document.getElementById(`list_${listId}`).checked = true;
        
        // Store selected list ID
        this.selectedListId = listId;
        
        // Enable upload button
        document.getElementById('vicidialUploadBtn').disabled = false;
    },

    // Perform the upload
    performUpload: async function() {
        const btn = document.getElementById('vicidialUploadBtn');
        const originalText = btn.innerHTML;
        
        // Check if list is selected
        if (!this.selectedListId) {
            alert('Please select a Vicidial list to overwrite');
            return;
        }
        
        // Confirm overwrite
        if (!confirm(`Are you sure you want to COMPLETELY REPLACE List ${this.selectedListId} with new leads?\n\nThis will DELETE all existing leads in the list!`)) {
            return;
        }
        
        // Disable button and show loading
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Overwriting list...';
        
        try {
            // Get form values
            const criteria = {
                state: document.getElementById('vicidialState').value,
                insuranceCompany: document.getElementById('vicidialInsuranceCompany').value,
                daysUntilExpiry: parseInt(document.getElementById('vicidialExpiryDays').value),
                limit: 5000  // Max 5000 leads per upload for Vicidial stability
            };
            
            // Overwrite the selected list
            const result = await this.overwriteList(this.selectedListId, criteria);
            
            if (result.success) {
                // Check if it's async upload
                if (result.status === 'uploading') {
                    // Show processing message
                    this.showProcessingMessage(result);
                } else {
                    // Show success message
                    this.showUploadResult(result);
                }
            } else {
                throw new Error(result.error || 'Upload failed');
            }
            
        } catch (error) {
            alert('Upload failed: ' + error.message);
            console.error('Upload error:', error);
        } finally {
            // Re-enable button
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    // Show processing message for async uploads
    showProcessingMessage: function(result) {
        // Try modal content first, then modal body
        let modalContent = document.getElementById('vicidialModalContent');
        if (!modalContent) {
            modalContent = document.querySelector('#vicidialUploadModal .modal-body');
        }
        
        if (!modalContent) {
            alert('Upload started! Processing in background...');
            return;
        }
        
        modalContent.innerHTML = `
            <div class="upload-result">
                <div class="text-center">
                    <i class="fas fa-cloud-upload-alt fa-5x text-primary mb-3"></i>
                    <h3 class="mb-3">Upload Started!</h3>
                    <p class="lead">${result.message}</p>
                    
                    <div class="alert alert-info mt-4">
                        <i class="fas fa-info-circle"></i> 
                        The leads are being uploaded to list ${result.list_id} in the background.
                        This process will continue even if you close this dialog.
                    </div>
                    
                    <div class="spinner-border text-primary mt-3" role="status">
                        <span class="sr-only">Processing...</span>
                    </div>
                </div>
                
                <div class="modal-footer mt-4">
                    <button class="btn btn-primary" onclick="vicidialUploader.closeDialog()">
                        Close
                    </button>
                    <a href="https://204.13.233.29/vicidial/admin.php?ADD=311&list_id=${result.list_id}" 
                       target="_blank" class="btn btn-success">
                        <i class="fas fa-external-link-alt"></i> View List in Vicidial
                    </a>
                </div>
            </div>
        `;
    },
    
    // Show upload result
    showUploadResult: function(result) {
        const modalBody = document.querySelector('#vicidialUploadModal .modal-body');
        
        // Log result for debugging
        console.log('Upload result:', result);
        
        modalBody.innerHTML = `
            <div class="upload-result">
                <div class="alert alert-success">
                    <h3><i class="fas fa-check-circle"></i> List Overwrite Complete!</h3>
                </div>
                
                <div class="result-stats">
                    <div class="stat-card">
                        <div class="stat-value">${result.uploaded}</div>
                        <div class="stat-label">Leads Uploaded</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${result.failed}</div>
                        <div class="stat-label">Failed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${result.total_leads}</div>
                        <div class="stat-label">Total Processed</div>
                    </div>
                </div>
                
                <div class="result-details">
                    <p><strong>List ID:</strong> ${result.list_id}</p>
                    <p><strong>Status:</strong> List has been completely replaced with new leads</p>
                    ${result.overwritten ? '<p style="color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> All previous leads in this list have been removed</p>' : ''}
                </div>
                
                <div class="result-preview">
                    <h4>Sample Uploaded Leads:</h4>
                    <ul>
                        ${result.leads && result.leads.slice(0, 5).map(lead => `
                            <li>${lead.first_name} ${lead.last_name} - ${lead.phone_number}</li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="vicidialUploader.closeDialog()">
                        Close
                    </button>
                    <a href="https://204.13.233.29/vicidial/admin.php?ADD=311&list_id=${result.list_id}" 
                       target="_blank" class="btn btn-success">
                        <i class="fas fa-external-link-alt"></i> View in Vicidial
                    </a>
                </div>
            </div>
        `;
    },

    // Close dialog
    closeDialog: function() {
        const modal = document.getElementById('vicidialUploadModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
};

// Add CSS for the upload modal
const uploadStyles = `
<style>
.upload-result {
    padding: 20px;
}

.result-stats {
    display: flex;
    justify-content: space-around;
    margin: 30px 0;
}

.stat-card {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    flex: 1;
    margin: 0 10px;
}

.stat-value {
    font-size: 36px;
    font-weight: bold;
    color: #2c3e50;
}

.stat-label {
    font-size: 14px;
    color: #7f8c8d;
    margin-top: 5px;
}

.result-details {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
}

.result-preview {
    margin-top: 20px;
}

.result-preview ul {
    list-style: none;
    padding: 0;
}

.result-preview li {
    padding: 8px;
    background: #fff;
    margin: 5px 0;
    border-left: 3px solid #28a745;
    border-radius: 4px;
}

.form-section {
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid #dee2e6;
}

.form-section h3 {
    margin-bottom: 15px;
    color: #495057;
}

.form-row {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
}

.form-group {
    flex: 1;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #495057;
}

.form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
}

.alert {
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.alert-info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.alert-danger {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}
</style>
`;

// Add styles to document if not already added
if (!document.getElementById('vicidialUploaderStyles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'vicidialUploaderStyles';
    styleElement.innerHTML = uploadStyles;
    document.head.appendChild(styleElement.firstElementChild);
}

// Make globally available
window.vicidialUploader = vicidialUploader;