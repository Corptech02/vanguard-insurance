#!/usr/bin/env python3
"""
Smart matching of insurance data to carriers using multiple strategies
"""

import sqlite3
import logging
from datetime import datetime
import re

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DB_PATH = "/home/corp06/DB-system/fmcsa_complete.db"

def add_columns(conn):
    """Add necessary columns"""
    cursor = conn.cursor()

    columns = [
        ("mc_number", "TEXT"),
        ("cargo_insurance_on_file_amount", "INTEGER DEFAULT 0"),
        ("has_current_insurance", "INTEGER DEFAULT 0"),
        ("insurance_last_updated", "TEXT"),
        ("insurance_policy_number", "TEXT"),
        ("insurance_effective_date", "TEXT"),
        ("insurance_form_code", "TEXT")
    ]

    for col, dtype in columns:
        try:
            cursor.execute(f"ALTER TABLE carriers ADD COLUMN {col} {dtype}")
            logger.info(f"Added column {col}")
        except:
            pass

    conn.commit()

def extract_mc_from_docket(conn):
    """Extract MC numbers from docket numbers in insurance_import"""
    cursor = conn.cursor()

    # Update MC numbers where docket starts with MC
    cursor.execute("""
        UPDATE carriers
        SET mc_number = (
            SELECT DISTINCT REPLACE(docket_number, 'MC', '')
            FROM insurance_import
            WHERE docket_number LIKE 'MC%'
            AND CAST(REPLACE(docket_number, 'MC', '') AS INTEGER) = carriers.dot_number
            LIMIT 1
        )
        WHERE mc_number IS NULL
        AND EXISTS (
            SELECT 1
            FROM insurance_import
            WHERE docket_number LIKE 'MC%'
            AND CAST(REPLACE(docket_number, 'MC', '') AS INTEGER) = carriers.dot_number
        )
    """)

    mc_matched = cursor.rowcount
    logger.info(f"Matched {mc_matched} MC numbers by DOT correlation")

    conn.commit()
    return mc_matched

def match_by_company_name(conn):
    """Match insurance by analyzing company names"""
    cursor = conn.cursor()

    # Get most common insurance companies
    cursor.execute("""
        SELECT insurance_company, COUNT(*) as cnt
        FROM insurance_import
        WHERE insurance_company != ''
        AND status_flag IN ('P', 'E', 'A')
        GROUP BY insurance_company
        ORDER BY cnt DESC
        LIMIT 500
    """)

    companies = cursor.fetchall()
    logger.info(f"Processing {len(companies)} insurance companies")

    total_matched = 0

    for company, count in companies:
        # Extract key words from insurance company name
        company_words = re.sub(r'[^A-Z0-9\s]', '', company.upper()).split()

        if len(company_words) < 2:
            continue

        # Try to match carriers by company name similarity
        key_word = company_words[0] if len(company_words[0]) > 3 else ' '.join(company_words[:2])

        cursor.execute("""
            WITH recent_policy AS (
                SELECT
                    insurance_company,
                    policy_number,
                    effective_date,
                    coverage_bipd,
                    coverage_cargo,
                    form_code,
                    effective_date_parsed
                FROM insurance_import
                WHERE insurance_company = ?
                AND status_flag IN ('P', 'E', 'A')
                ORDER BY effective_date_parsed DESC
                LIMIT 1
            )
            UPDATE carriers
            SET
                insurance_carrier = (SELECT insurance_company FROM recent_policy),
                bipd_insurance_on_file_amount = COALESCE(
                    (SELECT coverage_bipd FROM recent_policy),
                    bipd_insurance_on_file_amount
                ),
                cargo_insurance_on_file_amount = COALESCE(
                    (SELECT coverage_cargo FROM recent_policy),
                    cargo_insurance_on_file_amount
                ),
                insurance_policy_number = (SELECT policy_number FROM recent_policy),
                insurance_effective_date = (SELECT effective_date FROM recent_policy),
                insurance_form_code = (SELECT form_code FROM recent_policy),
                has_current_insurance = CASE
                    WHEN (SELECT effective_date_parsed FROM recent_policy) >= date('now', '-2 years')
                    THEN 1
                    ELSE has_current_insurance
                END,
                insurance_last_updated = datetime('now')
            WHERE UPPER(legal_name) LIKE '%' || ? || '%'
            AND (insurance_carrier IS NULL OR insurance_carrier = '')
            AND LENGTH(legal_name) > 10
        """, (company, key_word))

        matched = cursor.rowcount
        if matched > 0:
            total_matched += matched
            logger.debug(f"Matched {matched} carriers for {company}")

    conn.commit()
    logger.info(f"Matched {total_matched} carriers by company name similarity")
    return total_matched

