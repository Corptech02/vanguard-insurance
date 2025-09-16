#!/bin/bash

echo "========================================"
echo "    VANGUARD INSURANCE SYSTEM          "
echo "========================================"
echo ""

# Kill any existing processes
echo "🛑 Stopping any existing services..."
pkill -f "python.*api_main.py" 2>/dev/null
pkill -f "python.*api_complete.py" 2>/dev/null
pkill -f localtunnel 2>/dev/null
pkill ngrok 2>/dev/null
sleep 2

# Check if databases exist
if [ ! -f "fmcsa_complete.db" ]; then
    echo "❌ ERROR: fmcsa_complete.db not found!"
    echo "Please ensure the FMCSA database is in this directory"
    exit 1
fi

if [ ! -f "vanguard_system.db" ]; then
    echo "📊 Creating Vanguard system database..."
    /home/corp06/DB-system/venv_linux/bin/python3 create_vanguard_database.py
fi

# Start the API
echo ""
echo "🚀 Starting Vanguard Insurance API..."
/home/corp06/DB-system/venv_linux/bin/python3 api_main.py &
API_PID=$!
sleep 3

# Check if API started
if ps -p $API_PID > /dev/null; then
    echo "✅ API running on http://localhost:8897"
else
    echo "❌ Failed to start API"
    exit 1
fi

# Start localtunnel
echo ""
echo "🌐 Exposing API to the internet..."
npx localtunnel --port 8897 --subdomain vanguard-insurance-api &
TUNNEL_PID=$!
sleep 5

# Display status
echo ""
echo "========================================"
echo "    SYSTEM STATUS                      "
echo "========================================"
echo "✅ API Status: RUNNING (PID: $API_PID)"
echo "✅ Tunnel Status: RUNNING (PID: $TUNNEL_PID)"
echo ""
echo "📊 Database Statistics:"
curl -s http://localhost:8897/api/stats/summary 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'   Total Carriers: {data[\"total_carriers\"]:,}')
print(f'   Ohio Carriers: {data[\"ohio_carriers\"]:,}')
print(f'   Active Leads: {data[\"active_leads\"]}')
print(f'   Active Policies: {data[\"active_policies\"]}')
"
echo ""
echo "========================================"
echo "    ACCESS POINTS                      "
echo "========================================"
echo "🌐 Frontend: https://corptech02.github.io/vanguard-insurance/"
echo "🔗 API Local: http://localhost:8897"
echo "🌍 API Public: https://vanguard-insurance-api.loca.lt"
echo ""
echo "========================================"
echo "    AVAILABLE ENDPOINTS                "
echo "========================================"
echo "📍 /api/search - Search 2.2M carriers"
echo "📍 /api/leads - Lead management"
echo "📍 /api/policies - Policy management"
echo "📍 /api/users - User authentication"
echo "📍 /api/reminders - Tasks & reminders"
echo "📍 /api/stats/summary - System statistics"
echo "📍 /api/stats/dashboard - Dashboard data"
echo ""
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
trap "echo ''; echo 'Shutting down...'; kill $API_PID $TUNNEL_PID 2>/dev/null; exit" INT TERM
wait