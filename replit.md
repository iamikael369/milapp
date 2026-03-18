# MilApp — Universo Sagrado de Mila & Miguelo

## Descripción
Aplicación web privada y espiritual/romántica para Mila y Miguelo. Funciona como PWA instalable en móvil. Construida con HTML/CSS/JS vanilla + servidor Python HTTP.

## Arquitectura
- **Backend:** `server.py` — Python `http.server` con proxy seguro para Gemini AI y Firebase config
- **Frontend:** HTML/JS/CSS vanilla, Tailwind CDN, sin build step
- **Base de datos:** Firebase Firestore (con fallback a localStorage)
- **AI:** Gemini AI via proxy en `/api/generate`
- **Estilo:** Tailwind CSS + fuentes premium (Cinzel, Playfair, EB Garamond, etc.)

## Módulos
- `index.html` — Página principal con grid de portales
- `pergaminos.html` — Chat y perfiles de Mila & Miguelo
- `emilybooks.html` — Editor de escritura tipo libro (Emily Books)
- `diario.html` — Bitácora de sueños y metas SPEC
- `mapadesuenos.html` — Mapa de visiones con generación de imágenes IA
- `billetera.html` — Billetera de abundancia espiritual
- `astrologia.html` — Carta natal y tránsitos astrológicos
- `numerologia.html` — Perfil numerológico
- `biblioteca.html` — Bóveda de luz (libros, audio, PDF)
- `hipnosis.html` — Sesión de hipnosis

## Configuración Requerida
- `GEMINI_API_KEY` en Replit Secrets (obligatorio para IA)
- Firebase config opcionales (app degrada a localStorage con aviso espiritual)

## Archivos Clave
- `assets/js/universo.js` — Módulo central: perfiles, Firebase, Gemini proxy, navegación
- `assets/css/style.css` — Estilos globales compartidos
- `assets/data/conocimiento.json` — Base de conocimiento para IA
- `service-worker.js` — PWA offline support
- `manifest.webmanifest` — Configuración PWA

## Historial de Mejoras Implementadas

### Sesión 1-3 (completadas)
- PWA shell completa (service worker, manifest, iconos)
- Seguridad en server.py (proxy Gemini, Firebase config)
- Pergaminos: fotos de avatar locales, botones de cámara mobile, límite 500KB, burbujas de imagen en chat, aviso Firebase-offline, showToast(), DEFAULT_PHOTOS fallback

### Sesión 4 (completada) — Mobile-First Responsive
- **index.html:** Grid 2 columnas en móvil, cards `h-40 sm:h-64 p-4 sm:p-8`, header compacto, safe-area para música y ajustes
- **emilybooks.html:** Editor padding responsive (1.5rem/1.25rem → 5rem/6rem), mobile bottom nav bar con capítulos/nuevo/musa/tema, drawer de capítulos, safe-area bottom
- **billetera.html:** Padding reducido en todas las secciones mobile
- **mapadesuenos.html:** Header/sección/textarea/panel compactos mobile, floating-menu safe-area
- **diario.html:** Header/nav/editor/iconos compactos mobile, search compacto, seal button safe-area
- **astrologia.html, biblioteca.html, numerologia.html:** body padding reducido en mobile

## Notas de Diseño
- La alma visual debe preservarse: íntimo, espiritual, romántico
- No genericizar, no cambiar paleta de colores
- Siempre usar `env(safe-area-inset-bottom)` para botones flotantes (iOS)
- Mantener fuentes sagradas: Cinzel, Playfair, EB Garamond, Great Vibes
