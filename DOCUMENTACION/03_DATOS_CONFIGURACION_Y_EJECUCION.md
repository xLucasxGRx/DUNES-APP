# DUNES PARFUMS — Datos, Configuración y Ejecución

> **Fecha del análisis:** 17 de octubre de 2026  
> **Alcance revisado:** Modelos de datos en `localStorage`, estructura del CSV de Google Sheets, endpoints de integración externa, variables de configuración, comandos de ejecución y configuración de despliegue en GitHub Pages.

---

## 1. Modelos de Datos y Estructuras de Almacenamiento

La aplicación no utiliza bases de datos relacionales tradicionales (SQL) ni bases de datos documentales en servidor (NoSQL). Todo el almacenamiento persistente reside en el cliente a través de la API `localStorage`.

### 1.1. Claves Utilizadas en `localStorage`

| Clave | Tipo | Propósito |
| :--- | :--- | :--- |
| `dunes_cotizaciones_v1` | `Array<ObjetoCotizacion>` | Historial cronológico de cotizaciones guardadas por el usuario. |
| `dunes_config_base_v1` | `ObjetoConfigBase` | Tarifas y costos base personalizados de courier para nuevas cotizaciones. |
| `dunes_last_inputs_v1` | `ObjetoUltimosValores` | Memoria inteligente que recuerda los últimos valores numéricos introducidos al calcular. |
| `dunes_catalogo_cache_v2` | `Array<ObjetoProductoCatalogo>` | Caché local del catálogo de perfumes descargado desde Google Sheets. |
| `dunes_catalogo_last_sync_v1` | `String` | Hora de la última sincronización exitosa (formato `HH:mm`). |
| `dunes_google_sheets_url_v1` | `String` | URL personalizada de Google Sheets si el usuario decide sobreescribir la por defecto. |

---

### 1.2. Esquema del Objeto Cotización (`ObjetoCotizacion`)

Estructura de cada elemento almacenado en `dunes_cotizaciones_v1`:

```typescript
interface ObjetoCotizacion {
  id: number;               // Timestamp generado por Date.now() (Identificador único)
  fecha: string;            // Fecha legible formateada, ej: "17/10/2026 15:30"
  timestamp: number;        // Marca temporal numérica para ordenación
  producto: string;         // Nombre o descripción de la fragancia
  cantidad: number;         // Número de unidades a importar (>= 1)
  precioUSA: number;        // Precio unitario de compra en USD
  peso: number;             // Peso unitario en KG
  envioKg: number;          // Tarifa courier por KG en USD
  reempaque: number;        // Costo total de reempaque aplicado en USD
  tc: number;               // Tipo de cambio aplicado (USD a PEN)
  extras: number;           // Costos extras locales en PEN (delivery, packaging)
  venta: number;            // Precio de venta unitario final en PEN
  totalUSA: number;         // precioUSA * cantidad
  flete: number;            // (peso * cantidad) * envioKg
  totalEnvio: number;       // flete + reempaque
  precioTotalUSD: number;   // totalUSA + totalEnvio
  precioTotalSoles: number; // precioTotalUSD * tc
  costoUnidad: number;      // precioTotalSoles / cantidad
  gananciaUnidad: number;   // venta - costoUnidad - extras
  gananciaTotal: number;    // gananciaUnidad * cantidad
  margen: number;           // (gananciaUnidad / venta) * 100
}
```

---

### 1.3. Esquema del Objeto de Configuración Base (`ObjetoConfigBase`)

Estructura almacenada en `dunes_config_base_v1`:

```typescript
interface ObjetoConfigBase {
  peso: number;             // Peso base en KG (Fábrica: 0.60)
  envioKg: number;          // Tarifa envío por KG en USD (Fábrica: 9.50)
  costoCaja: number;        // Precio reempaque de caja de 4 unidades (Fábrica: 4.00)
  reempaque: number;        // Costo equivalente por perfume (costoCaja / 4 = 1.00)
  tc: number;               // Tipo de cambio base en PEN (Fábrica: 3.40)
  extras: number;           // Costos extras locales base en PEN (Fábrica: 15.00)
}
```

