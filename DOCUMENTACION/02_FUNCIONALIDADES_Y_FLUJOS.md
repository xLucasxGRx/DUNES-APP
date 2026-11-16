# DUNES PARFUMS — Funcionalidades y Flujos de Uso

> **Fecha del análisis:** 16 de noviembre de 2026  
> **Versión de la aplicación:** v2.4 (PWA Offline / GitHub Pages)  
> **Alcance revisado:** Interacciones de usuario, controladores en `app.js` (2,063 líneas), validaciones, sincronización con Google Sheets, cálculo dinámico de margen en catálogo, caché DOM de alto rendimiento y suites de pruebas en `tests/`.

---

## 1. Matriz Resumen de Funcionalidades

| Funcionalidad | Estado | Fuente de Datos | Archivos Involucrados |
| :--- | :--- | :--- | :--- |
| **1. Catálogo Google Sheets (Pantalla Principal)** | Implementada y Optimizada | Google Sheets publicado (CSV en vivo) + Caché local | `index.html`, `app.js`, `style.css` |
| **2. Tarjetas Luxury con % Margen Calculado** | Implementada y Verificada | Memoria (`catalogoProductos`) | `app.js:1370-1473`, `style.css` (`.trio-sub-margen`) |
| **3. Motor de Alto Rendimiento con Caché DOM** | Implementada y Verificada | Memoria (`tarjetaDomCache`, Sets de imágenes) | `app.js:1351-1473`, `replaceChildren()` |
| **4. Buscador con Debounce y Filtros Combinados** | Implementada y Verificada | Memoria (`catalogoProductos`) | `app.js`, `index.html`, `tests/catalog-filters.test.js` |
| **5. Contadores Diferenciados de Inventario** | Implementada y Verificada | Memoria (`catalogoProductos`) | `app.js:1475-1518`, `tests/catalog-filters.test.js` |
| **6. Lazy Loading de Imágenes con Shimmer** | Implementada y Verificada | URLs remotas desde Google Sheets (Columna N) | `app.js:1550-1643` (`IntersectionObserver`) |
| **7. Cotizador Financiero en Tiempo Real** | Implementada y Verificada | Entrada del usuario + memoria local | `index.html`, `app.js`, `js/calculator.js` |
| **8. Reempaque Dinámico basado en Caja (4 Uds)** | Implementada y Verificada | Configuración base / Entrada | `app.js`, `js/calculator.js`, `tests/calculator.test.js` |
| **9. Historial de Cotizaciones con Modal Detallado** | Implementada y Verificada | `localStorage` (`dunes_cotizaciones_v1`) | `index.html`, `app.js`, `style.css` |
| **10. Recarga de Cotización para Edición** | Implementada y Verificada | Objeto en memoria desde `localStorage` | `app.js` (`cargarItemEnFormulario`) |
| **11. Configuración de Tarifas Base** | Implementada y Verificada | `localStorage` (`dunes_config_base_v1`) | `index.html`, `app.js` (`modal-configuracion`) |
| **12. Modo PWA Offline Completo v2.4** | Implementada y Verificada | Cache Storage API + `service-worker.js` | `service-worker.js`, `manifest.json`, `index.html` |

---

## 2. Detalle Exhaustivo por Funcionalidad

### 2.1. Catálogo en Vivo Conectado a Google Sheets (Pantalla de Inicio)

- **Propósito:** Ofrecer a clientes y revendedores la vitrina comercial oficial de DUNES PARFUMS con precios, márgenes y disponibilidad en tiempo real.
- **Regla Crítica de Negocio:**  
  *El catálogo es de estricta consulta (Solo Lectura).* Google Sheets es la única fuente de edición del inventario. La aplicación no contiene formularios de alteración remota de datos.
- **Flujo de Carga y Sincronización:**
  1. La aplicación arranca mostrando de forma predeterminada la pestaña **Catálogo** (`cambiarPestana('catalogo')`).
  2. Si existe caché en `localStorage` (`dunes_catalogo_cache_v2`), se renderiza al instante sin pantalla en blanco.
  3. En paralelo, se lanza un `fetch()` con `AbortController` (timeout 10s) al CSV de Google Sheets añadiendo `_t=Date.now()` para invalidar cachés intermedias.
  4. Si la conexión responde:
     - Se procesan las filas respetando el estándar RFC 4180 (`parsearCSV`).
     - Se mapean las 15 columnas normalizadas A-O (`convertirFilasACatalogo`).
     - Si los datos son nuevos, se actualiza la memoria, la caché local y la hora en `dunes_catalogo_last_sync_v1`.
  5. Si no hay conexión (offline o error de red):
     - Se utilizan los datos cacheados. Si nunca hubo caché, se recurre a `CATALOGO_DEFAULT` (8 fragancias representativas).
     - El indicador cambia a `Modo local (Sin conexión a Sheets)`.

