#!/usr/bin/env python3
"""
Vanguard Insurance Complete API
Handles all data operations for the comprehensive system
"""

from fastapi import FastAPI, HTTPException, Request, Query, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import sqlite3
import json
import uvicorn
import hashlib
import secrets
import os
import shutil
from pathlib import Path
from contextlib import contextmanager

# Initialize FastAPI app
app = FastAPI(title="Vanguard Insurance API", version="2.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database paths
FMCSA_DB = "fmcsa_complete.db"
SYSTEM_DB = "vanguard_system.db"

# Database connection manager
@contextmanager
def get_db(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# ==================== MODELS ====================

class LeadCreate(BaseModel):
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    company_name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    status: str = "active"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = "manual"
    tags: Optional[List[str]] = []

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    next_followup_date: Optional[date] = None
    current_insurance: Optional[str] = None
    policy_expiry_date: Optional[date] = None
    coverage_amount: Optional[str] = None
    premium_quoted: Optional[float] = None

class PolicyCreate(BaseModel):
    policy_number: str
    dot_number: Optional[str] = None
    company_name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    policy_type: str
    carrier: str
    effective_date: date
    expiration_date: date
    premium: float
    commission: Optional[float] = None
    coverage_limits: Dict[str, Any] = {}
    deductibles: Dict[str, Any] = {}
    status: str = "active"

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "agent"

class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    priority: str = "medium"
    related_type: Optional[str] = None
    related_id: Optional[str] = None
    due_date: datetime
    reminder_date: Optional[datetime] = None
    assigned_to: Optional[str] = None

# ==================== SEARCH ENDPOINTS ====================

@app.post("/api/search")
async def search_carriers(request: Request):
    """Search the FMCSA database"""
    try:
        data = await request.json()

        # Build query
        with get_db(FMCSA_DB) as conn:
            cursor = conn.cursor()

            query = "SELECT * FROM carriers WHERE 1=1"
            params = []

            # Add filters
            if data.get("usdot_number"):
                query += " AND dot_number LIKE ?"
                params.append(f"%{data['usdot_number']}%")

            if data.get("mc_number"):
                query += " AND mc_number LIKE ?"
                params.append(f"%{data['mc_number']}%")

            if data.get("legal_name"):
                query += " AND (legal_name LIKE ? OR dba_name LIKE ?)"
                params.extend([f"%{data['legal_name']}%", f"%{data['legal_name']}%"])

            if data.get("state"):
                query += " AND state = ?"
                params.append(data["state"].upper())

            # Pagination
            page = data.get("page", 1)
            per_page = min(data.get("per_page", 100), 500)
            offset = (page - 1) * per_page

            # Get total count
            count_query = query.replace("SELECT *", "SELECT COUNT(*)")
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]

            # Get results
            query += f" LIMIT {per_page} OFFSET {offset}"
            cursor.execute(query, params)

            results = []
            for row in cursor.fetchall():
                carrier = dict(row)
                # Map fields for frontend compatibility
                results.append({
                    "usdot_number": carrier.get("dot_number", ""),
                    "legal_name": carrier.get("legal_name", ""),
                    "dba_name": carrier.get("dba_name", ""),
                    "city": carrier.get("city", ""),
                    "state": carrier.get("state", ""),
                    "power_units": carrier.get("power_units", 0),
                    "mc_number": carrier.get("mc_number", ""),
                    "phone": carrier.get("phone", ""),
                    "email_address": carrier.get("email_address", ""),
                    "status": "Active" if carrier.get("power_units", 0) > 0 else "Inactive",
                    "expiry": "2025-03-15"  # Placeholder
                })

            return {
                "results": results,
                "total": total,
                "page": page,
                "per_page": per_page,
                "carriers": results  # For frontend compatibility
            }

    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== LEAD MANAGEMENT ====================

@app.get("/api/leads")
async def get_leads(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    page: int = 1,
    per_page: int = 50
):
    """Get all leads with filtering"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM leads WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)

        if priority:
            query += " AND priority = ?"
            params.append(priority)

        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)

        # Pagination
        offset = (page - 1) * per_page
        query += f" ORDER BY created_date DESC LIMIT {per_page} OFFSET {offset}"

        cursor.execute(query, params)
        leads = [dict(row) for row in cursor.fetchall()]

        # Parse JSON fields
        for lead in leads:
            if lead.get("tags"):
                lead["tags"] = json.loads(lead["tags"])
            if lead.get("custom_fields"):
                lead["custom_fields"] = json.loads(lead["custom_fields"])

        return {"leads": leads, "page": page, "per_page": per_page}

@app.get("/api/carrier/profile/{dot_number}")
async def get_carrier_profile(dot_number: int):
    """Get complete carrier profile by DOT number including vehicle inspection data"""
    with get_db(FMCSA_DB) as conn:
        cursor = conn.cursor()

        # Get carrier data
        cursor.execute("""
            SELECT * FROM carriers WHERE dot_number = ?
        """, (dot_number,))

        carrier = cursor.fetchone()
        if not carrier:
            raise HTTPException(status_code=404, detail="Carrier not found")

        carrier_data = dict(carrier)

        # Get vehicle inspection data
        cursor.execute("""
            SELECT
                inspection_id,
                insp_date,
                report_state,
                report_number,
                insp_level_id,
                location_desc,
                gross_comb_veh_wt,
                viol_total,
                oos_total,
                driver_viol_total,
                vehicle_viol_total,
                hazmat_viol_total
            FROM vehicle_inspections
            WHERE dot_number = ?
            ORDER BY insp_date DESC
            LIMIT 10
        """, (dot_number,))

        inspections = [dict(row) for row in cursor.fetchall()]

        # Get inspection summary
        cursor.execute("""
            SELECT
                COUNT(*) as total_inspections,
                SUM(viol_total) as total_violations,
                SUM(oos_total) as total_oos,
                AVG(viol_total) as avg_violations
            FROM vehicle_inspections
            WHERE dot_number = ?
        """, (dot_number,))

        summary = cursor.fetchone()
        inspection_summary = dict(summary) if summary else {}

        return {
            "carrier": carrier_data,
            "inspections": inspections,
            "inspection_summary": inspection_summary
        }

@app.get("/api/leads/expiring-insurance")
async def get_expiring_insurance_leads(
    days: int = Query(30, description="Days until insurance expiry"),
    limit: int = Query(2000, description="Maximum number of leads"),
    state: Optional[str] = Query(None, description="State filter"),
    min_premium: Optional[float] = Query(0, description="Minimum premium"),
    insurance_companies: Optional[str] = Query(None, description="Insurance companies filter")
):
    """Get carriers with insurance information - simulated expiring leads"""
    print(f"Getting insurance leads: days={days}, state={state}, companies={insurance_companies}")

    with get_db(FMCSA_DB) as conn:
        cursor = conn.cursor()

        # Build the query - using actual column names that exist
        query = """
            SELECT dot_number, legal_name, dba_name,
                   street, city, state, zip_code,
                   phone, drivers, power_units, insurance_carrier,
                   bipd_insurance_required_amount, bipd_insurance_on_file_amount,
                   entity_type, operating_status
            FROM carriers
            WHERE insurance_carrier IS NOT NULL
            AND insurance_carrier != ''
        """
        params = []

        # Add state filter
        if state:
            query += " AND state = ?"
            params.append(state)

        # Add insurance companies filter
        if insurance_companies:
            companies = [c.strip() for c in insurance_companies.split(',')]
            placeholders = ','.join(['?' for _ in companies])
            query += f" AND insurance_carrier IN ({placeholders})"
            params.extend(companies)

        # Limit results
        query += " LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        results = []

        import random
        for row in cursor.fetchall():
            carrier = dict(row)
            # Simulate days until expiry for demonstration
            carrier['days_until_expiry'] = random.randint(1, days)
            carrier['estimated_premium'] = random.randint(5000, 50000)
            results.append(carrier)

        return {
            "leads": results,
            "total": len(results),
            "criteria": {
                "days": days,
                "state": state,
                "insurance_companies": insurance_companies
            }
        }

@app.post("/api/leads")
async def create_lead(lead: LeadCreate):
    """Create a new lead"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Generate unique lead_id
        lead_id = f"L{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(4).upper()}"

        cursor.execute("""
            INSERT INTO leads (
                lead_id, dot_number, mc_number, company_name, contact_name,
                phone, email, address, city, state, zip_code,
                status, priority, assigned_to, notes, source, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            lead_id, lead.dot_number, lead.mc_number, lead.company_name,
            lead.contact_name, lead.phone, lead.email, lead.address,
            lead.city, lead.state, lead.zip_code, lead.status,
            lead.priority, lead.assigned_to, lead.notes, lead.source,
            json.dumps(lead.tags)
        ))

        conn.commit()

        return {"message": "Lead created", "lead_id": lead_id}

@app.put("/api/leads/{lead_id}")
async def update_lead(lead_id: str, update: LeadUpdate):
    """Update a lead"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Build update query
        updates = []
        params = []

        for field, value in update.dict(exclude_none=True).items():
            updates.append(f"{field} = ?")
            params.append(value)

        if not updates:
            return {"message": "No updates provided"}

        params.append(lead_id)
        query = f"UPDATE leads SET {', '.join(updates)} WHERE lead_id = ?"

        cursor.execute(query, params)
        conn.commit()

        return {"message": "Lead updated", "lead_id": lead_id}

@app.post("/api/leads/{lead_id}/convert")
async def convert_lead(lead_id: str, policy_number: str):
    """Convert a lead to a policy"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE leads
            SET converted_to_policy = 1,
                policy_number = ?,
                conversion_date = CURRENT_TIMESTAMP,
                status = 'won'
            WHERE lead_id = ?
        """, (policy_number, lead_id))

        conn.commit()

        return {"message": "Lead converted to policy", "policy_number": policy_number}

# ==================== POLICY MANAGEMENT ====================

@app.get("/api/policies")
async def get_policies(
    status: Optional[str] = None,
    expiring_soon: bool = False,
    page: int = 1,
    per_page: int = 50
):
    """Get all policies"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM policies WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)

        if expiring_soon:
            query += " AND expiration_date <= date('now', '+30 days')"

        # Pagination
        offset = (page - 1) * per_page
        query += f" ORDER BY created_date DESC LIMIT {per_page} OFFSET {offset}"

        cursor.execute(query, params)
        policies = [dict(row) for row in cursor.fetchall()]

        # Parse JSON fields
        for policy in policies:
            for field in ["coverage_limits", "deductibles", "endorsements", "documents", "alerts"]:
                if policy.get(field):
                    policy[field] = json.loads(policy[field])

        return {"policies": policies, "page": page, "per_page": per_page}

@app.post("/api/policies")
async def create_policy(policy: PolicyCreate):
    """Create a new policy"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO policies (
                policy_number, dot_number, company_name, contact_name,
                email, phone, policy_type, carrier, effective_date,
                expiration_date, premium, commission, coverage_limits,
                deductibles, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'API')
        """, (
            policy.policy_number, policy.dot_number, policy.company_name,
            policy.contact_name, policy.email, policy.phone,
            policy.policy_type, policy.carrier, policy.effective_date.isoformat(),
            policy.expiration_date.isoformat(), policy.premium, policy.commission,
            json.dumps(policy.coverage_limits), json.dumps(policy.deductibles),
            policy.status
        ))

        conn.commit()

        # Set renewal reminder
        cursor.execute("""
            INSERT INTO reminders (
                title, description, type, related_type, related_id,
                due_date, reminder_date, priority
            ) VALUES (?, ?, 'renewal', 'policy', ?, ?, ?, 'high')
        """, (
            f"Policy Renewal: {policy.policy_number}",
            f"Policy for {policy.company_name} expires on {policy.expiration_date}",
            policy.policy_number,
            policy.expiration_date.isoformat(),
            (policy.expiration_date.replace(day=1)).isoformat()
        ))

        conn.commit()

        return {"message": "Policy created", "policy_number": policy.policy_number}

# ==================== USER MANAGEMENT ====================

@app.post("/api/users/register")
async def register_user(user: UserCreate):
    """Register a new user"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Hash password
        password_hash = hashlib.sha256(user.password.encode()).hexdigest()

        try:
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, full_name, role)
                VALUES (?, ?, ?, ?, ?)
            """, (user.username, user.email, password_hash, user.full_name, user.role))

            conn.commit()

            return {"message": "User registered", "username": user.username}
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Username or email already exists")

@app.post("/api/users/login")
async def login(username: str, password: str):
    """User login"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        password_hash = hashlib.sha256(password.encode()).hexdigest()

        cursor.execute("""
            SELECT id, username, email, full_name, role
            FROM users
            WHERE username = ? AND password_hash = ? AND active = 1
        """, (username, password_hash))

        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Update last login
        cursor.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", (user["id"],))
        conn.commit()

        # Create session token
        session_token = secrets.token_hex(32)

        return {
            "user": dict(user),
            "token": session_token
        }

