#!/usr/bin/env python3
"""
Import insurance history data from local file
Ensures most recent and accurate information overwrites older data
"""

import sqlite3
import csv
from datetime import datetime
import logging
import re

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# File and database paths
INPUT_FILE = "/home/corp06/uploaded_files/20250917_151844_insur_allwithhistory.txt"
DB_PATH = "/home/corp06/DB-system/fmcsa_complete.db"

def parse_date(date_str):
    """Parse date in MM/DD/YYYY format"""
    try:
        if date_str and '/' in date_str:
            return datetime.strptime(date_str, "%m/%d/%Y")
    except:
        pass
    return None

def parse_coverage_amount(amount_str):
    """Parse coverage amount from string (in thousands)"""
    try:
        # Remove any non-numeric characters
        amount_str = re.sub(r'[^\d]', '', amount_str)
        if amount_str:
            return int(amount_str) * 1000  # Convert from thousands to dollars
    except:
        pass
    return 0

def extract_dot_from_docket(docket):
    """Try to extract DOT number from docket if it's actually a DOT"""
    # Some dockets might be DOT numbers with prefix
    if docket.startswith('MC'):
        # Extract numeric part
        num_part = re.sub(r'[^0-9]', '', docket)
        if num_part:
            return int(num_part)
    # Check if it's just a number (possible DOT)
    try:
        return int(docket)
    except:
        pass
    return None

