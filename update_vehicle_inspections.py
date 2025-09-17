#!/usr/bin/env python3
"""
Vehicle Inspection Data Updater
Fetches vehicle inspection data from DOT API and merges with existing carrier database
"""

import sqlite3
import requests
import json
from datetime import datetime
import time
import sys

DB_PATH = '/home/corp06/DB-system/fmcsa_complete.db'
API_ENDPOINT = 'https://data.transportation.gov/resource/fx4q-ay7w.json'

def create_inspection_table(conn):
    """Create or update the vehicle_inspections table"""
    cursor = conn.cursor()

    # Create the vehicle_inspections table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehicle_inspections (
            inspection_id TEXT PRIMARY KEY,
            dot_number INTEGER,
            insp_date TEXT,
            report_state TEXT,
            report_number TEXT,
            insp_level_id TEXT,
            insp_carrier_name TEXT,
            insp_carrier_street TEXT,
            insp_carrier_city TEXT,
            insp_carrier_state TEXT,
            insp_carrier_zip_code TEXT,
            gross_comb_veh_wt TEXT,
            viol_total INTEGER,
            oos_total INTEGER,
            driver_viol_total INTEGER,
            driver_oos_total INTEGER,
            vehicle_viol_total INTEGER,
            vehicle_oos_total INTEGER,
            hazmat_viol_total INTEGER,
            hazmat_oos_total INTEGER,
            location_desc TEXT,
            county_code_state TEXT,
            insp_interstate TEXT,
            last_updated TIMESTAMP,
            FOREIGN KEY (dot_number) REFERENCES carriers (dot_number)
        )
    ''')

    # Create index for faster lookups
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_inspection_dot_number
        ON vehicle_inspections (dot_number)
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_inspection_date
        ON vehicle_inspections (insp_date)
    ''')

    conn.commit()
    print("✅ Vehicle inspections table created/verified")

