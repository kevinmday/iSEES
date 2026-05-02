from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length'))
        body = self.rfile.read(length)

        print("\n🔥 WEBHOOK RECEIVED:")
        print(json.dumps(json.loads(body), indent=2))

        self.send_response(200)
        self.end_headers()

server = HTTPServer(('localhost', 5001), Handler)
print("Listening on http://localhost:5001")
server.serve_forever()