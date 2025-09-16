#!/usr/bin/env python3
"""
Simple HTTP server to serve the database file for Render to download
Run this on your local server to make the database accessible
"""
import http.server
import socketserver
import os
import sys

PORT = 9999
DB_FILE = "fmcsa_complete.db"

class DatabaseHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/fmcsa_complete.db' or self.path == '/database':
            if os.path.exists(DB_FILE):
                self.send_response(200)
                self.send_header('Content-type', 'application/octet-stream')
                self.send_header('Content-Disposition', 'attachment; filename="fmcsa_complete.db"')

                file_size = os.path.getsize(DB_FILE)
                self.send_header('Content-Length', str(file_size))
                self.end_headers()

                with open(DB_FILE, 'rb') as f:
                    while True:
                        chunk = f.read(1024 * 1024)  # Read 1MB at a time
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                print(f"\n✓ Database served to {self.client_address[0]}")
            else:
                self.send_error(404, "Database file not found")
        else:
            self.send_error(404, "Use /database or /fmcsa_complete.db")

    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.client_address[0]}] {format % args}")

def get_local_ip():
    """Get the local IP address"""
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    return local_ip

if __name__ == "__main__":
    if not os.path.exists(DB_FILE):
        print(f"❌ Database file '{DB_FILE}' not found!")
        print("Make sure you're running this from the directory containing fmcsa_complete.db")
        sys.exit(1)

    file_size = os.path.getsize(DB_FILE) / (1024 * 1024)
    local_ip = get_local_ip()

    print("=" * 60)
    print("DATABASE FILE SERVER")
    print("=" * 60)
    print(f"Serving: {DB_FILE} ({file_size:.1f} MB)")
    print(f"Port: {PORT}")
    print("-" * 60)
    print("Access URLs:")
    print(f"  Local: http://localhost:{PORT}/database")
    print(f"  Network: http://{local_ip}:{PORT}/database")
    print(f"  Direct: http://192.168.40.232:{PORT}/database")
    print("-" * 60)
    print("Use one of these URLs as DATABASE_DOWNLOAD_URL in Render")
    print("Press Ctrl+C to stop the server")
    print("=" * 60)

    with socketserver.TCPServer(("", PORT), DatabaseHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
            sys.exit(0)