def fetch_inspection_data(offset=0, limit=1000):
    """Fetch inspection data from DOT API"""
    params = {
        '$limit': limit,
        '$offset': offset,
        '$order': 'insp_date DESC'  # Get most recent inspections first
    }

    try:
        response = requests.get(API_ENDPOINT, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching data: {e}")
        return []

def update_inspections(conn, inspections):
    """Update database with inspection data"""
    cursor = conn.cursor()
    updated_count = 0
    inserted_count = 0

    for inspection in inspections:
        try:
            # Extract DOT number (remove leading zeros)
            dot_number = int(inspection.get('dot_number', 0))
            if dot_number == 0:
                continue

            # Check if this carrier exists in our database
            cursor.execute('SELECT dot_number FROM carriers WHERE dot_number = ?', (dot_number,))
            if not cursor.fetchone():
                continue  # Skip if carrier not in our database

            inspection_id = inspection.get('inspection_id')
            if not inspection_id:
                continue

            # Prepare data for insertion/update
            data = (
                inspection_id,
                dot_number,
                inspection.get('insp_date', ''),
                inspection.get('report_state', ''),
                inspection.get('report_number', ''),
                inspection.get('insp_level_id', ''),
                inspection.get('insp_carrier_name', ''),
                inspection.get('insp_carrier_street', ''),
                inspection.get('insp_carrier_city', ''),
                inspection.get('insp_carrier_state', ''),
                inspection.get('insp_carrier_zip_code', ''),
                inspection.get('gross_comb_veh_wt', ''),
                int(inspection.get('viol_total', 0)),
                int(inspection.get('oos_total', 0)),
                int(inspection.get('driver_viol_total', 0)),
                int(inspection.get('driver_oos_total', 0)),
                int(inspection.get('vehicle_viol_total', 0)),
                int(inspection.get('vehicle_oos_total', 0)),
                int(inspection.get('hazmat_viol_total', 0)),
                int(inspection.get('hazmat_oos_total', 0)),
                inspection.get('location_desc', ''),
                inspection.get('county_code_state', ''),
                inspection.get('insp_interstate', ''),
                datetime.now().isoformat()
            )

            # Use INSERT OR REPLACE to update if exists or insert if new
            cursor.execute('''
                INSERT OR REPLACE INTO vehicle_inspections VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            ''', data)

            if cursor.rowcount > 0:
                inserted_count += 1

        except Exception as e:
            print(f"Error processing inspection {inspection.get('inspection_id')}: {e}")
            continue

    conn.commit()
    return inserted_count

def add_inspection_summary_to_carriers(conn):
    """Add summary columns to carriers table for inspection data"""
    cursor = conn.cursor()

    # Add new columns if they don't exist
    try:
        cursor.execute('ALTER TABLE carriers ADD COLUMN total_inspections INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass  # Column already exists

    try:
        cursor.execute('ALTER TABLE carriers ADD COLUMN total_violations INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute('ALTER TABLE carriers ADD COLUMN total_oos INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute('ALTER TABLE carriers ADD COLUMN last_inspection_date TEXT')
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute('ALTER TABLE carriers ADD COLUMN avg_violations_per_inspection REAL DEFAULT 0')
    except sqlite3.OperationalError:
        pass

    # Update carrier records with inspection summary
    cursor.execute('''
        UPDATE carriers
        SET
            total_inspections = (
                SELECT COUNT(*) FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            ),
            total_violations = (
                SELECT COALESCE(SUM(viol_total), 0) FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            ),
            total_oos = (
                SELECT COALESCE(SUM(oos_total), 0) FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            ),
            last_inspection_date = (
                SELECT MAX(insp_date) FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            ),
            avg_violations_per_inspection = (
                SELECT CASE
                    WHEN COUNT(*) > 0 THEN CAST(SUM(viol_total) AS REAL) / COUNT(*)
                    ELSE 0
                END
                FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            )
        WHERE EXISTS (
            SELECT 1 FROM vehicle_inspections
            WHERE vehicle_inspections.dot_number = carriers.dot_number
        )
    ''')

    affected_rows = cursor.rowcount
    conn.commit()
    print(f"✅ Updated {affected_rows} carriers with inspection summary data")

def main():
    """Main function to orchestrate the data update"""
    print("=" * 60)
    print("🚗 VEHICLE INSPECTION DATA UPDATER")
    print("=" * 60)

    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        # Create/verify inspection table
        create_inspection_table(conn)

        # Fetch and process data in batches
        offset = 0
        limit = 1000
        total_processed = 0
        batch_num = 1

        print("\n📥 Fetching inspection data from DOT API...")
        print("This may take several minutes for large datasets...")

        while True:
            print(f"\n📦 Processing batch {batch_num} (records {offset} - {offset + limit})...")

            # Fetch batch of inspection data
            inspections = fetch_inspection_data(offset, limit)

            if not inspections:
                print("✅ No more records to fetch")
                break

            # Process and insert/update records
            processed = update_inspections(conn, inspections)
            total_processed += processed

            print(f"   Processed {processed} inspection records")

            # If we got less than the limit, we've reached the end
            if len(inspections) < limit:
                break

            offset += limit
            batch_num += 1

            # Be nice to the API
            time.sleep(0.5)

            # Limit for testing (remove this for full import)
            if batch_num > 10:  # Process only first 10,000 records for testing
                print("\n⚠️  Stopping at 10,000 records for testing")
                print("   Remove this limit in production")
                break

        print(f"\n✅ Total inspection records processed: {total_processed}")

        # Update carrier summary information
        print("\n📊 Updating carrier summary information...")
        add_inspection_summary_to_carriers(conn)

        # Show some statistics
        cursor = conn.cursor()
        cursor.execute('''
            SELECT
                COUNT(DISTINCT dot_number) as carriers_with_inspections,
                COUNT(*) as total_inspections,
                AVG(viol_total) as avg_violations,
                MAX(insp_date) as most_recent_inspection
            FROM vehicle_inspections
        ''')

        stats = cursor.fetchone()
        print("\n📈 DATABASE STATISTICS:")
        print(f"   Carriers with inspections: {stats['carriers_with_inspections']:,}")
        print(f"   Total inspection records: {stats['total_inspections']:,}")
        print(f"   Average violations per inspection: {stats['avg_violations']:.2f}")
        print(f"   Most recent inspection: {stats['most_recent_inspection']}")

        print("\n✅ Vehicle inspection data update complete!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()