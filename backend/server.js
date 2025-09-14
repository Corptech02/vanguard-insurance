const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database setup
const db = new sqlite3.Database('./vanguard.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Clients table
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Policies table
    db.run(`CREATE TABLE IF NOT EXISTS policies (
        id TEXT PRIMARY KEY,
        client_id TEXT,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);

    // Leads table
    db.run(`CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Settings table for global app data
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // COI Email tables
    db.run(`CREATE TABLE IF NOT EXISTS coi_emails (
        id TEXT PRIMARY KEY,
        thread_id TEXT,
        from_email TEXT,
        to_email TEXT,
        subject TEXT,
        date DATETIME,
        body TEXT,
        snippet TEXT,
        attachments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS coi_emails_sent (
        message_id TEXT PRIMARY KEY,
        to_email TEXT,
        subject TEXT,
        body TEXT,
        sent_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database tables initialized');
}

// API Routes

// Get all clients
app.get('/api/clients', (req, res) => {
    db.all('SELECT * FROM clients', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const clients = rows.map(row => JSON.parse(row.data));
        res.json(clients);
    });
});

// Save/Update client
app.post('/api/clients', (req, res) => {
    const client = req.body;
    const id = client.id;
    const data = JSON.stringify(client);

    db.run(`INSERT INTO clients (id, data) VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP`,
        [id, data, data],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, success: true });
        }
    );
});

// Delete client
app.delete('/api/clients/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Get all policies
app.get('/api/policies', (req, res) => {
    db.all('SELECT * FROM policies', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const policies = rows.map(row => JSON.parse(row.data));
        res.json(policies);
    });
});

// Save/Update policy
app.post('/api/policies', (req, res) => {
    const policy = req.body;
    const id = policy.id;
    const clientId = policy.clientId;
    const data = JSON.stringify(policy);

    db.run(`INSERT INTO policies (id, client_id, data) VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = ?, client_id = ?, updated_at = CURRENT_TIMESTAMP`,
        [id, clientId, data, data, clientId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, success: true });
        }
    );
});

// Delete policy
app.delete('/api/policies/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM policies WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Get all leads
app.get('/api/leads', (req, res) => {
    db.all('SELECT * FROM leads', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const leads = rows.map(row => JSON.parse(row.data));
        res.json(leads);
    });
});

// Save/Update lead
app.post('/api/leads', (req, res) => {
    const lead = req.body;
    const id = lead.id;
    const data = JSON.stringify(lead);

    db.run(`INSERT INTO leads (id, data) VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP`,
        [id, data, data],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, success: true });
        }
    );
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM leads WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Bulk save endpoint for initial data migration
app.post('/api/bulk-save', (req, res) => {
    const { clients, policies, leads } = req.body;
    let savedCount = 0;
    let totalItems = 0;

    // Count total items
    if (clients) totalItems += clients.length;
    if (policies) totalItems += policies.length;
    if (leads) totalItems += leads.length;

    const checkComplete = () => {
        savedCount++;
        if (savedCount === totalItems) {
            res.json({ success: true, saved: savedCount });
        }
    };

    // Save clients
    if (clients && clients.length > 0) {
        clients.forEach(client => {
            const data = JSON.stringify(client);
            db.run(`INSERT INTO clients (id, data) VALUES (?, ?)
                    ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP`,
                [client.id, data, data],
                checkComplete
            );
        });
    }

    // Save policies
    if (policies && policies.length > 0) {
        policies.forEach(policy => {
            const data = JSON.stringify(policy);
            db.run(`INSERT INTO policies (id, client_id, data) VALUES (?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET data = ?, client_id = ?, updated_at = CURRENT_TIMESTAMP`,
                [policy.id, policy.clientId, data, data, policy.clientId],
                checkComplete
            );
        });
    }

    // Save leads
    if (leads && leads.length > 0) {
        leads.forEach(lead => {
            const data = JSON.stringify(lead);
            db.run(`INSERT INTO leads (id, data) VALUES (?, ?)
                    ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP`,
                [lead.id, data, data],
                checkComplete
            );
        });
    }

    if (totalItems === 0) {
        res.json({ success: true, saved: 0 });
    }
});

// Get all data endpoint
app.get('/api/all-data', (req, res) => {
    const result = {
        clients: [],
        policies: [],
        leads: []
    };

    db.all('SELECT * FROM clients', (err, clientRows) => {
        if (!err && clientRows) {
            result.clients = clientRows.map(row => JSON.parse(row.data));
        }

        db.all('SELECT * FROM policies', (err, policyRows) => {
            if (!err && policyRows) {
                result.policies = policyRows.map(row => JSON.parse(row.data));
            }

            db.all('SELECT * FROM leads', (err, leadRows) => {
                if (!err && leadRows) {
                    result.leads = leadRows.map(row => JSON.parse(row.data));
                }

                res.json(result);
            });
        });
    });
});

// Gmail routes
const gmailRoutes = require('./gmail-routes');
app.use('/api/gmail', gmailRoutes);

// Export database for use in other modules
module.exports = { db };

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});