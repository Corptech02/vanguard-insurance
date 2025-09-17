#!/usr/bin/env python3
"""
HTTPS Upload Server with self-signed certificate
"""

import http.server
import ssl
import os
import json
import cgi
from datetime import datetime
import hashlib

PORT = 8444
UPLOAD_DIR = "/home/corp06/uploaded_files/"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {
            'status': 'ready',
            'message': 'Upload server is running',
            'upload_dir': UPLOAD_DIR
        }
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        try:
            ctype, pdict = cgi.parse_header(self.headers.get('Content-Type'))

            if ctype == 'multipart/form-data':
                pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
                fields = cgi.parse_multipart(self.rfile, pdict)

                if 'file' in fields:
                    file_data = fields['file'][0]

                    # Generate unique filename
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    file_hash = hashlib.md5(file_data[:1024]).hexdigest()[:8]
                    filename = f"{timestamp}_{file_hash}_upload"

                    # Save file
                    filepath = os.path.join(UPLOAD_DIR, filename)
                    with open(filepath, 'wb') as f:
                        f.write(file_data)

                    # Send success response
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()

                    response = {
                        'success': True,
                        'data': {
                            'filename': filename,
                            'size': len(file_data),
                            'url': f'https://72.23.167.167:8444/uploads/{filename}',
                            'message': 'Upload successful'
                        }
                    }
                    self.wfile.write(json.dumps(response).encode())
                    print(f"✓ Uploaded: {filename} ({len(file_data):,} bytes)")
                else:
                    self.send_error(400, "No file in request")
            else:
                self.send_error(400, "Invalid content type")

        except Exception as e:
            print(f"Error: {e}")
            self.send_error(500, str(e))

    def log_message(self, format, *args):
        # Only log important messages
        if "POST" in format % args or "error" in format % args:
            super().log_message(format, *args)

# Create self-signed certificate if it doesn't exist
CERT_FILE = '/home/corp06/vanguard-insurance-github/server.pem'
if not os.path.exists(CERT_FILE):
    print("Creating self-signed certificate...")
    os.system(f'openssl req -new -x509 -keyout {CERT_FILE} -out {CERT_FILE} -days 365 -nodes -subj "/CN=72.23.167.167"')

print("="*60)
print("HTTPS UPLOAD SERVER")
print("="*60)
print(f"Server URL: https://72.23.167.167:{PORT}")
print(f"Upload directory: {UPLOAD_DIR}")
print("Note: Browser will warn about self-signed certificate")
print("="*60)

# Create HTTPS server
httpd = http.server.HTTPServer(('0.0.0.0', PORT), CORSHTTPRequestHandler)

# Add SSL
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(CERT_FILE)
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"Server listening on https://72.23.167.167:{PORT}")
httpd.serve_forever()