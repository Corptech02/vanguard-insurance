#!/usr/bin/env python3
"""
Download FMCSA database from cloud storage for deployment.
This script is used during deployment to fetch the large database file.
"""

import os
import sys
import urllib.request
import hashlib

# Database configuration
DB_NAME = "fmcsa_complete.db"
DB_SIZE_MB = 521
DB_CHECKSUM = None  # Add SHA256 checksum here after uploading to cloud

# Cloud storage URL (update after uploading database)
# Options:
# 1. Google Drive: https://drive.google.com/uc?export=download&id=FILE_ID
# 2. Dropbox: https://www.dropbox.com/s/SHARE_ID/fmcsa_complete.db?dl=1
# 3. AWS S3: https://your-bucket.s3.amazonaws.com/fmcsa_complete.db
# 4. GitHub Release: https://github.com/corptech02/vanguard-insurance-github/releases/download/v1.0/fmcsa_complete.db

DB_URL = os.environ.get('DATABASE_URL', '')

def download_database():
    """Download the database if it doesn't exist."""
    if os.path.exists(DB_NAME):
        print(f"✓ Database {DB_NAME} already exists")
        return True

    if not DB_URL:
        print("⚠ DATABASE_URL environment variable not set")
        print("  Creating empty database for development...")
        # Create empty SQLite database for development
        import sqlite3
        conn = sqlite3.connect(DB_NAME)
        conn.execute("""
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
                policy_renewal_date DATE
            )
        """)
        conn.commit()
        conn.close()
        print("✓ Created empty development database")
        return True

    print(f"Downloading {DB_NAME} ({DB_SIZE_MB}MB)...")
    print(f"From: {DB_URL}")

    try:
        # Download with progress indicator
        def download_progress(block_num, block_size, total_size):
            downloaded = block_num * block_size
            percent = min(downloaded * 100 / total_size, 100)
            mb_downloaded = downloaded / (1024 * 1024)
            mb_total = total_size / (1024 * 1024)
            sys.stdout.write(f'\rProgress: {percent:.1f}% ({mb_downloaded:.1f}/{mb_total:.1f} MB)')
            sys.stdout.flush()

        urllib.request.urlretrieve(DB_URL, DB_NAME, download_progress)
        print("\n✓ Database downloaded successfully")

        # Verify checksum if provided
        if DB_CHECKSUM:
            print("Verifying checksum...")
            sha256_hash = hashlib.sha256()
            with open(DB_NAME, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)

            if sha256_hash.hexdigest() == DB_CHECKSUM:
                print("✓ Checksum verified")
            else:
                print("✗ Checksum mismatch! Database may be corrupted")
                os.remove(DB_NAME)
                return False

        return True

    except Exception as e:
        print(f"\n✗ Error downloading database: {e}")
        return False

if __name__ == "__main__":
    if download_database():
        print("\n✓ Database ready for use")
        sys.exit(0)
    else:
        print("\n✗ Failed to prepare database")
        sys.exit(1)