# DUNES PARFUMS — Estado Actual, Pruebas y Deuda Técnica

> **Fecha del análisis:** 16 de noviembre de 2026  
> **Versión de la aplicación:** v2.4 (PWA Offline / GitHub Pages)  
> **Alcance revisado:** Ejecución real de suites de prueba con Node.js v23.3.0, inspección de árboles de código, análisis de Git hasta commit `743935d` e identificación de puntos de mejora.

---

## 1. Estado de Git y Entorno de Trabajo

- **Rama Actual:** `main` (Sincronizada con `origin/main`).
- **Commit HEAD:** `743935d80bed66a34ca5f3957b7cce7a9e092524`  
  *Mensaje de commit:* `IMAGE` (17 de octubre de 2026).
- **Commits Recientes Clave:**
  - `743935d`: Implementación de arranque garantizado en Catálogo (`vistaActiva = 'catalogo'`), motor de caché DOM (`tarjetaDomCache`), conjuntos de imágenes (`imagenesCargadas`, `imagenesFallidas`), prenormalización de búsqueda (`prepararCamposBusqueda`) y optimización de observador de lazy loading.
  - `34526e3`: Integración del cálculo y visualización de `% Margen` en las tarjetas del catálogo (`.trio-sub-margen`).
  - `501d2de`: Separación estricta del contador fijo de inventario general y el contador dinámico de resultados coincidentes.
- **Entorno de Ejecución:** Windows, Shell PowerShell, Node.js v23.3.0.

---

## 2. Pruebas Automatizadas Realizadas y Resultados

Se ejecutaron las 4 suites de prueba en el entorno local. A continuación se detallan los resultados comprobados por ejecución:

### 2.1. Suite Matemática (`tests/calculator.test.js`)
- **Comando:** `node tests/calculator.test.js`
- **Resultado:** **Aprobada al 100% (Código de salida: 0)**.
- **Detalle de casos verificados:**
  - Caso 1: Caso original de Excel (`20.90 USD`, flete `8.00 USD`, costo Perú `99.71 PEN`, ganancia `75.30 PEN`).
  - Caso 2: Prompt maestro (`33.50 USD`, flete `5.70 USD`, reempaque `$1.00`, venta `175 PEN`, ganancia `23.32 PEN`, margen `13.33%`).
  - Caso 3: Múltiples unidades y precio venta en cero (sin valores `NaN` en margen).
  - Caso 4: Flete proporcional por cantidad de unidades (`(peso * cantidad) * envioKg`).
  - Caso 5: Validación Dior Sauvage con 2 unidades.
  - Casos 6 a 11: Reempaque dinámico y proporcional por caja fija de 4 perfumes ($1.00/ud con caja a $4.00, $1.25/ud con caja a $5.00, y sobreescritura manual).

---

### 2.2. Suite de Filtros y Contadores (`tests/catalog-filters.test.js`)
- **Comando:** `node tests/catalog-filters.test.js`
- **Resultado:** **Aprobada al 100% (Código de salida: 0)**.
- **Detalle de casos verificados:**
  - Existencia de controles en HTML (`#btn-toggle-filtros`, `#catalog-filters-collapsible`, `#catalogo-contador-resultados`).
  - Filtro Categoría: `Diseñador` y `Árabes`.
  - Filtro Género: `Hombre` incluye Hombre + Unisex; `Mujer` incluye Mujer + Unisex.
  - Filtro Estado: `Disponibles` y `Agotados`.
  - Filtros combinados múltiples.
  - Separación comprobada: El contador superior (`#catalogo-contador`) mantiene fijo el total del inventario (`🟢 X DISPONIBLES • 🔴 Y AGOTADOS`), mientras que `#catalogo-contador-resultados` refleja el conteo de coincidencias (`X perfumes encontrados`).

---

### 2.3. Suite de Integridad Estática (`tests/validate-app.js`)
- **Comando:** `node tests/validate-app.js`
- **Resultado:** **Aprobada al 100% (Código de salida: 0)**.
- **Detalle de casos verificados:**
  - Verificación sintáctica sin errores en `app.js`, `js/calculator.js`, `service-worker.js` y `sw.js`.
  - Correspondencia exacta de **46 IDs** entre `index.html` y los selectores de `app.js`.
  - Verificación matemática headless contra los casos de prueba del Excel.
  - Verificación de existencia física de archivos obligatorios de despliegue (`manifest.json`, `service-worker.js`, iconos en `assets/` y `README.md`).

---

### 2.4. Suite de Catálogo Google Sheets (`tests/sheets.test.js`)
- **Comando:** `node tests/sheets.test.js`
- **Resultado:** **FALLA DE ASERCIÓN ESTÁTICA EN CASO 2 (Código de salida: 1)**.
- **Diagnóstico del Error:**
  ```text
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'First Instinct Blue 3.4 Oz Edp Women'
  - '9 Am Dive 3.4 Oz Edp Unisex'
      at runTests (C:\Users\Lucas\Desktop\DUNES-APP\tests\sheets.test.js:222:12)
  ```
