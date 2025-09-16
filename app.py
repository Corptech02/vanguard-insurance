#!/usr/bin/env python3
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                'status': 'ok',
                'message': 'Vanguard Insurance API',
                'version': 'minimal'
            }
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"healthy"}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress logs for cleaner output

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f'Starting server on port {port}')
    server = HTTPServer(('0.0.0.0', port), SimpleHandler)
    server.serve_forever()