#!/usr/bin/env python3
"""
Match imported insurance data to carriers
"""

import sqlite3
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DB_PATH = "/home/corp06/DB-system/fmcsa_complete.db"

def add_missing_columns(conn):
    """Add missing columns to carriers table"""
    cursor = conn.cursor()

    columns_to_add = [
        ("mc_number", "TEXT"),
        ("cargo_insurance_on_file_amount", "INTEGER DEFAULT 0"),
        ("has_current_insurance", "INTEGER DEFAULT 0"),
        ("insurance_last_updated", "TEXT"),
        ("insurance_policy_number", "TEXT"),
        ("insurance_effective_date", "TEXT"),
        ("insurance_form_code", "TEXT")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE carriers ADD COLUMN {col_name} {col_type}")
            logger.info(f"Added column {col_name}")
        except sqlite3.OperationalError:
            pass

    conn.commit()

def update_insurance_by_recent(conn):
    """Update carriers with most recent insurance data"""
    cursor = conn.cursor()

    # Find carriers that have exact matches in insurance data (by analyzing patterns)
    logger.info("Analyzing insurance company patterns...")

    # Get sample of insurance companies
    cursor.execute("""
        SELECT DISTINCT insurance_company, COUNT(*) as cnt
        FROM insurance_import
        WHERE insurance_company != ''
        GROUP BY insurance_company
        ORDER BY cnt DESC
        LIMIT 100
    """)

    companies = cursor.fetchall()
    logger.info(f"Found {len(companies)} major insurance companies")

    # Update carriers with most recent insurance info where we have active policies
    logger.info("Updating carriers with recent active insurance policies...")

    cursor.execute("""
        WITH latest_insurance AS (
            SELECT
                docket_number,
                insurance_company,
                policy_number,
                effective_date,
                coverage_bipd,
                coverage_cargo,
                form_code,
                effective_date_parsed,
                ROW_NUMBER() OVER (
                    PARTITION BY docket_number
                    ORDER BY effective_date_parsed DESC
                ) as rn
            FROM insurance_import
            WHERE status_flag IN ('P', 'E', 'A')  -- Active policies
            AND effective_date_parsed IS NOT NULL
        )
        UPDATE carriers
        SET
            insurance_carrier = COALESCE(
                (SELECT insurance_company FROM latest_insurance
                 WHERE rn = 1 AND docket_number = 'MC' || carriers.mc_number
                 LIMIT 1),
                insurance_carrier
            ),
            bipd_insurance_on_file_amount = COALESCE(
                (SELECT coverage_bipd FROM latest_insurance
                 WHERE rn = 1 AND docket_number = 'MC' || carriers.mc_number
                 LIMIT 1),
                bipd_insurance_on_file_amount
            ),
            cargo_insurance_on_file_amount = COALESCE(
                (SELECT coverage_cargo FROM latest_insurance
                 WHERE rn = 1 AND docket_number = 'MC' || carriers.mc_number
                 LIMIT 1),
                cargo_insurance_on_file_amount
            ),
            insurance_policy_number = COALESCE(
                (SELECT policy_number FROM latest_insurance
                 WHERE rn = 1 AND docket_number = 'MC' || carriers.mc_number
                 LIMIT 1),
                insurance_policy_number
            ),
            insurance_effective_date = COALESCE(
                (SELECT effective_date FROM latest_insurance
                 WHERE rn = 1 AND docket_number = 'MC' || carriers.mc_number
                 LIMIT 1),
                insurance_effective_date
            ),
            insurance_form_code = COALESCE(
                (SELECT form_code FROM latest_insurance
                 WHERE rn = 1 AND docket_number = 'MC' || carriers.mc_number
                 LIMIT 1),
                insurance_form_code
            ),
            has_current_insurance = 1,
            insurance_last_updated = datetime('now')
        WHERE mc_number IS NOT NULL
        AND mc_number != ''
        AND EXISTS (
            SELECT 1 FROM latest_insurance
            WHERE docket_number = 'MC' || carriers.mc_number
        )
    """)

    matched_by_mc = cursor.rowcount
    logger.info(f"Updated {matched_by_mc} carriers by MC number matching")

    # Try matching by FF numbers
    cursor.execute("""
        WITH latest_insurance AS (
            SELECT
                docket_number,
                insurance_company,
                policy_number,
                effective_date,
                coverage_bipd,
                coverage_cargo,
                form_code,
                effective_date_parsed,
                ROW_NUMBER() OVER (
                    PARTITION BY docket_number
                    ORDER BY effective_date_parsed DESC
                ) as rn
            FROM insurance_import
            WHERE status_flag IN ('P', 'E', 'A')
            AND effective_date_parsed IS NOT NULL
            AND docket_number LIKE 'FF%'
        )
        UPDATE carriers
        SET
            insurance_carrier = COALESCE(
                (SELECT insurance_company FROM latest_insurance
                 WHERE rn = 1 AND docket_number = 'FF' || SUBSTR('00000000' || carriers.dot_number, -6)
                 LIMIT 1),
                insurance_carrier
            ),
            bipd_insurance_on_file_amount = COALESCE(
                (SELECT coverage_bipd FROM latest_insurance
                 WHERE rn = 1 AND docket_number = 'FF' || SUBSTR('00000000' || carriers.dot_number, -6)
                 LIMIT 1),
                bipd_insurance_on_file_amount
            ),
            has_current_insurance = CASE
                WHEN EXISTS (
                    SELECT 1 FROM latest_insurance
                    WHERE docket_number = 'FF' || SUBSTR('00000000' || carriers.dot_number, -6)
                ) THEN 1
                ELSE has_current_insurance
            END,
            insurance_last_updated = CASE
                WHEN EXISTS (
                    SELECT 1 FROM latest_insurance
                    WHERE docket_number = 'FF' || SUBSTR('00000000' || carriers.dot_number, -6)
                ) THEN datetime('now')
                ELSE insurance_last_updated
            END
        WHERE dot_number IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM carriers c2
            WHERE c2.dot_number = carriers.dot_number
            AND c2.has_current_insurance = 1
        )
    """)

    matched_by_ff = cursor.rowcount
    logger.info(f"Updated {matched_by_ff} carriers by FF number pattern")

    conn.commit()
    return matched_by_mc, matched_by_ff

def get_statistics(conn):
    """Get updated statistics"""
    cursor = conn.cursor()

    stats = {}

    # Carriers with insurance now
    cursor.execute("SELECT COUNT(*) FROM carriers WHERE insurance_carrier IS NOT NULL AND insurance_carrier != ''")
    stats['carriers_with_insurance'] = cursor.fetchone()[0]

    # Carriers with current insurance flag
    cursor.execute("SELECT COUNT(*) FROM carriers WHERE has_current_insurance = 1")
    stats['carriers_current'] = cursor.fetchone()[0]

    # Carriers with BIPD amounts
    cursor.execute("SELECT COUNT(*) FROM carriers WHERE bipd_insurance_on_file_amount > 0")
    stats['carriers_with_bipd'] = cursor.fetchone()[0]

    # Carriers with cargo amounts
    cursor.execute("SELECT COUNT(*) FROM carriers WHERE cargo_insurance_on_file_amount > 0")
    stats['carriers_with_cargo'] = cursor.fetchone()[0]

    # Most recent insurance dates
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE insurance_effective_date LIKE '%2024%'
        OR insurance_effective_date LIKE '%2025%'
    """)
    stats['recent_policies'] = cursor.fetchone()[0]

    return stats

def main():
    """Main function"""
    logger.info("="*60)
    logger.info("Matching insurance data to carriers")
    logger.info("="*60)

    conn = sqlite3.connect(DB_PATH)

    try:
        # Add missing columns
        add_missing_columns(conn)

        # Get initial stats
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM insurance_import")
        total_import = cursor.fetchone()[0]
        logger.info(f"Total insurance records to match: {total_import:,}")

        # Perform matching
        matched_mc, matched_ff = update_insurance_by_recent(conn)

        # Get final statistics
        stats = get_statistics(conn)

        logger.info("="*60)
        logger.info("MATCHING COMPLETE")
        logger.info("="*60)
        logger.info(f"Matched by MC number: {matched_mc:,}")
        logger.info(f"Matched by FF pattern: {matched_ff:,}")
        logger.info(f"Total carriers with insurance: {stats['carriers_with_insurance']:,}")
        logger.info(f"Carriers with current insurance: {stats['carriers_current']:,}")
        logger.info(f"Carriers with BIPD amounts: {stats['carriers_with_bipd']:,}")
        logger.info(f"Carriers with cargo amounts: {stats['carriers_with_cargo']:,}")
        logger.info(f"Carriers with 2024/2025 policies: {stats['recent_policies']:,}")
        logger.info("="*60)

    except Exception as e:
        logger.error(f"Error during matching: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()