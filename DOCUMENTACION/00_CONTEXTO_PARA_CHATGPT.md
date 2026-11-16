# DUNES PARFUMS — Contexto General para Asistentes de IA (ChatGPT)

> **Fecha del análisis:** 16 de noviembre de 2026  
> **Versión de la aplicación:** v2.4 (PWA Offline / GitHub Pages)  
> **Alcance revisado:** Código fuente completo (`index.html`, `style.css`, `app.js`, `js/calculator.js`, `service-worker.js`, `manifest.json`), suites de pruebas automatizadas en `tests/`, especificaciones e historial de Git hasta el commit `743935d` (*IMAGE*).  
> **Propósito:** Proveer un punto de entrada autónomo, compacto y sin ambigüedades para que cualquier nuevo asistente comprenda el estado real del proyecto y pueda continuar el desarrollo de inmediato.

---

## 1. Identificación y Objetivo del Proyecto

- **Nombre:** **DUNES PARFUMS** (DUNES-APP)
- **Tipo de Aplicación:** PWA (*Progressive Web App*) móvil y de escritorio, tipo *Single Page Application* (SPA), construida con JavaScript y CSS vainilla (sin dependencias ni frameworks de frontend).
- **Objetivo Comercial:** Proporcionar a dueños de tiendas, revendedores e importadores de perfumería de alta gama en Perú una herramienta financiera precisa para calcular costos de importación de EE.UU. a Perú vía Courier (flete aéreo por peso, reempaque por caja, aranceles/tipo de cambio, gastos locales de entrega, ganancia neta y margen comercial), consultar un catálogo de perfumes sincronizado en vivo con Google Sheets y conservar cotizaciones localmente.

---

## 2. Usuarios y Experiencia de Uso

- **Destinatarios:** Importadores y emprendedores de perfumería (*retail* y *dropshipping* personal en Perú).
- **Entorno de uso principal:** Navegadores móviles, primordialmente Safari en iPhone (con soporte para Notch/Dynamic Island y opción "Agregar a pantalla de inicio"), además de navegadores de escritorio (Chrome, Edge).
- **Funcionamiento Offline:** Capacidad 100% autónoma sin conexión a internet una vez cargada la PWA gracias a su *Service Worker* (`dunes-parfums-v2.4`) y almacenamiento en `localStorage`.

---

## 3. Resumen de Funcionamiento y Módulos

La aplicación opera con navegación por pestañas en una sola vista sin recarga (`index.html`):

1. **Catálogo (Pantalla Inicial Predeterminada):**  
   Descarga y procesa un CSV público generado por Google Sheets (15 columnas normalizadas A-O). Posee buscador predictivo en tiempo real con *debounce* (100 ms), filtros combinables de *Categoría* (Todos / Diseñador / Árabes), *Género* (Todos / Hombre / Mujer — incluyendo Unisex de forma inclusiva) y *Estado* (Todos / Disponibles / Agotados), contador fijo de inventario general (`🟢 X DISPONIBLES • 🔴 Y AGOTADOS`) y contador dinámico de resultados (`X perfumes encontrados`). Las tarjetas Luxury muestran imagen con *Lazy Loading* vía `IntersectionObserver`, precio USA, grilla central (Costo Perú, Venta, Ganancia y % Margen calculado) y pie con datos de cálculo. Cuenta con caché de nodos DOM (`tarjetaDomCache`) para máximo rendimiento.  
   *Regla crítica:* El catálogo es estrictamente de solo lectura; la app no modifica ni edita la hoja remota.
2. **Cotizador:**  
   Formulario de 3 bloques (*Compra USA*, *Flete/Courier*, *Costos Perú/Venta*). Realiza cálculos reactivos en tiempo real con fórmulas extraídas de `COTIZADOR IMPORTACION DUNES PARFUMS.xlsx`. Permite guardar la cotización, iniciar nueva cotización o restaurar campos. Incluye reempaque dinámico proporcional según la regla de caja courier de 4 perfumes (`Cantidad × (Precio Caja ÷ 4)`), con soporte de sobreescritura manual.
3. **Cotizaciones Guardadas (Historial Local):**  
   Muestra tarjetas táctiles guardadas en `localStorage` (`dunes_cotizaciones_v1`), con resumen de costo unitario, venta, ganancia y margen. Incluye modal de desglose exhaustivo, botón para recargar la cotización en el formulario de edición y eliminación individual o total.
