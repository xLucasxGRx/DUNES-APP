/**
 * ==========================================================================
 * DUNES PARFUMS — Controlador Principal de la Aplicación
 * Versión Mejorada: Memoria Inteligente, Nombre Dinámico, Configuración Base
 * y Persistencia Total PWA / Offline
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Claves de Almacenamiento Local
  const STORAGE_KEYS = {
    HISTORY: 'dunes_cotizaciones_v1',
    BASE_CONFIG: 'dunes_config_base_v1',
    LAST_INPUTS: 'dunes_last_inputs_v1',
    SHEETS_URL: 'dunes_google_sheets_url_v1',
    CATALOGO_CACHE: 'dunes_catalogo_cache_v2',
    CATALOGO_LAST_SYNC: 'dunes_catalogo_last_sync_v1'
  };

  // URL del Google Sheets público oficial maestro de DUNES PARFUMS
  const DEFAULT_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMxWTEsUiAmYSnu8ra29ku79UTtObn2EnphEEabBODeDZDdXUVcHqI85RnXSvSHBuRthVUlbsWnCy_/pub?output=csv';

  // Valores de Fábrica Iniciales (DUNES PARFUMS)
  // La capacidad de la caja es fija por negocio: siempre 4 perfumes
  const FACTORY_DEFAULTS = {
    cantidad: 1,
    peso: 0.6,
    envioKg: 9.50,
    costoCaja: 4.00,    // Precio reempaque por caja (4 perfumes) ($)
    reempaque: 1.00,    // Costo equivalente por perfume ($) (4.00 ÷ 4 = 1.00)
    tc: 3.40,
    extras: 15.00
  };

  // Referencias a los inputs del formulario
  const inputs = {
    producto: document.getElementById('producto'),
    cantidad: document.getElementById('cantidad'),
    precioUSA: document.getElementById('precioUSA'),
    peso: document.getElementById('peso'),
    envioKg: document.getElementById('envioKg'),
    reempaque: document.getElementById('reempaque'),
    tc: document.getElementById('tc'),
    extras: document.getElementById('extras'),
    venta: document.getElementById('venta')
  };

  // Referencias a inputs de Configuración de Costos
  const configInputs = {
    peso: document.getElementById('cfg-peso'),
    envioKg: document.getElementById('cfg-envioKg'),
    costoCaja: document.getElementById('cfg-costoCaja'),
    reempaque: document.getElementById('cfg-reempaque'),
    tc: document.getElementById('cfg-tc'),
    extras: document.getElementById('cfg-extras')
  };

  // Referencias a elementos dinámicos de nombres y alertas
  const labels = {
    nombreCosto: document.getElementById('res-nombre-costo'),
    nombreGanancia: document.getElementById('res-nombre-ganancia'),
    alertCosto: document.getElementById('alert-costo'),
    alertGanancia: document.getElementById('alert-ganancia'),
    boxBreakdown: document.getElementById('box-costo-breakdown'),
    boxGananciaGrid: document.getElementById('box-ganancia-grid'),
    boxMargenContainer: document.getElementById('box-margen-container')
  };

  // Referencias a elementos de resultados
  const outputs = {
    totalUSA: document.getElementById('res-total-usa'),
    flete: document.getElementById('res-flete'),
    reempaque: document.getElementById('res-reempaque'),
    totalUSD: document.getElementById('res-total-usd'),
    costoPeru: document.getElementById('res-costo-peru'),
    costoTotalSoles: document.getElementById('res-costo-total-soles'),
    gananciaUnidad: document.getElementById('res-ganancia-unidad'),
    gananciaTotal: document.getElementById('res-ganancia-total'),
    margen: document.getElementById('res-margen'),
    margenBar: document.getElementById('margen-bar-fill'),
    wrapGananciaUnidad: document.getElementById('wrap-ganancia-unidad'),
    wrapGananciaTotal: document.getElementById('wrap-ganancia-total')
  };

  // Referencias a botones principales
  const btnCalcular = document.getElementById('btn-calcular');
  const btnGuardar = document.getElementById('btn-guardar');
  const btnNuevo = document.getElementById('btn-nuevo');
  const btnLimpiar = document.getElementById('btn-limpiar');
  const btnBorrarHistorial = document.getElementById('btn-borrar-historial');

  // Referencias de sección Configuración (Modal)
  const btnAbrirConfig = document.getElementById('btn-abrir-config');
  const btnCerrarConfig = document.getElementById('btn-cerrar-config');
  const modalConfig = document.getElementById('modal-configuracion');
  const btnGuardarConfig = document.getElementById('btn-guardar-config');
  const btnRestaurarFabrica = document.getElementById('btn-restaurar-fabrica');

  // Referencias de Historial
  const historialLista = document.getElementById('historial-lista');
  const historialContador = document.getElementById('historial-contador');
  const historialActions = document.getElementById('historial-actions');

  // Referencias de Modal
  const modalDetalle = document.getElementById('modal-detalle');
  const modalProducto = document.getElementById('modal-producto');
  const modalFecha = document.getElementById('modal-fecha');
  const modalContenido = document.getElementById('modal-contenido');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal');
  const btnCerrarModalBottom = document.getElementById('btn-cerrar-modal-bottom');
  const btnCargarModal = document.getElementById('btn-cargar-modal');

  // Contenedor de Toast y PWA Status
  const toastContainer = document.getElementById('toast-container');
  const pwaStatus = document.getElementById('pwa-status');

  // Referencias de Navegación y Vistas
  const navTabs = document.querySelectorAll('.app-nav-tabs .nav-tab');
  const views = {
    cotizador: document.getElementById('vista-cotizador'),
    catalogo: document.getElementById('vista-catalogo'),
    cotizaciones: document.getElementById('vista-cotizaciones')
  };

  // Referencias del Módulo Catálogo
  const catalogoElements = {
    busqueda: document.getElementById('catalogo-busqueda'),
    btnLimpiar: document.getElementById('catalogo-btn-limpiar-busqueda'),
    contador: document.getElementById('catalogo-contador'),
    lista: document.getElementById('catalogo-lista'),
    empty: document.getElementById('catalogo-empty'),
    emptyTitle: document.getElementById('catalogo-empty-title'),
    emptyDesc: document.getElementById('catalogo-empty-desc'),
    btnSync: document.getElementById('btn-sincronizar-catalogo'),
    syncDot: document.getElementById('catalogo-sync-dot'),
    syncText: document.getElementById('catalogo-sync-text')
  };

  // Estado en memoria
  let currentCalculations = null;
  let currentModalItem = null;
  let catalogoProductos = [];
  let catalogoCargando = false;
  let catalogoImageObserver = null;
  let vistaActiva = 'cotizador';

  // Formateadores
  const formatUSD = (num) => `$ ${Number(num || 0).toFixed(2)}`;
  const formatPEN = (num) => `S/ ${Number(num || 0).toFixed(2)}`;
  const formatNum = (num) => Number(num || 0).toFixed(2);

  /**
   * ========================================================================
   * GESTIÓN DE MEMORIA Y VALORES PREDETERMINADOS INTELIGENTES
   * ========================================================================
   */

  /**
   * Obtiene la configuración base activa (Guardada o Fábrica)
   */
  function obtenerConfigBase() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BASE_CONFIG);
      if (saved) {
        const merged = { ...FACTORY_DEFAULTS, ...JSON.parse(saved) };
        const costoCaja = (merged.costoCaja !== undefined && merged.costoCaja !== null && merged.costoCaja !== '')
          ? Math.max(0, parseFloat(merged.costoCaja) >= 0 ? parseFloat(merged.costoCaja) : 0)
          : FACTORY_DEFAULTS.costoCaja;
        merged.costoCaja = costoCaja;
        // Costo reempaque por perfume = Precio reempaque caja ÷ 4
        merged.reempaque = parseFloat((costoCaja / 4).toFixed(2));
        return merged;
      }
    } catch (e) {
      console.warn('Error al leer configuración base', e);
    }
    return { ...FACTORY_DEFAULTS };
  }

  /**
   * Obtiene los últimos valores utilizados por el usuario
   */
  function obtenerUltimosValores() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_INPUTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error al leer últimos valores', e);
    }
    return null;
  }

  /**
   * Guarda automáticamente los valores cambiados en tiempo real
   */
  function autoGuardarValoresUsuario() {
    try {
      const datosParaGuardar = {
        peso: Math.max(0, parseFloat(inputs.peso.value) || 0),
        envioKg: Math.max(0, parseFloat(inputs.envioKg.value) || 0),
        reempaque: Math.max(0, parseFloat(inputs.reempaque.value) || 0),
        tc: Math.max(0, parseFloat(inputs.tc.value) || 0),
        extras: Math.max(0, parseFloat(inputs.extras.value) || 0)
      };
      localStorage.setItem(STORAGE_KEYS.LAST_INPUTS, JSON.stringify(datosParaGuardar));
    } catch (e) {
      console.warn('Error al autoguardar valores', e);
    }
  }

  /**
   * Inicializa los campos de formulario según la regla de prioridad:
   * 1. Últimos valores usados
   * 2. Configuración base guardada
   * 3. Valores de fábrica DUNES
   */
  function cargarValoresIniciales() {
    const configBase = obtenerConfigBase();
    const ultimosValores = obtenerUltimosValores();

    // Determinar valores efectivos para el cotizador
    const valoresEfectivos = ultimosValores
      ? { ...configBase, ...ultimosValores }
      : configBase;

    const costoReempaquePorPerfume = parseFloat(configBase.reempaque) || 1.00;

    inputs.cantidad.value = 1;
    inputs.peso.value = valoresEfectivos.peso;
    inputs.envioKg.value = valoresEfectivos.envioKg;
    
    // Si el usuario tenía un reempaque manual modificado guardado, lo respetamos;
    // si no, se calcula dinámicamente cantidad (1) × costo por perfume.
    if (ultimosValores && ultimosValores.reempaque !== undefined && ultimosValores.reempaque !== null) {
      inputs.reempaque.value = parseFloat(ultimosValores.reempaque).toFixed(2);
    } else {
      inputs.reempaque.value = (1 * costoReempaquePorPerfume).toFixed(2);
    }

    inputs.tc.value = valoresEfectivos.tc;
    inputs.extras.value = valoresEfectivos.extras;

    // Sincronizar inputs de la sección de Configuración Base
    configInputs.peso.value = configBase.peso;
    configInputs.envioKg.value = configBase.envioKg;
    if (configInputs.costoCaja) configInputs.costoCaja.value = (configBase.costoCaja !== undefined ? configBase.costoCaja : 4.00).toFixed(2);
    if (configInputs.reempaque) configInputs.reempaque.value = costoReempaquePorPerfume.toFixed(2);
    configInputs.tc.value = configBase.tc;
    configInputs.extras.value = configBase.extras;
  }

  /**
   * ========================================================================
   * SINCRONIZACIÓN DINÁMICA DEL NOMBRE DEL PERFUME
   * ========================================================================
   */
  function sincronizarNombrePerfume() {
    const nombre = inputs.producto.value.trim();
    const textoMostrar = nombre ? nombre : 'Perfume no especificado';

    if (labels.nombreCosto) {
      labels.nombreCosto.textContent = textoMostrar;
      labels.nombreCosto.style.color = nombre ? 'var(--gold-light)' : 'var(--text-muted)';
    }

    if (labels.nombreGanancia) {
      labels.nombreGanancia.textContent = textoMostrar;
      labels.nombreGanancia.style.color = nombre ? 'var(--gold-light)' : 'var(--text-muted)';
    }
  }

  /**
   * ========================================================================
   * MOTOR DE CÁLCULO Y VALIDACIONES
   * ========================================================================
   */
  function getFormValues() {
    return {
      producto: inputs.producto.value.trim(),
      cantidad: Math.max(1, parseInt(inputs.cantidad.value, 10) || 1),
      precioUSA: Math.max(0, parseFloat(inputs.precioUSA.value) || 0),
      peso: Math.max(0, parseFloat(inputs.peso.value) || 0),
      envioKg: Math.max(0, parseFloat(inputs.envioKg.value) || 0),
      reempaque: Math.max(0, parseFloat(inputs.reempaque.value) || 0),
      tc: Math.max(0, parseFloat(inputs.tc.value) || 0),
      extras: Math.max(0, parseFloat(inputs.extras.value) || 0),
      venta: Math.max(0, parseFloat(inputs.venta.value) || 0)
    };
  }

  function ejecutarCalculo() {
    sincronizarNombrePerfume();
    autoGuardarValoresUsuario();

    const vals = getFormValues();
    const tienePrecioUSA = vals.precioUSA > 0;
    const tienePrecioVenta = vals.venta > 0;

    // Validación 1: Precio USA vacío o 0
    if (!tienePrecioUSA) {
      labels.alertCosto.style.display = 'block';
      labels.boxBreakdown.style.opacity = '0.4';
      labels.alertGanancia.style.display = 'block';
      labels.alertGanancia.textContent = '⚠️ Ingresa el precio USA para calcular';
      labels.boxGananciaGrid.style.opacity = '0.4';

      outputs.totalUSA.textContent = '$ 0.00';
      outputs.flete.textContent = '$ 0.00';
      outputs.reempaque.textContent = '$ 0.00';
      outputs.totalUSD.textContent = '$ 0.00';
      outputs.costoPeru.textContent = '0.00';
      outputs.costoTotalSoles.textContent = 'Total lote: S/ 0.00';
      outputs.gananciaUnidad.textContent = '0.00';
      outputs.gananciaTotal.textContent = '0.00';
      outputs.margen.textContent = '0.0%';
      outputs.margenBar.style.width = '0%';

      currentCalculations = { ...vals, totalUSA: 0, flete: 0, reempaque: 0, totalEnvio: 0, precioTotalUSD: 0, precioTotalSoles: 0, costoUnidad: 0, gananciaUnidad: 0, gananciaTotal: 0, margen: 0 };
      return currentCalculations;
    }

    // Si tiene Precio USA, calcular Costo Puesto en Perú
    labels.alertCosto.style.display = 'none';
    labels.boxBreakdown.style.opacity = '1';

    // Ejecución con motor matemático certificado por pruebas unitarias
    const res = window.calculateDunesQuotation(vals);
    currentCalculations = { ...vals, ...res };

    // Actualizar Tarjeta 1: Costo Puesto en Perú
    outputs.totalUSA.textContent = formatUSD(res.totalUSA);
    outputs.flete.textContent = formatUSD(res.flete);
    outputs.reempaque.textContent = formatUSD(res.reempaque);
    outputs.totalUSD.textContent = formatUSD(res.precioTotalUSD);
    outputs.costoPeru.textContent = formatNum(res.costoUnidad);
    outputs.costoTotalSoles.textContent = `Total lote: ${formatPEN(res.precioTotalSoles)}`;

    // Validación 2: Precio de Venta
    if (!tienePrecioVenta) {
      labels.alertGanancia.style.display = 'block';
      labels.alertGanancia.textContent = 'ℹ️ Ingresa el precio de venta para ver tu ganancia';
      labels.boxGananciaGrid.style.opacity = '0.4';
      labels.boxMargenContainer.style.opacity = '0.4';

      outputs.gananciaUnidad.textContent = '0.00';
      outputs.gananciaTotal.textContent = '0.00';
      outputs.margen.textContent = '0.0%';
      outputs.margenBar.style.width = '0%';
    } else {
      labels.alertGanancia.style.display = 'none';
      labels.boxGananciaGrid.style.opacity = '1';
      labels.boxMargenContainer.style.opacity = '1';

      outputs.gananciaUnidad.textContent = formatNum(res.gananciaUnidad);
      outputs.gananciaTotal.textContent = formatNum(res.gananciaTotal);
      outputs.margen.textContent = `${res.margen.toFixed(1)}%`;

      const esPositiva = res.gananciaUnidad >= 0;
      outputs.wrapGananciaUnidad.className = `stat-value-wrap ${esPositiva ? 'positive' : 'negative'}`;
      outputs.wrapGananciaTotal.className = `stat-value-wrap ${esPositiva ? 'positive' : 'negative'}`;

      const margenClamped = Math.max(0, Math.min(100, res.margen));
      outputs.margenBar.style.width = `${margenClamped}%`;
      if (!esPositiva) {
        outputs.margenBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
        outputs.margen.style.color = '#ef4444';
      } else {
        outputs.margenBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        outputs.margen.style.color = '#10b981';
      }
    }

    return currentCalculations;
  }

  /**
   * ========================================================================
   * NOTIFICACIONES TOAST
   * ========================================================================
   */
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✔' : 'ℹ'}</span>
      <span class="toast-msg">${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * ========================================================================
   * HISTORIAL LOCAL (PERSISTENCIA Y DETALLE)
   * ========================================================================
   */
  function obtenerHistorial() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer historial', e);
      return [];
    }
  }

  function guardarHistorial(lista) {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(lista));
    } catch (e) {
      console.error('Error al guardar historial', e);
    }
  }

  function guardarCotizacionActual() {
    const vals = getFormValues();

    if (!vals.precioUSA || vals.precioUSA <= 0) {
      showToast('Ingresa el precio USA para cotizar', 'info');
      inputs.precioUSA.focus();
      return;
    }

    const calc = ejecutarCalculo();
    const nombre = calc.producto || 'Perfume Importado';

    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + ahora.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const nuevoItem = {
      id: Date.now(),
      fecha: fechaFormateada,
      timestamp: ahora.getTime(),
      ...calc,
      producto: nombre
    };

    const historial = obtenerHistorial();
    historial.unshift(nuevoItem);
    guardarHistorial(historial);

    renderizarHistorial();
    showToast(`"${nombre}" guardado en historial`);
  }

  function renderizarHistorial() {
    const historial = obtenerHistorial();
    historialContador.textContent = `${historial.length} guardada${historial.length === 1 ? '' : 's'}`;

    if (historial.length === 0) {
      historialLista.innerHTML = `
        <div class="empty-history">
          <div class="empty-icon">🏷️</div>
          <p>Aún no tienes cotizaciones guardadas.</p>
          <small>Presiona "GUARDAR COTIZACIÓN" para archivarlas aquí.</small>
        </div>
      `;
      historialActions.style.display = 'none';
      return;
    }

    historialActions.style.display = 'block';
    historialLista.innerHTML = '';

    historial.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'quote-card';
      const esPositiva = (item.gananciaUnidad >= 0);

      card.innerHTML = `
        <div class="quote-card-header">
          <div>
            <h4 class="quote-card-title">🧴 ${escapeHTML(item.producto)}</h4>
            <span class="quote-card-meta">📅 ${item.fecha}</span>
          </div>
          <span class="quote-badge-qty">${item.cantidad} ud${item.cantidad > 1 ? 's' : ''}</span>
        </div>

        <div class="quote-metrics-grid">
          <div class="metric-item">
            <span class="metric-lbl">Costo Perú</span>
            <span class="metric-val">S/ ${formatNum(item.costoUnidad)}</span>
          </div>
          <div class="metric-item">
            <span class="metric-lbl">Venta</span>
            <span class="metric-val">S/ ${formatNum(item.venta)}</span>
          </div>
          <div class="metric-item">
            <span class="metric-lbl">Ganancia C/U</span>
            <span class="metric-val ${esPositiva ? 'metric-profit' : ''}" style="${!esPositiva ? 'color:#ef4444;' : ''}">
              S/ ${formatNum(item.gananciaUnidad)}
            </span>
          </div>
        </div>

        <div class="quote-card-footer">
          <span class="quote-margin-badge" style="${!esPositiva ? 'background:rgba(239,68,68,0.15); color:#ef4444;' : ''}">
            Margen: ${Number(item.margen || 0).toFixed(1)}%
          </span>
          <div class="quote-card-btns">
            <button class="btn-card-action btn-ver-detalle" data-id="${item.id}" type="button">
              🔍 Detalle
            </button>
            <button class="btn-card-action btn-card-delete btn-eliminar" data-id="${item.id}" type="button">
              🗑️
            </button>
          </div>
        </div>
      `;

      historialLista.appendChild(card);
    });

    historialLista.querySelectorAll('.btn-ver-detalle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        abrirModalDetalle(id);
      });
    });

    historialLista.querySelectorAll('.btn-eliminar').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        eliminarCotizacion(id);
      });
    });
  }

  function eliminarCotizacion(id) {
    let historial = obtenerHistorial();
    const item = historial.find((i) => i.id === id);
    const nombre = item ? item.producto : 'Cotización';

    historial = historial.filter((i) => i.id !== id);
    guardarHistorial(historial);
    renderizarHistorial();
    showToast(`Eliminado: ${nombre}`, 'info');
  }

  function borrarTodoHistorial() {
    if (confirm('¿Estás seguro de que deseas borrar todas las cotizaciones guardadas?')) {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      renderizarHistorial();
      showToast('Historial completo eliminado', 'info');
    }
  }

  /**
   * ========================================================================
   * MODAL DE DETALLE COMPLETO
   * ========================================================================
   */
  function abrirModalDetalle(id) {
    const historial = obtenerHistorial();
    const item = historial.find((i) => i.id === id);
    if (!item) return;

    currentModalItem = item;
    modalProducto.textContent = `🧴 ${item.producto}`;
    modalFecha.textContent = `Guardado: ${item.fecha}`;

    const esPositiva = (item.gananciaUnidad >= 0);

    modalContenido.innerHTML = `
      <table class="detail-table">
        <tbody>
          <tr>
            <td>Perfume:</td>
            <td style="color:var(--gold-light);">${escapeHTML(item.producto)}</td>
          </tr>
          <tr>
            <td>Cantidad importada:</td>
            <td>${item.cantidad} unidad${item.cantidad > 1 ? 'es' : ''}</td>
          </tr>
          <tr>
            <td>Precio unitario USA:</td>
            <td>${formatUSD(item.precioUSA)}</td>
          </tr>
          <tr>
            <td>Total Costo USA:</td>
            <td>${formatUSD(item.totalUSA)}</td>
          </tr>
          <tr>
            <td>Peso del perfume:</td>
            <td>${item.peso} KG</td>
          </tr>
          <tr>
            <td>Costo envío courier por KG:</td>
            <td>${formatUSD(item.envioKg)}</td>
          </tr>
          <tr>
            <td>Flete aéreo (${(item.peso * item.cantidad).toFixed(2)} KG total × Tarifa):</td>
            <td>${formatUSD(item.flete)}</td>
          </tr>
          <tr>
            <td>Reempaque courier:</td>
            <td>${formatUSD(item.reempaque)}</td>
          </tr>
          <tr>
            <td>Total Gasto Envío:</td>
            <td>${formatUSD(item.totalEnvio)}</td>
          </tr>
          <tr style="border-top: 1px dashed rgba(212,175,55,0.3); font-weight:600;">
            <td style="color:var(--gold-light);">Precio Total en USD:</td>
            <td style="color:var(--gold-light);">${formatUSD(item.precioTotalUSD)}</td>
          </tr>
          <tr>
            <td>Tipo de Cambio aplicado:</td>
            <td>S/ ${formatNum(item.tc)}</td>
          </tr>
          <tr>
            <td>Precio Total en Soles (Lote):</td>
            <td>${formatPEN(item.precioTotalSoles)}</td>
          </tr>
          <tr style="background:rgba(212,175,55,0.08); font-weight:700;">
            <td style="color:var(--gold-primary);">Costo puesto en Perú C/U:</td>
            <td style="color:#fff; font-size:1rem;">${formatPEN(item.costoUnidad)}</td>
          </tr>
          <tr>
            <td>Costos extras locales (delivery/caja):</td>
            <td>${formatPEN(item.extras)}</td>
          </tr>
          <tr>
            <td>Precio de venta público C/U:</td>
            <td>${formatPEN(item.venta)}</td>
          </tr>
        </tbody>
      </table>

      <div class="detail-hero-highlight" style="${!esPositiva ? 'background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3);' : ''}">
        <div>
          <span style="font-size:0.75rem; color:${esPositiva ? 'var(--emerald-profit)' : 'var(--crimson-loss)'}; text-transform:uppercase; font-weight:700; display:block;">
            ${esPositiva ? 'Ganancia Neta por Unidad' : 'Pérdida por Unidad'}
          </span>
          <b style="font-size:1.45rem; color:#fff;">${formatPEN(item.gananciaUnidad)}</b>
          <span style="font-size:0.75rem; color:var(--text-muted); display:block;">
            Ganancia total lote: ${formatPEN(item.gananciaTotal)}
          </span>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">Margen:</span>
          <b style="font-size:1.3rem; color:${esPositiva ? 'var(--emerald-profit)' : 'var(--crimson-loss)'};">
            ${Number(item.margen || 0).toFixed(1)}%
          </b>
        </div>
      </div>
    `;

    modalDetalle.classList.add('is-active');
    modalDetalle.setAttribute('aria-hidden', 'false');
  }

  function cerrarModal() {
    modalDetalle.classList.remove('is-active');
    modalDetalle.setAttribute('aria-hidden', 'true');
    currentModalItem = null;
  }

  function cargarItemEnFormulario() {
    if (!currentModalItem) return;
    inputs.producto.value = currentModalItem.producto || '';
    inputs.cantidad.value = currentModalItem.cantidad || 1;
    inputs.precioUSA.value = currentModalItem.precioUSA || '';
    inputs.peso.value = currentModalItem.peso || 0.6;
    inputs.envioKg.value = currentModalItem.envioKg || 9.50;
    inputs.reempaque.value = currentModalItem.reempaque || 1.00;
    inputs.tc.value = currentModalItem.tc || 3.40;
    inputs.extras.value = currentModalItem.extras || 15.00;
    inputs.venta.value = currentModalItem.venta || '';

    ejecutarCalculo();
    cerrarModal();

    document.getElementById('seccion-formulario').scrollIntoView({ behavior: 'smooth' });
    inputs.producto.focus();
    showToast('Cotización cargada en el formulario');
  }

  /**
   * ========================================================================
   * BOTONES: NUEVA COTIZACIÓN Y LIMPIAR DATOS
   * ========================================================================
   */
  function nuevaCotizacion() {
    inputs.producto.value = '';
    inputs.precioUSA.value = '';
    inputs.venta.value = '';
    inputs.cantidad.value = '1';

    // Cargar la configuración base activa para este nuevo cálculo
    const configBase = obtenerConfigBase();
    const ultimos = obtenerUltimosValores() || configBase;
    const costoPorPerfume = parseFloat(configBase.reempaque) || 1.00;

    inputs.peso.value = ultimos.peso;
    inputs.envioKg.value = ultimos.envioKg;
    // En nueva cotización (cantidad = 1), reempaque automático = 1 × costo reempaque por perfume
    inputs.reempaque.value = (1 * costoPorPerfume).toFixed(2);
    inputs.tc.value = ultimos.tc;
    inputs.extras.value = ultimos.extras;

    ejecutarCalculo();

    document.getElementById('seccion-formulario').scrollIntoView({ behavior: 'smooth' });
    inputs.producto.focus();
    showToast('Listo para nueva cotización');
  }

  function limpiarDatos() {
    inputs.producto.value = '';
    inputs.cantidad.value = '1';
    inputs.precioUSA.value = '';
    inputs.venta.value = '';

    // Cargar la configuración base
    const configBase = obtenerConfigBase();
    const costoPorPerfume = parseFloat(configBase.reempaque) || 1.00;

    inputs.peso.value = configBase.peso;
    inputs.envioKg.value = configBase.envioKg;
    inputs.reempaque.value = (1 * costoPorPerfume).toFixed(2);
    inputs.tc.value = configBase.tc;
    inputs.extras.value = configBase.extras;

    // Actualizar memoria
    autoGuardarValoresUsuario();
    ejecutarCalculo();
    showToast('Valores restaurados según configuración base', 'info');
  }

  /**
   * ========================================================================
   * SECCIÓN CONFIGURACIÓN DE COSTOS (MODAL & ACCIONES)
   * ========================================================================
   */
  function abrirModalConfiguracion() {
    if (!modalConfig) return;
    const configBase = obtenerConfigBase();
    configInputs.peso.value = configBase.peso;
    configInputs.envioKg.value = configBase.envioKg;
    const costoCaja = (configBase.costoCaja !== undefined ? configBase.costoCaja : 4.00);
    if (configInputs.costoCaja) configInputs.costoCaja.value = parseFloat(costoCaja).toFixed(2);
    
    // Costo equivalente por perfume = Precio reempaque caja ÷ 4
    const costoPorPerfume = parseFloat((costoCaja / 4).toFixed(2));
    if (configInputs.reempaque) configInputs.reempaque.value = costoPorPerfume.toFixed(2);

    configInputs.tc.value = configBase.tc;
    configInputs.extras.value = configBase.extras;

    modalConfig.classList.add('is-active');
    modalConfig.setAttribute('aria-hidden', 'false');
  }

  function cerrarModalConfiguracion() {
    if (!modalConfig) return;
    modalConfig.classList.remove('is-active');
    modalConfig.setAttribute('aria-hidden', 'true');
  }

  function actualizarCostoCalculadoModal() {
    const caja = Math.max(0, parseFloat(configInputs.costoCaja ? configInputs.costoCaja.value : 4.00) || 0);
    const porPerfume = caja / 4;
    if (configInputs.reempaque) {
      configInputs.reempaque.value = porPerfume.toFixed(2);
    }
  }

  function guardarConfiguracionBase() {
    const rawCaja = configInputs.costoCaja ? configInputs.costoCaja.value : '4.00';
    const costoCaja = Math.max(0, parseFloat(rawCaja) >= 0 ? parseFloat(rawCaja) : 4.00);
    const costoPorPerfume = parseFloat((costoCaja / 4).toFixed(2));

    const nuevaConfig = {
      peso: Math.max(0, parseFloat(configInputs.peso.value) || 0.6),
      envioKg: Math.max(0, parseFloat(configInputs.envioKg.value) || 9.50),
      costoCaja: costoCaja,
      reempaque: costoPorPerfume, // Costo reempaque por perfume = Precio caja ÷ 4
      tc: Math.max(0, parseFloat(configInputs.tc.value) || 3.40),
      extras: Math.max(0, parseFloat(configInputs.extras.value) || 15.00)
    };

    localStorage.setItem(STORAGE_KEYS.BASE_CONFIG, JSON.stringify(nuevaConfig));

    // Aplicar de inmediato al cotizador:
    // Reempaque total = Cantidad de perfumes × costo reempaque por perfume
    const cantActual = Math.max(1, parseInt(inputs.cantidad.value, 10) || 1);
    inputs.peso.value = nuevaConfig.peso;
    inputs.envioKg.value = nuevaConfig.envioKg;
    inputs.reempaque.value = (cantActual * costoPorPerfume).toFixed(2);
    inputs.tc.value = nuevaConfig.tc;
    inputs.extras.value = nuevaConfig.extras;

    autoGuardarValoresUsuario();
    ejecutarCalculo();
    showToast('Configuración y enlace de Google Sheets guardados exitosamente');
    setTimeout(cerrarModalConfiguracion, 350);
  }

  function restaurarValoresFabrica() {
    if (confirm('¿Restablecer los valores base a la configuración de fábrica DUNES?')) {
      localStorage.removeItem(STORAGE_KEYS.BASE_CONFIG);
      localStorage.removeItem(STORAGE_KEYS.LAST_INPUTS);

      configInputs.peso.value = FACTORY_DEFAULTS.peso;
      configInputs.envioKg.value = FACTORY_DEFAULTS.envioKg;
      if (configInputs.costoCaja) configInputs.costoCaja.value = FACTORY_DEFAULTS.costoCaja.toFixed(2);
      const costoPorPerfume = FACTORY_DEFAULTS.costoCaja / 4;
      if (configInputs.reempaque) configInputs.reempaque.value = costoPorPerfume.toFixed(2);
      configInputs.tc.value = FACTORY_DEFAULTS.tc;
      configInputs.extras.value = FACTORY_DEFAULTS.extras;

      const cantActual = Math.max(1, parseInt(inputs.cantidad.value, 10) || 1);
      inputs.peso.value = FACTORY_DEFAULTS.peso;
      inputs.envioKg.value = FACTORY_DEFAULTS.envioKg;
      inputs.reempaque.value = (cantActual * costoPorPerfume).toFixed(2);
      inputs.tc.value = FACTORY_DEFAULTS.tc;
      inputs.extras.value = FACTORY_DEFAULTS.extras;

      ejecutarCalculo();
      showToast('Configuración de fábrica DUNES restaurada', 'info');
      setTimeout(cerrarModalConfiguracion, 350);
    }
  }

  /**
   * Escapar HTML para seguridad
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * ========================================================================
   * GESTIÓN DE NAVEGACIÓN ENTRE MÓDULOS (COTIZADOR / CATÁLOGO / COTIZACIONES)
   * Regla de Negocio: El Cotizador siempre es el módulo principal y la pantalla inicial.
   * ========================================================================
   */
  function cambiarPestana(nombreTab) {
    if (nombreTab === 'configuracion') {
      abrirModalConfiguracion();
      return;
    }

    vistaActiva = nombreTab;

    // Actualizar botones de navegación
    navTabs.forEach((tab) => {
      const tabName = tab.getAttribute('data-tab');
      if (tabName === nombreTab) {
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
      } else if (tabName !== 'configuracion') {
        tab.classList.remove('is-active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    // Cambiar visibilidad de las vistas
    Object.entries(views).forEach(([key, viewEl]) => {
      if (!viewEl) return;
      if (key === nombreTab) {
        viewEl.classList.remove('is-hidden');
        viewEl.classList.add('is-active');
      } else {
        viewEl.classList.add('is-hidden');
        viewEl.classList.remove('is-active');
      }
    });

    // Acciones al cambiar a cada módulo
    if (nombreTab === 'catalogo') {
      if (catalogoProductos.length === 0) {
        cargarCatalogo(false);
      } else {
        // Reactivar lazy loading de tarjetas visibles al regresar a la pestaña
        iniciarLazyLoadingCatalogo();
      }
      if (catalogoElements.busqueda) {
        setTimeout(() => catalogoElements.busqueda.focus(), 150);
      }
    } else if (nombreTab === 'cotizaciones') {
      renderizarHistorial();
    }
  }

  /**
   * ========================================================================
   * MÓDULO CATÁLOGO (SOLO CONSULTA CONECTADO A GOOGLE SHEETS)
   * Reglas de Negocio:
   * - Google Sheets es la ÚNICA fuente de edición.
   * - La app SOLO visualiza información.
   * - NO permitir edición, NO inputs modificables, NO botones de guardar.
   * - NO inventario, NO stock, NO clientes, NO cálculos dentro del catálogo.
   * ========================================================================
   */

  // Catálogo base de perfumes de lujo (con datos de respaldo offline)
  const CATALOGO_DEFAULT = [
    {
      id: 'dp-live-1',
      producto: '9 Am Dive 3.4 Oz',
      precioUSA: 19.71,
      cantidad: 1,
      pesoKg: 0.65,
      fleteKg: 9.50,
      reempaque: 1.00,
      costosExtras: 10.00,
      costoPeru: 91.41,
      precioVenta: 139.00,
      ganancia: 37.59
    },
    {
      id: 'dp-1',
      producto: 'Dior Sauvage EDT 100ml',
      precioUSA: 19.95,
      cantidad: 1,
      pesoKg: 0.60,
      fleteKg: 9.50,
      reempaque: 1.00,
      costosExtras: 15.00,
      costoPeru: 86.53,
      precioVenta: 139.00,
      ganancia: 37.47
    },
    {
      id: 'dp-2',
      producto: 'Club de Nuit Intense Man EDT 105ml',
      precioUSA: 28.00,
      cantidad: 2,
      pesoKg: 0.70,
      fleteKg: 9.50,
      reempaque: 1.00,
      costosExtras: 15.00,
      costoPeru: 115.20,
      precioVenta: 185.00,
      ganancia: 69.80
    },
    {
      id: 'dp-3',
      producto: 'Khamrah Lattafa EDP 100ml',
      precioUSA: 25.00,
      cantidad: 1,
      pesoKg: 0.60,
      fleteKg: 9.50,
      reempaque: 1.00,
      costosExtras: 15.00,
      costoPeru: 112.50,
      precioVenta: 175.00,
      ganancia: 62.50
    },
    {
      id: 'dp-4',
      producto: 'Bleu de Chanel EDP 100ml',
      precioUSA: 115.00,
      cantidad: 1,
      pesoKg: 0.60,
      fleteKg: 9.50,
      reempaque: 1.00,
      costosExtras: 15.00,
      costoPeru: 415.50,
      precioVenta: 540.00,
      ganancia: 124.50
    },
    {
      id: 'dp-5',
      producto: 'Versace Eros Flame EDP 100ml',
      precioUSA: 58.00,
      cantidad: 1,
      pesoKg: 0.60,
      fleteKg: 9.50,
      reempaque: 1.00,
      costosExtras: 15.00,
      costoPeru: 220.00,
      precioVenta: 310.00,
      ganancia: 90.00
    },
    {
      id: 'dp-6',
      producto: 'Afnan 9PM EDP 100ml',
      precioUSA: 26.50,
      cantidad: 1,
      pesoKg: 0.65,
      fleteKg: 9.50,
      reempaque: 1.00,
      costosExtras: 15.00,
      costoPeru: 114.50,
      precioVenta: 175.00,
      ganancia: 60.50
    }
  ];

  /**
   * Parser CSV compatible con RFC 4180 (soporta comillas, comas y saltos)
   */
  function parsearCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentField.trim());
          currentField = '';
        } else if (char === '\r') {
          if (nextChar === '\n') i++;
          currentRow.push(currentField.trim());
          if (currentRow.some(cell => cell.length > 0)) rows.push(currentRow);
          currentRow = [];
          currentField = '';
        } else if (char === '\n') {
          currentRow.push(currentField.trim());
          if (currentRow.some(cell => cell.length > 0)) rows.push(currentRow);
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(cell => cell.length > 0)) rows.push(currentRow);
    }

    return rows;
  }

  function normalizarClaveColumna(str) {
    return (str || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Convierte filas de Google Sheets en objetos normalizados según la estructura actual A-K:
   * A: Producto
   * B: Precio USA ($)
   * C: Cantidad
   * D: Peso KG
   * E: Flete x KG
   * F: Reempaque
   * G: Precio Dólar (T.C)
   * H: Costo Perú
   * I: Precio Venta (S/.)
   * J: Costos extras
   * K: Ganancia (S/.)
   */
  function convertirFilasACatalogo(rows) {
    if (!rows || rows.length < 2) return [];

    const headers = rows[0].map(h => normalizarClaveColumna(h));
    const encontrarIndice = (posibles) => headers.findIndex(h => posibles.includes(h));

    const idxMap = {
      // Mapeo exacto de los nombres actuales del Sheet (A-K) + columna opcional imagen:
      producto: encontrarIndice(['producto', 'perfume', 'nombre']),
      precioUSA: encontrarIndice(['preciousa', 'precio_usa', 'preciounitariousa']),
      cantidad: encontrarIndice(['cantidad', 'cant', 'unidades']),
      pesoKg: encontrarIndice(['pesokg', 'peso', 'peso_kg']),
      fleteKg: encontrarIndice(['fletexkg', 'fletekg', 'flete_x_kg']),
      reempaque: encontrarIndice(['reempaque']),
      precioDolarTC: encontrarIndice(['preciodolartc', 'preciodolar', 'tc']),
      costoPeru: encontrarIndice(['costoperu', 'costo_peru', 'costopuestoperu']),
      precioVenta: encontrarIndice(['precioventas', 'precioventa', 'precio_venta']),
      costosExtras: encontrarIndice(['costosextras', 'costosextraslocales', 'extras']),
      ganancia: encontrarIndice(['ganancias', 'ganancia', 'ganancia_neta']),
      imagen: encontrarIndice(['imagen', 'img', 'foto', 'image', 'urlimagen', 'imagenurl', 'fotourl'])
    };

    // Respaldo estricto por posición de columnas A-K (0 a 10):
    if (idxMap.producto === -1 && headers.length > 0) idxMap.producto = 0;
    if (idxMap.precioUSA === -1 && headers.length > 1) idxMap.precioUSA = 1;
    if (idxMap.cantidad === -1 && headers.length > 2) idxMap.cantidad = 2;
    if (idxMap.pesoKg === -1 && headers.length > 3) idxMap.pesoKg = 3;
    if (idxMap.fleteKg === -1 && headers.length > 4) idxMap.fleteKg = 4;
    if (idxMap.reempaque === -1 && headers.length > 5) idxMap.reempaque = 5;
    if (idxMap.precioDolarTC === -1 && headers.length > 6) idxMap.precioDolarTC = 6;
    if (idxMap.costoPeru === -1 && headers.length > 7) idxMap.costoPeru = 7;
    if (idxMap.precioVenta === -1 && headers.length > 8) idxMap.precioVenta = 8;
    if (idxMap.costosExtras === -1 && headers.length > 9) idxMap.costosExtras = 9;
    if (idxMap.ganancia === -1 && headers.length > 10) idxMap.ganancia = 10;

    const limpiarNumero = (val, valorDefault = 0) => {
      if (val === undefined || val === null || val === '') return valorDefault;
      let str = val.toString().trim();
      str = str.replace(/S\/\.?/gi, '').replace(/\$/g, '').replace(/[a-zA-Z]/g, '').replace(/,/g, '').trim();
      const num = parseFloat(str);
      return isNaN(num) ? valorDefault : num;
    };

    const productos = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const nombre = idxMap.producto !== -1 ? (row[idxMap.producto] || '').trim() : '';
      if (!nombre) continue;

      productos.push({
        id: `gs-${i}`,
        // Campos visibles en el catálogo:
        producto: nombre,
        precioUSA: idxMap.precioUSA !== -1 ? limpiarNumero(row[idxMap.precioUSA], 0) : 0,
        costoPeru: idxMap.costoPeru !== -1 ? limpiarNumero(row[idxMap.costoPeru], 0) : 0,
        precioVenta: idxMap.precioVenta !== -1 ? limpiarNumero(row[idxMap.precioVenta], 0) : 0,
        ganancia: idxMap.ganancia !== -1 ? limpiarNumero(row[idxMap.ganancia], 0) : 0,

        // Datos internos mantenidos:
        cantidad: idxMap.cantidad !== -1 ? Math.max(1, parseInt(row[idxMap.cantidad], 10) || 1) : 1,
        pesoKg: idxMap.pesoKg !== -1 ? limpiarNumero(row[idxMap.pesoKg], 0.6) : 0.6,
        fleteKg: idxMap.fleteKg !== -1 ? limpiarNumero(row[idxMap.fleteKg], 9.50) : 9.50,
        reempaque: idxMap.reempaque !== -1 ? limpiarNumero(row[idxMap.reempaque], 1.00) : 1.00,
        tc: idxMap.precioDolarTC !== -1 ? limpiarNumero(row[idxMap.precioDolarTC], 3.40) : 3.40,
        costosExtras: idxMap.costosExtras !== -1 ? limpiarNumero(row[idxMap.costosExtras], 10.00) : 10.00,
        imagen: (idxMap.imagen !== -1 && row[idxMap.imagen]) ? (row[idxMap.imagen] || '').trim() : ''
      });
    }

    return productos;
  }

  function construirURLGoogleSheetCSV(input) {
    const raw = (input && input.trim()) ? input.trim() : DEFAULT_SHEETS_CSV_URL;

    if (raw.includes('/pub') || raw.includes('/export?format=csv') || raw.includes('/gviz/tq?tqx=out:csv') || raw.includes('output=csv')) {
      const sep = raw.includes('?') ? '&' : '?';
      return `${raw}${sep}_t=${Date.now()}`;
    }

    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = (match && match[1] && match[1] !== 'e') ? match[1] : (/^[a-zA-Z0-9-_]{20,}$/.test(raw) ? raw : null);

    if (!sheetId) return `${raw}${raw.includes('?') ? '&' : '?'}_t=${Date.now()}`;

    const gidMatch = raw.match(/[#&?]gid=([0-9]+)/);
    const gidParam = (gidMatch && gidMatch[1]) ? `&gid=${gidMatch[1]}` : '';

    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}&_t=${Date.now()}`;
  }

  /**
   * Renderiza las tarjetas del Catálogo en modo SOLO CONSULTA — Estilo Perfumería Luxury.
   * Muestra todos los 11 datos requeridos sin eliminar ninguno:
   * - Encabezado: Producto + Inversión Precio USA al lado
   * - Bloque Principal: Costo Perú, Venta, Ganancia
   * - Pie: Datos internos de cálculo en una sola línea compacta
   * - Soporte de imagen opcional
   */
  function renderizarCatalogo(productosParaMostrar, terminoBusqueda = '') {
    if (!catalogoElements.lista) return;

    catalogoElements.lista.innerHTML = '';
    const total = productosParaMostrar.length;

    if (terminoBusqueda) {
      catalogoElements.contador.textContent = `${total} resultado${total === 1 ? '' : 's'} para "${terminoBusqueda}"`;
    } else {
      catalogoElements.contador.textContent = `${total} perfume${total === 1 ? '' : 's'} disponible${total === 1 ? '' : 's'}`;
    }

    if (total === 0) {
      catalogoElements.empty.style.display = 'flex';
      if (terminoBusqueda) {
        catalogoElements.emptyTitle.textContent = `No se encontraron perfumes para "${terminoBusqueda}"`;
        catalogoElements.emptyDesc.textContent = 'Intenta buscando por marca o nombre (ej: 9 Am, Dior, Club de Nuit).';
      } else {
        catalogoElements.emptyTitle.textContent = 'Catálogo vacío';
        catalogoElements.emptyDesc.textContent = 'No hay filas en la hoja de Google Sheets.';
      }
      return;
    }

    catalogoElements.empty.style.display = 'none';

    productosParaMostrar.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'catalog-card';
      card.setAttribute('data-id', item.id);

      const gananciaPositiva = (item.ganancia >= 0);
      const tieneImagen = item.imagen && (item.imagen.startsWith('http://') || item.imagen.startsWith('https://'));

      card.innerHTML = `
        <!-- 1. Encabezado: Perfume (Icono o Mini imagen) + Nombre y Precio USA cercano -->
        <div class="card-top-section">
          <div class="card-title-group">
            ${tieneImagen ? `
              <div class="card-thumb-wrapper">
                <div class="card-thumb-placeholder">
                  <span class="card-thumb-shimmer"></span>
                  <span class="card-thumb-fallback-icon">🧴</span>
                </div>
                <img data-src="${escapeHTML(item.imagen)}" alt="${escapeHTML(item.producto)}" class="card-mini-thumb" onerror="this.style.display='none'; if(this.previousElementSibling) this.previousElementSibling.classList.add('is-failed');">
              </div>
            ` : `
              <span class="card-perfume-icon">🧴</span>
            `}
            <h3 class="card-product-name" title="${escapeHTML(item.producto)}">${escapeHTML(item.producto)}</h3>
          </div>
          <div class="card-usa-tag">
            <span class="usa-lbl">USA</span>
            <span class="usa-val">${formatUSD(item.precioUSA)}</span>
          </div>
        </div>

        <!-- 2. Bloque Principal: Sección visual con 3 valores grandes -->
        <div class="card-trio-grid">
          <div class="trio-item trio-costo">
            <span class="trio-lbl">Costo Perú</span>
            <span class="trio-val val-costo">${formatPEN(item.costoPeru)}</span>
          </div>
          <div class="trio-item trio-venta">
            <span class="trio-lbl">Venta</span>
            <span class="trio-val val-venta">${formatPEN(item.precioVenta)}</span>
          </div>
          <div class="trio-item trio-ganancia ${gananciaPositiva ? 'is-profit' : 'is-loss'}">
            <span class="trio-lbl">Ganancia</span>
            <span class="trio-val val-ganancia">${formatPEN(item.ganancia)}</span>
          </div>
        </div>

        <!-- 3. Datos Internos: Una sola línea inferior compacta y discreta -->
        <div class="card-internal-footer">
          <span class="calc-line-text">${item.cantidad}ud • ${Number(item.pesoKg || 0).toFixed(2)}kg • Flete ${formatUSD(item.fleteKg)} • Rep ${formatUSD(item.reempaque)} • TC ${Number(item.tc || 0).toFixed(2)} • Extras ${formatPEN(item.costosExtras)}</span>
        </div>
      `;

      catalogoElements.lista.appendChild(card);
    });

    // Activar carga progresiva (Lazy Loading) de las imágenes visibles en pantalla
    iniciarLazyLoadingCatalogo();
  }

  /**
   * Carga progresiva (Lazy Loading) de imágenes del catálogo con IntersectionObserver.
   * Carga únicamente las imágenes que entran en la pantalla visible del usuario.
   */
  function iniciarLazyLoadingCatalogo() {
    if (catalogoImageObserver) {
      catalogoImageObserver.disconnect();
      catalogoImageObserver = null;
    }

    if (!catalogoElements.lista) return;

    const lazyImages = catalogoElements.lista.querySelectorAll('img.card-mini-thumb[data-src]');
    if (!lazyImages || lazyImages.length === 0) return;

    if ('IntersectionObserver' in window) {
      catalogoImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            cargarImagenLazy(img);
            observer.unobserve(img);
          }
        });
      }, {
        root: null,
        rootMargin: '100px 0px 100px 0px', // Anticipa la carga 100px antes de entrar a la pantalla
        threshold: 0.01
      });

      lazyImages.forEach((img) => catalogoImageObserver.observe(img));
    } else {
      // Fallback para navegadores antiguos sin IntersectionObserver
      lazyImages.forEach((img) => cargarImagenLazy(img));
    }
  }

  /**
   * Carga asíncrona de una imagen con transición suave entre el placeholder y la imagen real.
   */
  function cargarImagenLazy(img) {
    const src = img.getAttribute('data-src');
    if (!src) return;
    img.removeAttribute('data-src');

    const wrapper = img.closest('.card-thumb-wrapper');
    const placeholder = wrapper ? wrapper.querySelector('.card-thumb-placeholder') : null;

    const preloader = new Image();
    preloader.onload = () => {
      img.src = src;
      img.classList.add('is-loaded');
      if (placeholder) {
        placeholder.classList.add('is-hidden');
      }
    };
    preloader.onerror = () => {
      img.style.display = 'none';
      if (placeholder) {
        placeholder.classList.add('is-failed');
      }
    };
    preloader.src = src;
  }

  /**
   * Filtrado en tiempo real con el Buscador
   */
  function filtrarCatalogo() {
    if (!catalogoElements.busqueda) return;
    const termino = catalogoElements.busqueda.value.trim();

    if (!termino) {
      if (catalogoElements.btnLimpiar) catalogoElements.btnLimpiar.style.display = 'none';
      renderizarCatalogo(catalogoProductos, '');
      return;
    }

    if (catalogoElements.btnLimpiar) catalogoElements.btnLimpiar.style.display = 'flex';

    const normalizar = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const terminoNorm = normalizar(termino);

    const filtrados = catalogoProductos.filter((item) => {
      const nombreNorm = normalizar(item.producto);
      return nombreNorm.includes(terminoNorm);
    });

    renderizarCatalogo(filtrados, termino);
  }

  /**
   * Carga y sincronización con Google Sheets (Caché local + Red)
   */
  async function cargarCatalogo(forzarRed = false) {
    if (catalogoCargando) return;
    catalogoCargando = true;

    if (catalogoElements.btnSync) catalogoElements.btnSync.classList.add('is-spinning');
    if (catalogoElements.syncDot) catalogoElements.syncDot.className = 'sync-status-dot is-syncing';
    if (catalogoElements.syncText) catalogoElements.syncText.textContent = 'Consultando Google Sheets...';

    // 1. Cargar caché previo
    if (!forzarRed) {
      try {
        const cacheGuardada = localStorage.getItem(STORAGE_KEYS.CATALOGO_CACHE);
        if (cacheGuardada) {
          const parsed = JSON.parse(cacheGuardada);
          if (Array.isArray(parsed) && parsed.length > 0) {
            catalogoProductos = parsed;
            renderizarCatalogo(catalogoProductos);
            const ultima = localStorage.getItem(STORAGE_KEYS.CATALOGO_LAST_SYNC) || 'Previa';
            if (catalogoElements.syncDot) catalogoElements.syncDot.className = 'sync-status-dot';
            if (catalogoElements.syncText) catalogoElements.syncText.textContent = `Sincronizado (${ultima})`;
          }
        }
      } catch (e) {
        console.warn('Error al leer caché local del catálogo', e);
      }
    }

    // 2. Obtener URL configurada de Google Sheets
    const sheetsUrlGuardada = localStorage.getItem(STORAGE_KEYS.SHEETS_URL);
    const urlCSV = construirURLGoogleSheetCSV(sheetsUrlGuardada);

    if (!urlCSV) {
      if (catalogoProductos.length === 0) {
        catalogoProductos = [...CATALOGO_DEFAULT];
        localStorage.setItem(STORAGE_KEYS.CATALOGO_CACHE, JSON.stringify(catalogoProductos));
        renderizarCatalogo(catalogoProductos);
      }
      if (catalogoElements.syncDot) catalogoElements.syncDot.className = 'sync-status-dot';
      if (catalogoElements.syncText) catalogoElements.syncText.textContent = 'Catálogo base activo';
      if (catalogoElements.btnSync) catalogoElements.btnSync.classList.remove('is-spinning');
      catalogoCargando = false;
      return;
    }

    // 3. Petición en vivo a Google Sheets
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(urlCSV, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csvText = await response.text();
      const rows = parsearCSV(csvText);
      const items = convertirFilasACatalogo(rows);

      if (items.length > 0) {
        catalogoProductos = items;
        localStorage.setItem(STORAGE_KEYS.CATALOGO_CACHE, JSON.stringify(items));
        const horaSync = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem(STORAGE_KEYS.CATALOGO_LAST_SYNC, horaSync);

        renderizarCatalogo(catalogoProductos);
        if (catalogoElements.syncDot) catalogoElements.syncDot.className = 'sync-status-dot';
        if (catalogoElements.syncText) catalogoElements.syncText.textContent = `Sincronizado (${horaSync})`;
        showToast(`Catálogo sincronizado: ${items.length} perfumes cargados`);
      } else {
        throw new Error('La hoja no contiene filas con datos');
      }
    } catch (err) {
      console.warn('[DUNES CATÁLOGO] Error al conectar con Google Sheets:', err);
      if (catalogoProductos.length === 0) {
        catalogoProductos = [...CATALOGO_DEFAULT];
        renderizarCatalogo(catalogoProductos);
      }
      if (catalogoElements.syncDot) catalogoElements.syncDot.className = 'sync-status-dot is-offline';
      if (catalogoElements.syncText) catalogoElements.syncText.textContent = 'Modo local (Sin conexión a Sheets)';
      if (forzarRed) {
        showToast('No se pudo conectar a Google Sheets. Mostrando datos locales.', 'info');
      }
    } finally {
      if (catalogoElements.btnSync) catalogoElements.btnSync.classList.remove('is-spinning');
      catalogoCargando = false;
    }
  }

  /**
   * ========================================================================
   * ASIGNACIÓN DE EVENTOS
   * ========================================================================
   */

  // Navegación por pestañas
  navTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const targetTab = e.currentTarget.getAttribute('data-tab');
      cambiarPestana(targetTab);
    });
  });

  // Buscador del Catálogo
  if (catalogoElements.busqueda) {
    catalogoElements.busqueda.addEventListener('input', filtrarCatalogo);
  }

  if (catalogoElements.btnLimpiar) {
    catalogoElements.btnLimpiar.addEventListener('click', () => {
      catalogoElements.busqueda.value = '';
      filtrarCatalogo();
      catalogoElements.busqueda.focus();
    });
  }

  if (catalogoElements.btnSync) {
    catalogoElements.btnSync.addEventListener('click', () => {
      cargarCatalogo(true);
    });
  }

  // Cálculo y sincronización en tiempo real
  Object.entries(inputs).forEach(([key, input]) => {
    if (!input) return;
    if (key === 'cantidad') {
      const onCantidadChange = () => {
        const cant = Math.max(1, parseInt(inputs.cantidad.value, 10) || 1);
        const configBase = obtenerConfigBase();
        const costoPorPerfume = parseFloat(configBase.reempaque) || 1.00;
        inputs.reempaque.value = (cant * costoPorPerfume).toFixed(2);
        ejecutarCalculo();
      };
      input.addEventListener('input', onCantidadChange);
      input.addEventListener('change', onCantidadChange);
    } else {
      input.addEventListener('input', ejecutarCalculo);
      input.addEventListener('change', ejecutarCalculo);
    }
  });

  // Sincronización en vivo del precio de caja en el modal de configuración
  if (configInputs.costoCaja) {
    configInputs.costoCaja.addEventListener('input', actualizarCostoCalculadoModal);
    configInputs.costoCaja.addEventListener('change', actualizarCostoCalculadoModal);
  }

  // Botones del formulario
  btnCalcular.addEventListener('click', () => {
    ejecutarCalculo();
    showToast('Cálculo actualizado', 'info');
  });

  btnGuardar.addEventListener('click', guardarCotizacionActual);
  btnNuevo.addEventListener('click', nuevaCotizacion);
  btnLimpiar.addEventListener('click', limpiarDatos);
  btnBorrarHistorial.addEventListener('click', borrarTodoHistorial);

  // Sección Configuración (Modal)
  if (btnAbrirConfig) btnAbrirConfig.addEventListener('click', abrirModalConfiguracion);
  if (btnCerrarConfig) btnCerrarConfig.addEventListener('click', cerrarModalConfiguracion);
  btnGuardarConfig.addEventListener('click', guardarConfiguracionBase);
  btnRestaurarFabrica.addEventListener('click', restaurarValoresFabrica);

  if (modalConfig) {
    modalConfig.addEventListener('click', (e) => {
      if (e.target === modalConfig) cerrarModalConfiguracion();
    });
  }

  // Modal Detalle
  btnCerrarModal.addEventListener('click', cerrarModal);
  btnCerrarModalBottom.addEventListener('click', cerrarModal);
  btnCargarModal.addEventListener('click', cargarItemEnFormulario);
  modalDetalle.addEventListener('click', (e) => {
    if (e.target === modalDetalle) cerrarModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalDetalle.classList.contains('is-active')) cerrarModal();
      if (modalConfig && modalConfig.classList.contains('is-active')) cerrarModalConfiguracion();
    }
  });

  // Estado Online / Offline (Compatible con mini indicador y estándar)
  function actualizarEstadoConexion() {
    if (!pwaStatus) return;
    const isOnline = navigator.onLine;
    const pulse = pwaStatus.querySelector('.status-dot-mini, .status-pulse');
    const label = pwaStatus.querySelector('.status-text-mini, .status-label');

    if (pulse && label) {
      if (isOnline) {
        pulse.style.background = 'var(--emerald-profit)';
        pulse.style.boxShadow = '0 0 6px var(--emerald-profit)';
        label.textContent = 'Online';
      } else {
        pulse.style.background = 'var(--gold-primary)';
        pulse.style.boxShadow = '0 0 6px var(--gold-primary)';
        label.textContent = 'Offline (PWA)';
      }
    }
  }

  window.addEventListener('online', actualizarEstadoConexion);
  window.addEventListener('offline', actualizarEstadoConexion);
  actualizarEstadoConexion();

  // Registro del Service Worker para funcionamiento Offline y PWA (compatible GitHub Pages)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then((reg) => {
          console.log('[DUNES PWA] Service Worker registrado con éxito:', reg.scope);
        })
        .catch((err) => {
          console.log('[DUNES PWA] Error al registrar Service Worker:', err);
        });
    });
  }

  // ========================================================================
  // ARRANQUE DE LA APLICACIÓN
  // REQUISITO CRÍTICO: La pantalla inicial SIEMPRE será el Cotizador.
  // ========================================================================
  cargarValoresIniciales();
  ejecutarCalculo();
  renderizarHistorial();
  cargarCatalogo(false);
  cambiarPestana('cotizador'); // Pantalla inicial garantizada: Cotizador

  console.log('[DUNES PARFUMS] Inicializado. Módulo principal activo: Cotizador.');
});
