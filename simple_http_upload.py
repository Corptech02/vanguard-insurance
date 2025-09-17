#!/usr/bin/env python3
"""
Simple HTTP Upload Server - Direct access without tunneling
"""

import http.server
import socketserver
import os
import cgi
import io
from datetime import datetime

PORT = 8999
UPLOAD_DIR = "/home/corp06/uploaded_files"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

HTML = """<!DOCTYPE html>
<html>
<head>
    <title>File Upload Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .upload-form { margin-top: 30px; }
        input[type="file"] { margin: 20px 0; padding: 10px; width: 100%; }
        input[type="submit"] { background: #4CAF50; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        input[type="submit"]:hover { background: #45a049; }
        .status { margin-top: 20px; padding: 10px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📤 File Upload Server</h1>
        <div class="info status">
            <strong>Server Info:</strong><br>
            Public IP: 72.23.167.167<br>
            Port: 8999<br>
            Upload Directory: /home/corp06/uploaded_files/
        </div>
        <form class="upload-form" method="POST" enctype="multipart/form-data">
            <label for="file">Select file to upload:</label><br>
            <input type="file" name="file" id="file" required><br>
            <input type="submit" value="Upload File">
        </form>
        {message}
    </div>
</body>
</html>"""

class UploadHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        html = HTML.format(message="")
        self.wfile.write(html.encode())

    def do_POST(self):
        try:
            ctype, pdict = cgi.parse_header(self.headers.get('Content-Type'))
            if ctype == 'multipart/form-data':
                pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
                fields = cgi.parse_multipart(self.rfile, pdict)

                if 'file' in fields:
                    file_data = fields['file'][0]
                    # Extract filename from headers if available
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"{timestamp}_uploaded_file"

                    filepath = os.path.join(UPLOAD_DIR, filename)
                    with open(filepath, 'wb') as f:
                        f.write(file_data)

                    message = f'<div class="success status">✓ File uploaded successfully!<br>Saved as: {filename}<br>Size: {len(file_data):,} bytes</div>'
                else:
                    message = '<div class="error status">✗ No file uploaded</div>'
            else:
                message = '<div class="error status">✗ Invalid request format</div>'
        except Exception as e:
            message = f'<div class="error status">✗ Upload failed: {str(e)}</div>'

        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        html = HTML.format(message=message)
        self.wfile.write(html.encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    print("="*60)
    print("FILE UPLOAD SERVER")
    print("="*60)
    print(f"Public Access: http://72.23.167.167:{PORT}")
    print(f"Local Access: http://localhost:{PORT}")
    print(f"Network Access: http://192.168.40.232:{PORT}")
    print(f"Upload Directory: {UPLOAD_DIR}")
    print("="*60)
    print("Server is running...")

    with socketserver.TCPServer(("0.0.0.0", PORT), UploadHandler) as httpd:
        httpd.serve_forever()