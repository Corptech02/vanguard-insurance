#!/bin/bash

echo "==================================="
echo "Upload Database to File.io"
echo "==================================="

# File.io allows up to 5GB for free (expires after 14 days)
echo "Uploading fmcsa_complete.db (521MB) to file.io..."
echo "This will take a few minutes..."

response=$(curl -F "file=@fmcsa_complete.db" https://file.io)

if [ $? -eq 0 ]; then
    echo "Upload successful!"
    echo ""
    echo "Response: $response"
    echo ""

    # Extract URL
    url=$(echo $response | python3 -c "import sys, json; print(json.load(sys.stdin)['link'])" 2>/dev/null)

    if [ ! -z "$url" ]; then
        echo "==================================="
        echo "DATABASE DOWNLOAD URL:"
        echo "$url"
        echo "==================================="
        echo ""
        echo "IMPORTANT: This URL expires after first download or 14 days"
        echo ""
        echo "To use on Render:"
        echo "1. Go to https://dashboard.render.com"
        echo "2. Click your service: vanguard-insurance"
        echo "3. Go to Environment tab"
        echo "4. Add variable: DATABASE_DOWNLOAD_URL = $url"
        echo "5. Save and redeploy"
        echo ""
        echo "URL saved to: database_url.txt"
        echo "$url" > database_url.txt
    fi
else
    echo "Upload failed!"
fi