---

### 1.4. Estructura de Columnas de Google Sheets (Catálogo)

El catálogo remoto publicado como CSV admite de 11 a 15 columnas. La aplicación utiliza un algoritmo de normalización de encabezados (`normalizarClaveColumna`) con fallback a mapeo posicional de columnas A-O (0 a 14):

| Columna | Índice | Nombre / Clave Normalizada | Tipo | Propósito |
| :---: | :---: | :--- | :--- | :--- |
| **A** | `0` | `producto`, `perfume`, `nombre` | `string` | Nombre del perfume o producto. |
| **B** | `1` | `preciousa`, `precio_usa` | `number` | Precio de compra en EE.UU. (USD). |
| **C** | `2` | `cantidad`, `cant`, `unidades` | `number` | Cantidad de unidades de referencia. |
| **D** | `3` | `categoria`, `cat` | `string` | Categoría (`Diseñador`, `Árabes`). |
| **E** | `4` | `genero`, `gender` | `string` | Género (`Hombre`, `Mujer`, `Unisex`). |
| **F** | `5` | `pesokg`, `peso` | `number` | Peso en kilogramos. |
| **G** | `6` | `fletexkg`, `fletekg` | `number` | Tarifa de flete aéreo por KG (USD). |
| **H** | `7` | `reempaque` | `number` | Costo de reempaque courier (USD). |
| **I** | `8` | `preciodolartc`, `tc` | `number` | Tipo de cambio en soles. |
| **J** | `9` | `costoperu`, `costo_peru` | `number` | Costo unitario puesto en Perú (PEN). |
| **K** | `10` | `precioventas`, `precioventa` | `number` | Precio de venta sugerido al público (PEN). |
| **L** | `11` | `costosextras`, `extras` | `number` | Costos extras locales (delivery/cajas) (PEN). |
| **M** | `12` | `ganancias`, `ganancia` | `number` | Ganancia neta calculada (PEN). |
| **N** | `13` | `imagen`, `img`, `foto` | `string` | URL absoluta de la fotografía del perfume. |
| **O** | `14` | `estadocatalogo`, `estado`, `status` | `string` | Disponibilidad comercial (`Disponible` vs `No disponible`). |

---

## 2. Autenticación, Roles y Permisos

- **Autenticación:** No existe sistema de inicio de sesión, contraseñas, tokens JWT ni cuentas de usuario.
- **Roles y Permisos:** Todos los usuarios que acceden a la aplicación tienen el mismo nivel de acceso (usuario final con capacidades completas de cálculo, guardado local y configuración de sus propios valores base).
- **Protección de Datos:**
  - El catálogo de Google Sheets está publicado como recurso web de **solo lectura**. Nadie puede modificar la hoja desde la aplicación.
  - Las cotizaciones y configuraciones se guardan localmente en el navegador de cada usuario. No hay acceso cruzado entre dispositivos ni usuarios.

---

## 3. Integraciones y Servicios Externos

1. **Google Sheets CSV Endpoint:**
   - URL oficial configurada:
     `https://docs.google.com/spreadsheets/d/e/2PACX-1vSMxWTEsUiAmYSnu8ra29ku79UTtObn2EnphEEabBODeDZDdXUVcHqI85RnXSvSHBuRthVUlbsWnCy_/pub?output=csv`
   - Protocolo: HTTPS GET sin autenticación.
   - Parámetros añadidos: `_t=<timestamp>` para invalidar el almacenamiento en caché del proxy de Google.
