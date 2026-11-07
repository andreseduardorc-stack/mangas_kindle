# Kindle Manga & Manhwa Reader (Español)

Aplicación moderna para la lectura de **Mangas** y **Manhwas** en español, con integración directa al catálogo en vivo de **Olympus Scanlation** (`https://olympusxyz.com/`), diseñada con la interfaz, menús, estética de tinta electrónica (E-Ink) y ergonomía de un lector **Amazon Kindle Paperwhite / Oasis**.

---

## 📱 Preparada para PWABuilder e Instalación en Teléfonos Móviles

La aplicación cuenta con todos los requerimientos técnicos para obtener una puntuación máxima (100/100) en **[PWABuilder.com](https://www.pwabuilder.com/)** y generar un archivo **APK / AAB para Android** o instalarla directamente en cualquier teléfono:

### Archivos PWA Incluidos:
- **`public/manifest.json`**: Manifiesto oficial PWA con `id`, `name`, `short_name`, `display: standalone`, `categories`, shortcuts, soporte para notch/cámaras (`viewport-fit=cover`) e iconos maskable.
- **`public/sw.js`**: Service Worker de alto rendimiento que cachea la interfaz y las páginas de los capítulos para lectura offline.
- **Iconos Adaptables:**
  - `icon-192.png` y `icon-512.png` (resolución estándar).
  - `icon-maskable-192.png` y `icon-maskable-512.png` (adaptables a círculos, esquinas redondeadas o cuadrados en Android 13/14/15).
  - `apple-touch-icon.png` (para iPhone / iPad).
- **Screenshots oficiales para tiendas:**
  - `screenshot-mobile.png` (formato vertical 720x1280).
  - `screenshot-desktop.png` (formato horizontal 1280x720).
- **Soporte de Zonas Seguras en Celulares:**
  - Adaptado a la barra de gestos inferior (`env(safe-area-inset-bottom)`) y al notch/perforación de cámara superior (`env(safe-area-inset-top)`).

---

## 📲 Cómo Empacarla con PWABuilder para tu Teléfono

### Paso 1: Publicar la app en línea (HTTPS gratuito)
PWABuilder requiere que el sitio esté publicado bajo una URL con `https://`. Puedes hacerlo en 1 minuto de forma 100% gratuita:
1. Compila el proyecto: `npm run build`
2. Puedes subir la carpeta `dist` a cualquier servicio gratuito como **[Netlify Drop](https://app.netlify.com/drop)** (solo arrastras la carpeta `dist`), **Vercel** (`npx vercel`) o **GitHub Pages**.

### Paso 2: Generar el APK en PWABuilder
1. Entra a **[https://www.pwabuilder.com/](https://www.pwabuilder.com/)**.
2. Ingresa la URL de tu aplicación (ejemplo: `https://mi-kindle-manga.netlify.app`).
3. Verás que pasa todas las auditorías en verde (Manifest, Service Worker, Security).
4. Haz clic en **"Package for Stores"**.
5. Selecciona **Android** -> Puedes descargar el archivo **APK** directamente a tu computadora o enviarlo a tu teléfono para instalarlo como cualquier aplicación nativa.

### Alternativa Directa (Sin compilar APK):
Desde tu teléfono móvil, abre la URL en Google Chrome (Android) o Safari (iOS) y pulsa:
- **Android:** Los 3 puntos superiores -> **"Instalar aplicación"** o **"Agregar a pantalla principal"**.
- **iPhone:** Botón Compartir -> **"Agregar al inicio"**.
La app se abrirá en pantalla completa sin barra de navegación del navegador, como una app nativa de Kindle.

---

## ⚡ Conexión con Olympus Scanlation (`https://olympusxyz.com/`)
La aplicación actúa como una máscara Kindle en tiempo real sobre el backend de Olympus:
- **Catálogo Completo:** Acceso a las más de **890 series** oficiales de Olympus en español.
- **Capítulos y Páginas Reales:** Las páginas se descargan en formato WebP en alta resolución directo de `media.imagesolymp.xyz`.
- **Auto-Scroll para Webtoons:** Botón flotante para lectura manos libres con velocidades 1x, 2x y 3x.
- **Seguimiento de Progreso:** La barra inferior estilo Kindle (`Loc X de Y • Z% leído`) actualiza tu posición automáticamente a medida que haces scroll.

---

## 🚀 Cómo Iniciar en Desarrollo Local

```powershell
# 1. Entrar a la carpeta
cd "c:\Users\ADM\OneDrive - Instituto Profesional San Sebastián\Escritorio\mangas"

# 2. Iniciar servidor local
npm run dev

# Para probarlo desde tu teléfono conectado a la misma red Wi-Fi:
npm run dev -- --host
```
