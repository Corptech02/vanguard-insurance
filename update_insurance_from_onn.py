#!/usr/bin/env python3
"""
Update FMCSA database with latest insurance data from ONN disk
Focuses on accurate insurance expiration dates and comprehensive carrier info
"""

import sqlite3
import csv
import os
from datetime import datetime, date
from collections import defaultdict
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/corp06/vanguard-insurance-github/insurance_update.log'),
        logging.StreamHandler()
    ]
)

# Database paths
DB_PATH = '/home/corp06/vanguard-insurance-github/fmcsa_complete.db'
ONN_PATH = '/mnt/usb_onn'

# Track statistics
stats = {
    'carriers_updated': 0,
    'new_carriers_added': 0,
    'insurance_records_processed': 0,
    'expiration_dates_updated': 0,
    'active_policies_found': 0,
    'errors': 0
}

def parse_date(date_str):
    """Parse various date formats"""
    if not date_str or date_str.strip() == '':
        return None

    date_str = date_str.strip().strip('"')

    # Try different date formats
    formats = [
        '%m/%d/%Y',
        '%Y-%m-%d',
        '%m/%d/%y',
        '%d-%m-%Y',
        '%Y/%m/%d'
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except:
            continue

    return None

def parse_coverage_amount(amount_str):
    """Parse coverage amount (in thousands)"""
    try:
        amount = float(amount_str.strip().strip('"'))
        # Convert from thousands to actual amount
        return amount * 1000
    except:
        return 0

def load_active_insurance_data():
    """Load and parse active/pending insurance from ONN disk"""
    logging.info("Loading active insurance data from ONN disk...")

    insurance_by_dot = defaultdict(list)
    insurance_by_mc = defaultdict(list)

    actpend_file = os.path.join(ONN_PATH, 'actpendins_allwithhistory.txt')

    with open(actpend_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line_num, line in enumerate(f, 1):
            try:
                # Parse CSV line
                parts = line.strip().split('","')
                if len(parts) >= 11:
                    mc_num = parts[0].strip('"').replace('MC', '')
                    dot_num = parts[1].strip('"').lstrip('0')  # Remove leading zeros
                    ins_type = parts[2].strip('"')
                    coverage_type = parts[3].strip('"')
                    carrier_name = parts[4].strip('"')
                    policy_num = parts[5].strip('"')
                    effective_date = parse_date(parts[6])
                    coverage_amount = parse_coverage_amount(parts[8])
                    expiration_date = parse_date(parts[9])
                    renewal_date = parse_date(parts[10]) if len(parts) > 10 else expiration_date

                    # Create insurance record
                    insurance_record = {
                        'mc_number': mc_num,
                        'dot_number': dot_num,
                        'insurance_type': ins_type,
                        'coverage_type': coverage_type,
                        'carrier_name': carrier_name,
                        'policy_number': policy_num,
                        'effective_date': effective_date,
                        'coverage_amount': coverage_amount,
                        'expiration_date': expiration_date,
                        'renewal_date': renewal_date or expiration_date,
                        'is_active': True
                    }

                    # Store by both DOT and MC for maximum matching
                    if dot_num and dot_num != '0':
                        insurance_by_dot[dot_num].append(insurance_record)
                    if mc_num and mc_num != '0':
                        insurance_by_mc[mc_num].append(insurance_record)

                    stats['insurance_records_processed'] += 1

                    if line_num % 10000 == 0:
                        logging.info(f"Processed {line_num} active insurance records...")

            except Exception as e:
                stats['errors'] += 1
                if stats['errors'] <= 10:  # Only log first 10 errors
                    logging.error(f"Error parsing line {line_num}: {e}")

    logging.info(f"Loaded {stats['insurance_records_processed']} active insurance records")
    return insurance_by_dot, insurance_by_mc

def load_insurance_history():
    """Load insurance history for comprehensive updates"""
    logging.info("Loading insurance history data...")

    history_by_dot = defaultdict(list)
    history_by_mc = defaultdict(list)

    hist_file = os.path.join(ONN_PATH, 'inshist_allwithhistory.txt')

    with open(hist_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line_num, line in enumerate(f, 1):
            try:
                parts = line.strip().split('","')
                if len(parts) >= 17:
                    mc_or_ff = parts[0].strip('"')
                    dot_num = parts[1].strip('"').lstrip('0')
                    ins_type = parts[2].strip('"')
                    status = parts[3].strip('"')
                    coverage_type = parts[6].strip('"')
                    policy_num = parts[7].strip('"')
                    coverage_amount = parse_coverage_amount(parts[8]) if parts[8] else 0
                    effective_date = parse_date(parts[10])
                    expiration_date = parse_date(parts[13])
                    carrier_name = parts[16].strip('"') if len(parts) > 16 else ''

                    # Only interested in active/current policies
                    if status.lower() not in ['cancelled', 'terminated', 'expired']:
                        history_record = {
                            'mc_number': mc_or_ff.replace('MC', '').replace('FF', '') if mc_or_ff.startswith('MC') else '',
                            'dot_number': dot_num,
                            'insurance_type': ins_type,
                            'coverage_type': coverage_type,
                            'carrier_name': carrier_name,
                            'policy_number': policy_num,
                            'coverage_amount': coverage_amount,
                            'effective_date': effective_date,
                            'expiration_date': expiration_date,
                            'status': status
                        }

                        if dot_num and dot_num != '0':
                            history_by_dot[dot_num].append(history_record)
                        if mc_or_ff.startswith('MC'):
                            mc_num = mc_or_ff.replace('MC', '')
                            if mc_num and mc_num != '0':
                                history_by_mc[mc_num].append(history_record)

                    if line_num % 100000 == 0:
                        logging.info(f"Processed {line_num} history records...")

            except Exception as e:
                if line_num <= 10:
                    logging.debug(f"Error parsing history line {line_num}: {e}")

    logging.info(f"Loaded insurance history for {len(history_by_dot)} DOT numbers")
    return history_by_dot, history_by_mc

def get_latest_insurance(insurance_records):
    """Get the most recent/relevant insurance from a list of records"""
    if not insurance_records:
        return None

    # Filter for BIPD/Primary coverage first (most important)
    bipd_records = [r for r in insurance_records if 'BIPD' in str(r.get('coverage_type', ''))]

    records_to_check = bipd_records if bipd_records else insurance_records

    # Sort by expiration date (latest first) and effective date
    valid_records = []
    for record in records_to_check:
        if record.get('expiration_date'):
            valid_records.append(record)

    if not valid_records:
        return records_to_check[0] if records_to_check else None

    # Sort by expiration date descending (latest expiration first)
    valid_records.sort(key=lambda x: (x.get('expiration_date') or date.min,
                                      x.get('effective_date') or date.min),
                      reverse=True)

    return valid_records[0]

def update_database(insurance_by_dot, insurance_by_mc, history_by_dot, history_by_mc):
    """Update database with insurance information"""
    logging.info("Updating database with insurance information...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # First, get all carriers that need updates
    cursor.execute("SELECT dot_number, docket FROM carriers WHERE dot_number IS NOT NULL")
    carriers = cursor.fetchall()

    batch_updates = []
    batch_size = 1000

    for i, (dot_number, mc_docket) in enumerate(carriers):
        if i % 10000 == 0:
            logging.info(f"Processing carrier {i}/{len(carriers)}...")

        try:
            dot_str = str(dot_number)
            mc_str = mc_docket.replace('MC', '') if mc_docket else ''

            # Get insurance records for this carrier
            active_ins = insurance_by_dot.get(dot_str, [])
            if not active_ins and mc_str:
                active_ins = insurance_by_mc.get(mc_str, [])

            # Also check history
            hist_ins = history_by_dot.get(dot_str, [])
            if not hist_ins and mc_str:
                hist_ins = history_by_mc.get(mc_str, [])

            # Combine and get latest
            all_insurance = active_ins + hist_ins

            if all_insurance:
                latest = get_latest_insurance(all_insurance)

                if latest:
                    # Prepare update
                    update_data = (
                        latest.get('carrier_name', ''),
                        latest.get('policy_number', ''),
                        latest.get('coverage_amount', 0),
                        latest.get('coverage_amount', 0),  # Set both required and on_file
                        latest.get('effective_date'),
                        latest.get('expiration_date') or latest.get('renewal_date'),
                        latest.get('coverage_type', ''),
                        1,  # Mark as updated
                        dot_number
                    )

                    batch_updates.append(update_data)
                    stats['carriers_updated'] += 1

                    # Check if policy is currently active
                    if latest.get('expiration_date'):
                        if latest['expiration_date'] >= date.today():
                            stats['active_policies_found'] += 1

                    if latest.get('expiration_date'):
                        stats['expiration_dates_updated'] += 1

                    # Execute batch updates
                    if len(batch_updates) >= batch_size:
                        cursor.executemany("""
                            UPDATE carriers
                            SET insurance_carrier = ?,
                                policy_number = ?,
                                bipd_insurance_required_amount = ?,
                                bipd_insurance_on_file_amount = ?,
                                policy_effective_date = ?,
                                policy_renewal_date = ?,
                                insurance_type = ?,
                                insurance_updated = ?
                            WHERE dot_number = ?
                        """, batch_updates)
                        conn.commit()
                        batch_updates = []

        except Exception as e:
            logging.error(f"Error updating carrier DOT {dot_number}: {e}")
            stats['errors'] += 1

    # Final batch
    if batch_updates:
        cursor.executemany("""
            UPDATE carriers
            SET insurance_carrier = ?,
                policy_number = ?,
                bipd_insurance_required_amount = ?,
                bipd_insurance_on_file_amount = ?,
                policy_effective_date = ?,
                policy_renewal_date = ?,
                insurance_type = ?,
                insurance_updated = ?
            WHERE dot_number = ?
        """, batch_updates)
        conn.commit()

    # Update carriers without DOT but with MC
    logging.info("Checking MC-only carriers...")
    cursor.execute("SELECT docket FROM carriers WHERE dot_number IS NULL AND docket LIKE 'MC%'")
    mc_only_carriers = cursor.fetchall()

    mc_updates = []
    for (mc_docket,) in mc_only_carriers:
        mc_str = mc_docket.replace('MC', '')

        active_ins = insurance_by_mc.get(mc_str, [])
        hist_ins = history_by_mc.get(mc_str, [])
        all_insurance = active_ins + hist_ins

        if all_insurance:
            latest = get_latest_insurance(all_insurance)
            if latest:
                mc_updates.append((
                    latest.get('carrier_name', ''),
                    latest.get('policy_number', ''),
                    latest.get('coverage_amount', 0),
                    latest.get('coverage_amount', 0),
                    latest.get('effective_date'),
                    latest.get('expiration_date') or latest.get('renewal_date'),
                    latest.get('coverage_type', ''),
                    1,
                    mc_docket
                ))
                stats['carriers_updated'] += 1

    if mc_updates:
        cursor.executemany("""
            UPDATE carriers
            SET insurance_carrier = ?,
                policy_number = ?,
                bipd_insurance_required_amount = ?,
                bipd_insurance_on_file_amount = ?,
                policy_effective_date = ?,
                policy_renewal_date = ?,
                insurance_type = ?,
                insurance_updated = ?
            WHERE docket = ?
        """, mc_updates)
        conn.commit()

    conn.close()
    logging.info("Database update complete!")

def verify_updates():
    """Verify the insurance updates were successful"""
    logging.info("Verifying insurance updates...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Count carriers with insurance
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE insurance_updated = 1
    """)
    updated_count = cursor.fetchone()[0]

    # Count active policies (not expired)
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE policy_renewal_date >= date('now')
        AND insurance_updated = 1
    """)
    active_count = cursor.fetchone()[0]

    # Count expired policies
    cursor.execute("""
        SELECT COUNT(*) FROM carriers
        WHERE policy_renewal_date < date('now')
        AND policy_renewal_date IS NOT NULL
        AND insurance_updated = 1
    """)
    expired_count = cursor.fetchone()[0]

    # Get sample of recent expirations
    cursor.execute("""
        SELECT legal_name, dot_number, policy_renewal_date, insurance_carrier
        FROM carriers
        WHERE policy_renewal_date BETWEEN date('now') AND date('now', '+30 days')
        AND insurance_updated = 1
        LIMIT 10
    """)
    upcoming_expirations = cursor.fetchall()

    conn.close()

    logging.info(f"Verification Results:")
    logging.info(f"  Total carriers with insurance: {updated_count}")
    logging.info(f"  Active policies: {active_count}")
    logging.info(f"  Expired policies: {expired_count}")
    logging.info(f"  Upcoming expirations (next 30 days): {len(upcoming_expirations)}")

    if upcoming_expirations:
        logging.info("\nSample upcoming expirations:")
        for name, dot, exp_date, carrier in upcoming_expirations[:5]:
            logging.info(f"  {name} (DOT: {dot}) - Expires: {exp_date} - Carrier: {carrier}")

    return {
        'updated': updated_count,
        'active': active_count,
        'expired': expired_count
    }

def main():
    """Main execution function"""
    start_time = datetime.now()
    logging.info("="*60)
    logging.info("Starting FMCSA Insurance Update from ONN Disk")
    logging.info("="*60)

    try:
        # Load insurance data
        insurance_by_dot, insurance_by_mc = load_active_insurance_data()
        history_by_dot, history_by_mc = load_insurance_history()

        # Update database
        update_database(insurance_by_dot, insurance_by_mc, history_by_dot, history_by_mc)

        # Verify updates
        verification = verify_updates()

        # Final statistics
        elapsed = datetime.now() - start_time
        logging.info("\n" + "="*60)
        logging.info("UPDATE COMPLETE - FINAL STATISTICS")
        logging.info("="*60)
        logging.info(f"Time elapsed: {elapsed}")
        logging.info(f"Carriers updated: {stats['carriers_updated']}")
        logging.info(f"Insurance records processed: {stats['insurance_records_processed']}")
        logging.info(f"Expiration dates updated: {stats['expiration_dates_updated']}")
        logging.info(f"Active policies found: {stats['active_policies_found']}")
        logging.info(f"Errors encountered: {stats['errors']}")
        logging.info(f"Database verification: {verification}")
        logging.info("="*60)

    except Exception as e:
        logging.error(f"Fatal error: {e}")
        raise

if __name__ == "__main__":
    main()