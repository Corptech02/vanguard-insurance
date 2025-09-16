# Setting Up Cloudflare Subdomains for Vanguard Insurance

## Step 1: Update Cloudflare Tunnel Configuration

The cloudflared service needs to be updated to route the new subdomains.

### On your server (requires sudo):

```bash
# 1. Back up existing configuration
sudo cp /etc/cloudflared/config.yml /etc/cloudflared/config.yml.backup

# 2. Update the configuration
sudo nano /etc/cloudflared/config.yml
```

Replace the content with:
```yaml
tunnel: 7b2f846a-8030-4cb9-91d3-db51a1fd85d5
credentials-file: /etc/cloudflared/7b2f846a-8030-4cb9-91d3-db51a1fd85d5.json

ingress:
  # Vanguard Insurance System
  - hostname: vanguard.vigagency.com
    service: http://localhost:80
  - hostname: api.vigagency.com
    service: http://localhost:8897

  # Original vigagency.com site
  - hostname: vigagency.com
    service: http://localhost:80
  - hostname: www.vigagency.com
    service: http://localhost:80

  # Catch-all
  - service: http_status:404
```

```bash
# 3. Restart cloudflared service
sudo systemctl restart cloudflared

# 4. Check status
sudo systemctl status cloudflared
```

## Step 2: Add DNS Records in Cloudflare Dashboard

Go to https://dash.cloudflare.com and add these DNS records:

1. **For Vanguard Frontend:**
   - Type: CNAME
   - Name: vanguard
   - Target: 7b2f846a-8030-4cb9-91d3-db51a1fd85d5.cfargotunnel.com
   - Proxy status: Proxied (orange cloud)

2. **For API:**
   - Type: CNAME
   - Name: api
   - Target: 7b2f846a-8030-4cb9-91d3-db51a1fd85d5.cfargotunnel.com
   - Proxy status: Proxied (orange cloud)

## Step 3: Update Frontend Configuration

Once DNS propagates (usually instant with Cloudflare), update the frontend to use the new API URL:

```javascript
// In your browser console at https://vanguard.vigagency.com
localStorage.setItem('VANGUARD_API_URL', 'https://api.vigagency.com');
location.reload();
```

## Result

You'll have:
- **Frontend:** https://vanguard.vigagency.com
- **API:** https://api.vigagency.com
- Both using HTTPS with valid SSL certificates
- Stable, permanent URLs
- Full access to the 2.2M carrier database

## Note
Your existing vigagency.com site remains unchanged and continues to work as before.