def update_by_dot_pattern(conn):
    """Try to match by DOT number patterns in docket numbers"""
    cursor = conn.cursor()

    # Some dockets might contain DOT numbers
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
                -- Try to extract DOT from various docket formats
                CASE
                    WHEN docket_number REGEXP '^[0-9]+$' THEN CAST(docket_number AS INTEGER)
                    WHEN docket_number LIKE 'DOT%' THEN CAST(REPLACE(docket_number, 'DOT', '') AS INTEGER)
                    ELSE NULL
                END as extracted_dot,
                ROW_NUMBER() OVER (
                    PARTITION BY docket_number
                    ORDER BY effective_date_parsed DESC
                ) as rn
            FROM insurance_import
            WHERE status_flag IN ('P', 'E', 'A')
            AND effective_date_parsed >= date('now', '-3 years')
        )
        UPDATE carriers
        SET
            insurance_carrier = COALESCE(
                (SELECT insurance_company FROM latest_insurance
                 WHERE rn = 1 AND extracted_dot = carriers.dot_number
                 LIMIT 1),
                insurance_carrier
            ),
            bipd_insurance_on_file_amount = COALESCE(
                (SELECT coverage_bipd FROM latest_insurance
                 WHERE rn = 1 AND extracted_dot = carriers.dot_number
                 LIMIT 1),
                bipd_insurance_on_file_amount
            ),
            cargo_insurance_on_file_amount = COALESCE(
                (SELECT coverage_cargo FROM latest_insurance
                 WHERE rn = 1 AND extracted_dot = carriers.dot_number
                 LIMIT 1),
                cargo_insurance_on_file_amount
            ),
            has_current_insurance = CASE
                WHEN EXISTS (
                    SELECT 1 FROM latest_insurance
                    WHERE extracted_dot = carriers.dot_number
                ) THEN 1
                ELSE has_current_insurance
            END,
            insurance_last_updated = datetime('now')
        WHERE EXISTS (
            SELECT 1 FROM latest_insurance
            WHERE extracted_dot = carriers.dot_number
        )
    """)

    matched = cursor.rowcount
    logger.info(f"Matched {matched} carriers by DOT pattern extraction")

    conn.commit()
    return matched

def get_final_stats(conn):
    """Get final statistics"""
    cursor = conn.cursor()

    stats = {}

    cursor.execute("SELECT COUNT(*) FROM carriers WHERE insurance_carrier IS NOT NULL AND insurance_carrier != ''")
    stats['with_insurance'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM carriers WHERE has_current_insurance = 1")
    stats['current'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM carriers WHERE bipd_insurance_on_file_amount > 0")
    stats['with_bipd'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM carriers WHERE cargo_insurance_on_file_amount > 0")
    stats['with_cargo'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM carriers WHERE mc_number IS NOT NULL AND mc_number != ''")
    stats['with_mc'] = cursor.fetchone()[0]

    # Check recent updates
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE insurance_last_updated >= datetime('now', '-1 hour')
    """)
    stats['updated_this_session'] = cursor.fetchone()[0]

    return stats

def main():
    logger.info("="*60)
    logger.info("Smart Insurance Matching")
    logger.info("="*60)

    conn = sqlite3.connect(DB_PATH)

    try:
        # Add columns
        add_columns(conn)

        # Get initial stats
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM insurance_import")
        total_import = cursor.fetchone()[0]
        logger.info(f"Total insurance records available: {total_import:,}")

        cursor.execute("SELECT COUNT(*) FROM carriers")
        total_carriers = cursor.fetchone()[0]
        logger.info(f"Total carriers in database: {total_carriers:,}")

        # Try various matching strategies
        logger.info("\nStarting matching strategies...")

        mc_matched = extract_mc_from_docket(conn)
        name_matched = match_by_company_name(conn)
        dot_matched = update_by_dot_pattern(conn)

        # Get final stats
        stats = get_final_stats(conn)

        logger.info("="*60)
        logger.info("MATCHING COMPLETE")
        logger.info("="*60)
        logger.info(f"MC numbers extracted: {mc_matched:,}")
        logger.info(f"Matched by company name: {name_matched:,}")
        logger.info(f"Matched by DOT pattern: {dot_matched:,}")
        logger.info(f"\nFinal Statistics:")
        logger.info(f"Carriers with insurance info: {stats['with_insurance']:,}")
        logger.info(f"Carriers with current insurance: {stats['current']:,}")
        logger.info(f"Carriers with BIPD amounts: {stats['with_bipd']:,}")
        logger.info(f"Carriers with cargo amounts: {stats['with_cargo']:,}")
        logger.info(f"Carriers with MC numbers: {stats['with_mc']:,}")
        logger.info(f"Carriers updated this session: {stats['updated_this_session']:,}")
        logger.info("="*60)

    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()