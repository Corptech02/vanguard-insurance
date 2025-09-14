// COI Gmail Override - Forces real Gmail data in COI Management
console.log('COI Gmail Override loading...');

// Backend API URL - Using HTTPS tunnel
const GMAIL_API_URL = 'https://shaggy-dingos-divide.loca.lt/api/gmail';

// Override immediately after script loads (don't wait for DOM)
(function() {
    console.log('Overriding COI functions...');

    // Store original function if it exists
    const originalLoadCOIView = window.loadCOIView;

    // Override loadCOIView - this is what gets called when navigating to #coi
    window.loadCOIView = function() {
        console.log('COI View Override: Loading with restored layout...');

        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) return;

        dashboardContent.innerHTML = `
            <div class="coi-management">
                <div class="page-header">
                    <h1>COI Management</h1>
                    <p>Manage Certificates of Insurance requests and policies</p>
                </div>
                <div class="coi-container">
                    <!-- Left Panel - Policy Profile Viewer -->
                    <div class="coi-left-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-file-contract"></i> Policy Profiles</h3>
                            <button class="btn-primary btn-small" onclick="refreshPolicies()">
                                <i class="fas fa-sync"></i> Refresh
                            </button>
                        </div>
                        <div id="policyViewer" class="policy-viewer">
                            <div class="policy-list" id="policyList">
                                <!-- Policy list will be populated here -->
                            </div>
                        </div>
                    </div>
                    <!-- Right Panel - COI Email Inbox -->
                    <div class="coi-right-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-inbox"></i> COI Request Inbox</h3>
                            <div class="inbox-actions">
                                <button class="btn-secondary btn-small" onclick="filterCOIEmails('unread')">
                                    <i class="fas fa-envelope"></i> Unread
                                </button>
                                <button class="btn-secondary btn-small" onclick="filterCOIEmails('all')">
                                    <i class="fas fa-list"></i> All
                                </button>
                            </div>
                        </div>
                        <div class="coi-inbox" id="coiInbox">
                            <div style="text-align: center; padding: 20px;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                                <p>Loading emails from corptech02@gmail.com...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load the policy list (keep existing functionality)
        if (window.loadPolicyList) {
            window.loadPolicyList();
        }

        // Load real Gmail emails
        loadRealCOIEmails();
    };

    // Function to load real emails from Gmail
    window.loadRealCOIEmails = async function() {
        console.log('Fetching real emails from corptech02@gmail.com...');

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        try {
            // Search for COI-related emails
            const response = await fetch(`${GMAIL_API_URL}/search-coi?days=30`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const emails = await response.json();
            console.log(`Received ${emails.length} real emails from Gmail`);

            if (emails.length === 0) {
                coiInbox.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6b7280;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>No COI-related emails found in corptech02@gmail.com</p>
                        <p style="font-size: 14px; margin-top: 8px;">
                            Searching for: COI, certificate, insurance, ACORD
                        </p>
                        <button class="btn-primary" onclick="window.location.href='test-real-emails.html'" style="margin-top: 16px;">
                            Test Gmail Connection
                        </button>
                    </div>
                `;
                return;
            }

            // Display real emails in the original format
            coiInbox.innerHTML = `
                <div class="email-list">
                    ${emails.map(email => {
                        const date = new Date(email.date);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dateStr = isToday ?
                            date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                            date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        // Extract sender name from email
                        const fromMatch = email.from.match(/"?([^"<]+)"?\s*<?/);
                        const senderName = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0];

                        return `
                            <div class="email-item unread" data-email-id="${email.id}" onclick="expandEmail('${email.id}')">
                                <div class="email-header">
                                    <div class="email-info">
                                        <div class="email-from">
                                            <i class="fas fa-circle" style="color: var(--primary-blue); font-size: 8px; margin-right: 8px;"></i>
                                            <strong>${senderName}</strong>
                                        </div>
                                        <div class="email-subject">${email.subject}</div>
                                        <div class="email-meta">
                                            ${email.attachments && email.attachments.length > 0 ?
                                                '<i class="fas fa-paperclip" style="margin-right: 8px;"></i>' : ''}
                                            <span class="email-date">${dateStr}</span>
                                        </div>
                                    </div>
                                    <div class="email-actions">
                                        <button class="btn-icon" onclick="event.stopPropagation(); markAsRead('${email.id}')" title="Mark as Read">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn-icon" onclick="event.stopPropagation(); processGmailCOI('${email.id}')" title="Process COI">
                                            <i class="fas fa-file-contract"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

        } catch (error) {
            console.error('Error loading real emails:', error);
            coiInbox.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading emails from Gmail</p>
                    <p style="font-size: 14px; margin-top: 8px;">${error.message}</p>
                    <div style="margin-top: 16px;">
                        <button class="btn-primary" onclick="window.location.href='gmail-setup.html'">
                            Setup Gmail
                        </button>
                        <button class="btn-secondary" onclick="loadRealCOIEmails()" style="margin-left: 8px;">
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }
    };

    // Sync Gmail emails function
    window.syncGmailEmails = function() {
        console.log('Syncing Gmail emails...');
        const btn = event.target.closest('button');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
        btn.disabled = true;

        loadRealCOIEmails().finally(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        });
    };

    // Expand email to show full content
    window.expandEmail = async function(emailId) {
        console.log('Expanding email:', emailId);

        try {
            // Fetch full email details
            const response = await fetch(`${GMAIL_API_URL}/messages/${emailId}`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const email = await response.json();

            // Create modal to display email
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>Email Details</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 20px;">
                            <div style="color: #6b7280; font-size: 12px;">FROM</div>
                            <div style="font-weight: 500;">${email.from}</div>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <div style="color: #6b7280; font-size: 12px;">TO</div>
                            <div>${email.to}</div>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <div style="color: #6b7280; font-size: 12px;">SUBJECT</div>
                            <div style="font-weight: 500; font-size: 18px;">${email.subject}</div>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <div style="color: #6b7280; font-size: 12px;">DATE</div>
                            <div>${new Date(email.date).toLocaleString()}</div>
                        </div>
                        ${email.attachments && email.attachments.length > 0 ? `
                            <div style="margin-bottom: 20px;">
                                <div style="color: #6b7280; font-size: 12px;">ATTACHMENTS</div>
                                <div>
                                    ${email.attachments.map(att => `
                                        <span style="display: inline-block; margin: 4px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px;">
                                            <i class="fas fa-paperclip"></i> ${att.filename} (${(att.size / 1024).toFixed(1)}KB)
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                            <div style="white-space: pre-wrap; line-height: 1.6;">${email.body || email.snippet}</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-primary" onclick="replyToEmail('${emailId}')">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                        <button class="btn-secondary" onclick="processGmailCOI('${emailId}')">
                            <i class="fas fa-file-contract"></i> Process COI
                        </button>
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

        } catch (error) {
            console.error('Error expanding email:', error);
            alert('Error loading email details: ' + error.message);
        }
    };

    // Mark email as read
    window.markAsRead = async function(emailId) {
        console.log('Marking email as read:', emailId);
        try {
            await fetch(`${GMAIL_API_URL}/messages/${emailId}/read`, {
                method: 'POST',
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });
            // Update UI to show email as read
            const emailItem = document.querySelector(`[data-email-id="${emailId}"]`);
            if (emailItem) {
                emailItem.classList.remove('unread');
                const dot = emailItem.querySelector('.fa-circle');
                if (dot) dot.style.display = 'none';
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Process COI from Gmail
    window.processGmailCOI = async function(emailId) {
        console.log('Processing COI:', emailId);
        // For now, just show a notification
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
        notification.innerHTML = '<i class="fas fa-check-circle"></i> Processing COI request...';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    // Reply to email
    window.replyToEmail = async function(emailId) {
        console.log('Reply to email:', emailId);
        // For now, just show a notification
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
        notification.innerHTML = '<i class="fas fa-envelope"></i> Opening reply composer...';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };
});

// Also handle hash changes
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#coi') {
        console.log('Hash changed to #coi, loading real emails...');
        setTimeout(() => {
            if (window.loadRealCOIEmails) {
                window.loadRealCOIEmails();
            }
        }, 100);
    }
})();

console.log('COI Gmail Override ready');