const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'vanguard.db'));

// First, add some clients
const clients = [
    { id: 'CLI-001', name: 'Swift Trucking LLC', email: 'info@swifttrucking.com' },
    { id: 'CLI-002', name: 'Eagle Transport Inc', email: 'ops@eagletransport.com' },
    { id: 'CLI-003', name: 'Rapid Logistics Corp', email: 'admin@rapidlogistics.com' },
    { id: 'CLI-004', name: 'Heavy Haul Express', email: 'dispatch@heavyhaul.com' },
    { id: 'CLI-005', name: 'Interstate Freight Co', email: 'fleet@interstatefreight.com' },
    { id: 'CLI-006', name: 'Metro Delivery Services', email: 'service@metrodelivery.com' },
    { id: 'CLI-007', name: 'Global Cargo Solutions', email: 'cargo@globalcargo.com' },
    { id: 'CLI-008', name: 'Express Lane Transport', email: 'express@expresslane.com' }
];

// Real policy data
const policies = [
    {
        id: 'POL-2024-001',
        client_id: 'CLI-001',
        data: JSON.stringify({
            policyNumber: 'POL-2024-001',
            clientName: 'Swift Trucking LLC',
            type: 'Commercial Auto',
            coverage: 1000000,
            coverageDisplay: '$1M',
            premium: 18500,
            effectiveDate: '2024-01-01',
            expiryDate: '2024-12-31',
            status: 'active',
            carrier: 'Progressive Commercial',
            description: 'Fleet of 15 trucks, comprehensive coverage'
        })
    },
    {
        id: 'POL-2024-002',
        client_id: 'CLI-002',
        data: JSON.stringify({
            policyNumber: 'POL-2024-002',
            clientName: 'Eagle Transport Inc',
            type: 'Motor Carrier Liability',
            coverage: 2000000,
            coverageDisplay: '$2M',
            premium: 32000,
            effectiveDate: '2024-02-15',
            expiryDate: '2025-02-14',
            status: 'active',
            carrier: 'Travelers',
            description: 'Interstate carrier, hazmat endorsement'
        })
    },
    {
        id: 'POL-2024-003',
        client_id: 'CLI-003',
        data: JSON.stringify({
            policyNumber: 'POL-2024-003',
            clientName: 'Rapid Logistics Corp',
            type: 'Commercial Auto',
            coverage: 1000000,
            coverageDisplay: '$1M',
            premium: 24000,
            effectiveDate: '2024-03-20',
            expiryDate: '2025-03-19',
            status: 'active',
            carrier: 'Liberty Mutual',
            description: 'Local delivery fleet, 20 vehicles'
        })
    },
    {
        id: 'POL-2024-004',
        client_id: 'CLI-004',
        data: JSON.stringify({
            policyNumber: 'POL-2024-004',
            clientName: 'Heavy Haul Express',
            type: 'Motor Truck Cargo',
            coverage: 500000,
            coverageDisplay: '$500K',
            premium: 15000,
            effectiveDate: '2023-10-30',
            expiryDate: '2024-10-29',
            status: 'expiring',
            carrier: 'Great West Casualty',
            description: 'Specialized heavy equipment transport'
        })
    },
    {
        id: 'POL-2024-005',
        client_id: 'CLI-005',
        data: JSON.stringify({
            policyNumber: 'POL-2024-005',
            clientName: 'Interstate Freight Co',
            type: 'General Liability',
            coverage: 2000000,
            coverageDisplay: '$2M',
            premium: 28000,
            effectiveDate: '2024-04-15',
            expiryDate: '2025-04-14',
            status: 'active',
            carrier: 'CNA Insurance',
            description: 'Warehouse and trucking operations'
        })
    },
    {
        id: 'POL-2024-006',
        client_id: 'CLI-006',
        data: JSON.stringify({
            policyNumber: 'POL-2024-006',
            clientName: 'Metro Delivery Services',
            type: 'Commercial Auto',
            coverage: 750000,
            coverageDisplay: '$750K',
            premium: 12000,
            effectiveDate: '2024-05-01',
            expiryDate: '2025-04-30',
            status: 'active',
            carrier: 'State Farm',
            description: 'Urban delivery vans, 10 vehicles'
        })
    },
    {
        id: 'POL-2024-007',
        client_id: 'CLI-007',
        data: JSON.stringify({
            policyNumber: 'POL-2024-007',
            clientName: 'Global Cargo Solutions',
            type: 'Ocean Marine Cargo',
            coverage: 5000000,
            coverageDisplay: '$5M',
            premium: 45000,
            effectiveDate: '2024-06-01',
            expiryDate: '2025-05-31',
            status: 'active',
            carrier: 'AIG',
            description: 'International shipping coverage'
        })
    },
    {
        id: 'POL-2024-008',
        client_id: 'CLI-008',
        data: JSON.stringify({
            policyNumber: 'POL-2024-008',
            clientName: 'Express Lane Transport',
            type: 'Workers Compensation',
            coverage: 1000000,
            coverageDisplay: '$1M',
            premium: 35000,
            effectiveDate: '2024-01-01',
            expiryDate: '2024-12-31',
            status: 'active',
            carrier: 'Hartford',
            description: '45 employees, drivers and warehouse'
        })
    }
];

// Insert clients
db.serialize(() => {
    // First clear existing data
    db.run('DELETE FROM policies');
    db.run('DELETE FROM clients');

    // Insert clients
    const clientStmt = db.prepare('INSERT OR REPLACE INTO clients (id, data) VALUES (?, ?)');
    clients.forEach(client => {
        const clientData = JSON.stringify({
            name: client.name,
            email: client.email
        });
        clientStmt.run(client.id, clientData);
    });
    clientStmt.finalize();

    // Insert policies
    const policyStmt = db.prepare('INSERT OR REPLACE INTO policies (id, client_id, data) VALUES (?, ?, ?)');
    policies.forEach(policy => {
        policyStmt.run(policy.id, policy.client_id, policy.data);
    });
    policyStmt.finalize();

    console.log('Database seeded with real policy data!');

    // Verify the data
    db.all('SELECT COUNT(*) as count FROM clients', (err, rows) => {
        console.log('Total clients:', rows[0].count);
    });

    db.all('SELECT COUNT(*) as count FROM policies', (err, rows) => {
        console.log('Total policies:', rows[0].count);
    });
});

db.close();