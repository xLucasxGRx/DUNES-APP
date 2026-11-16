# 🌙 DUNES PARFUMS APP (v2.4)

> **Catálogo interactivo y cotizador profesional de importación de perfumes USA 🇺🇸 → Perú 🇵🇪 por Courier**

Aplicación móvil web progresiva (**PWA**) diseñada para **DUNES PARFUMS**. Permite consultar en tiempo real el catálogo oficial sincronizado con **Google Sheets**, así como calcular con precisión matemática los costos de flete aéreo, reempaque por caja, tipo de cambio, costo puesto en Perú por unidad, ganancias netas y márgenes de rentabilidad, con persistencia local y soporte **100% offline**.

---

## ✨ Características Principales

- **📖 Catálogo Oficial Sincronizado con Google Sheets (Vista Principal)**:
  - **Modo Solo Consulta**: Google Sheets actúa como única fuente de verdad y edición; la aplicación consume y presenta el catálogo con estética de perfumería de lujo.
  - **Contador de Inventario en Vivo**: Resumen comercial fijo (`🟢 DISPONIBLES` • `🔴 AGOTADOS`) y contador dinámico de resultados filtrados.
  - **Buscador Instantáneo y Filtros Avanzados**: Búsqueda con *debounce* (100 ms) e indexación normalizada sin tildes en memoria, acompañada de un panel desplegable de filtros por **Categoría** (`Todos`, `Diseñador`, `Árabes`), **Género** (`Todos`, `Hombre` + Unisex, `Mujer` + Unisex) y **Estado** (`Todos`, `Disponibles`, `Agotados`).
  - **Tarjetas Luxury de Alto Rendimiento**: Diseño de 1 tarjeta por fila con miniatura de producto (*Lazy Loading* vía `IntersectionObserver` y *shimmer placeholder*), precio USA en el encabezado, grilla central (*Costo Perú*, *Venta*, *Ganancia* y *% Margen*) y pie compacto con el desglose técnico. Reutiliza nodos DOM en caché (`tarjetaDomCache`) para evitar parpadeos al filtrar o sincronizar.
- **⚡ Cotizador en Tiempo Real**:
  - **Fórmulas Exactas de Courier**: Basado estrictamente en la hoja financiera `COTIZADOR IMPORTACION DUNES PARFUMS.xlsx`.
  - **Reempaque Dinámico Inteligente**: Calcula automáticamente el reempaque según la cantidad de unidades y el costo de caja de 4 perfumes (`Cantidad × (Precio Caja ÷ 4)`), permitiendo además edición manual directa.
  - **Memoria Inteligente de 3 Niveles**: Prioriza automáticamente: 1) Últimos valores ingresados por el usuario, 2) Configuración base personalizada, y 3) Valores de fábrica DUNES.
- **📋 Historial de Cotizaciones Guardadas**:
  - Almacenamiento persistente en el dispositivo (`LocalStorage`), vista de tarjetas resumidas, modal con el desglose completo de las 15 métricas y botón **"Editar en Cotizador"** para recargar cualquier cotización previa.
- **⚙️ Configuración de Costos Base**:
  - Modal dedicado para definir tarifas predeterminadas de courier (peso base, tarifa por KG, precio de caja de reempaque de 4 unidades, tipo de cambio y costos extras locales) o restaurar los valores de fábrica.
- **📱 Experiencia Nativa iOS / Android & 100% Offline (PWA)**:
  - *Splash Screen* de bienvenida, estética oscura (*Obsidian & Gold*), soporte para *Safe Area Insets* en iPhone, indicador de conexión en vivo (`Online` / `Offline (PWA)`) y caché mediante Service Worker (`dunes-parfums-v2.4`).

---

## 🧭 Módulos de Navegación

| Pestaña | Función Principal |
| :--- | :--- |
| **📖 Catálogo** | Pantalla inicial predeterminada. Consulta de catálogo conectado a Google Sheets con buscador, filtros combinables y estado de stock. |
| **⚡ Cotizador** | Calculadora interactiva de importación USA → Perú en tiempo real con alertas de validación y barra visual de margen. |
| **📋 Cotizaciones** | Archivo histórico local con modal de desglose detallado, recarga al formulario y limpieza de historial. |
| **⚙️ Configuración** | Ajuste de parámetros logísticos base y restauración a valores predeterminados de fábrica. |

---

## 📐 Motor de Cálculos (Fórmulas Financieras)

| Métrica | Fórmula Matemática |
| :--- | :--- |
| **Total Costo USA ($)** | `Precio Unitario USA × Cantidad` |
| **Flete Aéreo ($)** | `(Peso KG × Cantidad) × Costo Envío por KG` |
| **Costo Reempaque por Unidad ($)** | `Precio Reempaque Caja (4 uds) ÷ 4` |
| **Reempaque Total ($)** | `Cantidad × Costo Reempaque por Unidad` *(o valor manual)* |
| **Total Gasto Envío ($)** | `Flete Aéreo + Reempaque Total` |
| **Precio Total USD ($)** | `Total Costo USA + Total Gasto Envío` |
| **Precio Total Soles (S/)** | `Precio Total USD × Tipo de Cambio` |
| **Costo Puesto en Perú C/U (S/)** | `Precio Total Soles ÷ Cantidad` |
| **Ganancia Neta por Unidad (S/)** | `Precio Venta Público - Costo por Unidad - Costos Extras Locales` |
| **Ganancia Total Lote (S/)** | `Ganancia por Unidad × Cantidad` |
| **Margen sobre Venta (%)** | `(Ganancia por Unidad ÷ Precio Venta Público) × 100` |

