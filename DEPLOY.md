# Vanguard Insurance Platform - Cloud Deployment Guide

## Quick Deployment to Render (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add cloud deployment configuration"
git push origin main
```

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub account and select `vanguard-insurance-github` repository
4. Configure the service:
   - **Name**: vanguard-insurance-api
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api_main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free tier (or upgrade as needed)

5. Add Environment Variables:
   - Click "Environment" tab
   - Add these variables:
     ```
     VICIDIAL_URL=https://204.13.233.29/vicidial
     VICIDIAL_USER=888
     VICIDIAL_PASS=vanguard8882024
     ```

6. Deploy!

### Step 3: Deploy Backend Service

1. Create another new Web Service on Render
2. Select the same repository
3. Configure:
   - **Name**: vanguard-backend
   - **Environment**: Node
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 4: Update Frontend with New URLs

Once deployed, Render will provide URLs like:
- API: `https://vanguard-insurance-api.onrender.com`
- Backend: `https://vanguard-backend.onrender.com`

Update the JavaScript files with these permanent URLs.

## Alternative: Railway.app Deployment

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login and Initialize
```bash
railway login
railway init
```

### Step 3: Deploy
```bash
railway up
```

Railway will automatically:
- Detect Python/Node.js environments
- Install dependencies
- Provision database if needed
- Provide HTTPS URLs

## Alternative: Deploy to DigitalOcean App Platform

### Using DigitalOcean CLI:
```bash
doctl apps create --spec .do/app.yaml
```

### Or via Web Interface:
1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Click "Create" → "Apps"
3. Connect GitHub repository
4. Auto-configure from repository
5. Deploy

## Database Handling

Since the FMCSA database is 521MB, we need special handling:

### Option 1: Use Git LFS (Large File Storage)
```bash
git lfs track "*.db"
git add .gitattributes
git add fmcsa_complete.db
git commit -m "Add database with LFS"
git push
```

### Option 2: Host Database Separately
1. Upload to cloud storage (AWS S3, Google Cloud Storage)
2. Download on app startup
3. Or use a cloud database service (PostgreSQL, MySQL)

### Option 3: Use External Database Service
- Supabase (PostgreSQL)
- PlanetScale (MySQL)
- Neon (PostgreSQL)

## Testing the Deployment

Once deployed, test all functionality:
```bash
# Test API health
curl https://your-api-url.onrender.com/health

# Test carrier search
curl "https://your-api-url.onrender.com/api/search?page=1&per_page=10"

# Test lead generation
curl "https://your-api-url.onrender.com/api/leads/expiring-insurance?days=30"
```

## Monitoring

- Render provides built-in monitoring and logs
- Railway includes metrics dashboard
- DigitalOcean has insights and alerts

## Cost Estimates

- **Render**: Free tier available, $7/month for starter
- **Railway**: $5/month credit free, then usage-based
- **DigitalOcean**: $5/month for basic droplet
- **Database hosting**: $0-25/month depending on size/usage

## Support

For issues or questions:
- Check deployment logs in your platform's dashboard
- Ensure all environment variables are set correctly
- Verify database connectivity
- Check CORS settings for frontend access