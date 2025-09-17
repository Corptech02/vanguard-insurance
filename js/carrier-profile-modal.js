// Carrier Profile Modal Component
// Displays comprehensive carrier information including inspections

class CarrierProfileModal {
    constructor() {
        this.modalId = 'carrierProfileModal';
        this.createModal();
    }

    createModal() {
        // Remove existing modal if present
        const existing = document.getElementById(this.modalId);
        if (existing) existing.remove();

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-truck-moving me-2"></i>
                            Carrier Profile
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="profileContent">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-3">Loading carrier profile...</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="carrierProfile.exportProfile()">
                            <i class="fas fa-download"></i> Export Profile
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = new bootstrap.Modal(modal);
    }

    async showProfile(dotNumber) {
        this.modal.show();
        const contentDiv = document.getElementById('profileContent');

        try {
            // Fetch carrier profile from API
            const response = await apiService.getCarrierProfile(dotNumber);

            if (!response || !response.carrier) {
                throw new Error('No carrier data found');
            }

            const { carrier, inspection_summary, recent_inspections } = response;

            // Build profile HTML
            contentDiv.innerHTML = `
                <!-- Navigation Tabs -->
                <ul class="nav nav-tabs mb-4" role="tablist">
                    <li class="nav-item">
                        <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#overview">
                            <i class="fas fa-info-circle"></i> Overview
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" data-bs-toggle="tab" data-bs-target="#inspections">
                            <i class="fas fa-clipboard-check"></i> Inspections
                            ${carrier.total_inspections ? `<span class="badge bg-danger ms-1">${carrier.total_inspections}</span>` : ''}
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" data-bs-toggle="tab" data-bs-target="#insurance">
                            <i class="fas fa-shield-alt"></i> Insurance
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" data-bs-toggle="tab" data-bs-target="#safety">
                            <i class="fas fa-hard-hat"></i> Safety Stats
                        </button>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Overview Tab -->
                    <div class="tab-pane fade show active" id="overview">
                        ${this.renderOverview(carrier)}
                    </div>

                    <!-- Inspections Tab -->
                    <div class="tab-pane fade" id="inspections">
                        ${this.renderInspections(carrier, inspection_summary, recent_inspections)}
                    </div>

                    <!-- Insurance Tab -->
                    <div class="tab-pane fade" id="insurance">
                        ${this.renderInsurance(carrier)}
                    </div>

                    <!-- Safety Tab -->
                    <div class="tab-pane fade" id="safety">
                        ${this.renderSafety(carrier, inspection_summary)}
                    </div>
                </div>
            `;

            // Store current profile data for export
            this.currentProfile = response;

        } catch (error) {
            console.error('Error loading carrier profile:', error);
            contentDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load carrier profile: ${error.message}
                </div>
            `;
        }
    }

    renderOverview(carrier) {
        return `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="fas fa-building me-2"></i>Company Information</h6>
                        </div>
                        <div class="card-body">
                            <dl class="row mb-0">
                                <dt class="col-sm-5">Legal Name:</dt>
                                <dd class="col-sm-7">${carrier.legal_name || 'N/A'}</dd>

                                <dt class="col-sm-5">DBA Name:</dt>
                                <dd class="col-sm-7">${carrier.dba_name || 'N/A'}</dd>

                                <dt class="col-sm-5">DOT Number:</dt>
                                <dd class="col-sm-7">
                                    <span class="badge bg-primary">${carrier.dot_number}</span>
                                </dd>

                                <dt class="col-sm-5">MC Number:</dt>
                                <dd class="col-sm-7">${carrier.mc_number || 'N/A'}</dd>

                                <dt class="col-sm-5">Entity Type:</dt>
                                <dd class="col-sm-7">${carrier.entity_type || 'N/A'}</dd>

                                <dt class="col-sm-5">Operating Status:</dt>
                                <dd class="col-sm-7">
                                    <span class="badge ${carrier.operating_status === 'Active' ? 'bg-success' : 'bg-warning'}">
                                        ${carrier.operating_status || 'Unknown'}
                                    </span>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="fas fa-map-marker-alt me-2"></i>Contact Information</h6>
                        </div>
                        <div class="card-body">
                            <dl class="row mb-0">
                                <dt class="col-sm-4">Address:</dt>
                                <dd class="col-sm-8">
                                    ${carrier.street || ''}<br>
                                    ${carrier.city || ''}, ${carrier.state || ''} ${carrier.zip_code || ''}
                                </dd>

                                <dt class="col-sm-4">Phone:</dt>
                                <dd class="col-sm-8">
                                    ${carrier.phone ? `<a href="tel:${carrier.phone}">${carrier.phone}</a>` : 'N/A'}
                                </dd>

                                <dt class="col-sm-4">Email:</dt>
                                <dd class="col-sm-8">
                                    ${carrier.email ? `<a href="mailto:${carrier.email}">${carrier.email}</a>` : 'N/A'}
                                </dd>

                                <dt class="col-sm-4">Website:</dt>
                                <dd class="col-sm-8">
                                    ${carrier.website ? `<a href="${carrier.website}" target="_blank">${carrier.website}</a>` : 'N/A'}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="fas fa-truck me-2"></i>Fleet Information</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3 text-center">
                                    <h4 class="text-primary">${carrier.drivers || 0}</h4>
                                    <small class="text-muted">Drivers</small>
                                </div>
                                <div class="col-md-3 text-center">
                                    <h4 class="text-info">${carrier.power_units || 0}</h4>
                                    <small class="text-muted">Power Units</small>
                                </div>
                                <div class="col-md-3 text-center">
                                    <h4 class="text-success">${carrier.total_inspections || 0}</h4>
                                    <small class="text-muted">Total Inspections</small>
                                </div>
                                <div class="col-md-3 text-center">
                                    <h4 class="text-warning">${carrier.total_violations || 0}</h4>
                                    <small class="text-muted">Total Violations</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderInspections(carrier, summary, inspections) {
        if (!inspections || inspections.length === 0) {
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No inspection records found for this carrier.
                </div>
            `;
        }

        return `
            <!-- Inspection Summary -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-primary">${carrier.total_inspections || 0}</h3>
                            <small>Total Inspections</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-warning">${carrier.total_violations || 0}</h3>
                            <small>Total Violations</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-danger">${carrier.total_oos || 0}</h3>
                            <small>Out of Service</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-info">${carrier.avg_violations_per_inspection ? carrier.avg_violations_per_inspection.toFixed(2) : '0'}</h3>
                            <small>Avg Violations/Inspection</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Inspections Table -->
            <div class="card">
                <div class="card-header bg-light">
                    <h6 class="mb-0">
                        <i class="fas fa-history me-2"></i>
                        Recent Inspections (Last ${inspections.length} Records)
                    </h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Inspection ID</th>
                                    <th>Location</th>
                                    <th>Level</th>
                                    <th>Violations</th>
                                    <th>OOS</th>
                                    <th>Vehicle Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${inspections.map(insp => `
                                    <tr>
                                        <td>${this.formatDate(insp.insp_date)}</td>
                                        <td><small>${insp.inspection_id}</small></td>
                                        <td>${insp.location_desc || 'N/A'}, ${insp.report_state || ''}</td>
                                        <td>
                                            <span class="badge bg-secondary">Level ${insp.insp_level_id}</span>
                                        </td>
                                        <td>
                                            ${insp.viol_total > 0 ?
                                                `<span class="badge bg-warning">${insp.viol_total}</span>` :
                                                '<span class="badge bg-success">0</span>'}
                                        </td>
                                        <td>
                                            ${insp.oos_total > 0 ?
                                                `<span class="badge bg-danger">${insp.oos_total}</span>` :
                                                '<span class="badge bg-success">0</span>'}
                                        </td>
                                        <td>${insp.gross_comb_veh_wt || 'N/A'} lbs</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Violation Breakdown -->
            ${this.renderViolationBreakdown(inspections)}
        `;
    }

    renderViolationBreakdown(inspections) {
        const totalDriverViol = inspections.reduce((sum, i) => sum + (i.driver_viol_total || 0), 0);
        const totalVehicleViol = inspections.reduce((sum, i) => sum + (i.vehicle_viol_total || 0), 0);
        const totalHazmatViol = inspections.reduce((sum, i) => sum + (i.hazmat_viol_total || 0), 0);

        return `
            <div class="card mt-4">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Violation Breakdown</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-user-tie fa-2x text-primary me-3"></i>
                                <div>
                                    <h5 class="mb-0">${totalDriverViol}</h5>
                                    <small class="text-muted">Driver Violations</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-truck fa-2x text-warning me-3"></i>
                                <div>
                                    <h5 class="mb-0">${totalVehicleViol}</h5>
                                    <small class="text-muted">Vehicle Violations</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-radiation fa-2x text-danger me-3"></i>
                                <div>
                                    <h5 class="mb-0">${totalHazmatViol}</h5>
                                    <small class="text-muted">Hazmat Violations</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderInsurance(carrier) {
        return `
            <div class="card">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-shield-alt me-2"></i>Insurance Information</h6>
                </div>
                <div class="card-body">
                    <dl class="row">
                        <dt class="col-sm-4">Insurance Carrier:</dt>
                        <dd class="col-sm-8">
                            <strong>${carrier.insurance_carrier || 'Not Available'}</strong>
                        </dd>

                        <dt class="col-sm-4">Policy Number:</dt>
                        <dd class="col-sm-8">${carrier.policy_number || 'N/A'}</dd>

                        <dt class="col-sm-4">Coverage Type:</dt>
                        <dd class="col-sm-8">${carrier.coverage_type || 'N/A'}</dd>

                        <dt class="col-sm-4">Required Coverage:</dt>
                        <dd class="col-sm-8">
                            ${carrier.bipd_insurance_required_amount ?
                                `$${Number(carrier.bipd_insurance_required_amount).toLocaleString()}` :
                                'N/A'}
                        </dd>

                        <dt class="col-sm-4">Coverage on File:</dt>
                        <dd class="col-sm-8">
                            ${carrier.bipd_insurance_on_file_amount ?
                                `$${Number(carrier.bipd_insurance_on_file_amount).toLocaleString()}` :
                                'N/A'}
                        </dd>

                        <dt class="col-sm-4">Coverage Status:</dt>
                        <dd class="col-sm-8">
                            ${this.getInsuranceStatus(carrier)}
                        </dd>
                    </dl>
                </div>
            </div>

            <div class="card mt-4">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>Coverage Analysis</h6>
                </div>
                <div class="card-body">
                    ${this.analyzeInsuranceCoverage(carrier)}
                </div>
            </div>
        `;
    }

    renderSafety(carrier, summary) {
        return `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Safety Performance</h6>
                        </div>
                        <div class="card-body">
                            <dl class="row">
                                <dt class="col-sm-6">Safety Rating:</dt>
                                <dd class="col-sm-6">
                                    ${carrier.safety_rating ?
                                        `<span class="badge bg-${this.getSafetyColor(carrier.safety_rating)}">${carrier.safety_rating}</span>` :
                                        'Not Rated'}
                                </dd>

                                <dt class="col-sm-6">Last Inspection:</dt>
                                <dd class="col-sm-6">${carrier.last_inspection_date ? this.formatDate(carrier.last_inspection_date) : 'N/A'}</dd>

                                <dt class="col-sm-6">Inspection Frequency:</dt>
                                <dd class="col-sm-6">${this.calculateInspectionFrequency(carrier)}</dd>

                                <dt class="col-sm-6">Violation Rate:</dt>
                                <dd class="col-sm-6">${this.calculateViolationRate(carrier)}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="fas fa-award me-2"></i>Compliance Score</h6>
                        </div>
                        <div class="card-body">
                            <div class="text-center">
                                <h1 class="${this.getComplianceColor(carrier)}">${this.calculateComplianceScore(carrier)}%</h1>
                                <p class="text-muted">Based on violations and OOS records</p>
                                <div class="progress">
                                    <div class="progress-bar ${this.getComplianceBarColor(carrier)}"
                                         style="width: ${this.calculateComplianceScore(carrier)}%">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mt-4">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-clipboard-list me-2"></i>Recommendations</h6>
                </div>
                <div class="card-body">
                    ${this.generateRecommendations(carrier)}
                </div>
            </div>
        `;
    }

    // Helper methods
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${month}/${day}/${year}`;
    }

    getInsuranceStatus(carrier) {
        const required = carrier.bipd_insurance_required_amount || 0;
        const onFile = carrier.bipd_insurance_on_file_amount || 0;

        if (onFile >= required && required > 0) {
            return '<span class="badge bg-success">Adequate Coverage</span>';
        } else if (onFile > 0 && onFile < required) {
            return '<span class="badge bg-warning">Insufficient Coverage</span>';
        } else {
            return '<span class="badge bg-danger">No Coverage on File</span>';
        }
    }

    analyzeInsuranceCoverage(carrier) {
        const required = carrier.bipd_insurance_required_amount || 0;
        const onFile = carrier.bipd_insurance_on_file_amount || 0;
        const difference = onFile - required;

        let analysis = '<ul class="mb-0">';

        if (onFile >= required && required > 0) {
            analysis += `<li class="text-success">✓ Carrier meets minimum insurance requirements</li>`;
            if (difference > 0) {
                analysis += `<li class="text-success">✓ Coverage exceeds requirement by $${difference.toLocaleString()}</li>`;
            }
        } else if (onFile > 0 && onFile < required) {
            analysis += `<li class="text-warning">⚠ Coverage is $${Math.abs(difference).toLocaleString()} below requirement</li>`;
            analysis += `<li class="text-warning">⚠ Carrier should update insurance to meet requirements</li>`;
        } else {
            analysis += `<li class="text-danger">✗ No insurance coverage on file</li>`;
            analysis += `<li class="text-danger">✗ Requires immediate attention</li>`;
        }

        analysis += '</ul>';
        return analysis;
    }

    getSafetyColor(rating) {
        switch(rating) {
            case 'Satisfactory': return 'success';
            case 'Conditional': return 'warning';
            case 'Unsatisfactory': return 'danger';
            default: return 'secondary';
        }
    }

    calculateInspectionFrequency(carrier) {
        if (!carrier.total_inspections) return 'No inspections';
        // This is simplified - you'd calculate based on date range
        if (carrier.total_inspections > 20) return 'High (20+ inspections)';
        if (carrier.total_inspections > 10) return 'Medium (10-20 inspections)';
        return 'Low (<10 inspections)';
    }

    calculateViolationRate(carrier) {
        if (!carrier.total_inspections || carrier.total_inspections === 0) return 'N/A';
        const rate = (carrier.total_violations / carrier.total_inspections).toFixed(2);
        return `${rate} violations per inspection`;
    }

    calculateComplianceScore(carrier) {
        if (!carrier.total_inspections) return 100;

        const violationPenalty = (carrier.total_violations || 0) * 2;
        const oosPenalty = (carrier.total_oos || 0) * 5;

        let score = 100 - violationPenalty - oosPenalty;
        score = Math.max(0, Math.min(100, score));

        return Math.round(score);
    }

    getComplianceColor(carrier) {
        const score = this.calculateComplianceScore(carrier);
        if (score >= 80) return 'text-success';
        if (score >= 60) return 'text-warning';
        return 'text-danger';
    }

    getComplianceBarColor(carrier) {
        const score = this.calculateComplianceScore(carrier);
        if (score >= 80) return 'bg-success';
        if (score >= 60) return 'bg-warning';
        return 'bg-danger';
    }

    generateRecommendations(carrier) {
        const recommendations = [];
        const score = this.calculateComplianceScore(carrier);

        if (score < 60) {
            recommendations.push('⚠️ <strong>High Priority:</strong> Schedule safety training for drivers');
            recommendations.push('⚠️ <strong>High Priority:</strong> Implement vehicle maintenance program');
        }

        if (carrier.total_oos > 5) {
            recommendations.push('🔧 Review and improve pre-trip inspection procedures');
        }

        if (carrier.avg_violations_per_inspection > 2) {
            recommendations.push('📋 Conduct internal compliance audit');
        }

        if (!carrier.insurance_carrier) {
            recommendations.push('🛡️ <strong>Critical:</strong> Update insurance information');
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ Carrier shows good compliance - maintain current practices');
        }

        return '<ul class="mb-0">' + recommendations.map(r => `<li>${r}</li>`).join('') + '</ul>';
    }

    exportProfile() {
        if (!this.currentProfile) {
            alert('No profile data to export');
            return;
        }

        const { carrier } = this.currentProfile;
        const filename = `carrier_profile_${carrier.dot_number}_${new Date().toISOString().split('T')[0]}.json`;

        const dataStr = JSON.stringify(this.currentProfile, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize the carrier profile modal
const carrierProfile = new CarrierProfileModal();

// Add to window for global access
window.carrierProfile = carrierProfile;