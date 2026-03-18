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
    """Lee la API Key desde el archivo usando Regex para mayor robustez."""
    if not os.path.exists(API_KEY_FILE):
        print(f"❌ Error: No se encuentra {API_KEY_FILE}")
        return None
    try:
        with open(API_KEY_FILE, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Busca un patrón que parezca una API Key de Google (AIza...)
        # Soporta: "API: AIza...", "AIza...", o simplemente la llave en el texto
        match = re.search(r'(AIza[0-9A-Za-z-_]{35})', content)
        
        if match:
            key = match.group(1)
            print(f"🔑 API Key detectada: {key[:5]}...{key[-3:]} (Longitud: {len(key)})")
            return key
            
        print("❌ Error: No se detectó patrón 'AIza...' en API.md")
        return None
    except Exception as e:
        print(f"❌ Error leyendo API Key: {e}")
        return None

class MilaHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/generate':
            self.handle_gemini()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_gemini(self):
        # 1. Leer API Key
        api_key = get_api_key()
        if not api_key:
            self.respond_json({'error': 'No API Key found in API.md'}, 500)
            return

        # 2. Leer Body del Request (Prompt del usuario)
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len)
        try:
            data = json.loads(post_body)
            # Esperamos { "contents": ... } o { "prompt": "..." }
            # Para compatibilidad con codigo existente, si recibimos 'contents' lo pasamos tal cual
            # Si recibimos 'prompt', lo envolvemos
            
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

        # 3. Llamar a Google Gemini
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
            with urllib.request.urlopen(req) as response:
                result = response.read()
                # Devolver respuesta cruda de Gemini al frontend
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
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

# Asegurar que estamos en el directorio correcto (donde reside este script)
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("0.0.0.0", PORT), MilaHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido.")
