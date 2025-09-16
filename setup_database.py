#!/usr/bin/env python3
"""
Database setup script for Render deployment
Downloads the database if not present
"""
import os
import sys
import sqlite3
import urllib.request

DB_PATH = 'fmcsa_complete.db'

def create_sample_database():
    """Create a sample database with a few carriers for testing"""
    print("Creating sample database with test data...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create carriers table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS carriers (
            dot_number TEXT PRIMARY KEY,
            legal_name TEXT,
            dba_name TEXT,
            street TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            phone TEXT,
            email_address TEXT,
            power_units INTEGER,
            drivers INTEGER,
            insurance_carrier TEXT,
            bipd_insurance_on_file_amount TEXT,
            policy_renewal_date DATE,
            mc_number TEXT
        )
    """)

    # Insert sample carriers
    sample_carriers = [
        ('1234567', 'ABC TRUCKING LLC', 'ABC Trucking', '123 Main St', 'Houston', 'TX', '77001', '713-555-0100', 'info@abctrucking.com', 25, 30, 'Progressive', '1000000', '2025-10-15', '567890'),
        ('2345678', 'XYZ LOGISTICS INC', 'XYZ Logistics', '456 Oak Ave', 'Dallas', 'TX', '75201', '214-555-0200', 'contact@xyzlogistics.com', 50, 65, 'State Farm', '1500000', '2025-09-20', '678901'),
        ('3456789', 'QUICK FREIGHT LLC', 'Quick Freight', '789 Pine Rd', 'Austin', 'TX', '78701', '512-555-0300', 'ops@quickfreight.com', 15, 18, 'Geico', '750000', '2025-11-01', '789012'),
        ('4567890', 'NATIONWIDE CARRIERS', 'Nationwide', '321 Elm St', 'Miami', 'FL', '33101', '305-555-0400', 'dispatch@nationwide.com', 100, 125, 'Allstate', '2000000', '2025-10-05', '890123'),
        ('5678901', 'REGIONAL TRANSPORT', 'Regional', '654 Maple Dr', 'Orlando', 'FL', '32801', '407-555-0500', 'info@regional.com', 35, 40, 'Liberty Mutual', '1250000', '2025-09-25', '901234'),
    ]

    cursor.executemany("""
        INSERT OR IGNORE INTO carriers (
            dot_number, legal_name, dba_name, street, city, state,
            zip_code, phone, email_address, power_units, drivers,
            insurance_carrier, bipd_insurance_on_file_amount,
            policy_renewal_date, mc_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_carriers)

    conn.commit()

    # Get count
    cursor.execute("SELECT COUNT(*) FROM carriers")
    count = cursor.fetchone()[0]

    conn.close()

    print(f"✓ Sample database created with {count} carriers")
    return True

def download_database(url):
    """Download database from URL"""
    print(f"Downloading database from {url}...")

    try:
        def download_progress(block_num, block_size, total_size):
            downloaded = block_num * block_size
            percent = min(downloaded * 100 / total_size, 100) if total_size > 0 else 0
            mb_downloaded = downloaded / (1024 * 1024)
            mb_total = total_size / (1024 * 1024) if total_size > 0 else 0
            sys.stdout.write(f'\rProgress: {percent:.1f}% ({mb_downloaded:.1f}/{mb_total:.1f} MB)')
            sys.stdout.flush()

        urllib.request.urlretrieve(url, DB_PATH, download_progress)
        print("\n✓ Database downloaded successfully")
        return True
    except Exception as e:
        print(f"\n✗ Failed to download database: {e}")
        return False

def setup_database():
    """Setup database for deployment"""
    if os.path.exists(DB_PATH):
        # Check if it's a valid database
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM carriers")
            count = cursor.fetchone()[0]
            conn.close()
            print(f"✓ Database exists with {count} carriers")
            return True
        except:
            print("⚠ Database file exists but is invalid")
            os.remove(DB_PATH)

    # Check for database URL in environment
    db_url = os.environ.get('DATABASE_DOWNLOAD_URL', '')

    if db_url:
        print(f"DATABASE_DOWNLOAD_URL found: {db_url}")
        if download_database(db_url):
            return True
        print("Failed to download, creating sample database...")
    else:
        print("No DATABASE_DOWNLOAD_URL set, creating sample database...")

    # Create sample database as fallback
    return create_sample_database()

if __name__ == "__main__":
    if setup_database():
        print("\n✓ Database ready for use")
        sys.exit(0)
    else:
        print("\n✗ Failed to setup database")
        sys.exit(1)