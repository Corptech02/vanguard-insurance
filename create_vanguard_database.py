#!/usr/bin/env python3
"""
Vanguard Insurance Complete Database Setup
Creates all necessary tables for full data synchronization
"""

import sqlite3
import json
from datetime import datetime

def create_database():
    """Create or update the Vanguard database with all necessary tables"""

    # Connect to the main database
    conn = sqlite3.connect('vanguard_system.db')
    cursor = conn.cursor()

    print("Creating Vanguard Insurance System Database...")

    # 1. LEAD DATA TABLE - Active and Archived Leads
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id TEXT UNIQUE NOT NULL,
            dot_number TEXT,
            mc_number TEXT,
            company_name TEXT,
            contact_name TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,

            -- Lead Status
            status TEXT DEFAULT 'active',  -- active, contacted, qualified, archived, won, lost
            priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
            assigned_to TEXT,

            -- Insurance Info
            current_insurance TEXT,
            policy_expiry_date DATE,
            coverage_amount TEXT,
            premium_quoted REAL,

            -- Activity Tracking
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_contact_date TIMESTAMP,
            next_followup_date DATE,
            notes TEXT,

            -- Conversion Tracking
            converted_to_policy BOOLEAN DEFAULT 0,
            policy_number TEXT,
            conversion_date TIMESTAMP,

            -- Archive Info
            archived_date TIMESTAMP,
            archive_reason TEXT,

            -- Metadata
            source TEXT,  -- website, vicidial, manual, import
            tags TEXT,    -- JSON array of tags
            custom_fields TEXT  -- JSON for expandable fields
        )
    """)

    # 2. ENHANCED FMCSA DATA - Expandable carrier information
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fmcsa_enhanced (
            dot_number TEXT PRIMARY KEY,

            -- Basic Info (from original)
            legal_name TEXT,
            dba_name TEXT,
            street TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            phone TEXT,
            email_address TEXT,

            -- Fleet Info
            power_units INTEGER,
            drivers INTEGER,
            mc_number TEXT,

            -- Insurance Info
            insurance_carrier TEXT,
            bipd_insurance_on_file_amount TEXT,
            policy_renewal_date DATE,

            -- Enhanced Fields
            website TEXT,
            fax TEXT,
            cell_phone TEXT,
            contact_person TEXT,
            contact_title TEXT,

            -- Business Info
            business_type TEXT,
            cargo_carried TEXT,
            operating_status TEXT,
            entity_type TEXT,

            -- Compliance
            safety_rating TEXT,
            safety_review_date DATE,
            out_of_service_date DATE,

            -- Financial
            annual_revenue TEXT,
            credit_score TEXT,
            payment_history TEXT,

            -- Custom Fields for Expansion
            custom_data TEXT,  -- JSON field for any additional data

            -- Tracking
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT,
            data_source TEXT,
            verified BOOLEAN DEFAULT 0,

            -- Notes and History
            internal_notes TEXT,
            interaction_history TEXT  -- JSON array of interactions
        )
    """)

    # 3. POLICIES TABLE - Real-time synchronized
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_number TEXT UNIQUE NOT NULL,

            -- Policy Holder Info
            dot_number TEXT,
            company_name TEXT,
            contact_name TEXT,
            email TEXT,
            phone TEXT,

            -- Policy Details
            policy_type TEXT,  -- auto, general liability, cargo, etc.
            carrier TEXT,      -- insurance company
            effective_date DATE,
            expiration_date DATE,
            premium REAL,
            commission REAL,

            -- Coverage Details
            coverage_limits TEXT,  -- JSON object with limit details
            deductibles TEXT,      -- JSON object with deductibles
            endorsements TEXT,     -- JSON array of endorsements

            -- Status Tracking
            status TEXT DEFAULT 'active',  -- active, expired, cancelled, pending
            payment_status TEXT DEFAULT 'current',  -- current, late, lapsed

            -- Documents
            documents TEXT,  -- JSON array of document references
            coi_sent BOOLEAN DEFAULT 0,
            coi_sent_date TIMESTAMP,

            -- Activity
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            last_modified TIMESTAMP,
            modified_by TEXT,

            -- Renewal
            renewal_date DATE,
            renewal_premium REAL,
            renewal_status TEXT,

            -- Notes
            notes TEXT,
            alerts TEXT  -- JSON array of alerts/reminders
        )
    """)

    # 4. GMAIL INTEGRATION TABLE - For COI Management
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS gmail_integration (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            -- Email Details
            message_id TEXT UNIQUE,
            thread_id TEXT,
            from_email TEXT,
            to_email TEXT,
            cc_email TEXT,
            subject TEXT,
            body TEXT,

            -- COI Related
            related_policy_number TEXT,
            related_dot_number TEXT,
            coi_type TEXT,
            coi_status TEXT,  -- pending, sent, confirmed, failed

            -- Attachments
            attachments TEXT,  -- JSON array of attachment info

            -- Tracking
            received_date TIMESTAMP,
            processed_date TIMESTAMP,
            sent_date TIMESTAMP,

            -- Integration
            gmail_label TEXT,
            processed BOOLEAN DEFAULT 0,
            error_message TEXT,

            -- Response
            response_sent BOOLEAN DEFAULT 0,
            response_template TEXT,

            FOREIGN KEY (related_policy_number) REFERENCES policies(policy_number)
        )
    """)

    # 5. USERS AND SESSIONS - Track who's logged in
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            full_name TEXT,
            role TEXT DEFAULT 'agent',  -- admin, manager, agent

            -- Permissions
            permissions TEXT,  -- JSON array of permissions

            -- Activity
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            active BOOLEAN DEFAULT 1,

            -- Settings
            preferences TEXT  -- JSON object for user preferences
        )
    """)

    # 6. ACTIVITY LOG - Track all changes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER,
            username TEXT,
            action TEXT,  -- create, update, delete, view
            table_name TEXT,
            record_id TEXT,
            old_value TEXT,  -- JSON of old values
            new_value TEXT,  -- JSON of new values
            ip_address TEXT,
            user_agent TEXT,

            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # 7. DOCUMENTS TABLE - Store references to all documents
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT UNIQUE NOT NULL,

            -- Document Info
            filename TEXT,
            file_type TEXT,
            file_size INTEGER,
            file_path TEXT,

            -- Related Records
            related_type TEXT,  -- policy, lead, carrier, email
            related_id TEXT,

            -- Metadata
            uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            uploaded_by TEXT,
            description TEXT,
            tags TEXT,  -- JSON array

            -- Security
            access_level TEXT DEFAULT 'private',  -- public, private, restricted
            encrypted BOOLEAN DEFAULT 0
        )
    """)

    # 8. REMINDERS AND TASKS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            -- Task Info
            title TEXT NOT NULL,
            description TEXT,
            type TEXT,  -- followup, renewal, payment, document, other
            priority TEXT DEFAULT 'medium',

            -- Related Records
            related_type TEXT,
            related_id TEXT,

            -- Scheduling
            due_date TIMESTAMP,
            reminder_date TIMESTAMP,

            -- Assignment
            assigned_to TEXT,
            assigned_by TEXT,

            -- Status
            status TEXT DEFAULT 'pending',  -- pending, completed, cancelled
            completed_date TIMESTAMP,
            completed_by TEXT,

            -- Metadata
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT
        )
    """)

    # 9. EMAIL TEMPLATES
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_name TEXT UNIQUE NOT NULL,
            subject TEXT,
            body TEXT,
            variables TEXT,  -- JSON array of variable names
            type TEXT,  -- coi, followup, renewal, welcome
            active BOOLEAN DEFAULT 1,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_modified TIMESTAMP
        )
    """)

    # 10. SYNC STATUS - Track data synchronization
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sync_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT,
            last_sync TIMESTAMP,
            sync_status TEXT,
            records_synced INTEGER,
            errors TEXT,
            next_sync TIMESTAMP
        )
    """)

    # Create indexes for better performance
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)",
        "CREATE INDEX IF NOT EXISTS idx_leads_dot ON leads(dot_number)",
        "CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status)",
        "CREATE INDEX IF NOT EXISTS idx_policies_expiration ON policies(expiration_date)",
        "CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp)",
        "CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_date)"
    ]

    for index in indexes:
        cursor.execute(index)

    conn.commit()

    # Get table info
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()

    print("\n✅ Database created successfully!")
    print(f"📊 Tables created: {len(tables)}")
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"   - {table[0]}: {count} records")

    conn.close()
    return True

if __name__ == "__main__":
    create_database()
    print("\n🎉 Vanguard Insurance System Database is ready!")
    print("📁 Database file: vanguard_system.db")
    print("🔄 All data will be synchronized across all locations")