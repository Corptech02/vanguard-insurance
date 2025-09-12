// Fix Policy View Modal Tabs - Makes tabs properly show/hide content sections
(function() {
    console.log('🔧 Fixing policy view modal tabs...');
    
    // Store the original switchViewTab function if it exists
    const originalSwitchViewTab = window.switchViewTab;
    
    // Override the switchViewTab function to properly handle tab switching
    window.switchViewTab = function(tabId) {
        console.log('Switching to tab:', tabId);
        
        // Find the policy view modal
        const modal = document.getElementById('policyViewModal');
        if (!modal) {
            console.error('Policy view modal not found');
            return;
        }
        
        // Remove active class from all tabs
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Remove active class from all content sections and hide them
        modal.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        // Add active class to selected tab
        const selectedTab = modal.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Show selected content
        const selectedContent = modal.querySelector(`#${tabId}-view-content`);
        if (selectedContent) {
            selectedContent.classList.add('active');
            selectedContent.style.display = 'block';
        }
    };
    
    // Add styles for proper tab display
    const style = document.createElement('style');
    style.textContent = `
        /* Policy view modal specific styles */
        #policyViewModal .tab-content {
            display: none;
        }
        
        #policyViewModal .tab-content.active {
            display: block !important;
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Tab button styles */
        #policyViewModal .tab-btn {
            background: white;
            border: 1px solid #e5e7eb;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        #policyViewModal .tab-btn:hover {
            background: #f9fafb;
            color: #1f2937;
        }
        
        #policyViewModal .tab-btn.active {
            background: #0066cc;
            color: white;
            border-color: #0066cc;
            box-shadow: 0 2px 4px rgba(0, 102, 204, 0.2);
        }
        
        /* Policy tabs container */
        #policyViewModal .policy-tabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        /* Tab content container */
        #policyViewModal .tab-contents {
            min-height: 400px;
        }
        
        /* Fix for content visibility */
        #policyViewModal .tab-content > * {
            opacity: 1 !important;
            visibility: visible !important;
        }
    `;
    document.head.appendChild(style);
    
    // Function to initialize tabs when modal opens
    function initializePolicyViewTabs() {
        const modal = document.getElementById('policyViewModal');
        if (!modal) return;
        
        // Hide all tabs except the first one
        const tabContents = modal.querySelectorAll('.tab-content');
        tabContents.forEach((content, index) => {
            if (index === 0) {
                content.classList.add('active');
                content.style.display = 'block';
            } else {
                content.classList.remove('active');
                content.style.display = 'none';
            }
        });
        
        // Make sure first tab button is active
        const firstTab = modal.querySelector('.tab-btn');
        if (firstTab) {
            firstTab.classList.add('active');
        }
    }
    
    // Watch for when the policy modal is added to the DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.id === 'policyViewModal') {
                    console.log('Policy view modal detected, initializing tabs...');
                    setTimeout(() => {
                        initializePolicyViewTabs();
                    }, 100);
                }
            });
        });
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Also override the viewPolicy function to ensure tabs are initialized
    const originalViewPolicy = window.viewPolicy;
    if (originalViewPolicy) {
        window.viewPolicy = function(...args) {
            const result = originalViewPolicy.apply(this, args);
            
            // Wait for modal to render then initialize tabs
            setTimeout(() => {
                initializePolicyViewTabs();
            }, 200);
            
            return result;
        };
    }
    
    // Override showPolicyDetailsModal if it exists
    const originalShowPolicyDetailsModal = window.showPolicyDetailsModal;
    if (originalShowPolicyDetailsModal) {
        window.showPolicyDetailsModal = function(...args) {
            const result = originalShowPolicyDetailsModal.apply(this, args);
            
            // Wait for modal to render then initialize tabs
            setTimeout(() => {
                initializePolicyViewTabs();
            }, 200);
            
            return result;
        };
    }
    
    console.log('✅ Policy view modal tabs fixed');
    console.log('   - Tabs now properly show/hide content sections');
    console.log('   - Only active tab content is visible');
    console.log('   - Smooth transitions between tabs');
})();