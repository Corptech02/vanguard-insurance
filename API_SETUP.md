# Vanguard Insurance API Setup

## For Remote Access (Different Network)

Since you're accessing from a different network than the server, you need to set up a tunnel URL.

### Quick Setup:

1. **Get a tunnel URL from your admin** (they need to run one of these on the server):
   - `ngrok http 8897` (requires account)
   - `cloudflared tunnel --url http://localhost:8897` (free, temporary)
   - `npx localtunnel --port 8897` (free, may require browser auth)

2. **Once you have the tunnel URL** (like `https://something.ngrok.io`), open your browser console (F12) and run:
```javascript
localStorage.setItem('VANGUARD_API_URL', 'https://YOUR-TUNNEL-URL-HERE');
location.reload();
```

3. **That's it!** The system will now connect to the database through the tunnel.

## For Local Network Access

If you're on the same network as the server:
- Access: **http://192.168.40.232**
- Everything works automatically!

## Current Status

- **Frontend:** https://corptech02.github.io/vanguard-insurance/
- **Backend API:** Running on port 8897
- **Database:** 2.2M carriers ready
- **Domain:** vigagency.com (separate, not affected)

## Technical Details

The system consists of:
- Frontend on GitHub Pages (HTTPS)
- Backend API with 2.2M carrier database (HTTP)
- Browser security prevents HTTPS→HTTP connections
- Solution: Use HTTPS tunnel to expose the API

The tunnel does NOT affect your vigagency.com domain - it's just a temporary bridge for the API.