def create_insurance_import_table(conn):
    """Create table to store imported insurance data"""
    cursor = conn.cursor()

    # Create new table for imported insurance data
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS insurance_import (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            docket_number TEXT,
            sequence_number INTEGER,
            status_flag TEXT,
            coverage_bipd INTEGER,
            coverage_cargo INTEGER,
            policy_number TEXT,
            effective_date TEXT,
            effective_date_parsed DATE,
            form_code TEXT,
            insurance_company TEXT,
            dot_number INTEGER,
            mc_number TEXT,
            last_updated TEXT
        )
    """)

    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_import_docket ON insurance_import(docket_number)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_import_dot ON insurance_import(dot_number)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_import_date ON insurance_import(effective_date_parsed)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_import_company ON insurance_import(insurance_company)")

    conn.commit()
    logger.info("Insurance import table created/verified")

def import_insurance_data(conn):
    """Import insurance data from CSV file"""
    cursor = conn.cursor()

    # Clear existing import data
    cursor.execute("DELETE FROM insurance_import")
    conn.commit()

    total_lines = 0
    imported = 0

    logger.info(f"Reading insurance data from {INPUT_FILE}")

    with open(INPUT_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)

        batch = []
        batch_size = 1000

        for row in reader:
            total_lines += 1

            if len(row) >= 9:
                try:
                    docket = row[0].strip('"')
                    sequence = int(row[1].strip('"')) if row[1].strip('"') else 0
                    status = row[2].strip('"')
                    bipd_amount = parse_coverage_amount(row[3].strip('"'))
                    cargo_amount = parse_coverage_amount(row[4].strip('"'))
                    policy_no = row[5].strip('"')
                    date_str = row[6].strip('"')
                    form_code = row[7].strip('"')
                    company = row[8].strip('"')

                    # Parse date
                    parsed_date = parse_date(date_str)

                    # Try to extract DOT or MC number
                    dot_number = None
                    mc_number = None

                    if docket.startswith('FF') or docket.startswith('MX'):
                        # This is a docket number
                        mc_number = docket
                    else:
                        # Might be a DOT number
                        dot_number = extract_dot_from_docket(docket)

                    batch.append((
                        docket, sequence, status, bipd_amount, cargo_amount,
                        policy_no, date_str, parsed_date, form_code, company,
                        dot_number, mc_number, datetime.now().isoformat()
                    ))

                    if len(batch) >= batch_size:
                        cursor.executemany("""
                            INSERT INTO insurance_import (
                                docket_number, sequence_number, status_flag, coverage_bipd, coverage_cargo,
                                policy_number, effective_date, effective_date_parsed, form_code, insurance_company,
                                dot_number, mc_number, last_updated
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, batch)
                        conn.commit()
                        imported += len(batch)
                        batch = []

                        if imported % 10000 == 0:
                            logger.info(f"Imported {imported:,} records...")

                except Exception as e:
                    if total_lines <= 10:
                        logger.error(f"Error processing line {total_lines}: {e}")

            if total_lines % 50000 == 0:
                logger.info(f"Processed {total_lines:,} lines...")

        # Insert remaining batch
        if batch:
            cursor.executemany("""
                INSERT INTO insurance_import (
                    docket_number, sequence_number, status_flag, coverage_bipd, coverage_cargo,
                    policy_number, effective_date, effective_date_parsed, form_code, insurance_company,
                    dot_number, mc_number, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, batch)
            conn.commit()
            imported += len(batch)

    logger.info(f"Imported {imported:,} insurance records from {total_lines:,} lines")
    return imported

def match_insurance_to_carriers(conn):
    """Try to match imported insurance to carriers"""
    cursor = conn.cursor()

    # First add missing columns if they don't exist
    columns_to_add = [
        ("cargo_insurance_on_file_amount", "INTEGER DEFAULT 0"),
        ("has_current_insurance", "INTEGER DEFAULT 0"),
        ("insurance_last_updated", "TEXT"),
        ("insurance_policy_number", "TEXT"),
        ("insurance_effective_date", "TEXT")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE carriers ADD COLUMN {col_name} {col_type}")
            logger.info(f"Added column {col_name}")
        except sqlite3.OperationalError:
            pass

    # Method 1: Match by insurance company name
    logger.info("Matching by insurance company name...")
    cursor.execute("""
        UPDATE carriers
        SET insurance_carrier = (
            SELECT insurance_company
            FROM insurance_import
            WHERE LOWER(insurance_import.insurance_company) LIKE '%' || LOWER(SUBSTR(carriers.legal_name, 1, 10)) || '%'
            AND insurance_import.status_flag IN ('P', 'E', 'A')
            ORDER BY insurance_import.effective_date_parsed DESC
            LIMIT 1
        ),
        bipd_insurance_on_file_amount = (
            SELECT coverage_bipd
            FROM insurance_import
            WHERE LOWER(insurance_import.insurance_company) LIKE '%' || LOWER(SUBSTR(carriers.legal_name, 1, 10)) || '%'
            AND insurance_import.status_flag IN ('P', 'E', 'A')
            ORDER BY insurance_import.effective_date_parsed DESC
            LIMIT 1
        ),
        cargo_insurance_on_file_amount = (
            SELECT coverage_cargo
            FROM insurance_import
            WHERE LOWER(insurance_import.insurance_company) LIKE '%' || LOWER(SUBSTR(carriers.legal_name, 1, 10)) || '%'
            AND insurance_import.status_flag IN ('P', 'E', 'A')
            ORDER BY insurance_import.effective_date_parsed DESC
            LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1
            FROM insurance_import
            WHERE LOWER(insurance_import.insurance_company) LIKE '%' || LOWER(SUBSTR(carriers.legal_name, 1, 10)) || '%'
        )
        AND LENGTH(carriers.legal_name) > 10
    """)
    matched_by_name = cursor.rowcount
    logger.info(f"Matched {matched_by_name} carriers by company name")

    # Method 2: Try to match MC numbers
    logger.info("Matching by MC numbers...")
    cursor.execute("""
        UPDATE carriers
        SET mc_number = (
            SELECT mc_number
            FROM insurance_import
            WHERE insurance_import.dot_number = carriers.dot_number
            AND insurance_import.mc_number IS NOT NULL
            LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1
            FROM insurance_import
            WHERE insurance_import.dot_number = carriers.dot_number
        )
        AND (carriers.mc_number IS NULL OR carriers.mc_number = '')
    """)
    mc_updated = cursor.rowcount
    logger.info(f"Updated {mc_updated} MC numbers")

    # Update insurance status for recent policies
    logger.info("Updating insurance status flags...")
    cursor.execute("""
        WITH recent_insurance AS (
            SELECT
                docket_number,
                insurance_company,
                policy_number,
                effective_date,
                coverage_bipd,
                coverage_cargo,
                status_flag,
                ROW_NUMBER() OVER (PARTITION BY insurance_company ORDER BY effective_date_parsed DESC) as rn
            FROM insurance_import
            WHERE effective_date_parsed >= date('now', '-2 years')
            AND status_flag IN ('P', 'E', 'A')
        )
        UPDATE carriers
        SET has_current_insurance = 1,
            insurance_policy_number = (
                SELECT policy_number FROM recent_insurance
                WHERE LOWER(recent_insurance.insurance_company) LIKE '%' || LOWER(SUBSTR(carriers.legal_name, 1, 10)) || '%'
                AND rn = 1
            ),
            insurance_effective_date = (
                SELECT effective_date FROM recent_insurance
                WHERE LOWER(recent_insurance.insurance_company) LIKE '%' || LOWER(SUBSTR(carriers.legal_name, 1, 10)) || '%'
                AND rn = 1
            ),
            insurance_last_updated = datetime('now')
        WHERE EXISTS (
            SELECT 1 FROM recent_insurance
            WHERE LOWER(recent_insurance.insurance_company) LIKE '%' || LOWER(SUBSTR(carriers.legal_name, 1, 10)) || '%'
        )
        AND LENGTH(carriers.legal_name) > 10
    """)
    status_updated = cursor.rowcount
    logger.info(f"Updated insurance status for {status_updated} carriers")

    conn.commit()
    return matched_by_name, mc_updated, status_updated

def get_statistics(conn):
    """Get summary statistics"""
    cursor = conn.cursor()

    stats = {}

    # Total imported records
    cursor.execute("SELECT COUNT(*) FROM insurance_import")
    stats['total_imported'] = cursor.fetchone()[0]

    # Unique dockets
    cursor.execute("SELECT COUNT(DISTINCT docket_number) FROM insurance_import")
    stats['unique_dockets'] = cursor.fetchone()[0]

    # Recent policies (last 2 years)
    cursor.execute("""
        SELECT COUNT(*) FROM insurance_import
        WHERE effective_date_parsed >= date('now', '-2 years')
    """)
    stats['recent_policies'] = cursor.fetchone()[0]

    # Active policies
    cursor.execute("""
        SELECT COUNT(*) FROM insurance_import
        WHERE status_flag IN ('P', 'E', 'A')
    """)
    stats['active_policies'] = cursor.fetchone()[0]

    # Unique insurance companies
    cursor.execute("SELECT COUNT(DISTINCT insurance_company) FROM insurance_import")
    stats['unique_companies'] = cursor.fetchone()[0]

    # Carriers with updated insurance
    cursor.execute("SELECT COUNT(*) FROM carriers WHERE has_current_insurance = 1")
    stats['carriers_with_current'] = cursor.fetchone()[0]

    # Most recent policy date
    cursor.execute("SELECT MAX(effective_date) FROM insurance_import WHERE effective_date_parsed IS NOT NULL")
    stats['most_recent_policy'] = cursor.fetchone()[0]

    return stats

def main():
    """Main function"""
    logger.info("="*60)
    logger.info("Starting insurance data import")
    logger.info("="*60)

    conn = sqlite3.connect(DB_PATH)

    try:
        # Create import table
        create_insurance_import_table(conn)

        # Import data
        imported = import_insurance_data(conn)

        # Match to carriers
        matched_name, mc_updated, status_updated = match_insurance_to_carriers(conn)

        # Get statistics
        stats = get_statistics(conn)

        logger.info("="*60)
        logger.info("IMPORT COMPLETE")
        logger.info("="*60)
        logger.info(f"Total records imported: {stats['total_imported']:,}")
        logger.info(f"Unique dockets: {stats['unique_dockets']:,}")
        logger.info(f"Recent policies (last 2 years): {stats['recent_policies']:,}")
        logger.info(f"Active policies: {stats['active_policies']:,}")
        logger.info(f"Unique insurance companies: {stats['unique_companies']:,}")
        logger.info(f"Carriers matched by name: {matched_name:,}")
        logger.info(f"MC numbers updated: {mc_updated:,}")
        logger.info(f"Carriers with current insurance: {stats['carriers_with_current']:,}")
        logger.info(f"Most recent policy date: {stats['most_recent_policy']}")
        logger.info("="*60)

    except Exception as e:
        logger.error(f"Error during import: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()