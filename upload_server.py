#!/usr/bin/env python3
"""
File Upload Server with JSON API support for AJAX requests
"""

import http.server
import socketserver
import os
import cgi
import json
from datetime import datetime
import hashlib
import mimetypes

PORT = 8999
UPLOAD_DIR = "/home/corp06/uploaded_files"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class UploadHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_GET(self):
        """Serve a simple upload page for browser access"""
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        html = """<!DOCTYPE html>
<html>
<head>
    <title>Upload Server</title>
    <style>
        body { font-family: Arial; margin: 40px; background: #f0f0f0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        h1 { color: #333; }
        .status { padding: 10px; margin: 20px 0; border-radius: 5px; background: #d1ecf1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📤 File Upload Server</h1>
        <div class="status">
            Server is running on port 8999<br>
            Ready to accept file uploads
        </div>
        <form method="POST" enctype="multipart/form-data">
            <input type="file" name="file" required>
            <button type="submit">Upload</button>
        </form>
    </div>
</body>
</html>"""
        self.wfile.write(html.encode())

    def do_POST(self):
        """Handle file uploads and return JSON response"""
        try:
            # Parse content type
            ctype, pdict = cgi.parse_header(self.headers.get('Content-Type'))

            # Set CORS headers for response
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')

            if ctype == 'multipart/form-data':
                # Parse multipart data
                pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
                fields = cgi.parse_multipart(self.rfile, pdict)

                if 'file' in fields:
                    file_data = fields['file'][0]

                    # Generate unique filename
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    file_hash = hashlib.md5(file_data[:1024]).hexdigest()[:8]

                    # Try to get original filename from form data
                    filename = f"{timestamp}_{file_hash}_upload"

                    # Save file
                    filepath = os.path.join(UPLOAD_DIR, filename)
                    with open(filepath, 'wb') as f:
                        f.write(file_data)

                    # Generate file URL (this would be your public URL in production)
                    file_url = f"http://localhost:{PORT}/uploads/{filename}"

                    # Return JSON response
                    response = {
                        "success": True,
                        "data": {
                            "url": file_url,
                            "filename": filename,
                            "size": len(file_data),
                            "timestamp": timestamp
                        }
                    }

                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(response).encode())

                    print(f"✓ File uploaded: {filename} ({len(file_data):,} bytes)")
                else:
                    # No file in request
                    response = {
                        "success": False,
                        "error": "No file uploaded"
                    }
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(response).encode())
            else:
                # Invalid content type
                response = {
                    "success": False,
                    "error": f"Invalid content type: {ctype}"
                }
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            print(f"✗ Upload error: {str(e)}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {
                "success": False,
                "error": str(e)
            }
            self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        """Override to reduce log spam"""
        if "POST" in format % args or "error" in format % args:
            super().log_message(format, *args)

if __name__ == "__main__":
    print("="*60)
    print("FILE UPLOAD SERVER WITH JSON API")
    print("="*60)
    print(f"Server running on port: {PORT}")
    print(f"Upload directory: {UPLOAD_DIR}")
    print(f"Access URL: http://localhost:{PORT}")
    print("="*60)
    print("Waiting for uploads...")
    print()

    # Allow address reuse
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("0.0.0.0", PORT), UploadHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✗ Server stopped")