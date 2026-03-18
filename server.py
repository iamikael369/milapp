import http.server
import socketserver
import json
import os
import urllib.request
import urllib.error

# Configuración
PORT = 5000
API_KEY_FILE = "API.md"

import re

def get_api_key():
    """Lee la API Key desde GEMINI_API_KEY env var; fallback a API.md (deprecado)."""
    env_key = os.environ.get('GEMINI_API_KEY')
    if env_key:
        return env_key

    print("⚠️  DEPRECADO: GEMINI_API_KEY no encontrada en variables de entorno. Intentando API.md como respaldo...")
    if not os.path.exists(API_KEY_FILE):
        print(f"❌ Error: No se encuentra {API_KEY_FILE} ni GEMINI_API_KEY en entorno.")
        return None
    try:
        with open(API_KEY_FILE, "r", encoding="utf-8") as f:
            content = f.read()

        match = re.search(r'(AIza[0-9A-Za-z-_]{35})', content)

        if match:
            key = match.group(1)
            return key

        print("❌ Error: No se detectó patrón 'AIza...' en API.md")
        return None
    except Exception as e:
        print(f"❌ Error leyendo API Key: {e}")
        return None

FIREBASE_KEYS = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
]

def get_firebase_config():
    """Ensambla config de Firebase desde variables de entorno."""
    config = {
        'apiKey': os.environ.get('FIREBASE_API_KEY'),
        'authDomain': os.environ.get('FIREBASE_AUTH_DOMAIN'),
        'projectId': os.environ.get('FIREBASE_PROJECT_ID'),
        'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET'),
        'messagingSenderId': os.environ.get('FIREBASE_MESSAGING_SENDER_ID'),
        'appId': os.environ.get('FIREBASE_APP_ID'),
    }
    if any(v is None for v in config.values()):
        return {}
    return config

class MilaHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/health':
            self.respond_json({
                'status': 'ok',
                'geminiConfigured': bool(os.environ.get('GEMINI_API_KEY')),
                'firebaseConfigured': bool(get_firebase_config()),
            })
        elif self.path == '/api/firebase-config':
            self.respond_json(get_firebase_config())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/generate':
            self.handle_gemini()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_gemini(self):
        api_key = get_api_key()
        if not api_key:
            self.respond_json({'error': 'No API Key configured. Set the GEMINI_API_KEY environment variable.'}, 500)
            return

        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len)
        try:
            data = json.loads(post_body)
            payload = {}
            if 'contents' in data:
                payload = data
            elif 'prompt' in data:
                payload = {
                    "contents": [{
                        "parts": [{"text": data['prompt']}]
                    }]
                }
            else:
                self.respond_json({'error': 'Invalid request format'}, 400)
                return

        except json.JSONDecodeError:
            self.respond_json({'error': 'Invalid JSON'}, 400)
            return

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
        headers = {'Content-Type': 'application/json'}

        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=20) as response:
                result = response.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(result)
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8')
            print(f"Gemini API Error: {err_msg}")
            self.respond_json({'error': f"Gemini Error: {e.code}", 'details': err_msg}, e.code)
        except Exception as e:
            print(f"Server Error: {e}")
            self.respond_json({'error': str(e)}, 500)

    def respond_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

print(f"🌌 Templo de Mila Iniciado en http://localhost:{PORT}")
print(f"🔮 Servidor de IA Activo")
print(f"--------------------------------------------------")

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

with ReusableTCPServer(("0.0.0.0", PORT), MilaHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido.")
