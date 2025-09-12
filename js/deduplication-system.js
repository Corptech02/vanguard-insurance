// Deduplication System for Vanguard CRM
// Prevents duplicates across leads, clients, and archived leads

(function() {
    console.log('🔄 Initializing Deduplication System...');
    
    // Main deduplication function
    window.deduplicateData = function() {
        console.log('Running deduplication across all data sources...');
        
        // Get all data sources
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        
        console.log(`Initial counts - Leads: ${leads.length}, Clients: ${clients.length}, Archived: ${archivedLeads.length}`);
        
        // Create lookup maps for faster searching
        const clientPhones = new Set();
        const clientEmails = new Set();
        const clientNames = new Set();
        const clientLeadIds = new Set(); // Track which lead IDs have been converted
        
        // Build client lookup maps
        clients.forEach(client => {
            if (client.phone) {
                const cleanPhone = client.phone.replace(/\D/g, '');
                if (cleanPhone) clientPhones.add(cleanPhone);
            }
            if (client.email) {
                clientEmails.add(client.email.toLowerCase());
            }
            if (client.name) {
                clientNames.add(client.name.toLowerCase());
            }
            // Track the original lead ID if this client was converted from a lead
            if (client.leadId) {
                clientLeadIds.add(String(client.leadId));
            }
        });
        
        // Build archived lookup maps
        const archivedPhones = new Set();
        const archivedEmails = new Set();
        const archivedIds = new Set();
        
        archivedLeads.forEach(lead => {
            if (lead.phone) {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                if (cleanPhone) archivedPhones.add(cleanPhone);
            }
            if (lead.email) {
                archivedEmails.add(lead.email.toLowerCase());
            }
            archivedIds.add(String(lead.id));
        });
        
        // Filter leads to remove duplicates
        const deduplicatedLeads = leads.filter(lead => {
            // Check if this lead has been converted to a client
            if (clientLeadIds.has(String(lead.id))) {
                console.log(`Removing lead "${lead.name}" - already converted to client`);
                return false;
            }
            
            // Check if lead is marked as converted
            if (lead.stage === 'converted' || lead.status === 'converted') {
                console.log(`Removing lead "${lead.name}" - marked as converted`);
                return false;
            }
            
            // Check if lead has a clientId (meaning it was converted)
            if (lead.clientId) {
                console.log(`Removing lead "${lead.name}" - has clientId ${lead.clientId}`);
                return false;
            }
            
            // Check if already archived
            if (archivedIds.has(String(lead.id))) {
                console.log(`Removing lead "${lead.name}" - already archived`);
                return false;
            }
            
            // Check by phone number
            if (lead.phone) {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                if (cleanPhone && clientPhones.has(cleanPhone)) {
                    console.log(`Removing lead "${lead.name}" - phone matches existing client`);
                    return false;
                }
                if (cleanPhone && archivedPhones.has(cleanPhone)) {
                    console.log(`Removing lead "${lead.name}" - phone matches archived lead`);
                    return false;
                }
            }
            
            // Check by email
            if (lead.email) {
                const cleanEmail = lead.email.toLowerCase();
                if (clientEmails.has(cleanEmail)) {
                    console.log(`Removing lead "${lead.name}" - email matches existing client`);
                    return false;
                }
                if (archivedEmails.has(cleanEmail)) {
                    console.log(`Removing lead "${lead.name}" - email matches archived lead`);
                    return false;
                }
            }
            
            // Check by exact name match
            if (lead.name) {
                const cleanName = lead.name.toLowerCase();
                if (clientNames.has(cleanName)) {
                    console.log(`Removing lead "${lead.name}" - name matches existing client`);
                    return false;
                }
            }
            
            // Lead is unique, keep it
            return true;
        });
        
        const removedCount = leads.length - deduplicatedLeads.length;
        if (removedCount > 0) {
            console.log(`✅ Removed ${removedCount} duplicate leads`);
            localStorage.setItem('leads', JSON.stringify(deduplicatedLeads));
        } else {
            console.log('✅ No duplicate leads found');
        }
        
        console.log(`Final counts - Leads: ${deduplicatedLeads.length}, Clients: ${clients.length}, Archived: ${archivedLeads.length}`);
        
        return {
            originalLeads: leads.length,
            deduplicatedLeads: deduplicatedLeads.length,
            removedCount: removedCount,
            clients: clients.length,
            archived: archivedLeads.length
        };
    };
    
    // Enhanced lead loading function with deduplication
    window.loadLeadsWithDeduplication = function() {
        console.log('Loading leads with deduplication...');
        
        // First run deduplication
        const result = window.deduplicateData();
        
        // Get the clean leads
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        console.log(`Loaded ${leads.length} deduplicated leads`);
        return leads;
    };
    
    // Override the original convertLead function to ensure proper cleanup
    const originalConvertLead = window.confirmConvertLead;
    window.confirmConvertLead = function(event, leadId) {
        console.log('Enhanced confirmConvertLead - ensuring proper deduplication');
        
        // Call the original function
        if (originalConvertLead) {
            originalConvertLead.call(this, event, leadId);
        }
        
        // Run deduplication after conversion
        setTimeout(() => {
            console.log('Running post-conversion deduplication...');
            window.deduplicateData();
        }, 500);
    };
    
    // Override archiveLead to ensure proper cleanup
    const originalArchiveLead = window.archiveLead;
    window.archiveLead = function(leadId) {
        console.log('Enhanced archiveLead - ensuring proper deduplication');
        
        // Call the original function
        if (originalArchiveLead) {
            originalArchiveLead.call(this, leadId);
        }
        
        // Run deduplication after archiving
        setTimeout(() => {
            console.log('Running post-archive deduplication...');
            window.deduplicateData();
        }, 500);
    };
    
    // Auto-deduplicate on page load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            console.log('Running initial deduplication on page load...');
            window.deduplicateData();
        }, 1000);
    });
    
    // Deduplicate when hash changes (navigating between views)
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#leads') {
            setTimeout(() => {
                console.log('Navigated to leads view - running deduplication...');
                window.deduplicateData();
            }, 100);
        }
    });
    
    // Provide a manual deduplication function for debugging
    window.manualDeduplicate = function() {
        console.log('=== MANUAL DEDUPLICATION ===');
        const result = window.deduplicateData();
        console.table(result);
        
        if (result.removedCount > 0) {
            showNotification(`Removed ${result.removedCount} duplicate leads`, 'success');
        } else {
            showNotification('No duplicates found', 'info');
        }
        
        // Reload the current view if on leads page
        if (window.location.hash === '#leads' || !window.location.hash) {
            if (typeof loadLeadsView === 'function') {
                loadLeadsView();
            }
        }
        
        return result;
    };
    
    console.log('✅ Deduplication System initialized');
    console.log('Commands available:');
    console.log('  - deduplicateData(): Run deduplication');
    console.log('  - loadLeadsWithDeduplication(): Load deduplicated leads');
    console.log('  - manualDeduplicate(): Manual deduplication with UI feedback');
})();