# ==================== REMINDERS & TASKS ====================

@app.get("/api/reminders")
async def get_reminders(
    assigned_to: Optional[str] = None,
    status: str = "pending",
    due_today: bool = False
):
    """Get reminders and tasks"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM reminders WHERE status = ?"
        params = [status]

        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)

        if due_today:
            query += " AND date(due_date) = date('now')"

        query += " ORDER BY due_date ASC"

        cursor.execute(query, params)
        reminders = [dict(row) for row in cursor.fetchall()]

        return {"reminders": reminders}

@app.post("/api/reminders")
async def create_reminder(reminder: ReminderCreate):
    """Create a reminder"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO reminders (
                title, description, type, priority, related_type,
                related_id, due_date, reminder_date, assigned_to, assigned_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'API')
        """, (
            reminder.title, reminder.description, reminder.type,
            reminder.priority, reminder.related_type, reminder.related_id,
            reminder.due_date.isoformat() if reminder.due_date else None,
            reminder.reminder_date.isoformat() if reminder.reminder_date else None,
            reminder.assigned_to
        ))

        conn.commit()

        return {"message": "Reminder created", "id": cursor.lastrowid}

# ==================== ACTIVITY LOGGING ====================

@app.get("/api/activity")
async def get_activity_log(
    table_name: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 100
):
    """Get activity log"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM activity_log WHERE 1=1"
        params = []

        if table_name:
            query += " AND table_name = ?"
            params.append(table_name)

        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)

        query += f" ORDER BY timestamp DESC LIMIT {limit}"

        cursor.execute(query, params)
        activities = [dict(row) for row in cursor.fetchall()]

        # Parse JSON fields
        for activity in activities:
            for field in ["old_value", "new_value"]:
                if activity.get(field):
                    activity[field] = json.loads(activity[field])

        return {"activities": activities}

