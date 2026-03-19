import http.server
import socketserver
import json
import os
import urllib.request
import urllib.error

PORT = 5000

def get_api_key():
    """Lee la API Key desde OPENROUTER_API_KEY env var."""
    env_key = os.environ.get('OPENROUTER_API_KEY')
    if env_key:
        return env_key
    print("❌ Error: OPENROUTER_API_KEY no encontrada en variables de entorno.")
    return None

def get_openrouter_model():
    """Modelo a usar. Default: openrouter/free (mejora automáticamente al mejor gratuito disponible)."""
    return os.environ.get('OPENROUTER_MODEL', 'openrouter/free')

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
                'openrouterConfigured': bool(os.environ.get('OPENROUTER_API_KEY')),
                'openrouterModel': get_openrouter_model(),
                'firebaseConfigured': bool(get_firebase_config()),
            })
        elif self.path == '/api/firebase-config':
            self.respond_json(get_firebase_config())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/generate':
            self.handle_generate()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_generate(self):
        api_key = get_api_key()
        if not api_key:
            self.respond_json({'error': 'No API Key configured. Set the OPENROUTER_API_KEY environment variable.'}, 500)
            return

        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len)
        try:
            data = json.loads(post_body)
        except json.JSONDecodeError:
            self.respond_json({'error': 'Invalid JSON'}, 400)
            return

        prompt = data.get('prompt', '')
        system = data.get('system', '')
        model = data.get('model', get_openrouter_model())
        temperature = float(data.get('temperature', 0.7))
        max_tokens = int(data.get('max_tokens', 1000))

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
            'HTTP-Referer': 'https://milapp.local',
            'X-Title': 'MilApp',
        }

        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode('utf-8'))

                if 'choices' in result and len(result['choices']) > 0:
                    text = result['choices'][0]['message']['content']
                    self.respond_json({'text': text, 'model': model, 'usage': result.get('usage', {})})
                else:
                    self.respond_json({'error': 'No response from model', 'raw': result}, 500)

        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            try:
                err_data = json.loads(err_body)
                err_msg = err_data.get('error', {}).get('message', err_body)
            except:
                err_msg = err_body
            print(f"OpenRouter API Error ({e.code}): {err_msg}")
            self.respond_json({'error': f"OpenRouter Error {e.code}", 'details': err_msg}, e.code)
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
print(f"🔮 OpenRouter IA Activo")
print(f"📡 Modelo: {get_openrouter_model()}")
print(f"--------------------------------------------------")

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

with ReusableTCPServer(("0.0.0.0", PORT), MilaHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido.")
