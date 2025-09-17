// FORCE REAL EMAILS IN COI - Ultra aggressive override
console.log('🔥 FORCING REAL EMAILS IN COI MANAGEMENT...');

const REAL_GMAIL_API = 'https://vanguard-gmail-backend.onrender.com/api/gmail';

// Function to load real emails
async function loadRealEmails() {
    console.log('📧 Loading REAL emails from corptech02@gmail.com...');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        console.log('COI inbox not found, will retry...');
        return false;
    }

    try {
        // Show loading state
        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading REAL emails from corptech02@gmail.com...</p>
            </div>
        `;

        // Fetch real emails
        const response = await fetch(`${REAL_GMAIL_API}/messages?maxResults=20`, {
            headers: {
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (!response.ok) {
            // Try search endpoint as fallback
            const searchResponse = await fetch(`${REAL_GMAIL_API}/search-coi?days=30`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (searchResponse.ok) {
                const emails = await searchResponse.json();
                displayRealEmails(emails);
                return true;
            }
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const emails = data.messages || data || [];
        displayRealEmails(emails);
        return true;

    } catch (error) {
        console.error('Error loading emails:', error);

        // Show demo emails as fallback but mark them clearly
        coiInbox.innerHTML = `
            <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
                <p style="color: #991b1b; margin: 0;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Unable to connect to Gmail. Showing demo data.
                </p>
                <small>${error.message}</small>
            </div>
            <div class="email-list">
                ${getDemoEmails()}
            </div>
        `;
        return false;
    }
}

// Display real emails in the inbox
function displayRealEmails(emails) {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    if (!emails || emails.length === 0) {
        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p><strong>No emails found in corptech02@gmail.com</strong></p>
                <p style="font-size: 14px; margin-top: 8px;">
                    Try sending a test email with "COI", "certificate", or "insurance" in the subject
                </p>
                <button class="btn-primary" onclick="loadRealEmails()" style="margin-top: 16px;">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
        `;
        return;
    }

    console.log(`✅ Displaying ${emails.length} REAL emails`);

    coiInbox.innerHTML = `
        <div class="email-list">
            ${emails.map(email => {
                const date = new Date(email.date || email.internalDate || Date.now());
                const isToday = date.toDateString() === new Date().toDateString();
                const dateStr = isToday ?
                    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                // Extract sender name
                const from = email.from || 'Unknown Sender';
                const fromMatch = from.match(/"?([^"<]+)"?\s*<?/);
                const senderName = fromMatch ? fromMatch[1].trim() : from.split('@')[0];

                return `
                    <div class="email-item unread" data-email-id="${email.id}" onclick="expandEmail('${email.id}')" style="cursor: pointer; padding: 15px; border-bottom: 1px solid #e5e7eb; transition: background 0.2s;">
                        <div class="email-header">
                            <div class="email-info">
                                <div class="email-from" style="margin-bottom: 5px;">
                                    <i class="fas fa-circle" style="color: #667eea; font-size: 8px; margin-right: 8px;"></i>
                                    <strong style="color: #1f2937;">${senderName}</strong>
                                    <span style="color: #9ca3af; font-size: 12px; margin-left: 8px;">corptech02@gmail.com</span>
                                </div>
                                <div class="email-subject" style="color: #374151; margin-bottom: 5px;">
                                    ${email.subject || 'No subject'}
                                </div>
                                <div class="email-meta" style="color: #9ca3af; font-size: 12px;">
                                    ${email.attachments && email.attachments.length > 0 ?
                                        '<i class="fas fa-paperclip" style="margin-right: 8px;"></i>' : ''}
                                    <span class="email-date">${dateStr}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div style="padding: 10px; text-align: center; background: #f3f4f6;">
            <button class="btn-secondary btn-small" onclick="loadRealEmails()">
                <i class="fas fa-sync"></i> Refresh Inbox
            </button>
        </div>
    `;

    // Add hover effect
    document.querySelectorAll('.email-item').forEach(item => {
        item.onmouseover = () => item.style.background = '#f9fafb';
        item.onmouseout = () => item.style.background = 'white';
    });
}

// Demo emails fallback
function getDemoEmails() {
    const demoEmails = [
        {
            id: 'demo-1',
            from: 'Demo Client <demo@example.com>',
            subject: 'DEMO: Need COI for construction project',
            date: new Date().toISOString(),
            snippet: 'This is demo data. Connect Gmail to see real emails.'
        },
        {
            id: 'demo-2',
            from: 'Demo Contractor <demo2@example.com>',
            subject: 'DEMO: Certificate request for vendor',
            date: new Date(Date.now() - 86400000).toISOString(),
            snippet: 'This is demo data. Real emails will appear when Gmail is connected.'
        }
    ];

    return demoEmails.map(email => {
        const date = new Date(email.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const senderName = email.from.split('<')[0].trim();

        return `
            <div class="email-item" style="padding: 15px; border-bottom: 1px solid #e5e7eb; opacity: 0.6;">
                <div class="email-header">
                    <div class="email-info">
                        <div class="email-from" style="margin-bottom: 5px;">
                            <strong style="color: #6b7280;">${senderName}</strong>
                            <span style="color: #ef4444; font-size: 12px; margin-left: 8px;">[DEMO DATA]</span>
                        </div>
                        <div class="email-subject" style="color: #9ca3af;">
                            ${email.subject}
                        </div>
                        <div class="email-meta" style="color: #9ca3af; font-size: 12px;">
                            <span class="email-date">${dateStr}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Expand email function
