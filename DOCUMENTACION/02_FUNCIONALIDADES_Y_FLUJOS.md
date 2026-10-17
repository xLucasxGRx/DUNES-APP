# DUNES PARFUMS — Funcionalidades y Flujos de Uso

> **Fecha del análisis:** 17 de octubre de 2026  
> **Alcance revisado:** Interacciones de usuario, controladores de interfaz en `app.js`, validaciones de formulario, sincronización con Google Sheets, persistencia en `localStorage` y suites de pruebas en `tests/`.

---

## 1. Matriz Resumen de Funcionalidades

| Funcionalidad | Estado | Fuente de Datos | Archivos Involucrados |
| :--- | :--- | :--- | :--- |
| **1. Cotizador Financiero en Tiempo Real** | Implementada y Verificada | Entrada del usuario + memoria local | `index.html`, `app.js`, `js/calculator.js` |
| **2. Reempaque Dinámico basado en Caja (4 Uds)** | Implementada y Verificada | Configuración base / Entrada | `app.js`, `js/calculator.js`, `tests/calculator.test.js` |
| **3. Historial de Cotizaciones con Modal Detallado** | Implementada y Verificada | `localStorage` (`dunes_cotizaciones_v1`) | `index.html`, `app.js`, `style.css` |
| **4. Recarga de Cotización para Edición** | Implementada y Verificada | Objeto en memoria desde `localStorage` | `app.js` (`cargarItemEnFormulario`) |
| **5. Consulta de Catálogo Google Sheets** | Implementada y Verificada | Google Sheets publicado (CSV real) + Fallback local | `app.js`, `index.html`, `tests/sheets.test.js` |
| **6. Buscador y Filtros Combinados de Catálogo** | Implementada y Verificada | Memoria (`catalogoProductos`) | `app.js`, `index.html`, `tests/catalog-filters.test.js` |
| **7. Contadores Diferenciados de Catálogo** | Implementada y Verificada | Memoria (`catalogoProductos`) | `app.js:1309-1351`, `tests/catalog-filters.test.js` |
| **8. Lazy Loading de Imágenes de Perfumes** | Implementada y Verificada | URLs remotas desde Google Sheets | `app.js:1434-1493` (`IntersectionObserver`) |
| **9. Configuración de Tarifas Base** | Implementada y Verificada | `localStorage` (`dunes_config_base_v1`) | `index.html`, `app.js` (`modal-configuracion`) |
| **10. Modo PWA Offline Completo** | Implementada y Verificada | Cache Storage API + `service-worker.js` | `service-worker.js`, `manifest.json`, `index.html` |

---

## 2. Detalle Exhaustivo por Funcionalidad

### 2.1. Cotizador Financiero en Tiempo Real

- **Propósito:** Calcular con total exactitud matemática el costo total puesto en Perú, el costo unitario, la ganancia neta y el margen de ganancia al importar perfumes vía courier desde Estados Unidos.
- **Flujo de Uso:**
  1. El usuario ingresa a la aplicación (se abre por defecto en la pestaña "Cotizador").
  2. Escribe el nombre del perfume (opcional para cálculo, pero sincroniza en tiempo real el título de las tarjetas de resultados).
  3. Ingresa la cantidad de unidades y el precio unitario en USD.
  4. Los campos de flete (peso por unidad, costo de envío por KG, reempaque y tipo de cambio) y costos extras en Perú cargan valores predeterminados o recordados de la última sesión.
  5. Al introducir el precio de venta en soles (`S/`), se despliegan automáticamente la ganancia por unidad, la ganancia total del lote y la barra de progreso del margen comercial.
