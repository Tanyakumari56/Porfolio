import http.server
import os
import sys

PORT = 5000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        if self.path.endswith(('.jpg', '.jpeg', '.png', '.webp', '.js', '.css')):
            self.send_header('Cache-Control', 'public, max-age=86400')
        else:
            self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        pass

class ReusableThreadingServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    for port in [PORT, 5001, 8000, 8080]:
        try:
            server = ReusableThreadingServer(("", port), Handler)
            print(f"Serving at http://localhost:{port}", flush=True)
            server.serve_forever()
            break
        except OSError:
            continue
