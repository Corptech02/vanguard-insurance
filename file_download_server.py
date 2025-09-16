#!/usr/bin/env python3
"""
Enhanced file download server for Vanguard Insurance deployment files
Serves files needed for cloud deployment
"""

from flask import Flask, send_file, render_template_string, jsonify
import os
import time
from pathlib import Path

app = Flask(__name__)

# HTML template with download buttons
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Vanguard Insurance - Cloud Deployment Files</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }

        .subtitle {
            color: #666;
            font-size: 16px;
        }

        .status-badge {
            display: inline-block;
            background: #d4edda;
            color: #155724;
            padding: 8px 16px;
            border-radius: 20px;
            margin-top: 15px;
            font-weight: 600;
        }

        .files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .file-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }

        .file-card:hover {
            transform: translateY(-5px);
        }

        .file-card.primary {
            border: 3px solid #667eea;
            background: linear-gradient(to bottom, #f0f0ff, white);
        }

        .file-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }

        .file-name {
            font-size: 20px;
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
        }

        .file-info {
            color: #666;
            margin-bottom: 20px;
        }

        .file-size {
            display: inline-block;
            background: #f0f0f0;
            padding: 5px 12px;
            border-radius: 15px;
            font-weight: 600;
            margin-right: 10px;
        }

        .file-desc {
            margin-top: 10px;
            font-size: 14px;
            line-height: 1.5;
        }

        .download-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }

        .download-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        .download-btn.secondary {
            background: #6c757d;
        }

        .instructions {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .instructions h2 {
            color: #333;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .step {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }

        .step-number {
            display: inline-block;
            background: #667eea;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            text-align: center;
            line-height: 30px;
            font-weight: bold;
            margin-right: 15px;
        }

        .step-content {
            display: inline-block;
            vertical-align: middle;
        }

        .code-block {
            background: #2d3748;
            color: #10b981;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            overflow-x: auto;
        }

        .alert {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }

        .alert-icon {
            font-size: 24px;
            margin-right: 10px;
            vertical-align: middle;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
            color: #666;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .success-message {
            display: none;
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: center;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Vanguard Insurance Cloud Deployment</h1>
            <p class="subtitle">Download essential files for cloud deployment</p>
            <div class="status-badge">✅ File Server Active</div>
        </div>

        <div class="alert">
            <span class="alert-icon">⚠️</span>
            <strong>Important:</strong> The database file is 521MB. Make sure you have a stable connection before downloading.
        </div>

        <div class="instructions">
            <h2>📋 Deployment Instructions</h2>

            <div class="step">
                <span class="step-number">1</span>
                <span class="step-content">
                    <strong>Download the database file</strong> - Click the button below to download fmcsa_complete.db (521MB)
                </span>
            </div>

            <div class="step">
                <span class="step-number">2</span>
                <span class="step-content">
                    <strong>Upload to Google Drive</strong> - Upload the database file to your Google Drive
                </span>
            </div>

            <div class="step">
                <span class="step-number">3</span>
                <span class="step-content">
                    <strong>Make it public</strong> - Right-click → "Get link" → Change to "Anyone with the link"
                </span>
            </div>

            <div class="step">
                <span class="step-number">4</span>
                <span class="step-content">
                    <strong>Convert the URL format:</strong>
                    <div class="code-block">
                        From: https://drive.google.com/file/d/FILE_ID/view<br>
                        To: https://drive.google.com/uc?export=download&id=FILE_ID
                    </div>
                </span>
            </div>

            <div class="step">
                <span class="step-number">5</span>
                <span class="step-content">
                    <strong>Add to Render</strong> - Go to your Render dashboard → Environment → Add DATABASE_URL variable
                </span>
            </div>
        </div>

        <div class="files-grid">
            <div class="file-card primary">
                <div class="file-icon">🗄️</div>
                <div class="file-name">fmcsa_complete.db</div>
                <div class="file-info">
                    <span class="file-size">521 MB</span>
                    <span style="color: #28a745;">● Required</span>
                    <div class="file-desc">
                        FMCSA database with 2.2 million carrier records. This is the main database required for the API to function.
                    </div>
                </div>
                <button class="download-btn" onclick="downloadDatabase()">
                    ⬇️ Download Database (521MB)
                </button>
                <div class="loading" id="loading-db">
                    <div class="spinner"></div>
                    Preparing download...
                </div>
                <div class="success-message" id="success-db">
                    ✅ Download started! Check your downloads folder.
                </div>
            </div>

            <div class="file-card">
                <div class="file-icon">🐍</div>
                <div class="file-name">insurance_leads_api.py</div>
                <div class="file-info">
                    <span class="file-size">45 KB</span>
                    <div class="file-desc">
                        Insurance leads generation API module. Contains the core logic for lead generation.
                    </div>
                </div>
                <button class="download-btn secondary" onclick="downloadAPI()">
                    ⬇️ Download API Module
                </button>
                <div class="success-message" id="success-api">
                    ✅ Download started!
                </div>
            </div>
        </div>
    </div>

    <script>
        function downloadDatabase() {
            const btn = event.target;
            const loading = document.getElementById('loading-db');
            const success = document.getElementById('success-db');

            btn.style.display = 'none';
            loading.style.display = 'block';

            // Create download link
            const a = document.createElement('a');
            a.href = '/download/database';
            a.download = 'fmcsa_complete.db';
            document.body.appendChild(a);

            setTimeout(() => {
                a.click();
                document.body.removeChild(a);
                loading.style.display = 'none';
                success.style.display = 'block';

                // Show instructions
                alert('Download started!\\n\\nNext steps:\\n1. Wait for download to complete (521MB)\\n2. Upload to Google Drive\\n3. Make it public\\n4. Get the share link\\n5. Convert to direct download URL\\n6. Add to Render environment variables');

                setTimeout(() => {
                    btn.style.display = 'block';
                    success.style.display = 'none';
                }, 5000);
            }, 1000);
        }

        function downloadAPI() {
            const success = document.getElementById('success-api');

            const a = document.createElement('a');
            a.href = '/download/api';
            a.download = 'insurance_leads_api.py';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            success.style.display = 'block';
            setTimeout(() => {
                success.style.display = 'none';
            }, 3000);
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Serve the main download page"""
    return HTML_TEMPLATE

@app.route('/download/database')
def download_database():
    """Download the FMCSA database"""
    # Check multiple possible locations
    db_paths = [
        '/home/corp06/fmcsa_complete.db',
        '/home/corp06/DB-system/fmcsa_complete.db',
        '/home/corp06/vanguard-insurance-github/fmcsa_complete.db'
    ]

    for db_path in db_paths:
        if os.path.exists(db_path):
            print(f"Serving database from: {db_path}")
            return send_file(
                db_path,
                as_attachment=True,
                download_name='fmcsa_complete.db',
                mimetype='application/x-sqlite3'
            )

    return "Database file not found", 404

@app.route('/download/api')
def download_api():
    """Download the insurance leads API module"""
    api_path = '/home/corp06/vanguard-insurance-github/insurance_leads_api.py'
    if os.path.exists(api_path):
        return send_file(
            api_path,
            as_attachment=True,
            download_name='insurance_leads_api.py',
            mimetype='text/x-python'
        )
    return "API file not found", 404

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": time.time()})

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Vanguard Insurance File Download Server")
    print("=" * 60)
    print("Access the download portal at:")
    print("  → http://192.168.40.232:8082")
    print("  → http://localhost:8082")
    print("-" * 60)
    print("Files available for download:")
    print("  • fmcsa_complete.db (521MB)")
    print("  • insurance_leads_api.py")
    print("=" * 60)
    app.run(host='0.0.0.0', port=8082, debug=False)