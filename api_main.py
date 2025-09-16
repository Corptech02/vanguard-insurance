#!/usr/bin/env python3
"""
FMCSA API with Insurance Lead Generation and Vicidial Support
Port 8897 version for Vanguard Insurance frontend
"""

import sys
import os
import subprocess
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Query, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict
import sqlite3
from datetime import datetime, timedelta
import logging
import uvicorn
import os
import shutil
from pathlib import Path

# Import the insurance leads API for the endpoints
from insurance_leads_api import (
    get_expiring_insurance_leads,
    get_vicidial_lists,
    overwrite_vicidial_list
)

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

# Database path - use local file in deployment
DB_PATH = os.environ.get('DATABASE_PATH', 'fmcsa_complete.db')

# Ensure database is downloaded on startup
if not os.path.exists(DB_PATH):
    import subprocess
    subprocess.run([sys.executable, 'download_database.py'], check=False)

@app.get("/")
async def root():
    return {
        "service": "FMCSA Insurance Lead Generation API",
        "version": "2.0",
        "port": 8897,
        "endpoints": {
            "/api/leads/expiring-insurance": "Get leads with expiring insurance",
            "/api/vicidial/lists": "Get Vicidial lists",
            "/api/vicidial/overwrite": "Upload leads to Vicidial"
        }
    }

@app.get("/api/leads/expiring-insurance")
async def get_leads_endpoint(
    days: int = Query(30, description="Days until insurance expiry"),
    limit: int = Query(100, description="Maximum number of leads"),
    state: Optional[str] = Query(None, description="State filter"),
    insurance_companies: Optional[str] = Query(None, description="Insurance companies filter"),
    skip_days: int = Query(0, description="Skip first N days for 5/30 filter"),
    min_premium: int = Query(0, description="Minimum premium amount")
):
    """Get carriers with insurance expiring within specified days"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Build query
        query = """
            SELECT
                dot_number,
                dot_number as usdot_number,
                legal_name,
                dba_name,
                street as physical_address,
                city as physical_city,
                state as physical_state,
                state as phy_state,
                zip_code as physical_zip,
                phone,
                phone as telephone,
                email_address,
                email_address as email,
                power_units,
                drivers as total_drivers,
                NULL as mc_number,
                insurance_carrier as insurance_company,
                insurance_carrier,
                bipd_insurance_on_file_amount as liability_insurance_amount,
                bipd_insurance_on_file_amount as coverage_amount,
                policy_renewal_date as insurance_expiry_date,
                policy_renewal_date as insurance_expiry,
                policy_renewal_date as liability_insurance_date,
                policy_renewal_date,
                julianday(policy_renewal_date) - julianday('now') as days_until_expiry
            FROM carriers
            WHERE insurance_carrier IS NOT NULL
            AND insurance_carrier != ''
            AND insurance_carrier != 'Unknown'
            AND policy_renewal_date IS NOT NULL
            AND julianday(policy_renewal_date) - julianday('now') BETWEEN ? AND ?
        """

        params = [skip_days, days]

        if state:
            query += " AND state = ?"
            params.append(state.upper())

        if insurance_companies:
            companies = [c.strip() for c in insurance_companies.split(',')]
            company_conditions = []
            for company in companies:
                company_conditions.append("insurance_carrier LIKE ?")
                params.append(f"%{company}%")
            query += f" AND ({' OR '.join(company_conditions)})"

        if min_premium > 0:
            query += " AND CAST(bipd_insurance_on_file_amount AS INTEGER) >= ?"
            params.append(min_premium)

        query += f" ORDER BY days_until_expiry ASC LIMIT {limit}"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Convert to list of dicts
        leads = []
        for row in rows:
            lead = dict(row)
            # Ensure all expected fields are present
            lead['priority'] = 'high' if lead.get('days_until_expiry', 99) < 15 else 'medium'
            leads.append(lead)

        conn.close()

        logger.info(f"Retrieved {len(leads)} insurance leads (days {skip_days+1}-{days})")
        return leads

    except Exception as e:
        logger.error(f"Error getting insurance leads: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Vicidial endpoints
app.get("/api/vicidial/lists")(get_vicidial_lists)

@app.post("/api/vicidial/overwrite")
async def overwrite_list(
    background_tasks: BackgroundTasks,
    list_id: str,
    state: Optional[str] = None,
    insurance_company: Optional[str] = None,
    days_until_expiry: int = 30,
    skip_days: int = 0,
    limit: int = 5000
):
    """Upload leads to Vicidial with skip_days support"""
    return await overwrite_vicidial_list(
        background_tasks=background_tasks,
        list_id=list_id,
        state=state,
        insurance_company=insurance_company,
        days_until_expiry=days_until_expiry,
        skip_days=skip_days,
        limit=limit
    )

@app.get("/api/vicidial/test")
async def test_vicidial():
    """Test Vicidial connection"""
    try:
        # Test by trying to connect to Vicidial
        import requests
        VICIDIAL_URL = "https://204.13.233.29/vicidial"
        USERNAME = "888"
        PASSWORD = "vanguard8882024"

        session = requests.Session()
        session.verify = False

        # Try to get lists to test connection
        url = f"{VICIDIAL_URL}/non_agent_api.php"
        params = {
            'source': 'test',
            'user': USERNAME,
            'pass': PASSWORD,
            'function': 'list_info',
            'stage': 'ALL'
        }

        response = session.get(url, params=params, timeout=5)

        if response.status_code == 200:
            return {"connected": True, "message": "Vicidial connection successful"}
        else:
            return {"connected": False, "error": f"Vicidial returned status {response.status_code}"}
    except requests.exceptions.Timeout:
        return {"connected": False, "error": "Vicidial connection timeout"}
    except Exception as e:
        return {"connected": False, "error": str(e)}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "port": 8897}

@app.get("/health")
async def health_check():
    """Health check endpoint for upload.html status indicator"""
    return {"status": "healthy", "port": 8897}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle file uploads from the web interface"""
    try:
        # Create upload directory if it doesn't exist
        upload_dir = Path("/home/corp06/uploaded_files")
        upload_dir.mkdir(exist_ok=True)

        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(file.filename).suffix
        file_name_base = Path(file.filename).stem
        saved_filename = f"{file_name_base}_{timestamp}{file_extension}"
        file_path = upload_dir / saved_filename

        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logger.info(f"File uploaded successfully: {file_path}")

        # Check if it's a CSV file that might contain insurance data
        if file_extension.lower() in ['.csv', '.xlsx', '.xls']:
            logger.info(f"Detected potential data file: {saved_filename}")
            # Could add processing logic here to import into database

        return JSONResponse(
            status_code=200,
            content={
                "message": "File uploaded successfully",
                "filename": saved_filename,
                "path": str(file_path),
                "size": os.path.getsize(file_path)
            }
        )

    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

if __name__ == "__main__":
    print("=" * 60)
    print("FMCSA Insurance Lead Generation API")
    print("=" * 60)
    print(f"Database: {DB_PATH}")
    print("Starting server on http://localhost:8897")
    print("API Documentation: http://localhost:8897/docs")
    print("-" * 60)

    uvicorn.run(app, host="0.0.0.0", port=8897)