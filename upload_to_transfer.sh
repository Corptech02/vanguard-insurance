#!/bin/bash

echo "==================================="
echo "Uploading Database to Transfer.sh"
echo "==================================="
echo "File: fmcsa_complete.db (521MB)"
echo "This will take a few minutes..."
echo ""

# Upload to transfer.sh (allows up to 10GB for 14 days)
url=$(curl --upload-file ./fmcsa_complete.db https://transfer.sh/fmcsa_complete.db 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$url" ]; then
    echo "✅ Upload successful!"
    echo ""
    echo "==================================="
    echo "DATABASE DOWNLOAD URL:"
    echo "$url"
    echo "==================================="
    echo ""
    echo "This URL is valid for 14 days"
    echo ""
    echo "TO SET UP ON RENDER:"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Click your service: vanguard-insurance"
    echo "3. Go to Environment tab"
    echo "4. Add new environment variable:"
    echo "   DATABASE_DOWNLOAD_URL = $url"
    echo "5. Click Save Changes"
    echo "6. Service will redeploy and download the database"
    echo ""
    echo "URL saved to: database_url.txt"
    echo "$url" > database_url.txt
else
    echo "❌ Upload failed!"
    echo "Try running the script again"
fi