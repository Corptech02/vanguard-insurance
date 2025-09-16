#!/usr/bin/env python3
"""
Simplified FMCSA API for debugging deployment
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import sqlite3
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FMCSA Insurance API", version="2.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path
DB_PATH = os.environ.get('DATABASE_PATH', 'fmcsa_complete.db')

# Create empty database if it doesn't exist
if not os.path.exists(DB_PATH):
    logger.info(f"Creating empty database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
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
    logger.info("Empty database created")

@app.get("/")
async def root():
    return {
        "service": "FMCSA Insurance Lead Generation API",
        "version": "2.0 (simplified)",
        "status": "running",
        "database": DB_PATH
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/test")
async def test():
    """Test endpoint to verify API is working"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM carriers")
        count = cursor.fetchone()[0]
        conn.close()
        return {
            "status": "ok",
            "database": DB_PATH,
            "carrier_count": count
        }
    except Exception as e:
        logger.error(f"Database error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8897))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)