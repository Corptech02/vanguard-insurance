#!/usr/bin/env python3
"""
Simple proxy server to forward API requests to the insurance database
This allows the ngrok tunnel to access both the Vanguard UI and the API
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import json
import sys
import os

class ProxyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # If it's an API call, proxy it to the insurance database
        if self.path.startswith('/api/'):
            self.proxy_to_api()
        else:
            # Otherwise serve the static files
            super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.proxy_to_api()
        else:
            super().do_POST()
    
    def proxy_to_api(self):
        """Forward requests to the insurance API on port 8003"""
        try:
            # Build the target URL - forward API requests to insurance API on port 8003
            api_url = f"http://localhost:8003{self.path}"
            
            # Read POST data if present
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else None
            
            # Create the request
            req = urllib.request.Request(api_url, data=post_data)
            
            # Copy headers
            for header in self.headers:
                if header.lower() not in ['host', 'content-length']:
                    req.add_header(header, self.headers[header])
            
            # Make the request
            with urllib.request.urlopen(req) as response:
                # Send response status
                self.send_response(response.code)
                
                # Copy response headers
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header, value)
                self.end_headers()
                
                # Send response body
                self.wfile.write(response.read())
                
        except urllib.error.HTTPError as e:
            self.send_error(e.code, e.reason)
        except Exception as e:
            self.send_error(500, str(e))

if __name__ == '__main__':
    port = 8897
    server = HTTPServer(('0.0.0.0', port), ProxyHTTPRequestHandler)
    print(f"Proxy server running on port {port}")
    print(f"Forwarding /api/* requests to localhost:8002")
    print(f"Serving static files from current directory")
    server.serve_forever()