- **Validaciones y Reglas de Negocio:**
  - `Cantidad`: Mínimo `1`. Si se introduce un valor menor o no numérico, se fuerza a `1`.
  - `Precio USA`: Si es `<= 0` o está vacío, no se calcula el costo en Perú; se muestra una alerta informativa `alert-costo` y los resultados se restablecen a cero.
  - `Precio Venta`: Si es `<= 0` o vacío, se calcula el costo en Perú, pero la tarjeta de ganancia muestra una alerta informativa `alert-ganancia` y los valores de ganancia se mantienen en `0.00`.
  - `Fórmulas Financieras Exactas:`
    - $\text{Total USA} = \text{Precio USA} \times \text{Cantidad}$
    - $\text{Flete} = (\text{Peso} \times \text{Cantidad}) \times \text{Costo Envío por KG}$
    - $\text{Total Envío} = \text{Flete} + \text{Reempaque}$
    - $\text{Total USD} = \text{Total USA} + \text{Total Envío}$
    - $\text{Total Soles} = \text{Total USD} \times \text{Tipo de Cambio}$
    - $\text{Costo Perú (Unitario)} = \text{Total Soles} \div \text{Cantidad}$
    - $\text{Ganancia Unidad} = \text{Precio Venta} - \text{Costo Perú Unitario} - \text{Costos Extras}$
    - $\text{Ganancia Total} = \text{Ganancia Unidad} \times \text{Cantidad}$
    - $\text{Margen (\%)} = (\text{Ganancia Unidad} \div \text{Precio Venta}) \times 100$
- **Evidencia y Estado:** Comprobado mediante ejecución directa de `tests/calculator.test.js` (11 casos aprobados) y `tests/validate-app.js`.

---

### 2.2. Sistema Inteligente de Reempaque Dinámico (Caja de 4 Perfumes)

- **Propósito:** Adaptar el costo de reempaque courier a la operativa real de importación, donde los couriers cobran una tarifa fija por caja de reempaque (por defecto `$4.00`), cuya capacidad estándar es de 4 perfumes.
- **Flujo de Uso:**
  1. El usuario tiene configurado el precio de caja en el modal de configuración (por ejemplo `$4.00`).
  2. En el cotizador, al modificar la `Cantidad`:
     - 1 perfume $\rightarrow$ Reempaque total = $1 \times (4.00 \div 4) = \$1.00$.
     - 2 perfumes $\rightarrow$ Reempaque total = $2 \times (4.00 \div 4) = \$2.00$.
     - 3 perfumes $\rightarrow$ Reempaque total = $3 \times (4.00 \div 4) = \$3.00$.
     - 4 perfumes $\rightarrow$ Reempaque total = $4 \times (4.00 \div 4) = \$4.00$.
  3. Si el usuario decide sobreescribir manualmente el campo `Reempaque total ($)` en el formulario, el sistema respeta el valor manual introducido sin bloquearlo.
- **Evidencia:** `app.js:1768-1776`, validado en `tests/calculator.test.js` (Casos 6, 7, 9, 10 y 11) y `tests/validate-app.js` (Bloque 4).

---

### 2.3. Historial de Cotizaciones Persistente

- **Propósito:** Almacenar de forma indefinida en el dispositivo móvil o navegador las cotizaciones generadas para su posterior revisión, comparación o edición.
- **Flujo de Uso:**
  1. Con una cotización calculada en pantalla, el usuario pulsa `GUARDAR COTIZACIÓN`.
  2. La cotización se almacena con marca temporal local (`DD/MM/YYYY HH:mm`) e ID único (`Date.now()`).
  3. El usuario pulsa la pestaña `Cotizaciones` en la barra superior.
  4. Se muestra la lista de tarjetas con métricas clave (Costo Perú, Venta, Ganancia C/U, Margen %).
  5. Cada tarjeta cuenta con botones:
     - `🔍 Detalle`: Abre el modal `#modal-detalle` con una tabla desglosada de todas las variables involucradas (Total USA, Flete, Reempaque, T.C., Costos Extras, etc.).
     - `🗑️`: Elimina la cotización individual con aviso toast de confirmación.
  6. Al final de la lista existe la opción `Borrar todo el historial` (requiere confirmación nativa `confirm()`).