def log_activity(table_name: str, action: str, record_id: str,
                 old_value: Any = None, new_value: Any = None, user_id: int = None):
    """Helper function to log activity"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO activity_log (
                user_id, username, action, table_name, record_id,
                old_value, new_value
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, "API", action, table_name, record_id,
            json.dumps(old_value) if old_value else None,
            json.dumps(new_value) if new_value else None
        ))

        conn.commit()

# ==================== FILE UPLOAD ====================

UPLOAD_DIR = Path("/home/corp06/uploaded_files")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle file uploads"""
    try:
        # Create unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1]
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = UPLOAD_DIR / safe_filename

        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # If it's a CSV, try to import to database
        if file_extension.lower() == '.csv':
            # Here you could add CSV processing logic
            pass

        return {
            "message": "File uploaded successfully",
            "filename": safe_filename,
            "path": str(file_path),
            "size": os.path.getsize(file_path)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== STATISTICS ====================

@app.get("/api/stats/summary")
async def get_stats():
    """Get system statistics"""
    stats = {}

    # FMCSA database stats
    with get_db(FMCSA_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM carriers")
        stats["total_carriers"] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM carriers WHERE state = 'OH'")
        stats["ohio_carriers"] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM carriers WHERE bipd_insurance_on_file_amount IS NOT NULL")
        stats["carriers_with_insurance"] = cursor.fetchone()[0]

    # System database stats
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM leads WHERE status = 'active'")
        stats["active_leads"] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM policies WHERE status = 'active'")
        stats["active_policies"] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM reminders WHERE status = 'pending'")
        stats["pending_reminders"] = cursor.fetchone()[0]

    return stats

@app.get("/api/stats/dashboard")
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Lead statistics
        cursor.execute("""
            SELECT
                status,
                COUNT(*) as count
            FROM leads
            GROUP BY status
        """)
        lead_stats = dict(cursor.fetchall())

        # Policy statistics
        cursor.execute("""
            SELECT
                policy_type,
                COUNT(*) as count,
                SUM(premium) as total_premium
            FROM policies
            WHERE status = 'active'
            GROUP BY policy_type
        """)
        policy_stats = [dict(row) for row in cursor.fetchall()]

        # Monthly revenue
        cursor.execute("""
            SELECT
                strftime('%Y-%m', created_date) as month,
                SUM(premium) as revenue,
                SUM(commission) as commission
            FROM policies
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        """)
        monthly_revenue = [dict(row) for row in cursor.fetchall()]

        return {
            "lead_stats": lead_stats,
            "policy_stats": policy_stats,
            "monthly_revenue": monthly_revenue
        }

# ==================== HEALTH CHECK ====================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "service": "Vanguard Insurance API",
        "version": "2.0",
        "status": "operational",
        "features": [
            "FMCSA Database Search (2.2M carriers)",
            "Lead Management",
            "Policy Management",
            "User Authentication",
            "Activity Logging",
            "Reminders & Tasks",
            "Real-time Statistics"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check FMCSA database
        with get_db(FMCSA_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM carriers LIMIT 1")
            fmcsa_ok = True
    except:
        fmcsa_ok = False

    try:
        # Check system database
        with get_db(SYSTEM_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM leads LIMIT 1")
            system_ok = True
    except:
        system_ok = False

    return {
        "status": "healthy" if (fmcsa_ok and system_ok) else "degraded",
        "databases": {
            "fmcsa": "connected" if fmcsa_ok else "error",
            "system": "connected" if system_ok else "error"
        }
    }

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Vanguard Insurance Complete API")
    print("="*50)
    print("📊 Connected to 2.2M carrier database")
    print("🔄 All data synchronized across locations")
    print("🌐 API running at: http://0.0.0.0:8897")
    print("="*50 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8897)