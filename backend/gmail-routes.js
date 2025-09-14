const express = require('express');
const router = express.Router();
const GmailService = require('./gmail-service');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vanguard.db');

// Initialize Gmail Service
const gmailService = new GmailService();

// Store credentials securely (in production, use environment variables or secure storage)
let gmailCredentials = null;

/**
 * Initialize Gmail with credentials
 * POST /api/gmail/init
 */
router.post('/init', async (req, res) => {
    try {
        const { client_id, client_secret, redirect_uri, refresh_token, access_token } = req.body;

        gmailCredentials = {
            client_id,
            client_secret,
            redirect_uri,
            refresh_token,
            access_token,
            expiry_date: new Date().getTime() + (3600 * 1000) // 1 hour from now
        };

        await gmailService.initialize(gmailCredentials);

        res.json({ success: true, message: 'Gmail API initialized successfully' });
    } catch (error) {
        console.error('Error initializing Gmail:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get OAuth URL for authorization
 * GET /api/gmail/auth-url
 */
router.get('/auth-url', (req, res) => {
    const credentials = {
        client_id: process.env.GMAIL_CLIENT_ID || req.query.client_id,
        client_secret: process.env.GMAIL_CLIENT_SECRET || req.query.client_secret,
        redirect_uri: process.env.GMAIL_REDIRECT_URI || 'http://192.168.40.232:3001/api/gmail/callback'
    };

    const authUrl = gmailService.getAuthUrl(credentials);
    res.json({ authUrl });
});

/**
 * OAuth callback to exchange code for tokens
 * GET /api/gmail/callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;

        const credentials = {
            client_id: process.env.GMAIL_CLIENT_ID,
            client_secret: process.env.GMAIL_CLIENT_SECRET,
            redirect_uri: process.env.GMAIL_REDIRECT_URI || 'http://192.168.40.232:3001/api/gmail/callback'
        };

        const tokens = await gmailService.getTokensFromCode(code, credentials);

        // Store tokens securely
        gmailCredentials = { ...credentials, ...tokens };
        await gmailService.initialize(gmailCredentials);

        // Redirect to COI management page with success message
        res.redirect('https://corptech02.github.io/vanguard-insurance/#coi-management?gmail=connected');
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.redirect('https://corptech02.github.io/vanguard-insurance/#coi-management?gmail=error');
    }
});

/**
 * List COI-related emails
 * GET /api/gmail/messages
 */
router.get('/messages', async (req, res) => {
    try {
        const { query, maxResults = 20 } = req.query;
        const messages = await gmailService.listMessages(query, parseInt(maxResults));

        // Store messages in database for offline access
        messages.forEach(msg => {
            db.run(`
                INSERT OR REPLACE INTO coi_emails
                (id, thread_id, from_email, to_email, subject, date, body, snippet, attachments)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                msg.id,
                msg.threadId,
                msg.from,
                msg.to,
                msg.subject,
                msg.date.toISOString(),
                msg.body,
                msg.snippet,
                JSON.stringify(msg.attachments)
            ]);
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get a specific message
 * GET /api/gmail/messages/:id
 */
router.get('/messages/:id', async (req, res) => {
    try {
        const message = await gmailService.getMessage(req.params.id);
        res.json(message);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Send an email
 * POST /api/gmail/send
 */
router.post('/send', async (req, res) => {
    try {
        const { to, subject, body, cc, bcc, attachments } = req.body;

        const result = await gmailService.sendEmail({
            to,
            subject,
            body,
            cc,
            bcc,
            attachments
        });

        // Store sent email in database
        db.run(`
            INSERT INTO coi_emails_sent
            (message_id, to_email, subject, body, sent_date)
            VALUES (?, ?, ?, ?, ?)
        `,
        [
            result.id,
            to,
            subject,
            body,
            new Date().toISOString()
        ]);

        res.json({ success: true, messageId: result.id });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Search for COI emails
 * GET /api/gmail/search-coi
 */
router.get('/search-coi', async (req, res) => {
    try {
        const { clientName, days = 30 } = req.query;
        const messages = await gmailService.searchCOIEmails(clientName, parseInt(days));
        res.json(messages);
    } catch (error) {
        console.error('Error searching COI emails:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Download attachment
 * GET /api/gmail/attachments/:messageId/:attachmentId
 */
router.get('/attachments/:messageId/:attachmentId', async (req, res) => {
    try {
        const { messageId, attachmentId } = req.params;
        const attachment = await gmailService.getAttachment(messageId, attachmentId);

        res.set('Content-Type', 'application/octet-stream');
        res.send(attachment);
    } catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Mark message as read
 * POST /api/gmail/messages/:id/read
 */
router.post('/messages/:id/read', async (req, res) => {
    try {
        await gmailService.markAsRead(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Add label to message
 * POST /api/gmail/messages/:id/label
 */
router.post('/messages/:id/label', async (req, res) => {
    try {
        const { label } = req.body;
        await gmailService.addLabel(req.params.id, label);
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding label:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;