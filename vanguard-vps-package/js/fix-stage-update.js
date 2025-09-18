// Fix lead stage update issue
console.log('Fixing lead stage update...');

(function() {
    // Store the existing function (might be wrapped by persistence)
    const existingUpdateLeadStage = window.updateLeadStage;
    
    // Override updateLeadStage to work properly
    window.updateLeadStage = function(leadId, newStage) {
        console.log('Updating lead stage:', leadId, 'to', newStage);
        
        // Get leads from localStorage
        let leads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        // Find the lead - try multiple matching strategies
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                console.log('Found lead, updating stage from', leads[i].stage, 'to', newStage);
                leads[i].stage = newStage;
                leadFound = true;
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found for stage update:', leadId);
            console.log('Available lead IDs:', leads.map(l => l.id));
            showNotification('Lead not found', 'error');
            return;
        }
        
        // Save back to localStorage using the original setItem to avoid issues
        const originalSetItem = localStorage.setItem.bind(localStorage);
        originalSetItem('leads', JSON.stringify(leads));
        
        // Also update the tracker if it exists
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].stage = newStage;
        originalSetItem('leadStatusTracker', JSON.stringify(tracker));
        
        // Show success message
        if (window.showNotification) {
            showNotification('Lead stage updated to: ' + newStage, 'success');
        }
        
        // Refresh the leads view if it's active
        setTimeout(() => {
            if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
                if (window.loadLeadsView) {
                    window.loadLeadsView();
                }
            }
        }, 500);
        
        console.log('Stage update complete');
    };
    
    // Also fix updateLeadStatus
    window.updateLeadStatus = function(leadId, newStatus) {
        console.log('Updating lead status:', leadId, 'to', newStatus);
        
        // Get leads from localStorage
        let leads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        // Find the lead
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                console.log('Found lead, updating status from', leads[i].status, 'to', newStatus);
                leads[i].status = newStatus;
                leadFound = true;
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found for status update:', leadId);
            showNotification('Lead not found', 'error');
            return;
        }
        
        // Save back to localStorage
        const originalSetItem = localStorage.setItem.bind(localStorage);
        originalSetItem('leads', JSON.stringify(leads));
        
        // Update tracker
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].status = newStatus;
        originalSetItem('leadStatusTracker', JSON.stringify(tracker));
        
        // Show success message
        if (window.showNotification) {
            showNotification('Lead status updated to: ' + newStatus, 'success');
        }
        
        // Refresh the view
        setTimeout(() => {
            if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
                if (window.loadLeadsView) {
                    window.loadLeadsView();
                }
            }
        }, 500);
    };
    
    // Fix updateLeadPriority
    window.updateLeadPriority = function(leadId, newPriority) {
        console.log('Updating lead priority:', leadId, 'to', newPriority);
        
        let leads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                leads[i].priority = newPriority;
                leadFound = true;
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found for priority update:', leadId);
            showNotification('Lead not found', 'error');
            return;
        }
        
        const originalSetItem = localStorage.setItem.bind(localStorage);
        originalSetItem('leads', JSON.stringify(leads));
        
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].priority = newPriority;
        originalSetItem('leadStatusTracker', JSON.stringify(tracker));
        
        if (window.showNotification) {
            showNotification('Lead priority updated to: ' + newPriority, 'success');
        }
    };
    
    // Fix updateLeadScore
    window.updateLeadScore = function(leadId, newScore) {
        console.log('Updating lead score:', leadId, 'to', newScore);
        
        let leads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                leads[i].leadScore = parseInt(newScore);
                leadFound = true;
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found for score update:', leadId);
            showNotification('Lead not found', 'error');
            return;
        }
        
        const originalSetItem = localStorage.setItem.bind(localStorage);
        originalSetItem('leads', JSON.stringify(leads));
        
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].leadScore = parseInt(newScore);
        originalSetItem('leadStatusTracker', JSON.stringify(tracker));
        
        if (window.showNotification) {
            showNotification('Lead score updated to: ' + newScore + '%', 'success');
        }
        
        // Refresh if on leads page
        setTimeout(() => {
            if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
                if (window.loadLeadsView) {
                    window.loadLeadsView();
                }
            }
        }, 500);
    };
    
    console.log('Lead stage/status update functions fixed');
})();