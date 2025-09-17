#!/usr/bin/env python3
"""
Update insurance history data from DOT API
Fetches insurance policy history and merges with existing carrier database
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
API_URL = "https://data.transportation.gov/resource/6sqe-dvqs.json"

def create_insurance_history_table(conn):
    """Create insurance_history table if it doesn't exist"""
    cursor = conn.cursor()

    # Drop existing table to ensure proper schema
    cursor.execute("DROP TABLE IF EXISTS insurance_history")

    cursor.execute("""
        CREATE TABLE insurance_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dot_number INTEGER,
            docket_number TEXT,
            ins_form_code TEXT,
            status TEXT,  -- from mod_col_1 (Active/Cancelled)
            ins_cancl_form TEXT,
            insurance_type TEXT,  -- from mod_col_3 (BIPD/CARGO/etc)
            policy_no TEXT,
            min_cov_amount TEXT,
            effective_date TEXT,
            cancl_effective_date TEXT,
            cancl_method TEXT,
            inser_branch TEXT,
            name_company TEXT,
            last_updated TEXT,

            -- Additional mod_col fields
            mod_col_2 TEXT,
            mod_col_4 TEXT,
            mod_col_5 TEXT
        )
    """)

    # Create indexes for faster lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_insurance_history_dot
        ON insurance_history(dot_number)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_insurance_history_status
        ON insurance_history(status)
    """)

    conn.commit()
    logger.info("Insurance history table created/verified")

def fetch_insurance_records(offset=0, limit=1000):
    """Fetch insurance history data from DOT API"""
    params = {
        "$limit": limit,
        "$offset": offset,
        "$order": "dot_number ASC"
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
        # Remove leading zeros for DOT numbers
        if isinstance(value, str):
            value = value.lstrip('0') or '0'
        return int(value) if value else default
    except (ValueError, TypeError):
        return default

def safe_str(value, default=""):
    """Safely convert to string"""
    return str(value) if value else default

def update_insurance_record(cursor, record):
    """Update or insert insurance record"""
    try:
        # Extract fields with safe defaults
        data = {
            'dot_number': safe_int(record.get('dot_number')),
            'docket_number': safe_str(record.get('docket_number')),
            'ins_form_code': safe_str(record.get('ins_form_code')),
            'status': safe_str(record.get('mod_col_1', 'Unknown')),
            'ins_cancl_form': safe_str(record.get('ins_cancl_form')),
            'insurance_type': safe_str(record.get('mod_col_3')),
            'policy_no': safe_str(record.get('policy_no')),
            'min_cov_amount': safe_str(record.get('min_cov_amount')),
            'effective_date': safe_str(record.get('effective_date')),
            'cancl_effective_date': safe_str(record.get('cancl_effective_date')),
            'cancl_method': safe_str(record.get('cancl_method')),
            'inser_branch': safe_str(record.get('inser_branch')),
            'name_company': safe_str(record.get('name_company')),
            'last_updated': datetime.now().isoformat(),
            'mod_col_2': safe_str(record.get('mod_col_2')),
            'mod_col_4': safe_str(record.get('mod_col_4')),
            'mod_col_5': safe_str(record.get('mod_col_5'))
        }

        # Insert record (allowing duplicates as this is history)
        cursor.execute("""
            INSERT INTO insurance_history (
                dot_number, docket_number, ins_form_code, status, ins_cancl_form,
                insurance_type, policy_no, min_cov_amount, effective_date,
                cancl_effective_date, cancl_method, inser_branch, name_company,
                last_updated, mod_col_2, mod_col_4, mod_col_5
            ) VALUES (
                :dot_number, :docket_number, :ins_form_code, :status, :ins_cancl_form,
                :insurance_type, :policy_no, :min_cov_amount, :effective_date,
                :cancl_effective_date, :cancl_method, :inser_branch, :name_company,
                :last_updated, :mod_col_2, :mod_col_4, :mod_col_5
            )
        """, data)

        return True
    except Exception as e:
        logger.error(f"Error updating insurance record for DOT {record.get('dot_number')}: {e}")
        return False

def update_carrier_insurance_stats(conn):
    """Update carriers table with insurance history statistics"""
    cursor = conn.cursor()

    # Add columns if they don't exist
    columns_to_add = [
        ("insurance_history_count", "INTEGER DEFAULT 0"),
        ("active_policies_count", "INTEGER DEFAULT 0"),
        ("cancelled_policies_count", "INTEGER DEFAULT 0"),
        ("latest_insurance_company", "TEXT"),
        ("has_cargo_insurance", "INTEGER DEFAULT 0"),
        ("has_bipd_insurance", "INTEGER DEFAULT 0")
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
            insurance_history_count = (
                SELECT COUNT(*)
                FROM insurance_history
                WHERE insurance_history.dot_number = carriers.dot_number
            ),
            active_policies_count = (
                SELECT COUNT(*)
                FROM insurance_history
                WHERE insurance_history.dot_number = carriers.dot_number
                AND insurance_history.status != 'Cancelled'
            ),
            cancelled_policies_count = (
                SELECT COUNT(*)
                FROM insurance_history
                WHERE insurance_history.dot_number = carriers.dot_number
                AND insurance_history.status = 'Cancelled'
            ),
            latest_insurance_company = (
                SELECT name_company
                FROM insurance_history
                WHERE insurance_history.dot_number = carriers.dot_number
                ORDER BY effective_date DESC
                LIMIT 1
            ),
            has_cargo_insurance = (
                SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
                FROM insurance_history
                WHERE insurance_history.dot_number = carriers.dot_number
                AND insurance_history.insurance_type = 'CARGO'
                AND insurance_history.status != 'Cancelled'
            ),
            has_bipd_insurance = (
                SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
                FROM insurance_history
                WHERE insurance_history.dot_number = carriers.dot_number
                AND insurance_history.insurance_type = 'BIPD'
                AND insurance_history.status != 'Cancelled'
            )
        WHERE EXISTS (
            SELECT 1
            FROM insurance_history
            WHERE insurance_history.dot_number = carriers.dot_number
        )
    """)

    affected = cursor.rowcount
    conn.commit()
    logger.info(f"Updated {affected} carriers with insurance history statistics")

