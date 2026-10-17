# DUNES PARFUMS — Continuidad del Desarrollo y Registro de Cambios

> **Fecha del análisis:** 17 de octubre de 2026  
> **Alcance revisado:** Historial de Git desde commit inicial `0e128ac` hasta `501d2de`, registros de diseño en `docs/superpowers/`, convenciones de código y decisiones de arquitectura.

---

## 1. Decisiones Técnicas Conocidas y su Justificación

Basado estrictamente en la evidencia del código y los mensajes de commit:

| Decisión Técnica | Justificación Identificada | Evidencia en Repositorio |
| :--- | :--- | :--- |
| **Arquitectura 100% Vanilla (HTML + CSS + JS)** | Permite alojar y ejecutar la PWA directamente en GitHub Pages sin pasos de compilación (*build step*), asegurando carga inmediata en móviles y cero vulnerabilidades de dependencias npm. | Ausencia de `package.json` y scripts de empaquetado; ejecución directa en el navegador. |
| **Identidad Visual de Perfumería Luxury** | Inspirada en marcas globales de alta gama (Dior, Creed, Tom Ford) con paleta oficial extraída del logo DUNES: Fondo negro obsidiana (`#08070a`), acentos en oro pulido (`#d4a73b`), ganancias en verde esmeralda (`#10b981`) y textos crema. | Variables en `style.css:6-54`, commit `64fb474`. |
| **El Cotizador como Pantalla Inicial Absoluta** | Regla de negocio crítica: el objetivo primario de la app es cotizar importaciones. Al abrir o recargar la app, la pestaña activa forzosa debe ser siempre el Cotizador. | `app.js:1872`: `cambiarPestana('cotizador')`. |
| **Capacidad de Caja Courier Fija en 4 Unidades** | En la logística courier a Perú, las cajas estándar de reempaque albergan hasta 4 perfumes. Por ende, el reempaque unitario equivale a $\text{Precio Caja} \div 4$. | `app.js:24-33`, commit `7d38381`. |
| **Catálogo de Solo Consulta (Google Sheets como CMS)** | El inventario de perfumes lo gestionan los administradores en una hoja de Google Drive. La app actúa únicamente como visor comercial; no se implementan formularios de edición para evitar conflictos de concurrencia. | `app.js:915-922`, commits `5c54ce5` a `6878f39`. |
| **Regla Inclusiva de Género para Perfumes Unisex** | En perfumería árabe y nicho, la mayoría de fragancias son unisex. Al filtrar por "Hombre" o "Mujer", la app incluye automáticamente los unisex para no ocultar opciones comerciales viables. | `app.js:1544-1555`, commit `61870d8`. |
| **Separación de Contadores en el Catálogo** | Para evitar que el usuario piense que la tienda tiene pocos productos al hacer una búsqueda, el contador superior muestra el inventario total inmutable (`🟢 X DISPONIBLES • 🔴 Y AGOTADOS`), mientras que un contador secundario muestra los resultados coincidentes. | `app.js:1309-1351`, commit `501d2de`. |
| **Rutas Relativas (`./`) en Todos los Recursos** | Esencial para que la PWA funcione tanto en la raíz de un dominio (`https://ejemplo.com/`) como en un subdirectorio de GitHub Pages (`https://usuario.github.io/DUNES-APP/`). | `service-worker.js:10-26`, `manifest.json`, `index.html`. |

---

## 2. Restricciones y Convenciones que Deben Respetarse

1. **No incorporar frameworks pesados:** No introducir React, Angular o Tailwind a menos que exista una directiva explícita. La ligereza y simplicidad de un solo archivo HTML y CSS es una ventaja clave del proyecto.
2. **Preservar la exactitud de las fórmulas matemáticas:** Cualquier modificación a la lógica financiera debe validarse ejecutando `node tests/calculator.test.js`.
3. **No intentar escribir en Google Sheets desde el cliente:** El endpoint `/pub?output=csv` es estrictamente unidireccional (descarga pública).
4. **Respetar la compatibilidad móvil de Apple:** Mantener los metadatos de iOS en `<head>` (`viewport-fit=cover`, `apple-mobile-web-app-capable`, safe-area insets).
5. **Versionar el Service Worker en cada cambio de activos:** Si se modifica `style.css` o `app.js`, se debe incrementar el sufijo de versión en `index.html` (`?v=X.X`) y la constante `CACHE_NAME` en `service-worker.js`.