2. **Google Fonts CDN:**
   - Tipografías: `Cinzel` (títulos de alta gama) y `Outfit` (números e interfaz limpia).
   - Enlace: `https://fonts.googleapis.com` con `preconnect`.
   - Si no hay conexión, el CSS recurre a la pila nativa del sistema (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`).
3. **Web App Manifest & Service Worker API:**
   - Manejo interno del navegador para funcionamiento offline y comportamiento de aplicación nativa.

---

## 4. Variables de Entorno y Secretos

- **Variables de Entorno (`.env`):**  
  **Ninguna requerida en tiempo de ejecución.** La aplicación es 100% estática para el lado del cliente (*client-side only*).
- **Archivo `.gitignore`:**  
  Excluye adecuadamente `.env` y `.env.local` por buena práctica preventiva, pero no existen variables secretas ni llamadas autenticadas con API Keys privadas. La URL de Google Sheets es pública por diseño mediante la opción "Publicar en la web" de Google Drive.

---

## 5. Requisitos y Comandos del Proyecto

### 5.1. Requisitos del Sistema

- **Para desarrollo y ejecución de pruebas:**
  - Node.js versión `>= 18.0.0` (Probado y verificado en `Node v23.3.0`).
  - Python 3 con librería `Pillow` (Opcional, únicamente para ejecutar `scripts/generate_icons.py`).
- **Para ejecutar la aplicación:**
  - Cualquier navegador moderno compatible con ES6 y Service Workers (Safari iOS 14+, Chrome 90+, Edge 90+, Firefox 90+).
  - Cualquier servidor web estático local o remoto.

---

### 5.2. Comandos Reales Verificados por Ejecución

Todos los siguientes comandos fueron ejecutados y comprobados en este entorno:

```bash
# 1. Ejecución de la suite matemática de importación (Fórmulas Excel)
# Resultado comprobado: 11 casos exitosos, código de salida 0
node tests/calculator.test.js

# 2. Ejecución de la suite de validación de filtros y contadores de catálogo
# Resultado comprobado: Todas las aserciones superadas, código de salida 0
node tests/catalog-filters.test.js

# 3. Ejecución de la suite de validación estática interna (IDs, inputs, fórmulas)
# Resultado comprobado: 0 errores detectados, código de salida 0
node tests/validate-app.js

# 4. Comprobación del estado del repositorio Git
git status
```

---

### 5.3. Comandos Documentados (Disponibles en el Código)

Comandos presentes en los archivos del proyecto pero que dependen de servicios auxiliares:

```bash
# 5. Prueba de conexión y parser con Google Sheets
# Nota: Conecta en vivo con Google Sheets. Actualmente arroja error en una aserción estática de nombre por cambio de orden remoto.
node tests/sheets.test.js

# 6. Prueba End-to-End con Edge Headless vía Chrome DevTools Protocol
# Requiere levantar previamente un servidor en el puerto 8085
node tests/cdp-desktop-test.js

# 7. Regeneración de todos los iconos de la marca desde logosDP/logocotizador.jpeg
python scripts/generate_icons.py

# 8. Servidor de desarrollo local (cualquiera de las siguientes opciones)
npx serve .
# o con Python:
python -m http.server 8085
```

---

## 6. Configuración de Despliegue (GitHub Pages)

El proyecto está configurado para desplegarse de manera directa y gratuita en **GitHub Pages**:

1. **Rutas Relativas Obligatorias:**  
   Todos los enlaces a recursos en `index.html`, `style.css`, `manifest.json` y `service-worker.js` emplean `./` (rutas relativas) para garantizar compatibilidad con subdominios o subcarpetas de GitHub (`https://usuario.github.io/repositorio/`).
2. **Configuración de GitHub Pages:**
   - **Rama de origen:** `main`.
   - **Carpeta:** `/ (root)`.
3. **Caché y Actualizaciones en Producción:**  
   Para desplegar cambios de CSS o JS evitando que los navegadores mantengan versiones en caché obsoletas, se aplican dos técnicas:
   - Parámetro de versión en `index.html`: `<link rel="stylesheet" href="./style.css?v=2.4">` y `<script src="./app.js?v=2.4"></script>`.
   - Nombre de caché en `service-worker.js`: `const CACHE_NAME = 'dunes-parfums-v2.4';`.