---

### 2.2. Tarjetas Luxury con Cálculo de % Margen y Desglose Técnico

- **Diseño de 1 Tarjeta por Fila:**  
  Cada perfume se presenta en una tarjeta amplia de estética premium (*Obsidian & Gold*), compuesta por 3 zonas:
  1. **Encabezado Comercial:** Miniatura del perfume (o icono `🧴`), nombre de la fragancia con badge de estado y etiqueta de compra USA (`USA $ XX.XX`).
  2. **Grilla Principal (*Trio Grid*):**
     - **Costo Perú:** Valor en soles (`S/`).
     - **Venta:** Precio de venta al público en soles (`S/`).
     - **Ganancia & Margen:** Ganancia neta en soles y porcentaje de rentabilidad sobre venta (`.trio-sub-margen`):
       $$\text{Margen (\%)} = \left(\frac{\text{Ganancia Neta}}{\text{Precio Venta}}\right) \times 100$$
  3. **Pie Técnico Compacto (*Card Footer*):** Una sola línea discreta con todos los datos logísticos de importación:
     `Cantidad ud • Peso kg • Flete $ • Rep $ • TC • Extras S/`.

---

### 2.3. Arquitectura de Alto Rendimiento con Caché de Nodos DOM

Para garantizar una experiencia fluida a 60 FPS en dispositivos móviles durante búsquedas rápidas:
- **`tarjetaDomCache` (`Map`):** Almacena en memoria los nodos DOM generados asociados a una firma de datos (`id|producto|precioUSA|costoPeru|...`).
- **Reutilización de Elementos:** Al filtrar o sincronizar, si los datos del perfume no han cambiado, se reutiliza el mismo nodo HTML intacto. Esto previene re-renderizados costosos, evita el parpadeo de imágenes y mantiene el scroll estable.
- **Inserción Atómica:** Emplea `DocumentFragment` y `replaceChildren()` para actualizar el contenedor de una sola vez.
- **Recolección de Memoria (`podarCacheTarjetas`):** Elimina del mapa de caché aquellos IDs que hayan sido borrados de la hoja de cálculo.

---

### 2.4. Buscador Instantáneo y Filtros Combinados de Catálogo

- **Buscador con Debounce (100 ms):**  
  Evita bloqueos en el hilo principal durante el tipeo acelerado. Utiliza campos prenormalizados en memoria (`prepararCamposBusqueda`) para comparar cadenas en minúsculas y sin acentos (`normalizarTexto`).
- **Acordeón Desplegable de Filtros (`#btn-toggle-filtros`):**  
  Panel colapsable que indica con un punto dorado (`#toggle-filtros-dot`) cuando hay filtros activos distintos a "Todos".
  - **Categoría:** `Todos` | `Diseñador` | `Árabes`.
  - **Género (Regla Inclusiva):** `Todos` | `Hombre` | `Mujer`.  
    *Regla de Negocio:* Las fragancias catalogadas como `Unisex` se visualizan tanto en `Hombre` como en `Mujer`.
  - **Estado:** `Todos` | `Disponibles` | `Agotados`.  
    Detecta la columna O (`Disponible` vs `No disponible`). Los productos no disponibles reciben la clase `.is-agotado` y el badge `(AGOTADO)`.

---

### 2.5. Contadores Separados de Inventario y Resultados

- **Contador General de Inventario (`#catalogo-contador`):**  
  Permanece fijo en la parte superior reflejando el balance global de la tienda según Google Sheets:  
  `🟢 X DISPONIBLES • 🔴 Y AGOTADOS`.  
  Optimizado para no alterar el DOM si las cifras no han variado (`ultimoContadorInventarioHtml`).
- **Contador Dinámico de Coincidencias (`#catalogo-contador-resultados`):**  
  Muestra en tiempo real la cantidad de resultados tras aplicar búsqueda y filtros (`X perfumes encontrados`).

---