4. **Configuración de Costos Base (Modal):**  
   Permite al usuario definir y guardar tarifas base predeterminadas (peso base, envío por KG, precio de reempaque por caja de 4 perfumes, tipo de cambio y costos extras) o restaurar los valores de fábrica DUNES (`FACTORY_DEFAULTS`).

---

## 4. Tecnologías Principales y Arquitectura

- **Frontend:** HTML5 semántico + CSS3 puro (variables CSS `:root`, diseño mobile-first, paleta de lujo obsidiana/dorado/esmeralda, soporte de `env(safe-area-inset-*)`) + JavaScript Vainilla ES6+ modular.
- **Sin Bundlers ni Transpiladores:** No utiliza Webpack, Vite, React, Vue ni dependencias `npm` en ejecución. Corre directamente en cualquier servidor web estático o GitHub Pages.
- **Persistencia Local:** `localStorage` (`dunes_cotizaciones_v1`, `dunes_config_base_v1`, `dunes_last_inputs_v1`, `dunes_catalogo_cache_v2`, `dunes_google_sheets_url_v1`, `dunes_catalogo_last_sync_v1`).
- **PWA & Offline:** `service-worker.js` (con proxy `sw.js`) con estrategia *Cache First* y actualización dinámica (`dunes-parfums-v2.4`); `manifest.json` para modo *standalone*.
- **Integración Externa:** `fetch` directo al enlace CSV público de Google Sheets con control de tiempo de espera (`AbortController`, 10s) y *cache-busting* (`_t=timestamp`).
- **Optimización DOM y Memoria:** Reutilización de nodos DOM (`tarjetaDomCache`), prenormalización de textos (`prepararCamposBusqueda`), sets de imágenes (`imagenesCargadas`, `imagenesFallidas`) e inserción por `DocumentFragment` con `replaceChildren`.
- **Pruebas y Automatización:** Suites basadas en `node:assert` ejecutables sin librerías externas (`node tests/...`).

---

## 5. Estado de Implementación

| Módulo / Característica | Estado | Evidencia |
| :--- | :--- | :--- |
| **Catálogo Google Sheets (Pantalla de Inicio)** | Implementado y Optimizado | `app.js:1318-1848`, arranque garantizado en Catálogo (`app.js:2060`). |
| **Tarjetas Luxury con % Margen y Caché DOM** | Implementado y Verificado | Commits `34526e3` y `743935d`, `tarjetaDomCache` y `.trio-sub-margen`. |
| **Lazy Loading de Imágenes y Shimmer** | Implementado y Verificado | `IntersectionObserver` activo en `app.js:1550-1643`. |
| **Buscador con Debounce y Filtros Combinados** | Implementado y Verificado | Debounce (100 ms), normalización sin acentos, verificado en `tests/catalog-filters.test.js`. |
| **Motor Matemático Courier** | Implementado y Verificado | `js/calculator.js`, 11 casos de prueba aprobados en `tests/calculator.test.js`. |
| **Cotizador en Tiempo Real** | Implementado y Verificado | Interfaz y reactividad en `app.js` verificadas mediante `tests/validate-app.js`. |
| **Reempaque Inteligente (Caja de 4)** | Implementado y Verificado | Tarifa de caja fija distribuida en 4 unidades (`costoCaja / 4`), con edición manual opcional. |
| **Historial en LocalStorage con Modal** | Implementado y Verificado | Métodos `obtenerHistorial()`, `guardarHistorial()`, modal de desglose y recarga al cotizador. |
| **Service Worker & PWA v2.4** | Implementado | `service-worker.js` (`dunes-parfums-v2.4`), `manifest.json`, iconos completos en `assets/`. |
| **Test E2E Headless (Edge CDP)** | Implementado en script | `tests/cdp-desktop-test.js` (requiere servidor local activo en puerto 8085). |

---

## 6. Problemas Detectados y Limitaciones Conocidas

1. **Test `tests/sheets.test.js` falla en aserción rígida de fila en vivo:**  
   El test espera que el primer perfume sea `'9 Am Dive 3.4 Oz Edp Unisex'`, pero la hoja remota de Google Sheets cambió su ordenamiento y devolvió `'First Instinct Blue 3.4 Oz Edp Women'`. El parser y la conexión funcionan correctamente; la falla radica en una aserción estática frente a datos dinámicos.
2. **Ausencia de `package.json`:**  
   El proyecto no cuenta con manifiesto de Node.js ni scripts tipo `npm test`. Los tests deben invocarse individualmente vía `node tests/<nombre>.js`.
