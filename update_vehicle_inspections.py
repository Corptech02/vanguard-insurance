#!/usr/bin/env python3
"""
Update vehicle inspections data from DOT API
Fetches recent vehicle inspection data and merges with existing carrier database
Enhanced to include VIN and vehicle details
"""

import requests
import sqlite3
import json
from datetime import datetime
import time
import logging
import sys

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database path - use the main database
DB_PATH = "/home/corp06/DB-system/fmcsa_complete.db"
API_URL = "https://data.transportation.gov/resource/fx4q-ay7w.json"

def create_vehicle_inspections_table(conn):
    """Create vehicle_inspections table if it doesn't exist"""
    cursor = conn.cursor()

    # Drop existing table if it exists (to ensure proper schema)
    cursor.execute("DROP TABLE IF EXISTS vehicle_inspections")

    cursor.execute("""
        CREATE TABLE vehicle_inspections (
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
            location_desc TEXT,
            county_code_state TEXT,
            gross_comb_veh_wt TEXT,
            viol_total INTEGER,
            oos_total INTEGER,
            driver_viol_total INTEGER,
            driver_oos_total INTEGER,
            vehicle_viol_total INTEGER,
            vehicle_oos_total INTEGER,
            hazmat_viol_total INTEGER,
            hazmat_oos_total INTEGER,
            insp_interstate TEXT,
            last_updated TEXT,

            -- Additional vehicle info fields from API
            vehicle_vin TEXT,
            vehicle_make TEXT,
            vehicle_model TEXT,
            vehicle_year TEXT,
            vehicle_type TEXT,
            vehicle_license_state TEXT,
            vehicle_license_number TEXT,

            -- Additional fields from API
            post_acc_ind TEXT,
            census_source_id TEXT,
            insp_facility TEXT,
            service_center TEXT,
            region TEXT
        )
    """)

    # Create indexes for faster lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_dot
        ON vehicle_inspections(dot_number)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date
        ON vehicle_inspections(insp_date)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vin
        ON vehicle_inspections(vehicle_vin)
    """)

    conn.commit()
    logger.info("Vehicle inspections table created/verified")

def fetch_inspections(offset=0, limit=1000):
    """Fetch inspection data from DOT API"""
    params = {
        "$limit": limit,
        "$offset": offset,
        "$order": "insp_date DESC"  # Get most recent first
    }

    try:
        response = requests.get(API_URL, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error fetching data: {e}")
        return []

def safe_int(value, default=0):
    """Safely convert to integer"""
    try:
        return int(value) if value else default
    except (ValueError, TypeError):
        return default

def safe_str(value, default=""):
    """Safely convert to string"""
    return str(value) if value else default

def update_inspection_record(cursor, inspection):
    """Update or insert inspection record"""
    try:
        # Extract fields with safe defaults
        data = {
            'inspection_id': safe_str(inspection.get('inspection_id')),
            'dot_number': safe_int(inspection.get('dot_number')),
            'insp_date': safe_str(inspection.get('insp_date')),
            'report_state': safe_str(inspection.get('report_state')),
            'report_number': safe_str(inspection.get('report_number')),
            'insp_level_id': safe_str(inspection.get('insp_level_id')),
            'location_desc': safe_str(inspection.get('location_desc')),
            'county_code_state': safe_str(inspection.get('county_code_state')),
            'gross_comb_veh_wt': safe_str(inspection.get('gross_comb_veh_wt')),
            'viol_total': safe_int(inspection.get('viol_total')),
            'oos_total': safe_int(inspection.get('oos_total')),
            'driver_viol_total': safe_int(inspection.get('driver_viol_total')),
            'driver_oos_total': safe_int(inspection.get('driver_oos_total')),
            'vehicle_viol_total': safe_int(inspection.get('vehicle_viol_total')),
            'vehicle_oos_total': safe_int(inspection.get('vehicle_oos_total')),
            'hazmat_viol_total': safe_int(inspection.get('hazmat_viol_total')),
            'hazmat_oos_total': safe_int(inspection.get('hazmat_oos_total')),
            'insp_interstate': safe_str(inspection.get('insp_interstate')),
            'last_updated': datetime.now().isoformat()
        }

        # Add carrier info if available
        data['insp_carrier_name'] = safe_str(inspection.get('insp_carrier_name'))
        data['insp_carrier_street'] = safe_str(inspection.get('insp_carrier_street'))
        data['insp_carrier_city'] = safe_str(inspection.get('insp_carrier_city'))
        data['insp_carrier_state'] = safe_str(inspection.get('insp_carrier_state'))
        data['insp_carrier_zip_code'] = safe_str(inspection.get('insp_carrier_zip_code'))

        # Vehicle info - will need separate API call for detailed VIN data
        data['vehicle_vin'] = safe_str(inspection.get('vehicle_vin'))
        data['vehicle_make'] = safe_str(inspection.get('vehicle_make'))
        data['vehicle_model'] = safe_str(inspection.get('vehicle_model'))
        data['vehicle_year'] = safe_str(inspection.get('vehicle_year'))
        data['vehicle_type'] = safe_str(inspection.get('vehicle_type'))
        data['vehicle_license_state'] = safe_str(inspection.get('vehicle_license_state'))
        data['vehicle_license_number'] = safe_str(inspection.get('vehicle_license_number'))

        # Additional fields
        data['post_acc_ind'] = safe_str(inspection.get('post_acc_ind'))
        data['census_source_id'] = safe_str(inspection.get('census_source_id'))
        data['insp_facility'] = safe_str(inspection.get('insp_facility'))
        data['service_center'] = safe_str(inspection.get('service_center'))
        data['region'] = safe_str(inspection.get('region'))

        # Use REPLACE to update if exists, insert if new
        cursor.execute("""
            REPLACE INTO vehicle_inspections (
                inspection_id, dot_number, insp_date, report_state, report_number,
                insp_level_id, insp_carrier_name, insp_carrier_street, insp_carrier_city,
                insp_carrier_state, insp_carrier_zip_code, location_desc, county_code_state,
                gross_comb_veh_wt, viol_total, oos_total, driver_viol_total, driver_oos_total,
                vehicle_viol_total, vehicle_oos_total, hazmat_viol_total, hazmat_oos_total,
                insp_interstate, last_updated, vehicle_vin, vehicle_make, vehicle_model,
                vehicle_year, vehicle_type, vehicle_license_state, vehicle_license_number,
                post_acc_ind, census_source_id, insp_facility, service_center, region
            ) VALUES (
                :inspection_id, :dot_number, :insp_date, :report_state, :report_number,
                :insp_level_id, :insp_carrier_name, :insp_carrier_street, :insp_carrier_city,
                :insp_carrier_state, :insp_carrier_zip_code, :location_desc, :county_code_state,
                :gross_comb_veh_wt, :viol_total, :oos_total, :driver_viol_total, :driver_oos_total,
                :vehicle_viol_total, :vehicle_oos_total, :hazmat_viol_total, :hazmat_oos_total,
                :insp_interstate, :last_updated, :vehicle_vin, :vehicle_make, :vehicle_model,
                :vehicle_year, :vehicle_type, :vehicle_license_state, :vehicle_license_number,
                :post_acc_ind, :census_source_id, :insp_facility, :service_center, :region
            )
        """, data)

        return True
    except Exception as e:
        logger.error(f"Error updating inspection {inspection.get('inspection_id')}: {e}")
        return False

def update_carrier_inspection_stats(conn):
    """Update carriers table with latest inspection statistics"""
    cursor = conn.cursor()

    # Add columns if they don't exist
    columns_to_add = [
        ("last_inspection_date", "TEXT"),
        ("total_inspections", "INTEGER DEFAULT 0"),
        ("total_violations", "INTEGER DEFAULT 0"),
        ("avg_violations", "REAL DEFAULT 0"),
        ("total_oos", "INTEGER DEFAULT 0"),
        ("vehicle_count", "INTEGER DEFAULT 0")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE carriers ADD COLUMN {col_name} {col_type}")
            logger.info(f"Added column {col_name} to carriers table")
        except sqlite3.OperationalError:
            pass  # Column already exists

    # Update carrier statistics
    cursor.execute("""
        UPDATE carriers
        SET
            last_inspection_date = (
                SELECT MAX(insp_date)
                FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            ),
            total_inspections = (
                SELECT COUNT(*)
                FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            ),
            total_violations = (
                SELECT COALESCE(SUM(viol_total), 0)
                FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            ),
            avg_violations = (
                SELECT COALESCE(AVG(viol_total), 0)
                FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            ),
            total_oos = (
                SELECT COALESCE(SUM(oos_total), 0)
                FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
            ),
            vehicle_count = (
                SELECT COUNT(DISTINCT vehicle_vin)
                FROM vehicle_inspections
                WHERE vehicle_inspections.dot_number = carriers.dot_number
                AND vehicle_vin IS NOT NULL AND vehicle_vin != ''
            )
        WHERE EXISTS (
            SELECT 1
            FROM vehicle_inspections
            WHERE vehicle_inspections.dot_number = carriers.dot_number
        )
    """)

    affected = cursor.rowcount
    conn.commit()
    logger.info(f"Updated {affected} carriers with inspection statistics")

def main():
    """Main function to update inspection data"""
    logger.info("=" * 60)
    logger.info("Starting vehicle inspection data update...")
    logger.info("=" * 60)

    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        # Create table if needed
        create_vehicle_inspections_table(conn)

        # Check if carriers with DOT numbers exist
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM carriers WHERE dot_number IS NOT NULL AND dot_number > 0")
        carrier_count = cursor.fetchone()[0]
        logger.info(f"Found {carrier_count:,} carriers with DOT numbers")

        # Fetch and update data
        offset = 0
        batch_size = 1000
        total_processed = 0
        total_updated = 0
        max_records = 50000  # Limit for initial import

        logger.info("Fetching inspection data from DOT API...")
        logger.info("This may take several minutes...")

        while total_processed < max_records:
            logger.info(f"Fetching batch at offset {offset}...")
            inspections = fetch_inspections(offset, batch_size)

            if not inspections:
                logger.info("No more data to fetch")
                break

            cursor = conn.cursor()
            batch_updated = 0

            # Filter to only include inspections for carriers in our database
            for inspection in inspections:
                dot_number = safe_int(inspection.get('dot_number'))
                if dot_number > 0:
                    # Check if carrier exists in our database
                    cursor.execute("SELECT 1 FROM carriers WHERE dot_number = ? LIMIT 1", (dot_number,))
                    if cursor.fetchone():
                        if update_inspection_record(cursor, inspection):
                            batch_updated += 1

            conn.commit()

            total_processed += len(inspections)
            total_updated += batch_updated

            logger.info(f"Processed {len(inspections)} records, updated {batch_updated}")

            # If we got less than batch_size, we've reached the end
            if len(inspections) < batch_size:
                break

            offset += batch_size

            # Rate limiting to avoid overwhelming the API
            time.sleep(0.5)

        # Update carrier statistics
        logger.info("Updating carrier statistics...")
        update_carrier_inspection_stats(conn)

        # Get summary statistics
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM vehicle_inspections")
        total_inspections = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT dot_number) FROM vehicle_inspections")
        carriers_with_inspections = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT vehicle_vin) FROM vehicle_inspections WHERE vehicle_vin IS NOT NULL AND vehicle_vin != ''")
        unique_vins = cursor.fetchone()[0]

        logger.info(f"\n{'=' * 60}")
        logger.info("UPDATE COMPLETE")
        logger.info(f"{'=' * 60}")
        logger.info(f"Total records processed: {total_processed:,}")
        logger.info(f"Total records updated: {total_updated:,}")
        logger.info(f"Total inspections in database: {total_inspections:,}")
        logger.info(f"Carriers with inspection data: {carriers_with_inspections:,}")
        logger.info(f"Unique VINs found: {unique_vins:,}")
        logger.info(f"{'=' * 60}")

    except Exception as e:
        logger.error(f"Error during update: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()