### 2.6. Carga Progresiva de Imágenes (Lazy Loading) y Shimmer

- Emplea la API nativa `IntersectionObserver` con un margen anticipado de `100px`.
- Muestra un placeholder con animación *shimmer* mientras la imagen se descarga.
- Los conjuntos `imagenesCargadas` e `imagenesFallidas` registran las URLs resueltas para que, al navegar entre pestañas o filtrar, las imágenes ya conocidas se desplieguen de inmediato sin volver a pasar por el estado de carga.

---

### 2.7. Cotizador Financiero en Tiempo Real

- **Propósito:** Calcular con rigor matemático el costo puesto en Perú, ganancia neta y margen al importar lotes de perfumes.
- **Flujo de Uso:**
  1. El usuario navega a la pestaña **Cotizador**.
  2. Escribe el nombre del perfume (sincroniza en tiempo real el encabezado de las tarjetas de resultados).
  3. Ingresa cantidad y precio unitario en USA ($).
  4. Los campos de flete, tipo de cambio y costos extras cargan valores según la regla de memoria inteligente (Últimos valores > Configuración base > Valores de fábrica).
  5. Al ingresar el precio de venta en soles (`S/`), se calculan ganancia unitaria, ganancia total y la barra visual de margen.
- **Fórmulas Financieras Oficiales:**
  - $\text{Total Costo USA} = \text{Precio USA} \times \text{Cantidad}$
  - $\text{Flete Aéreo} = (\text{Peso KG} \times \text{Cantidad}) \times \text{Costo Envío por KG}$
  - $\text{Total Gasto Envío} = \text{Flete Aéreo} + \text{Reempaque}$
  - $\text{Precio Total USD} = \text{Total Costo USA} + \text{Total Gasto Envío}$
  - $\text{Precio Total Soles} = \text{Precio Total USD} \times \text{Tipo de Cambio}$
  - $\text{Costo Puesto en Perú (C/U)} = \text{Precio Total Soles} \div \text{Cantidad}$
  - $\text{Ganancia Neta por Unidad} = \text{Precio Venta} - \text{Costo por Unidad} - \text{Costos Extras Locales}$
  - $\text{Ganancia Total} = \text{Ganancia por Unidad} \times \text{Cantidad}$
  - $\text{Margen sobre Venta (\%)} = (\text{Ganancia por Unidad} \div \text{Precio Venta}) \times 100$

---

### 2.8. Reempaque Dinámico basado en Caja (4 Perfumes)

- **Regla Logística:** Los couriers aplican una tarifa por caja de reempaque (por defecto `$4.00`), con capacidad para 4 perfumes.
- **Cálculo Automático:**  
  $$\text{Reempaque Total} = \text{Cantidad} \times \left(\frac{\text{Precio Caja}}{4}\right)$$
  - 1 perfume $\rightarrow$ `$1.00`
  - 2 perfumes $\rightarrow$ `$2.00`
  - 3 perfumes $\rightarrow$ `$3.00`
  - 4 perfumes $\rightarrow$ `$4.00`
- **Flexibilidad:** Si el usuario modifica manualmente el campo de reempaque en el formulario, la app respeta el valor introducido.

---

### 2.9. Historial Local y Modal de Desglose

- **Guardado:** Al pulsar `GUARDAR COTIZACIÓN`, se guarda un registro en `dunes_cotizaciones_v1` con ID temporal (`Date.now()`).
- **Pestaña Cotizaciones:** Muestra las tarjetas archivadas con botón de eliminación individual (`🗑️`) y botón de borrado global.
- **Modal de Desglose (`🔍 Detalle`):** Muestra una tabla con los 15 parámetros financieros y cuenta con el botón **"Editar en Cotizador"** (`#btn-cargar-modal`), que recarga los datos en el formulario y enfoca el cotizador para ajustes rápidos.

---

### 2.10. Configuración Base y Soporte Offline PWA

- **Modal de Configuración:** Permite fijar los valores predeterminados (peso base, tarifa por KG, precio de caja de 4 uds, TC y extras locales) y guardarlos en `dunes_config_base_v1` o restaurar los valores oficiales DUNES (`FACTORY_DEFAULTS`).
- **PWA Offline:** El Service Worker (`service-worker.js`, versión `dunes-parfums-v2.4`) cachea todos los recursos críticos. En caso de corte de conexión, la aplicación opera al 100% y el indicador visual en el header cambia a `Offline (PWA)`.
