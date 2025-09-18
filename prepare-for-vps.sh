#!/bin/bash
# ============================================================
# Prepare Files for VPS Migration
# This script packages everything needed for VPS deployment
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "============================================================"
echo "   Preparing Vanguard Insurance System for VPS Migration"
echo "============================================================"
echo ""

# Create deployment package directory
DEPLOY_DIR="vanguard-vps-package"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo -e "${BLUE}[1/8]${NC} Copying core application files..."
# Copy essential files
cp -r backend $DEPLOY_DIR/
cp -r js $DEPLOY_DIR/
cp -r css $DEPLOY_DIR/
cp index.html $DEPLOY_DIR/
cp -r images $DEPLOY_DIR/ 2>/dev/null || true

echo -e "${BLUE}[2/8]${NC} Copying Python API files..."
# Copy Python API
cp api_complete.py $DEPLOY_DIR/ 2>/dev/null || echo "api_complete.py not found"
cp /home/corp06/DB-system/api_complete.py $DEPLOY_DIR/ 2>/dev/null || true

echo -e "${BLUE}[3/8]${NC} Copying deployment scripts..."
# Copy deployment scripts
cp vps-setup.sh $DEPLOY_DIR/
cp VPS_DEPLOYMENT_COMPLETE.md $DEPLOY_DIR/
chmod +x $DEPLOY_DIR/vps-setup.sh

echo -e "${BLUE}[4/8]${NC} Creating database upload script..."
# Create database upload script
cat > $DEPLOY_DIR/upload_databases.sh << 'EOF'
#!/bin/bash
# Upload databases to transfer.sh for easy download on VPS

echo "Uploading databases to transfer.sh..."

# Upload FMCSA database
if [ -f "fmcsa_complete.db" ]; then
    echo "Uploading fmcsa_complete.db (this may take a while)..."
    curl --upload-file fmcsa_complete.db https://transfer.sh/fmcsa_complete.db
    echo ""
else
    echo "fmcsa_complete.db not found!"
fi

# Upload other databases
for db in vanguard.db vanguard_system.db; do
    if [ -f "$db" ]; then
        echo "Uploading $db..."
        curl --upload-file $db https://transfer.sh/$db
        echo ""
    fi
done

echo "Upload complete! Save these URLs for the VPS setup."
EOF
chmod +x $DEPLOY_DIR/upload_databases.sh

echo -e "${BLUE}[5/8]${NC} Packaging small databases..."
# Copy small databases
cp backend/vanguard.db $DEPLOY_DIR/ 2>/dev/null || true
cp vanguard_system.db $DEPLOY_DIR/ 2>/dev/null || true

echo -e "${BLUE}[6/8]${NC} Creating requirements file..."
# Create requirements.txt for Python
cat > $DEPLOY_DIR/requirements.txt << 'EOF'
flask==3.0.0
flask-cors==4.0.0
werkzeug==3.0.1
EOF

echo -e "${BLUE}[7/8]${NC} Creating quick start guide..."
# Create quick start guide
cat > $DEPLOY_DIR/QUICK_START.md << 'EOF'
# Quick Start Guide for VPS Deployment

## Step 1: Upload to VPS
```bash
scp -r vanguard-vps-package/ root@your-vps-ip:/tmp/
```

## Step 2: Connect to VPS
```bash
ssh root@your-vps-ip
cd /tmp/vanguard-vps-package
```

## Step 3: Run Setup Script
```bash
chmod +x vps-setup.sh
./vps-setup.sh
```

## Step 4: Upload Database
If you haven't uploaded the database yet:
1. On your local machine: run `./upload_databases.sh`
2. On VPS: download using the provided URLs

## Step 5: Verify
```bash
./health_check.sh
```

That's it! Your system should be running.
EOF

echo -e "${BLUE}[8/8]${NC} Creating deployment package..."
# Create tar.gz package
tar -czf vanguard-vps-package.tar.gz $DEPLOY_DIR/

# Calculate package size
PACKAGE_SIZE=$(du -h vanguard-vps-package.tar.gz | cut -f1)

echo ""
echo "============================================================"
echo -e "${GREEN}   Package Created Successfully!${NC}"
echo "============================================================"
echo ""
echo "Package: vanguard-vps-package.tar.gz ($PACKAGE_SIZE)"
echo ""
echo "Files included:"
echo "  ✓ Backend Node.js application"
echo "  ✓ Python API (api_complete.py)"
echo "  ✓ Frontend files (HTML, CSS, JS)"
echo "  ✓ Small databases (vanguard.db, vanguard_system.db)"
echo "  ✓ Automated setup script"
echo "  ✓ Documentation"
echo ""
echo -e "${YELLOW}NOTE:${NC} The large FMCSA database (558MB) needs to be uploaded separately."
echo ""
echo "Next steps:"
echo "1. Upload package to VPS: scp vanguard-vps-package.tar.gz root@your-vps:/tmp/"
echo "2. Upload FMCSA database: cd $DEPLOY_DIR && ./upload_databases.sh"
echo "3. Connect to VPS and extract: tar -xzf /tmp/vanguard-vps-package.tar.gz"
echo "4. Run setup: cd vanguard-vps-package && ./vps-setup.sh"
echo ""
echo "Complete documentation: VPS_DEPLOYMENT_COMPLETE.md"
echo ""