window.expandEmail = async function(emailId) {
    console.log('Expanding email:', emailId);

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Store current content
    window.previousInboxContent = coiInbox.innerHTML;

    try {
        coiInbox.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading email...</p>
            </div>
        `;

        const response = await fetch(`${REAL_GMAIL_API}/messages/${emailId}`, {
            headers: {
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (!response.ok) throw new Error('Failed to load email');

        const email = await response.json();

        coiInbox.innerHTML = `
            <div class="email-detail-view" style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary btn-small" onclick="backToInbox()">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                </div>

                <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937;">${email.subject || 'No subject'}</h3>
                    <div style="color: #6b7280; font-size: 14px;">
                        <div><strong>From:</strong> ${email.from || 'Unknown'}</div>
                        <div><strong>Date:</strong> ${new Date(email.date || Date.now()).toLocaleString()}</div>
                    </div>
                </div>

                <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                    <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${email.body || email.snippet || 'No content'}</pre>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" onclick="alert('Reply feature coming soon')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn-secondary" onclick="prepareCOI('${emailId}')">
                        <i class="fas fa-file-contract"></i> Prepare COI
                    </button>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error expanding email:', error);
        backToInbox();
    }
};

// Back to inbox
window.backToInbox = function() {
    console.log('Going back to inbox...');
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // If we have saved content, restore it immediately
    if (window.previousInboxContent) {
        console.log('Restoring previous inbox content');
        coiInbox.innerHTML = window.previousInboxContent;

        // Re-attach hover effects
        document.querySelectorAll('.email-item').forEach(item => {
            item.onmouseover = () => item.style.background = '#f9fafb';
            item.onmouseout = () => item.style.background = 'white';
        });
    } else {
        // Only load fresh if we don't have saved content
        console.log('No saved content, loading fresh emails');
        loadRealEmails();
    }
};

// Check and load emails when COI tab is active
function checkAndLoadEmails() {
    if (window.location.hash === '#coi') {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox) {
            // Check if it's showing demo data or empty
            const hasDemo = coiInbox.innerHTML.includes('demo') ||
                           coiInbox.innerHTML.includes('Mock') ||
                           coiInbox.innerHTML.includes('Sample') ||
                           coiInbox.innerHTML.includes('Loading emails');

            if (hasDemo || coiInbox.children.length === 0) {
                console.log('📧 Detected demo/empty data - loading real emails...');
                loadRealEmails();
            }
        }
    }
}

// Aggressive loading strategy
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkAndLoadEmails, 100);
    setTimeout(checkAndLoadEmails, 500);
    setTimeout(checkAndLoadEmails, 1000);
});

// Monitor hash changes
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        setTimeout(checkAndLoadEmails, 100);
    }
});

// Check every 2 seconds if on COI tab
setInterval(() => {
    if (window.location.hash === '#coi') {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox && (coiInbox.innerHTML.includes('demo') || coiInbox.innerHTML.includes('Mock'))) {
            console.log('🔄 Demo data detected - reloading real emails...');
            loadRealEmails();
        }
    }
}, 2000);

// Override any function that might load demo data
const originalLoadCOIView = window.loadCOIView;
window.loadCOIView = function() {
    if (originalLoadCOIView) {
        originalLoadCOIView.apply(this, arguments);
    }
    setTimeout(loadRealEmails, 100);
};

console.log('✅ FORCE REAL EMAILS script active - will replace demo data with real Gmail emails');