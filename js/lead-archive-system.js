/**
 * Lead Archive System
 * Allows archiving leads instead of deleting them
 * Provides separate view for archived leads with restore and permanent delete options
 */

(function() {
    console.log('📦 Lead Archive System initializing...');
    
    // Archive a lead (move from active to archived)
    window.archiveLead = function(leadId) {
        console.log('Archiving lead:', leadId);
        
        // Get current leads
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const leadIndex = leads.findIndex(l => l.id === leadId || l.id == leadId);
        
        if (leadIndex === -1) {
            showNotification('Lead not found', 'error');
            return;
        }
        
        const lead = leads[leadIndex];
        
        // Add archive metadata
        lead.archived = true;
        lead.archivedDate = new Date().toISOString();
        lead.archivedBy = localStorage.getItem('currentUser') || 'Admin';
        
        // Get archived leads
        let archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        
        // Add to archived leads
        archivedLeads.push(lead);
        localStorage.setItem('archivedLeads', JSON.stringify(archivedLeads));
        
        // Remove from active leads
        leads.splice(leadIndex, 1);
        localStorage.setItem('leads', JSON.stringify(leads));
        
        showNotification(`Lead "${lead.name}" archived successfully`, 'success');
        
        // Reload the view
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        }
    };
    
    // Restore a lead from archive
    window.restoreArchivedLead = function(leadId) {
        console.log('Restoring lead:', leadId);
        
        // Get archived leads
        const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        const leadIndex = archivedLeads.findIndex(l => l.id === leadId || l.id == leadId);
        
        if (leadIndex === -1) {
            showNotification('Archived lead not found', 'error');
            return;
        }
        
        const lead = archivedLeads[leadIndex];
        
        // Remove archive metadata
        delete lead.archived;
        delete lead.archivedDate;
        delete lead.archivedBy;
        lead.restoredDate = new Date().toISOString();
        
        // Get active leads
        let activeLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        // Add back to active leads
        activeLeads.push(lead);
        localStorage.setItem('leads', JSON.stringify(activeLeads));
        
        // Remove from archived leads
        archivedLeads.splice(leadIndex, 1);
        localStorage.setItem('archivedLeads', JSON.stringify(archivedLeads));
        
        showNotification(`Lead "${lead.name}" restored successfully`, 'success');
        
        // Reload the view
        loadArchivedLeadsView();
    };
    
    // Permanently delete a lead from archive
    window.permanentlyDeleteLead = function(leadId) {
        if (!confirm('Are you sure you want to permanently delete this lead? This action cannot be undone.')) {
            return;
        }
        
        console.log('Permanently deleting lead:', leadId);
        
        // Get archived leads
        const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        const leadIndex = archivedLeads.findIndex(l => l.id === leadId || l.id == leadId);
        
        if (leadIndex === -1) {
            showNotification('Archived lead not found', 'error');
            return;
        }
        
        const lead = archivedLeads[leadIndex];
        
        // Remove from archived leads
        archivedLeads.splice(leadIndex, 1);
        localStorage.setItem('archivedLeads', JSON.stringify(archivedLeads));
        
        showNotification(`Lead "${lead.name}" permanently deleted`, 'success');
        
        // Reload the view
        loadArchivedLeadsView();
    };
    
    // Load archived leads view
    window.loadArchivedLeadsView = function() {
        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) return;
        
        const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        
        dashboardContent.innerHTML = `
            <div class="leads-view">
                <header class="content-header">
                    <h1>Archived Leads</h1>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="loadLeadsView()">
                            <i class="fas fa-arrow-left"></i> Back to Active Leads
                        </button>
                        <span style="margin-left: 10px; color: #6b7280;">
                            ${archivedLeads.length} archived lead${archivedLeads.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </header>
                
                <!-- Tabs for Active/Archived -->
                <div class="lead-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 0;">
                    <button class="tab-btn" onclick="loadLeadsView()" style="padding: 12px 24px; background: transparent; border: none; cursor: pointer; font-size: 16px; color: #6b7280;">
                        <i class="fas fa-users"></i> Active Leads
                    </button>
                    <button class="tab-btn active" style="padding: 12px 24px; background: transparent; border: none; border-bottom: 3px solid #3b82f6; cursor: pointer; font-size: 16px; color: #3b82f6; font-weight: 600;">
                        <i class="fas fa-archive"></i> Archived Leads
                    </button>
                </div>
                
                ${archivedLeads.length === 0 ? `
                    <div style="text-align: center; padding: 60px 20px; background: #f9fafb; border-radius: 8px;">
                        <i class="fas fa-archive" style="font-size: 48px; color: #d1d5db; margin-bottom: 20px;"></i>
                        <h3 style="color: #6b7280; margin-bottom: 10px;">No Archived Leads</h3>
                        <p style="color: #9ca3af;">Archived leads will appear here</p>
                    </div>
                ` : `
                    <div class="data-table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Lead Name</th>
                                    <th>Contact</th>
                                    <th>Product</th>
                                    <th>Premium</th>
                                    <th>Archived Date</th>
                                    <th>Archived By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${archivedLeads.map(lead => `
                                    <tr>
                                        <td>
                                            <div class="lead-name">
                                                <strong>${lead.name}</strong>
                                                ${lead.company ? `<br><small style="color: #6b7280;">${lead.company}</small>` : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <div class="contact-info">
                                                ${lead.email ? `<div><i class="fas fa-envelope" style="color: #6b7280; margin-right: 5px;"></i> ${lead.email}</div>` : ''}
                                                ${lead.phone ? `<div><i class="fas fa-phone" style="color: #6b7280; margin-right: 5px;"></i> ${lead.phone}</div>` : ''}
                                            </div>
                                        </td>
                                        <td>${lead.product || 'N/A'}</td>
                                        <td>$${(lead.premium || 0).toLocaleString()}</td>
                                        <td>${new Date(lead.archivedDate).toLocaleDateString()}</td>
                                        <td>${lead.archivedBy || 'Admin'}</td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="btn-icon" onclick="viewArchivedLead('${lead.id}')" title="View Details">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn-icon" onclick="restoreArchivedLead('${lead.id}')" title="Restore Lead" style="color: #10b981;">
                                                    <i class="fas fa-undo"></i>
                                                </button>
                                                <button class="btn-icon btn-icon-danger" onclick="permanentlyDeleteLead('${lead.id}')" title="Delete Permanently">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    };
    
    // View archived lead details
    window.viewArchivedLead = function(leadId) {
        const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        const lead = archivedLeads.find(l => l.id === leadId || l.id == leadId);
        
        if (!lead) {
            showNotification('Archived lead not found', 'error');
            return;
        }
        
        // Use existing viewLead function if available, or create a modal
        if (typeof viewLead === 'function') {
            // Temporarily add to leads for viewing
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            leads.push(lead);
            localStorage.setItem('leads', JSON.stringify(leads));
            
            viewLead(leadId);
            
            // Remove after viewing
            setTimeout(() => {
                const updatedLeads = JSON.parse(localStorage.getItem('leads') || '[]');
                const index = updatedLeads.findIndex(l => l.id === leadId);
                if (index !== -1) {
                    updatedLeads.splice(index, 1);
                    localStorage.setItem('leads', JSON.stringify(updatedLeads));
                }
            }, 100);
        }
    };
    
    // Override the original loadLeadsView to add archive tab
    const originalLoadLeadsView = window.loadLeadsView;
    window.loadLeadsView = function() {
        // Call original function first
        if (originalLoadLeadsView) {
            originalLoadLeadsView();
        }
        
        // Add tabs if not already present
        setTimeout(() => {
            const leadsView = document.querySelector('.leads-view');
            if (leadsView && !leadsView.querySelector('.lead-tabs')) {
                const header = leadsView.querySelector('.content-header');
                if (header) {
                    const archivedCount = JSON.parse(localStorage.getItem('archivedLeads') || '[]').length;
                    
                    const tabsHTML = `
                        <div class="lead-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 0;">
                            <button class="tab-btn active" style="padding: 12px 24px; background: transparent; border: none; border-bottom: 3px solid #3b82f6; cursor: pointer; font-size: 16px; color: #3b82f6; font-weight: 600;">
                                <i class="fas fa-users"></i> Active Leads
                            </button>
                            <button class="tab-btn" onclick="loadArchivedLeadsView()" style="padding: 12px 24px; background: transparent; border: none; cursor: pointer; font-size: 16px; color: #6b7280;">
                                <i class="fas fa-archive"></i> Archived Leads ${archivedCount > 0 ? `(${archivedCount})` : ''}
                            </button>
                        </div>
                    `;
                    
                    header.insertAdjacentHTML('afterend', tabsHTML);
                }
            }
            
            // Replace delete buttons with archive buttons
            const deleteButtons = document.querySelectorAll('.leads-view .btn-icon-danger');
            deleteButtons.forEach(btn => {
                const onclickAttr = btn.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes('deleteLead')) {
                    // Extract lead ID
                    const leadIdMatch = onclickAttr.match(/deleteLead\(['"]([^'"]+)['"]\)/);
                    if (leadIdMatch) {
                        const leadId = leadIdMatch[1];
                        btn.setAttribute('onclick', `archiveLead('${leadId}')`);
                        btn.setAttribute('title', 'Archive Lead');
                        btn.style.color = '#f59e0b'; // Orange color for archive
                        btn.innerHTML = '<i class="fas fa-archive"></i>';
                    }
                }
            });
        }, 100);
    };
    
    console.log('✅ Lead Archive System loaded');
    console.log('Use archiveLead(id) to archive, restoreArchivedLead(id) to restore');
})();