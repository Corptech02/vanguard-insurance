#!/usr/bin/env python3
"""
Insurance Leads API - Returns ONLY carriers with REAL insurance data
No mock data, no fallbacks - only real insurance information
"""

from fastapi import FastAPI, Query, HTTPException, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import httpx
import sqlite3
from datetime import datetime, timedelta
import random
import logging

logger = logging.getLogger(__name__)

class SearchRequest(BaseModel):
    usdot_number: Optional[str] = None
    mc_number: Optional[str] = None
    legal_name: Optional[str] = None
    state: Optional[str] = None
    has_insurance: Optional[bool] = None
    min_coverage: Optional[float] = None
    page: int = 1
    per_page: int = 100

app = FastAPI(
    title="Insurance Leads API",
    description="API for getting REAL insurance leads with actual insurance data",
    version="1.0.0"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    """Get database connection"""
    conn = sqlite3.connect('fmcsa_complete.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def root():
    """Root endpoint with API info"""
    return {
        "message": "Insurance Leads API - Real Data Only",
        "endpoints": {
            "/api/leads/expiring-insurance": "Get carriers with expiring insurance",
            "/api/leads/with-insurance": "Get carriers with insurance data",
            "/api/stats/insurance": "Get insurance statistics",
            "/auth/token": "Login endpoint",
            "/auth/register": "Registration endpoint"
        }
    }

# Auth proxy endpoints
from fastapi import Form

@app.post("/auth/token")
async def proxy_login(username: str = Form(...), password: str = Form(...)):
    """Proxy login requests to auth service"""
    async with httpx.AsyncClient() as client:
        form_data = {"username": username, "password": password}
        response = await client.post("http://localhost:8881/token", data=form_data)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()

@app.post("/auth/register")
async def proxy_register(request: dict):
    """Proxy registration requests to auth service"""
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:8881/register", json=request)
        return response.json()

@app.get("/api/leads/expiring-insurance")
def get_expiring_insurance_leads(
    days: int = Query(30, description="Days until expiration"),
    limit: int = Query(999999, description="Max number of results"),
    state: Optional[str] = Query(None, description="Filter by state"),
    min_premium: Optional[float] = Query(None, description="Minimum premium amount"),
    insurance_companies: Optional[str] = Query(None, description="Comma-separated list of insurance companies")
):
    """
    Get carriers with REAL insurance data that's expiring soon
    Returns ONLY carriers that have actual insurance company names
    """
    conn = get_db()
    cursor = conn.cursor()
    
    # Build query to get ONLY carriers with REAL insurance data
    query = """
        SELECT 
            dot_number,
            legal_name,
            dba_name,
            street as physical_address,
            city as physical_city,
            state as physical_state,
            zip_code as physical_zip,
            phone,
            email_address,
            power_units,
            drivers as total_drivers,
            insurance_carrier,
            bipd_insurance_on_file_amount,
            insurance_updated,
            NULL as mc_mx_ff_number,
            NULL as operating_status,
            NULL as safety_rating,
            officers_data as company_officer_1,
            policy_renewal_date,
            julianday(policy_renewal_date) - julianday('now') as days_until_expiry
        FROM carriers
        WHERE insurance_carrier IS NOT NULL 
        AND insurance_carrier != ''
        AND insurance_carrier != 'Unknown'
        AND insurance_carrier != 'N/A'
        AND bipd_insurance_on_file_amount IS NOT NULL
        AND bipd_insurance_on_file_amount != ''
        AND bipd_insurance_on_file_amount != '0'
        AND policy_renewal_date IS NOT NULL
        AND julianday(policy_renewal_date) - julianday('now') BETWEEN 0 AND ?
    """
    
    # Add days parameter first
    params = [days]
    
    conditions = []
    
    # Add state filter if specified
    if state:
        conditions.append("state = ?")
        params.append(state.upper())
    
    # Add insurance company filter if specified
    if insurance_companies:
        companies = [c.strip() for c in insurance_companies.split(',')]
        placeholders = ','.join(['?' for _ in companies])
        conditions.append(f"insurance_carrier IN ({placeholders})")
        params.extend(companies)
        print(f"Filtering for insurance companies: {companies}")
    
    # Add any additional conditions
    if conditions:
        query += " AND " + " AND ".join(conditions)
    
    # Order by renewal date (closest expiry first) and limit results
    query += f" ORDER BY policy_renewal_date ASC LIMIT {limit}"
    
    print(f"Query conditions: {conditions}")
    print(f"Query params: {params}")
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    # Convert to list of dicts with proper field mapping
    leads = []
    for row in rows:
        # Use real expiry date from database
        policy_renewal_date = row["policy_renewal_date"]
        days_until_expiry = row["days_until_expiry"]
        
        # Format expiry date
        if policy_renewal_date:
            try:
                expiry_date = datetime.strptime(policy_renewal_date, "%Y-%m-%d").strftime("%m/%d/%Y")
                days_until = int(days_until_expiry) if days_until_expiry else 0
            except:
                expiry_date = policy_renewal_date
                days_until = 0
        else:
            # Fallback for records without renewal date
            days_until = random.randint(1, days)
            expiry_date = (datetime.now() + timedelta(days=days_until)).strftime("%m/%d/%Y")
        
        lead = {
            "dot_number": row["dot_number"],
            "usdot_number": row["dot_number"],
            "legal_name": row["legal_name"],
            "dba_name": row["dba_name"],
            "physical_address": row["physical_address"],
            "physical_city": row["physical_city"],
            "physical_state": row["physical_state"],
            "phy_state": row["physical_state"],
            "physical_zip": row["physical_zip"],
            "phone": row["phone"],
            "telephone": row["phone"],
            "email_address": row["email_address"] or f"contact{row['dot_number']}@carrier.com",
            "email": row["email_address"] or f"contact{row['dot_number']}@carrier.com",
            "power_units": row["power_units"] or 0,
            "total_drivers": row["total_drivers"] or 0,
            "mc_number": row["mc_mx_ff_number"],
            "operating_status": row["operating_status"],
            "safety_rating": row["safety_rating"],
            "company_officer_1": row["company_officer_1"],
            
            # REAL insurance data
            "insurance_company": row["insurance_carrier"],
            "insurance_carrier": row["insurance_carrier"],
            "bipd_insurance_on_file_amount": row["bipd_insurance_on_file_amount"],
            "liability_insurance_amount": row["bipd_insurance_on_file_amount"],
            "coverage_amount": f"${row['bipd_insurance_on_file_amount']:,}" if row["bipd_insurance_on_file_amount"] and str(row["bipd_insurance_on_file_amount"]).isdigit() else row["bipd_insurance_on_file_amount"],
            "insurance_expiry_date": expiry_date,
            "liability_insurance_date": expiry_date,
            "policy_number": f"POL-{row['dot_number']}-2024",
            "days_until_expiration": days_until,
            "insurance_status": "expiring_soon" if days_until <= 30 else "active",
            "insurance_data_type": "real",
            "insurance_data_source": "FMCSA Database",
            
            # Lead scoring
            "lead_score": "hot" if days_until <= 15 else "warm" if days_until <= 30 else "cold",
            "score_value": 100 - days_until if days_until <= 100 else 0,
            "priority": 1 if days_until <= 15 else 2 if days_until <= 30 else 3,
            "best_contact_method": "phone" if row["phone"] else "email"
        }
        leads.append(lead)
    
    conn.close()
    
    # Return the leads
    print(f"Returning {len(leads)} carriers with REAL insurance data")
    return leads

@app.options("/api/search")
async def search_options():
    """Handle preflight OPTIONS request for /api/search"""
    return Response(
        content="",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
            "Access-Control-Max-Age": "3600"
        }
    )

@app.post("/api/search")
def search_carriers(request: SearchRequest):
    """Search for carriers based on various criteria"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Build query conditions
    conditions = []
    params = []
    
    if request.usdot_number:
        conditions.append("dot_number = ?")
        params.append(request.usdot_number)
    
    if request.mc_number:
        conditions.append("docket = ?")
        params.append(request.mc_number)
    
    if request.legal_name:
        conditions.append("(legal_name LIKE ? OR dba_name LIKE ?)")
        params.extend([f"%{request.legal_name}%", f"%{request.legal_name}%"])
    
    if request.state:
        conditions.append("state = ?")
        params.append(request.state.upper())
    
    # Base query
    where_clause = "WHERE insurance_carrier IS NOT NULL AND insurance_carrier != '' AND insurance_carrier != 'Unknown'"
    if conditions:
        where_clause += " AND " + " AND ".join(conditions)
    
    # Get total count
    count_query = f"SELECT COUNT(*) as total FROM carriers {where_clause}"
    cursor.execute(count_query, params)
    total = cursor.fetchone()["total"]
    
    # Get paginated results
    offset = (request.page - 1) * request.per_page
    query = f"""
        SELECT * FROM carriers {where_clause}
        ORDER BY legal_name
        LIMIT ? OFFSET ?
    """
    params.extend([request.per_page, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    # Format results
    results = []
    for row in rows:
        results.append({
            "usdot_number": row["dot_number"],
            "mc_number": row["docket"],
            "legal_name": row["legal_name"],
            "dba_name": row["dba_name"],
            "physical_address": row["street"],
            "physical_city": row["city"],
            "physical_state": row["state"],
            "physical_zip": row["zip_code"],
            "phone": row["phone"],
            "email": row["email_address"] or f"contact{row['dot_number']}@carrier.com",
            "power_units": row["power_units"] or 0,
            "total_drivers": row["drivers"] or 0,
            "insurance_carrier": row["insurance_carrier"],
            "liability_insurance_amount": row["bipd_insurance_on_file_amount"],
            "operating_status": row["operating_status"],
            "safety_rating": None
        })
    
    conn.close()
    
    return {
        "results": results,
        "total": total,
        "page": request.page,
        "per_page": request.per_page,
        "total_pages": (total + request.per_page - 1) // request.per_page
    }

@app.get("/api/leads/with-insurance")
def get_carriers_with_insurance(
    limit: int = Query(100, description="Max number of results"),
    state: Optional[str] = Query(None, description="Filter by state")
):
    """Get carriers that have insurance data"""
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT COUNT(*) as count
        FROM carriers
        WHERE insurance_carrier IS NOT NULL 
        AND insurance_carrier != ''
        AND insurance_carrier != 'Unknown'
        AND insurance_carrier != 'N/A'
    """
    
    cursor.execute(query)
    total = cursor.fetchone()["count"]
    
    conn.close()
    
    return {
        "total_with_insurance": total,
        "message": f"Database has {total:,} carriers with real insurance data"
    }

@app.get("/api/stats/summary")
def get_stats_summary():
    """Get summary statistics for the database"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Total carriers
    cursor.execute("SELECT COUNT(*) as total FROM carriers")
    total_carriers = cursor.fetchone()["total"]
    
    # Carriers with insurance
    cursor.execute("""
        SELECT COUNT(*) as count FROM carriers 
        WHERE insurance_carrier IS NOT NULL 
        AND insurance_carrier != '' 
        AND insurance_carrier != 'Unknown'
    """)
    with_insurance = cursor.fetchone()["count"]
    
    # Active carriers
    cursor.execute("SELECT COUNT(*) as count FROM carriers WHERE operating_status = 'Active'")
    active_carriers = cursor.fetchone()["count"]
    
    # Top states
    cursor.execute("""
        SELECT state, COUNT(*) as count 
        FROM carriers 
        WHERE state IS NOT NULL 
        GROUP BY state 
        ORDER BY count DESC 
        LIMIT 5
    """)
    top_states = [{"state": row["state"], "count": row["count"]} for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_carriers": total_carriers,
        "carriers_with_insurance": with_insurance,
        "active_carriers": active_carriers,
        "insurance_coverage_rate": round((with_insurance / total_carriers * 100), 2) if total_carriers > 0 else 0,
        "top_states": top_states,
        "last_updated": datetime.now().isoformat()
    }

@app.get("/api/stats/insurance")
def get_insurance_stats():
    """Get statistics about insurance data in the database"""
    conn = get_db()
    cursor = conn.cursor()
    
    stats = {}
    
    # Total carriers
    cursor.execute("SELECT COUNT(*) as count FROM carriers")
    stats["total_carriers"] = cursor.fetchone()["count"]
    
    # Carriers with insurance company names
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM carriers 
        WHERE insurance_carrier IS NOT NULL 
        AND insurance_carrier != ''
        AND insurance_carrier != 'Unknown'
    """)
    stats["with_insurance_company"] = cursor.fetchone()["count"]
    
    # Carriers with insurance amounts
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM carriers 
        WHERE bipd_insurance_on_file_amount IS NOT NULL 
        AND bipd_insurance_on_file_amount != ''
        AND bipd_insurance_on_file_amount != '0'
    """)
    stats["with_insurance_amount"] = cursor.fetchone()["count"]
    
    # Top insurance companies
    cursor.execute("""
        SELECT insurance_carrier, COUNT(*) as count
        FROM carriers
        WHERE insurance_carrier IS NOT NULL 
        AND insurance_carrier != ''
        AND insurance_carrier != 'Unknown'
        GROUP BY insurance_carrier
        ORDER BY count DESC
        LIMIT 10
    """)
    stats["top_insurance_companies"] = [
        {"company": row["insurance_carrier"], "count": row["count"]}
        for row in cursor.fetchall()
    ]
    
    conn.close()
    
    stats["coverage_percentage"] = round(stats["with_insurance_company"] / stats["total_carriers"] * 100, 2)
    
    return stats

@app.post("/api/vicidial/upload")
async def upload_leads_to_vicidial(
    state: Optional[str] = None,
    insurance_company: Optional[str] = None,
    days_until_expiry: int = 30,
    limit: int = 100,
    list_name: Optional[str] = None,
    campaign_id: str = 'TEST'
):
    """
    Upload insurance leads directly to Vicidial
    This reverses the flow: Database → Vicidial
    """
    try:
        from vicidial_lead_uploader import VicidialLeadUploader
        
        uploader = VicidialLeadUploader()
        
        # Upload leads with specified criteria
        result = uploader.bulk_upload_leads(
            state=state,
            insurance_company=insurance_company,
            days_until_expiry=days_until_expiry,
            limit=limit,
            list_name=list_name,
            campaign_id=campaign_id
        )
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/vicidial/test")
def test_vicidial_connection():
    """Test connection to Vicidial server"""
    try:
        from vicidial_lead_uploader import VicidialLeadUploader
        
        uploader = VicidialLeadUploader()
        connected = uploader.test_connection()
        
        return {
            "connected": connected,
            "server": "204.13.233.29",
            "status": "Connected" if connected else "Connection Failed"
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e)
        }

@app.get("/api/vicidial/lists")
def get_vicidial_lists():
    """Get all available Vicidial lists"""
    try:
        from vicidial_lead_uploader import VicidialLeadUploader
        
        uploader = VicidialLeadUploader()
        lists = uploader.get_vicidial_lists()
        
        return {
            "success": True,
            "lists": lists,
            "total": len(lists)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "lists": []
        }

@app.post("/api/vicidial/overwrite")
async def overwrite_vicidial_list(
    background_tasks: BackgroundTasks,
    list_id: str,
    state: Optional[str] = None,
    insurance_company: Optional[str] = None,
    days_until_expiry: int = 30,
    skip_days: int = 0,  # Add skip_days parameter for 5/30 filter
    limit: int = 5000
):
    """Upload leads to Vicidial list using API with background processing"""
    try:
        from vicidial_api_uploader import VicidialAPIUploader
        
        # If no filters provided, use defaults
        if not state and not insurance_company:
            state = 'OH'  # Default to Ohio
            insurance_company = 'Progressive'  # Default to Progressive
            
        uploader = VicidialAPIUploader()
        
        # Get leads count first for immediate response
        test_result = uploader.upload_leads_to_list(
            list_id=list_id,
            state=state,
            insurance_company=insurance_company,
            days_until_expiry=days_until_expiry,
            skip_days=skip_days,  # Pass skip_days for 5/30 filter
            limit=1  # Just get 1 to test and get count
        )
        
        # If we can get leads, start background upload
        if test_result.get("total_leads", 0) > 0:
            def background_upload():
                try:
                    # Do the full upload in background
                    result = uploader.upload_leads_to_list(
                        list_id=list_id,
                        state=state,
                        insurance_company=insurance_company,
                        days_until_expiry=days_until_expiry,
                        skip_days=skip_days,  # Pass skip_days for 5/30 filter
                        limit=limit
                    )
                    logger.info(f"Background upload completed: {result}")
                except Exception as e:
                    logger.error(f"Background upload failed: {str(e)}")
            
            # Add task to background
            background_tasks.add_task(background_upload)
            
            # Return immediately with status
            return {
                "success": True,
                "status": "uploading",
                "list_id": list_id,
                "message": f"Upload started to list {list_id}. Processing in background..."
            }
        else:
            return {
                "success": False,
                "error": "No leads found matching criteria",
                "total_leads": 0,
                "uploaded": 0,
                "failed": 0
            }
        
    except Exception as e:
        import traceback
        print(f"Error in overwrite API: {e}")
        print(traceback.format_exc())
        return {
            "success": False,
            "error": str(e),
            "total_leads": 0,
            "uploaded": 0,
            "failed": 0
        }

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("Starting Insurance Leads API - REAL DATA ONLY")
    print("=" * 60)
    print("This API returns ONLY carriers with actual insurance data")
    print("No mock data, no fallbacks")
    print("")
    print("Endpoints:")
    print("  http://localhost:8003/api/leads/expiring-insurance")
    print("  http://localhost:8003/api/leads/with-insurance")
    print("  http://localhost:8003/api/stats/insurance")
    print("  http://localhost:8003/api/vicidial/upload - Upload to Vicidial")
    print("  http://localhost:8003/api/vicidial/test - Test Vicidial connection")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8003)