- **Causa Raíz:**  
  El test conecta exitosamente a internet y descarga el CSV en vivo desde Google Drive. Sin embargo, la línea 222 del test tiene escrita una expectativa fija (`assert.strictEqual(items[0].producto, '9 Am Dive 3.4 Oz Edp Unisex')`). Dado que la hoja remota fue editada o reordenada por los dueños de la tienda, la primera fila actual es `'First Instinct Blue 3.4 Oz Edp Women'`.
- **Impacto:** Bajo para la aplicación en producción (la app parsea y muestra todos los perfumes sin problemas), pero representa un test frágil que debe actualizarse para no depender de la ordenación de una fuente externa cambiante. El Caso 1 (parser RFC 4180) y el Caso 3 (generación de HTML Luxury) pasan limpiamente.

---

## 3. Deuda Técnica y Observaciones del Código

### 3.1. Inconsistencias y Redundancias

1. **Duplicidad de Carpetas de Iconos (`./assets/` vs `./icons/`):**  
   Existen copias idénticas de los iconos en ambas carpetas. `index.html` y `service-worker.js` apuntan primordialmente a `./assets/`. `./icons/` es redundante pero se conserva para evitar enlaces rotos históricos.
2. **Dualidad de Service Workers (`service-worker.js` vs `sw.js`):**  
   `service-worker.js` es el archivo real con la versión `dunes-parfums-v2.4`. `sw.js` contiene únicamente una línea `importScripts('./service-worker.js');`.
3. **Falta de Manifiesto `package.json`:**  
   El repositorio no posee `package.json`. No se pueden ejecutar scripts estándar (`npm test`, `npm run lint`). Los desarrolladores deben conocer de antemano las rutas de los archivos dentro de `tests/`.
4. **URL de Google Sheets en Código Duro:**  
   La constante `DEFAULT_SHEETS_CSV_URL` está escrita dentro de `app.js:21`. Aunque `localStorage` permite almacenar una URL alternativa (`dunes_google_sheets_url_v1`), no hay una interfaz visual en el modal de configuración para que el usuario ingrese una nueva URL de Google Sheets sin tocar la consola del navegador.
5. **Monolito de Control en `app.js` (2,063 líneas):**  
   `app.js` concentra la gestión de eventos, lógica de cotización, persistencia, modal de detalle, modal de configuración, descarga de Google Sheets, parser de CSV, filtrado, observador de lazy loading y la caché de nodos DOM.

---

## 4. Aspectos que Requieren Validación en Dispositivos Reales

1. **Comportamiento háptico y Safe Areas en iOS Safari:**  
   Verificar el espaciado en dispositivos reales con Dynamic Island (iPhone 14 Pro, 15, 16) para confirmar que `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)` eviten solapamientos con la barra de gestos inferior y el notch.
2. **Ciclo de Vida Offline en Dispositivo Móvil:**  
   Validar que al activar el modo avión en un iPhone con la app instalada en la pantalla de inicio, la aplicación cargue de inmediato desde la caché del Service Worker y que el indicador de estado cambie adecuadamente a "Offline (PWA)".
3. **Rendimiento con Hojas de Cálculo Masivas (> 500 productos):**  
   Aunque la caché de nodos DOM (`tarjetaDomCache`) y el *debounce* resuelven el cuello de botella en el catálogo actual, convendría probar la carga si el catálogo crece exponencialmente.

---

## 5. Pendientes Explícitos Detectados en el Contexto

1. **Flexibilizar `tests/sheets.test.js`:** Reemplazar la comprobación rígida `items[0].producto === '9 Am Dive...'` por una búsqueda de existencia (`items.some(p => p.producto.includes(...))`) para que el test no falle cuando se agreguen o muevan filas en Google Sheets.
2. **Campo UI para URL de Google Sheets:** Añadir un campo de texto en el modal de configuración (`#modal-configuracion`) que permita cambiar la URL de Google Sheets directamente desde la interfaz y guardarla en `dunes_google_sheets_url_v1`.

---

## 6. Mejoras Sugeridas (Separadas de los Requisitos Confirmados)

> [!NOTE]  
> Las siguientes sugerencias son propuestas técnicas para futuros ciclos de desarrollo y **no constituyen decisiones tomadas por el usuario**.

1. **Exportación de Cotizaciones a WhatsApp / PDF:**  
   Permitir que el usuario comparta la tarjeta de cotización formateada directamente a clientes por WhatsApp (`navigator.share`) o la guarde en formato imagen o PDF.
2. **Transferir Producto del Catálogo al Cotizador con un Toque:**  
   Permitir pulsar una tarjeta del Catálogo para transferir automáticamente su nombre, precio USA y peso al Cotizador y realizar ajustes rápidos.
3. **Incorporación de `package.json` ligero:**  
   Crear un `package.json` mínimo sin dependencias en producción que solo contenga scripts de npm para testing local.
4. **Modularización de `app.js` con Módulos ES6:**  
   Dividir `app.js` en submódulos limpios (`js/quotation.js`, `js/history.js`, `js/catalog.js`, `js/config.js`).
