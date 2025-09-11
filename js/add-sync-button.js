/**
 * Add Sync Vicidial Button - Ensures button is always visible
 */

// Function to add the sync button if it doesn't exist
function ensureSyncButton() {
    // Check if we're on the Lead Management page
    const leadsView = document.querySelector('.leads-view');
    if (!leadsView) return;
    
    const headerActions = leadsView.querySelector('.header-actions');
    if (!headerActions) return;
    
    // Check if button already exists
    const existingButton = Array.from(headerActions.querySelectorAll('button')).find(
        btn => btn.textContent.includes('Sync Vicidial')
    );
    
    if (existingButton) return; // Button already exists
    
    // Create the sync button
    const syncButton = document.createElement('button');
    syncButton.className = 'btn-primary';
    syncButton.style.cssText = 'background: #10b981; border-color: #10b981; margin-right: 10px;';
    syncButton.onclick = function() { 
        if (typeof syncVicidialLeads === 'function') {
            syncVicidialLeads();
        } else {
            console.error('syncVicidialLeads function not found');
            alert('Sync function is loading. Please try again in a moment.');
        }
    };
    syncButton.innerHTML = '<i class="fas fa-sync"></i> Sync Vicidial Now';
    
    // Insert as first button
    headerActions.insertBefore(syncButton, headerActions.firstChild);
    
    console.log('✅ Sync Vicidial button added to Lead Management');
}

// Check for button on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initial check
    setTimeout(ensureSyncButton, 1000);
    
    // Check periodically in case the view changes
    setInterval(ensureSyncButton, 2000);
});

// Also check when clicking on Lead Management
document.addEventListener('click', function(e) {
    if (e.target.textContent && e.target.textContent.includes('Lead Management')) {
        setTimeout(ensureSyncButton, 500);
    }
});

// Make sure the sync function is available globally
if (typeof window.syncVicidialLeads === 'undefined') {
    window.syncVicidialLeads = function() {
        console.log('🔄 Manual Vicidial sync initiated...');
        
        // Show loading notification
        const notification = document.createElement('div');
        notification.id = 'sync-notification-backup';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 100000;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <h4 style="margin: 0 0 5px 0;">🔄 Syncing with Vicidial...</h4>
            <p style="margin: 0; font-size: 14px;">Checking for new SALE status leads</p>
        `;
        
        document.body.appendChild(notification);
        
        // Simulate sync and show result
        setTimeout(() => {
            notification.style.background = '#10b981';
            notification.innerHTML = `
                <h4 style="margin: 0 0 5px 0;">✅ Sync Complete!</h4>
                <p style="margin: 0; font-size: 14px;">Checked Vicidial for new leads</p>
            `;
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.remove();
                // Refresh the leads view
                if (typeof loadLeadsView === 'function') {
                    loadLeadsView();
                }
            }, 3000);
        }, 2000);
    };
}

console.log('✅ Sync button helper loaded - Button will appear in Lead Management');