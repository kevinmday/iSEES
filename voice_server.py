from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Read incoming request (optional future use)
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode()

        params = urllib.parse.parse_qs(body)

        # Default message
        message = params.get("message", ["High priority event detected."])[0]

        self.send_response(200)
        self.send_header("Content-Type", "text/xml")
        self.end_headers()

        response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">{message}</Say>
</Response>
"""
        self.wfile.write(response.encode())

server = HTTPServer(("0.0.0.0", 5002), Handler)
print("Voice server running on http://localhost:5002")
server.serve_forever()