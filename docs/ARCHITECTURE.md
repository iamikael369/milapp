# MilApp · Arquitectura objetivo

## Estado actual

MilApp nació como una constelación de módulos ricos y autónomos. Ese enfoque permitió velocidad creativa, pero dejó:

- inicializaciones repetidas por página;
- registro PWA duplicado;
- fallbacks de IA/Firebase no uniformes;
- onboarding inconsistente;
- demasiada lógica mezclada dentro de HTMLs grandes.

## Dirección estratégica

La reestructuración no busca una reescritura total, sino una evolución por capas:

1. **Shell compartido**
   - bootstrap común;
   - registro PWA;
   - instalación;
   - tutoriales;
   - avisos y estado online/offline.

2. **Servicios compartidos**
   - IA;
   - Firebase/config;
   - perfil activo;
   - modo local.

3. **Módulos conservados**
   - cada módulo mantiene su personalidad visual y narrativa;
   - la base técnica se normaliza progresivamente.

## Nuevas capas

### `assets/js/universo.js`
Permanece como capa de dominio compartido: perfiles, comunicación, privacidad, backups y puente IA existente.

### `assets/js/milapp-shell.js`
Nueva capa de shell/aplicación:

- service worker;
- instalación PWA;
- tutoriales;
- toasts;
- estado online/offline;
- acceso compartido a IA/Firebase desde cliente.

### `assets/css/milapp-shell.css`
Estilos comunes no invasivos para:

- avisos;
- onboarding;
- acciones flotantes;
- safe areas.

## Fases siguientes

1. Migrar más módulos a `MilApp.ai.generate()` y `MilApp.firebase.getConfig()`.
2. Extraer headers/botones repetidos y patrones de modal.
3. Unificar chat persistente y estados vacíos.
4. Profundizar mobile-first real por módulo.