### Valores de Fábrica Predeterminados (`FACTORY_DEFAULTS`)
- **Cantidad**: `1 ud`
- **Peso por perfume**: `0.60 KG`
- **Costo de envío courier**: `$ 9.50 / KG`
- **Precio reempaque por caja (4 perfumes)**: `$ 4.00` (`$ 1.00` por perfume)
- **Tipo de cambio (T.C.)**: `S/ 3.40`
- **Costos extras locales (Perú)**: `S/ 15.00` (delivery, empaque, decant)

---

## 📊 Estructura de Google Sheets para el Catálogo

El módulo **Catálogo** consume automáticamente un archivo CSV publicado desde Google Sheets (con soporte de mapeo flexible por nombre de encabezado y respaldo por posición de columna `A-O`, además de retrocompatibilidad con `A-K`):

| Columna | Campo | Descripción |
| :---: | :--- | :--- |
| **A** | `Producto` | Nombre del perfume y presentación (ej. *9 Am Dive 3.4 Oz Edp Unisex*) |
| **B** | `Precio USA ($)` | Costo unitario de compra en EE. UU. |
| **C** | `Cantidad` | Unidades cotizadas en la fila (por defecto `1`) |
| **D** | `Categoría` | `Diseñador` o `Árabes` |
| **E** | `Género` | `Hombre`, `Mujer` o `Unisex` *(Unisex se incluye al filtrar por Hombre o Mujer)* |
| **F** | `Peso KG` | Peso unitario en kilogramos |
| **G** | `Flete x KG` | Tarifa de courier por kilogramo (`$`) |
| **H** | `Reempaque` | Costo de reempaque asignado (`$`) |
| **I** | `Precio Dólar (T.C)` | Tipo de cambio aplicado (`S/`) |
| **J** | `Costo Perú` | Costo unitario puesto en Perú (`S/`) |
| **K** | `Precio Venta (S/.)` | Precio de venta al público en Perú (`S/`) |
| **L** | `Costos extras` | Gastos operativos/entrega locales (`S/`) |
| **M** | `Ganancia (S/.)` | Utilidad neta por unidad (`S/`) |
| **N** | `Imagen` | URL pública (`http`/`https`) de la miniatura del perfume *(opcional)* |
| **O** | `Estado catálogo` | `Disponible` o `No disponible` *(marca la tarjeta como `AGOTADO`)* |

---

## 📱 Cómo Instalar en iPhone / Android (PWA)

### En iPhone (Safari)
1. Abre la aplicación en **Safari**.
2. Toca el botón **Compartir** (cuadrado con flecha hacia arriba en la barra inferior).
3. Selecciona **"Agregar a pantalla de inicio"** (*Add to Home Screen*).
4. Pulsa **"Agregar"** en la esquina superior derecha.

### En Android (Chrome)
1. Abre la aplicación en **Google Chrome**.
2. Toca el menú de tres puntos (`⋮`) en la esquina superior derecha.
3. Selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.

---

## 🚀 Publicación en GitHub Pages

### Paso 1: Subir el proyecto a GitHub
```bash
git init
git add .
git commit -m "Release v2.4 DUNES PARFUMS"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### Paso 2: Activar GitHub Pages
1. Entra a tu repositorio en GitHub y ve a **Settings** → **Pages**.
2. En **Build and deployment** → **Source**, elige `Deploy from a branch`.
3. Selecciona la rama `main` y la carpeta `/(root)`, luego presiona **Save**.

---

## 📂 Estructura del Proyecto

```text
DUNES-APP/
│── index.html                # Estructura principal (Catálogo, Cotizador, Historial y Modales)
│── style.css                 # Sistema de diseño Luxury Dark, grillas, animaciones y responsive
│── app.js                    # Controlador principal, sincronización Google Sheets, caché DOM y eventos
│── js/
│   └── calculator.js         # Motor matemático puro de cotización courier
│── service-worker.js         # Service Worker (caché offline v2.4 compatible con GitHub Pages)
│── sw.js                     # Proxy de retrocompatibilidad para el Service Worker
│── manifest.json             # Manifiesto Web App (PWA)
│── favicon.ico               # Favicon en raíz
│── assets/                   # Identidad visual e iconos PWA
│   ├── logocotizador.png     # Logo oficial DUNES PARFUMS (512x512)
│   ├── favicon.ico           # Favicon multi-resolución
│   ├── favicon-16x16.png     # Favicon 16px
│   ├── favicon-32x32.png     # Favicon 32px
│   ├── icon-192.png          # Icono PWA estándar (192x192)
│   ├── icon-512.png          # Icono PWA estándar (512x512)
│   ├── icon-maskable-192.png # Icono PWA maskable para Android (192x192)
│   ├── icon-maskable-512.png # Icono PWA maskable para Android (512x512)
│   └── apple-touch-icon.png  # Icono para pantalla de inicio en iOS (180x180)
│── tests/
│   ├── calculator.test.js    # Pruebas unitarias del motor matemático y reempaque dinámico
│   └── sheets.test.js        # Pruebas del parser CSV (RFC 4180), Google Sheets en vivo y tarjetas UI
│── .gitignore                # Exclusión de archivos temporales
└── README.md                 # Documentación oficial del proyecto
```

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con dos suites de pruebas en Node.js sin dependencias externas:

```bash
# 1. Verificar exactitud de fórmulas financieras y cálculo de reempaque por caja
node tests/calculator.test.js

# 2. Verificar parser CSV, conexión en vivo con Google Sheets y estructura de tarjetas del catálogo
node tests/sheets.test.js
```