- **Naturaleza de los Datos:** **Datos reales locales**. Se guardan exclusivamente en el `localStorage` del dispositivo (`dunes_cotizaciones_v1`). No se transmiten a ningún servidor externo.
- **Limitaciones Conocidas:** Si el usuario borra los datos de navegación o el almacenamiento de Safari/Chrome, el historial se pierde. No cuenta con exportación a PDF ni respaldo en nube.

---

### 2.4. Recarga de Cotizaciones en el Formulario

- **Propósito:** Permitir al usuario retomar una cotización previamente guardada para realizar ajustes de precios o cantidades sin tener que volver a escribir todos los parámetros.
- **Flujo de Uso:**
  1. En la pestaña de cotizaciones, el usuario pulsa `🔍 Detalle`.
  2. En el pie del modal pulsa `Editar en Cotizador` (`#btn-cargar-modal`).
  3. La app cierra el modal, transfiere todos los datos numéricos y de texto a los inputs de `#seccion-formulario`, cambia a la pestaña del Cotizador, hace scroll suave hacia el formulario y enfoca el campo de producto.
- **Evidencia:** Función `cargarItemEnFormulario()` en `app.js:679-698`.

---

### 2.5. Catálogo en Vivo Conectado a Google Sheets

- **Propósito:** Permitir a los usuarios consultar la lista oficial de perfumes comercializados por DUNES PARFUMS con sus precios de importación, costos y venta sugerida.
- **Regla Crítica de Negocio:**  
  *El catálogo es de estricta consulta (Solo Lectura).* Google Sheets es la única fuente de edición del inventario. La aplicación no contiene formularios de alta, baja o modificación de productos en el catálogo.
- **Flujo de Sincronización:**
  1. Al acceder a la pestaña `Catálogo`:
     - Si existe caché en `localStorage` (`dunes_catalogo_cache_v2`), se renderiza de inmediato mostrando el indicador `Sincronizado (HH:mm)`.
     - Si no hay caché o se pulsa el botón `Actualizar` (`#btn-sincronizar-catalogo`), se realiza una petición HTTP `GET` al CSV publicado de Google Sheets.
  2. Si la conexión tiene éxito:
     - Se procesan las filas respetando el estándar RFC 4180.
     - Se mapean las columnas (A: Producto, B: Precio USA, C: Cantidad, D: Categoría, E: Género, F: Peso KG, G: Flete KG, H: Reempaque, I: T.C., J: Costo Perú, K: Venta, L: Costos extras, M: Ganancia, N: Imagen, O: Estado catálogo).
     - Se actualiza la memoria y la caché local.
  3. Si la conexión falla (offline o error de red):
     - La app muestra los datos cacheados previamente.
     - Si nunca hubo caché, recurre a `CATALOGO_DEFAULT` (conjunto estático de 8 perfumes de prueba definidos en `app.js:925-1061`).
     - El indicador de estado cambia a `Modo local (Sin conexión a Sheets)`.
- **Diferenciación de Datos:**
  - **Datos Reales:** Petición HTTP a la URL oficial `https://docs.google.com/spreadsheets/d/e/2PACX-1vSMxWTEsUiAmYSnu8ra29ku79UTtObn2EnphEEabBODeDZDdXUVcHqI85RnXSvSHBuRthVUlbsWnCy_/pub?output=csv`.
  - **Datos de Prueba / Simulación:** Constante `CATALOGO_DEFAULT` en `app.js`, usada únicamente como fallback cuando no hay internet y no existe caché previa.

---

### 2.6. Buscador y Filtros Combinados de Catálogo