---

## 3. Historial de Cambios Identificables (Git)

- **`501d2de` (10/09/2026):** *gooooood* — Separación del contador de inventario general inmutable y nuevo contador dinámico de resultados (`#catalogo-contador-resultados`).
- **`61870d8` (10/09/2026):** *filtros* — Implementación de acordeón desplegable de filtros (Categoría, Género inclusivo y Estado) y diseño compacto.
- **`4f4d8f5` (10/09/2026):** *mejroas* — Soporte de imágenes con Lazy Loading e IntersectionObserver, detección de estado disponible/agotado en columna O.
- **`6878f39` (07/09/2026):** *goodod* — Integración de Google Sheets en vivo mediante endpoint CSV RFC 4180 y pruebas CDP automatizadas con Edge.
- **`229909c` (06/09/2026):** *style* — Compactación de campos numéricos y optimización de distribución horizontal en pantallas móviles.
- **`7d38381` (06/09/2026):** *fix* — Corrección del reempaque fijando la capacidad de la caja courier en 4 perfumes.
- **`0ed92d1` (06/09/2026):** *feat* — Configuración de reempaque real basado en costo de caja y capacidad de unidades.
- **`3a75012` (05/09/2026):** *fix* — Corrección de la fórmula de flete: `(peso * cantidad) * envioKg`.
- **`64fb474` (05/09/2026):** *style* — Aplicación de la paleta oficial de marca DUNES PARFUMS (oro, ébano y crema).
- **`73bb327` (05/09/2026):** *feat* — Implementación de memoria inteligente, configuración base y suite de validación interna headless (`tests/validate-app.js`).
- **`0e128ac` (05/09/2026):** *Initial version DUNES PARFUMS* — Creación inicial del proyecto.

---

## 4. Próximos Pasos Recomendados para Continuar

1. **Ajustar la aserción en `tests/sheets.test.js`:**  
   Cambiar la comparación estricta de la primera fila por una verificación no posicional para que la suite pase limpiamente independientemente del orden de la hoja.
2. **Añadir selector visual de URL de Google Sheets en el modal de configuración:**  
   Actualmente la URL se puede guardar en `localStorage` bajo `dunes_google_sheets_url_v1`, pero el modal `#modal-configuracion` no expone un input para que el usuario la actualice visualmente.
3. **Añadir botón de Compartir Cotización:**  
   Implementar `navigator.share()` para compartir el desglose financiero por WhatsApp o copiarlo al portapapeles con formato de texto elegante.

---

## 5. Preguntas Pendientes para el Propietario del Proyecto

1. ¿Se planea permitir la selección directa de un perfume del Catálogo para transferir su precio USA y peso automáticamente al Cotizador?
2. ¿Se requerirá en el futuro exportar el historial de cotizaciones a formato Excel o PDF?
3. ¿Existe intención de publicar la app bajo un dominio personalizado (ej. `app.dunesparfums.com`) o se mantendrá en `github.io`?

---

## 6. Registro de Cambios de Documentación

### [17 de Octubre de 2026] — Auditoría Integral y Creación de Documentación Central
- **Autor:** Asistente de IA (Antigravity).
- **Alcance:** Creación de la carpeta `./DOCUMENTACION/` y generación de los 6 documentos de referencia técnica (`00` a `05`) a partir del análisis del código fuente, suites de pruebas y el repositorio Git.
- **Hallazgos Clave Registrados:** Identificación del estado real de las pruebas (3 suites aprobadas al 100%, 1 con fallo por aserción estática frente a Google Sheets en vivo), confirmación del árbol de almacenamiento en `localStorage`, documentación del modelo de columnas A-O y verificación de las fórmulas financieras.
