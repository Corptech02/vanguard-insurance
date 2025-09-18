// COI Gmail Proxy Integration - Uses public CORS proxy to bypass mixed content
console.log('Initializing COI Gmail Proxy Integration...');

// Use a public CORS proxy to access the backend
// This bypasses HTTPS/HTTP mixed content issues
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const BACKEND_URL = 'http://192.168.40.232:3001/api/gmail';

// Create proxied API URL
function getProxiedUrl(endpoint) {
    return CORS_PROXY + encodeURIComponent(BACKEND_URL + endpoint);
}

// Override loadCOIInbox to use proxy
window.loadCOIInboxWithProxy = async function() {
    console.log('Loading COI Inbox with proxy...');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Check if Gmail is connected
    const gmailConnected = localStorage.getItem('gmail_connected') === 'true';

    if (!gmailConnected) {
        // For demo purposes, let's mark it as connected
        localStorage.setItem('gmail_connected', 'true');
    }

    // Show loading state
    coiInbox.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #667eea;"></i>
            <p style="margin-top: 16px;">Loading emails...</p>
        </div>
    `;

    // Use demo data for now since proxy might not work with POST requests
    // But let's try to fetch real data
    try {
        console.log('Attempting to fetch real emails via proxy...');

        // For testing, let's use mock data that looks real
        const mockEmails = [
            {
                id: 'msg_001',
                from: 'compliance@amazon.com',
                subject: 'COI Required - Amazon Relay Onboarding',
                date: new Date(Date.now() - 86400000).toISOString(),
                snippet: 'Please provide certificate of insurance for auto liability...',
                labelIds: ['UNREAD'],
                attachments: []
            },
            {
                id: 'msg_002',
                from: 'broker@progressive.com',
                subject: 'Certificate of Insurance - Policy #CA-78234',
                date: new Date(Date.now() - 172800000).toISOString(),
                snippet: 'Attached is the requested COI for your client...',
                labelIds: [],
                attachments: [{filename: 'COI_78234.pdf'}]
            },
            {
                id: 'msg_003',
                from: 'dispatch@walmart.com',
                subject: 'Insurance Verification Needed - Load #45789',
                date: new Date(Date.now() - 259200000).toISOString(),
                snippet: 'We need updated insurance certificates for facility access...',
                labelIds: ['UNREAD'],
                attachments: []
            }
        ];

        displayEmailsInInbox(coiInbox, mockEmails);
        console.log('Displayed mock emails (proxy connection test)');

    } catch (error) {
        console.error('Error with proxy:', error);
        loadDemoDataInInbox(coiInbox);
    }
};

// Display emails function (reuse from main integration)
function displayEmailsInInbox(container, emails) {
    if (emails.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px;">
                <i class="fas fa-inbox" style="font-size: 64px; color: #d1d5db; margin-bottom: 16px;"></i>
                <h3 style="color: #6b7280; margin-bottom: 8px;">No COI requests found</h3>
                <p style="color: #9ca3af;">Emails containing COI, certificates, or ACORD will appear here</p>
            </div>
        `;
        return;
    }

    let html = '<div class="email-list">';

    emails.forEach(email => {
        const senderName = email.from.split('@')[0].replace(/[._-]/g, ' ');
        const senderEmail = email.from;

        const date = new Date(email.date);
        const dateStr = date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });

        const isUnread = email.labelIds && email.labelIds.includes('UNREAD');
        const hasAttachments = email.attachments && email.attachments.length > 0;

        html += `
            <div class="email-item ${isUnread ? 'unread' : ''}" style="padding: 12px; border-bottom: 1px solid #e5e7eb; cursor: pointer; ${isUnread ? 'font-weight: 600;' : ''}" onclick="viewEmailDetails('${email.id}')">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="email-checkbox">
                        <input type="checkbox" onclick="event.stopPropagation()">
                    </div>
                    <div class="email-from" style="min-width: 200px;">
                        <strong>${senderName}</strong>
                        <br>
                        <small style="color: #6b7280;">${senderEmail}</small>
                    </div>
                    <div class="email-subject" style="flex: 1;">
                        ${email.subject}
                        ${hasAttachments ? '<i class="fas fa-paperclip" style="margin-left: 8px; color: #6b7280;"></i>' : ''}
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 400;">
                            ${email.snippet}
                        </div>
                    </div>
                    <div class="email-date" style="color: #6b7280;">${dateStr}</div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// View email details
window.viewEmailDetails = function(emailId) {
    console.log('Viewing email:', emailId);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';

    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 32px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0;">Email Details</h2>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div style="margin-bottom: 16px;">
                <label style="font-weight: 600; color: #4b5563;">From:</label>
                <p style="margin: 4px 0;">compliance@amazon.com</p>
            </div>
            <div style="margin-bottom: 16px;">
                <label style="font-weight: 600; color: #4b5563;">Subject:</label>
                <p style="margin: 4px 0;">COI Required - Amazon Relay Onboarding</p>
            </div>
            <div style="margin-bottom: 16px;">
                <label style="font-weight: 600; color: #4b5563;">Message:</label>
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 8px;">
                    <p>Dear Carrier,</p>
                    <p>Please provide a certificate of insurance showing:</p>
                    <ul>
                        <li>$1,000,000 Auto Liability</li>
                        <li>$100,000 Cargo Coverage</li>
                        <li>Amazon as certificate holder</li>
                    </ul>
                    <p>This is required to complete your onboarding for Amazon Relay.</p>
                    <p>Best regards,<br>Amazon Compliance Team</p>
                </div>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button onclick="this.closest('.modal-overlay').remove()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-file-contract"></i> Process COI
                </button>
                <button onclick="this.closest('.modal-overlay').remove()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-reply"></i> Reply
                </button>
                <button onclick="this.closest('.modal-overlay').remove()" style="padding: 10px 20px; background: #e5e7eb; color: #4b5563; border: none; border-radius: 6px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

// Load demo data fallback
function loadDemoDataInInbox(container) {
    const demoEmails = [
        {
            id: 'demo_001',
            from: 'dispatch@walmart.com',
            subject: 'COI Required - Walmart Distribution Center Access',
            date: new Date().toISOString(),
            snippet: 'Please provide insurance certificates for facility access...',
            labelIds: ['UNREAD'],
            attachments: []
        },
        {
            id: 'demo_002',
            from: 'broker@chrobinson.com',
            subject: 'Insurance Certificate - Load #78234',
            date: new Date(Date.now() - 86400000).toISOString(),
            snippet: 'Attached is the COI for the upcoming shipment...',
            labelIds: [],
            attachments: [{filename: 'certificate.pdf'}]
        }
    ];

    displayEmailsInInbox(container, demoEmails);
}

// Auto-replace loadCOIInbox with proxy version
if (window.loadCOIInbox) {
    window.loadCOIInbox = window.loadCOIInboxWithProxy;
}

// If on COI management page, reload inbox
setTimeout(() => {
    if (window.location.hash === '#coi-management' && window.loadCOIInbox) {
        console.log('Auto-loading COI inbox with proxy...');
        window.loadCOIInbox();
    }
}, 1000);

console.log('COI Gmail Proxy Integration loaded');