// Fix Policy Tabs Navigation - Makes tabs jump to sections instead of hiding content
(function() {
    console.log('🔧 Fixing policy tabs navigation...');
    
    // Override the switchTab function to use scrolling navigation
    window.switchTab = function(tabId) {
        console.log('Navigating to section:', tabId);
        
        // Remove the default tab switching behavior
        // Instead, scroll to the appropriate section
        
        // First, ensure all content is visible
        const allContents = document.querySelectorAll('.tab-content');
        allContents.forEach(content => {
            content.style.display = 'block';
            content.classList.add('active'); // Keep all sections visible
        });
        
        // Update active tab styling
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Find the target section
        const targetSection = document.getElementById(`${tabId}-content`);
        if (targetSection) {
            // Calculate offset (accounting for fixed headers)
            const headerOffset = 100; // Adjust based on your header height
            const elementPosition = targetSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            // Smooth scroll to the section
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Add a highlight effect
            targetSection.style.backgroundColor = '#f0f9ff';
            setTimeout(() => {
                targetSection.style.backgroundColor = '';
            }, 1000);
        }
    };
    
    // Function to setup policy view for scrolling navigation
    window.setupPolicyScrollNavigation = function() {
        console.log('Setting up policy scroll navigation...');
        
        // Find all tab contents and make them visible
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach((content, index) => {
            content.style.display = 'block';
            content.classList.add('active');
            
            // Add section headers for better navigation
            if (!content.querySelector('.section-header-anchor')) {
                const header = document.createElement('div');
                header.className = 'section-header-anchor';
                header.id = content.id.replace('-content', '-anchor');
                content.insertBefore(header, content.firstChild);
            }
        });
        
        // Update the tab container to be sticky
        const tabContainer = document.querySelector('.policy-tabs');
        if (tabContainer) {
            tabContainer.style.position = 'sticky';
            tabContainer.style.top = '0';
            tabContainer.style.zIndex = '100';
            tabContainer.style.backgroundColor = 'white';
            tabContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            tabContainer.style.padding = '10px 0';
        }
        
        // Add scroll spy to highlight active section
        setupScrollSpy();
    };
    
    // Scroll spy to highlight the active tab based on scroll position
    function setupScrollSpy() {
        const sections = document.querySelectorAll('.tab-content');
        const tabs = document.querySelectorAll('.tab-btn');
        
        // Function to update active tab based on scroll position
        function updateActiveTab() {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                
                if (window.pageYOffset >= (sectionTop - 150)) {
                    const sectionId = section.id.replace('-content', '');
                    current = sectionId;
                }
            });
            
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.tab === current) {
                    tab.classList.add('active');
                }
            });
        }
        
        // Throttle scroll event for performance
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                window.cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = window.requestAnimationFrame(updateActiveTab);
        });
    }
    
    // Auto-fix when policy modal is opened
    const originalShowPolicyModal = window.showPolicyModal;
    if (originalShowPolicyModal) {
        window.showPolicyModal = function(...args) {
            const result = originalShowPolicyModal.apply(this, args);
            
            // Wait for modal to render
            setTimeout(() => {
                setupPolicyScrollNavigation();
            }, 100);
            
            return result;
        };
    }
    
    // Also fix for viewPolicy function
    const originalViewPolicy = window.viewPolicy;
    if (originalViewPolicy) {
        window.viewPolicy = function(...args) {
            const result = originalViewPolicy.apply(this, args);
            
            // Wait for modal to render
            setTimeout(() => {
                setupPolicyScrollNavigation();
            }, 100);
            
            return result;
        };
    }
    
    // Add styles for improved navigation
    const style = document.createElement('style');
    style.textContent = `
        /* Make all tab content visible and add spacing */
        .tab-content {
            display: block !important;
            opacity: 1 !important;
            padding: 30px 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
        }
        
        .tab-content:last-child {
            border-bottom: none;
        }
        
        /* Section headers */
        .tab-content h3:first-child,
        .tab-content h2:first-child {
            margin-top: 0;
            padding-top: 20px;
            font-size: 24px;
            color: #1f2937;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        /* Sticky tabs */
        .policy-tabs {
            position: sticky;
            top: 0;
            z-index: 100;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 10px 20px;
            margin: -20px -20px 20px -20px;
        }
        
        /* Active tab highlighting */
        .tab-btn.active {
            color: #3b82f6;
            border-bottom: 3px solid #3b82f6;
            background: #eff6ff;
        }
        
        /* Smooth transitions */
        .tab-content {
            transition: background-color 0.3s ease;
        }
        
        /* Hide the original tab switching CSS */
        .tab-content:not(.active) {
            display: block !important;
            opacity: 1 !important;
            height: auto !important;
            visibility: visible !important;
        }
        
        /* Add section labels */
        .tab-content::before {
            content: attr(data-section-name);
            display: block;
            font-size: 20px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        /* Overview section */
        #overview-content::before { content: "Overview"; }
        #named-insured-content::before { content: "Named Insured"; }
        #contact-content::before { content: "Contact Information"; }
        #coverage-content::before { content: "Coverage Details"; }
        #vehicles-content::before { content: "Vehicles"; }
        #drivers-content::before { content: "Drivers"; }
        #financial-content::before { content: "Financial Information"; }
        #documents-content::before { content: "Documents"; }
        #notes-content::before { content: "Notes"; }
    `;
    document.head.appendChild(style);
    
    // Setup navigation on page load if modal is already open
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (document.querySelector('.policy-modal')) {
                setupPolicyScrollNavigation();
            }
        }, 500);
    });
    
    console.log('✅ Policy tabs navigation fixed');
    console.log('   - Tabs now jump to sections instead of hiding content');
    console.log('   - All sections remain visible');
    console.log('   - Sticky navigation with scroll spy');
    console.log('   - Smooth scrolling enabled');
})();