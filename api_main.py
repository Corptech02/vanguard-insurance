#!/usr/bin/env python3
"""
Minimal FastAPI app for Render deployment
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import random

app = FastAPI(title="Vanguard Insurance API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Vanguard Insurance API",
        "version": "minimal",
        "note": "Database functionality temporarily disabled for deployment testing"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/test")
async def test():
    return {
        "status": "ok",
        "message": "API is running",
        "database": "Not connected (deployment test mode)"
    }

from fastapi import Request

@app.post("/api/search")
async def search_carriers(request: Request):
    """
    Search endpoint that returns mock carrier data for now.
    Will be connected to real database later.
    """
    # Parse request body
    try:
        body = await request.json()
    except:
        body = {}

    # Generate mock carrier data
    carriers = []
    insurance_companies = [
        "Progressive", "State Farm", "GEICO", "Allstate", "Liberty Mutual",
        "Farmers", "Nationwide", "Travelers", "American Family", "USAA"
    ]

    states = ["TX", "FL", "CA", "NY", "IL", "PA", "OH", "GA", "NC", "MI"]

    # Generate 10-50 mock results
    num_results = random.randint(10, 50)

    for i in range(num_results):
        # Generate random dates for insurance expiry
        days_until_expiry = random.randint(1, 90)
        expiry_date = datetime.now() + timedelta(days=days_until_expiry)

        carrier = {
            "dot_number": str(random.randint(1000000, 9999999)),
            "legal_name": f"Sample Carrier {i+1} LLC",
            "dba_name": f"Carrier {i+1}",
            "physical_address": f"{random.randint(100, 9999)} Main St",
            "physical_city": f"City {i+1}",
            "physical_state": random.choice(states),
            "physical_zip": str(random.randint(10000, 99999)),
            "phone": f"({random.randint(200, 999)}) {random.randint(100, 999)}-{random.randint(1000, 9999)}",
            "email": f"contact{i+1}@carrier.com",
            "mc_number": str(random.randint(100000, 999999)),
            "power_units": random.randint(1, 100),
            "drivers": random.randint(1, 50),
            "insurance_company": random.choice(insurance_companies),
            "coverage_amount": f"${random.randint(750, 2000) * 1000:,}",
            "policy_renewal_date": expiry_date.strftime("%Y-%m-%d"),
            "days_until_expiry": days_until_expiry,
            "insurance_expiry_date": expiry_date.strftime("%Y-%m-%d"),
            "insurance_expiry": expiry_date.strftime("%Y-%m-%d")
        }
        carriers.append(carrier)

    # Sort by days until expiry
    carriers.sort(key=lambda x: x['days_until_expiry'])

    return {
        "success": True,
        "data": carriers,
        "total": len(carriers),
        "page": 1,
        "message": "Mock data - Database connection pending"
    }

@app.get("/api/stats/summary")
async def get_stats():
    """Return mock statistics for dashboard"""
    return {
        "total_carriers": 2200000,
        "carriers_with_insurance": 1850000,
        "expiring_30_days": 45678,
        "expiring_60_days": 89012,
        "expiring_90_days": 134567,
        "last_updated": datetime.now().isoformat()
    }

@app.get("/api/leads/expiring-insurance")
async def get_expiring_leads(days: int = 30, limit: int = 100, state: str = None):
    """Get carriers with expiring insurance"""
    # For now, return empty array
    return []

@app.get("/api/all-data")
async def get_all_data():
    """Return all data for sync - mock implementation"""
    return {
        "clients": [],
        "policies": [],
        "quotes": [],
        "notes": [],
        "reminders": [],
        "emails": [],
        "documents": []
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)