- **Propósito:** Localizar rápidamente fragancias específicas entre decenas de referencias disponibles.
- **Controles Disponibles:**
  1. **Buscador de Texto:** Filtra por coincidencia parcial insensible a mayúsculas y acentos sobre el nombre del producto (`app.js:1521-1525`).
  2. **Acordeón Desplegable de Filtros (`#btn-toggle-filtros`):**
     - Muestra un punto dorado indicador cuando hay filtros distintos a "Todos" aplicados.
     - Se abre y cierra suavemente alternando la flecha `▲` / `▼`.
  3. **Filtro de Categoría:** `Todos` | `Diseñador` | `Árabes`.
  4. **Filtro de Género:** `Todos` | `Hombre` | `Mujer`.
     - *Regla de Negocio Especial:* Las fragancias clasificadas como `Unisex` se muestran tanto al seleccionar `Hombre` como al seleccionar `Mujer` (`app.js:1544-1555`).
  5. **Filtro de Estado:** `Todos` | `Disponibles` | `Agotados`.
     - Detecta la columna O de Google Sheets (`Disponible` vs `No disponible`). Si un perfume está marcado como no disponible, la tarjeta recibe la clase `.is-agotado` y muestra el badge `(AGOTADO)`.
- **Evidencia:** Validado al 100% mediante `tests/catalog-filters.test.js`.

---

### 2.7. Contadores Separados de Inventario y Resultados

- **Propósito:** Mantener siempre a la vista el balance comercial general de la tienda sin confundir al usuario cuando realiza búsquedas específicas.
- **Implementación:**
  1. **Contador Superior Fijo (`#catalogo-contador`):**  
     Calcula y muestra siempre el total general de la hoja de Google Sheets:  
     `🟢 X DISPONIBLES • 🔴 Y AGOTADOS`.  
     Permanece inmutable sin importar qué texto se busque o qué filtro se active.
  2. **Contador Dinámico de Resultados (`#catalogo-contador-resultados`):**  
     Muestra el resultado del filtrado en tiempo real: `X perfumes encontrados` (o `1 perfume encontrado`).
- **Evidencia:** `app.js:1309-1351`, probado en `tests/catalog-filters.test.js`.

---

### 2.8. Carga Diferida de Imágenes (Lazy Loading)

- **Propósito:** Reducir el consumo de datos móviles y acelerar la renderización del catálogo en listas extensas.
- **Implementación:**
  - Emplea la API estándar `IntersectionObserver` con un margen de anticipación de `100px` (`rootMargin: '100px 0px 100px 0px'`).
  - Las etiquetas `<img>` portan el atributo `data-src` con la URL remota de la imagen (columna N de Google Sheets).
  - Al entrar al viewport, se descarga la imagen en segundo plano. Al completar la carga (`onload`), se asigna a `src`, se activa una animación de fundido suave y se oculta el placeholder animado (*shimmer*).
  - Si la URL remota falla (`onerror`), se oculta la imagen y se activa el icono de respaldo.
- **Evidencia:** `app.js:1434-1493`.

---

### 2.9. Modal de Configuración de Costos Base

- **Propósito:** Personalizar los valores iniciales con los que se inicia el cotizador según los acuerdos de courier de cada importador.
- **Campos Configurables:**
  - Peso base en KG (por defecto `0.60`).
  - Costo de envío base por KG (por defecto `$9.50`).
  - Precio de caja de reempaque de 4 unidades (por defecto `$4.00`, que fija el reempaque unitario en `$1.00`).
  - Tipo de cambio base en soles (por defecto `S/ 3.40`).
  - Costos extras locales en soles (por defecto `S/ 15.00`).
- **Acciones:**
  - `Guardar como Base`: Almacena en `localStorage` (`dunes_config_base_v1`) y aplica inmediatamente al formulario.
  - `Restaurar Fábrica`: Borra las personalizaciones de `localStorage` y restablece los valores oficiales de DUNES PARFUMS (`FACTORY_DEFAULTS`).

---

### 2.10. Instalación PWA y Soporte 100% Offline

- **Propósito:** Ofrecer una experiencia idéntica a una aplicación nativa instalable en iOS y Android, operando sin conexión en aduanas o almacenes.
- **Implementación:**
  - `manifest.json`: Configuración *standalone*, tema `#08070a`, orientación vertical e iconos completos.
  - `service-worker.js`: Cachea recursos críticos estáticos durante el evento `install` y aplica estrategia *Cache First* con fallback de navegación a `index.html`.
  - Detección en vivo de conectividad con eventos `online`/`offline` actualizando el indicador visual en el header (`pwa-status`).