def main():
    """Main function to update insurance history data"""
    logger.info("=" * 60)
    logger.info("Starting insurance history data update...")
    logger.info("=" * 60)

    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        # Create table if needed
        create_insurance_history_table(conn)

        # Check if carriers exist
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

        logger.info("Fetching insurance history data from DOT API...")
        logger.info("This may take several minutes...")

        while total_processed < max_records:
            logger.info(f"Fetching batch at offset {offset}...")
            records = fetch_insurance_records(offset, batch_size)

            if not records:
                logger.info("No more data to fetch")
                break

            cursor = conn.cursor()
            batch_updated = 0

            for record in records:
                dot_number = safe_int(record.get('dot_number'))
                if dot_number > 0:
                    # Check if carrier exists in our database
                    cursor.execute("SELECT 1 FROM carriers WHERE dot_number = ? LIMIT 1", (dot_number,))
                    if cursor.fetchone():
                        if update_insurance_record(cursor, record):
                            batch_updated += 1

            conn.commit()

            total_processed += len(records)
            total_updated += batch_updated

            logger.info(f"Processed {len(records)} records, updated {batch_updated}")

            # If we got less than batch_size, we've reached the end
            if len(records) < batch_size:
                break

            offset += batch_size

            # Rate limiting to avoid overwhelming the API
            time.sleep(0.5)

        # Update carrier statistics
        logger.info("Updating carrier insurance statistics...")
        update_carrier_insurance_stats(conn)

        # Get summary statistics
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM insurance_history")
        total_insurance_records = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT dot_number) FROM insurance_history")
        carriers_with_insurance_history = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM insurance_history WHERE status != 'Cancelled'")
        active_policies = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT insurance_type) FROM insurance_history WHERE insurance_type != ''")
        insurance_types = cursor.fetchone()[0]

        logger.info(f"\n{'=' * 60}")
        logger.info("UPDATE COMPLETE")
        logger.info(f"{'=' * 60}")
        logger.info(f"Total records processed: {total_processed:,}")
        logger.info(f"Total records updated: {total_updated:,}")
        logger.info(f"Total insurance records in database: {total_insurance_records:,}")
        logger.info(f"Carriers with insurance history: {carriers_with_insurance_history:,}")
        logger.info(f"Active policies: {active_policies:,}")
        logger.info(f"Insurance types found: {insurance_types}")
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