3. **Duplicidad de carpetas de recursos:**  
   Existen copias de iconos en `./icons/` y `./assets/`. `index.html` y `service-worker.js` enlazan prioritariamente `./assets/`.
4. **URL de Google Sheets embebida como fallback:**  
   La URL por defecto está hardcodeada en `app.js:21`. Si cambia la hoja oficial, se puede sobreescribir vía `localStorage` (`dunes_google_sheets_url_v1`).
5. **No hay edición bidireccional:**  
   No es posible editar inventario ni añadir perfumes desde la app; todo cambio de catálogo debe realizarse directamente en la hoja de cálculo de Google.

---

## 7. Rutas Clave del Repositorio

- **`index.html`:** Estructura de la aplicación, metadatos PWA y vistas (`vista-catalogo`, `vista-cotizador`, `vista-cotizaciones`, modal de configuración y detalle).
- **`style.css`:** Sistema de diseño completo, variables de color, tipografía de lujo, estilos de tarjetas de catálogo y cotizador, y media queries responsivas.
- **`app.js`:** Controlador principal (2,063 líneas), enrutador de pestañas, gestión de eventos, sincronización de Google Sheets, caché DOM y observadores.
- **`js/calculator.js`:** Motor matemático desacoplado de la interfaz; exporta `calculateDunesQuotation()` para Node y el navegador.
- **`service-worker.js`:** Manejo de caché offline versión `dunes-parfums-v2.4` con rutas relativas para compatibilidad con GitHub Pages.
- **`tests/calculator.test.js`:** Pruebas unitarias de las fórmulas de importación (11 casos).
- **`tests/catalog-filters.test.js`:** Pruebas unitarias de filtros, acordeón y contadores del catálogo.
- **`tests/validate-app.js`:** Suite de integridad estática que comprueba 46 IDs entre HTML y JS, fórmulas y archivos PWA.
- **`tests/sheets.test.js`:** Pruebas del parser RFC 4180 y mapeo de columnas A-O.

---

## 8. Guía Esencial para Continuar Trabajando

1. **Regla de Oro:** Mantener la arquitectura Vanilla JS/CSS sin frameworks ni transpiladores para preservar la ligereza y el despliegue directo en GitHub Pages.
2. **Ejecución de Pruebas Automatizadas:**
   ```bash
   node tests/calculator.test.js
   node tests/catalog-filters.test.js
   node tests/validate-app.js
   ```
3. **Servidor Local para Desarrollo:**
   Cualquier servidor HTTP local que sirva la carpeta raíz es suficiente:
   ```bash
   # Opción Node (sin instalación previa)
   npx serve .
   # Opción Python
   python -m http.server 8085
   ```
4. **Despliegue:**  
   El repositorio está preparado para desplegarse mediante GitHub Pages directamente desde la raíz (`/`) de la rama `main`.

---

## 9. Índice y Orden de Lectura de la Documentación

Para una comprensión completa y estructurada del sistema, lee los documentos en este orden:

1. [**`00_CONTEXTO_PARA_CHATGPT.md`**](./00_CONTEXTO_PARA_CHATGPT.md) *(Este documento)*: Visión ejecutiva, reglas base y resumen operativo.
2. [**`01_ARQUITECTURA_Y_ESTRUCTURA.md`**](./01_ARQUITECTURA_Y_ESTRUCTURA.md): Árbol de archivos, arquitectura de interfaz, optimizaciones de DOM, flujo de datos y dependencias internas.
3. [**`02_FUNCIONALIDADES_Y_FLUJOS.md`**](./02_FUNCIONALIDADES_Y_FLUJOS.md): Detalle técnico de cada funcionalidad (Catálogo Sheets con % margen, Cotizador, Historial, Reempaque de Caja).
4. [**`03_DATOS_CONFIGURACION_Y_EJECUCION.md`**](./03_DATOS_CONFIGURACION_Y_EJECUCION.md): Estructuras de datos (`localStorage`, columnas Google Sheets A-O), variables y comandos de ejecución.
5. [**`04_ESTADO_ACTUAL_Y_PENDIENTES.md`**](./04_ESTADO_ACTUAL_Y_PENDIENTES.md): Resultados de pruebas reales, análisis de deuda técnica, hallazgos de Git y pendientes.
6. [**`05_CONTINUIDAD_Y_CAMBIOS.md`**](./05_CONTINUIDAD_Y_CAMBIOS.md): Historial de decisiones de diseño, convenciones a respetar y registro de cambios hasta v2.4.
