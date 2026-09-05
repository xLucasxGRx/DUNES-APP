/**
 * ==========================================================================
 * DUNES PARFUMS — Controlador Principal de la Aplicación
 * Lógica de cotizaciones, persistencia en LocalStorage y soporte PWA
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Clave para almacenamiento local
  const STORAGE_KEY = 'dunes_cotizaciones_v1';

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

  // Referencias a botones de acción
  const btnCalcular = document.getElementById('btn-calcular');
  const btnGuardar = document.getElementById('btn-guardar');
  const btnNuevo = document.getElementById('btn-nuevo');
  const btnLimpiar = document.getElementById('btn-limpiar');
  const btnBorrarHistorial = document.getElementById('btn-borrar-historial');

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

  // Contenedor de Toast
  const toastContainer = document.getElementById('toast-container');
  const pwaStatus = document.getElementById('pwa-status');

  // Estado en memoria de la cotización actual
  let currentCalculations = null;
  let currentModalItem = null;

  // Formateadores
  const formatUSD = (num) => `$ ${Number(num || 0).toFixed(2)}`;
  const formatPEN = (num) => `S/ ${Number(num || 0).toFixed(2)}`;
  const formatNum = (num) => Number(num || 0).toFixed(2);

  /**
   * Obtiene los valores actuales del formulario
   */
  function getFormValues() {
    return {
      producto: inputs.producto.value.trim(),
      cantidad: Math.max(1, parseInt(inputs.cantidad.value, 10) || 1),
      precioUSA: parseFloat(inputs.precioUSA.value) || 0,
      peso: parseFloat(inputs.peso.value) || 0,
      envioKg: parseFloat(inputs.envioKg.value) || 0,
      reempaque: parseFloat(inputs.reempaque.value) || 0,
      tc: parseFloat(inputs.tc.value) || 0,
      extras: parseFloat(inputs.extras.value) || 0,
      venta: parseFloat(inputs.venta.value) || 0
    };
  }

  /**
   * Ejecuta el cálculo y actualiza las tarjetas de resultados
   */
  function ejecutarCalculo() {
    const vals = getFormValues();

    // Motor de cálculo garantizado por tests unitarios
    const res = window.calculateDunesQuotation(vals);
    currentCalculations = { ...vals, ...res };

    // Actualizar Tarjeta 1: Costo Puesto en Perú
    outputs.totalUSA.textContent = formatUSD(res.totalUSA);
    outputs.flete.textContent = formatUSD(res.flete);
    outputs.reempaque.textContent = formatUSD(res.reempaque);
    outputs.totalUSD.textContent = formatUSD(res.precioTotalUSD);
    outputs.costoPeru.textContent = formatNum(res.costoUnidad);
    outputs.costoTotalSoles.textContent = `Total lote: ${formatPEN(res.precioTotalSoles)}`;

    // Actualizar Tarjeta 2: Ganancia
    outputs.gananciaUnidad.textContent = formatNum(res.gananciaUnidad);
    outputs.gananciaTotal.textContent = formatNum(res.gananciaTotal);
    outputs.margen.textContent = `${res.margen.toFixed(1)}%`;

    // Clases visuales de rentabilidad (Verde si es positivo, Rojo si es negativo)
    const esPositiva = res.gananciaUnidad >= 0;
    
    outputs.wrapGananciaUnidad.className = `stat-value-wrap ${esPositiva ? 'positive' : 'negative'}`;
    outputs.wrapGananciaTotal.className = `stat-value-wrap ${esPositiva ? 'positive' : 'negative'}`;

    // Barra de margen (tope en 100%)
    const margenClamped = Math.max(0, Math.min(100, res.margen));
    outputs.margenBar.style.width = `${margenClamped}%`;
    if (!esPositiva) {
      outputs.margenBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
      outputs.margen.style.color = '#ef4444';
    } else {
      outputs.margenBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
      outputs.margen.style.color = '#10b981';
    }

    return currentCalculations;
  }

  /**
   * Muestra notificación Toast flotante
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
    }, 3200);
  }

  /**
   * Almacenamiento Local (LocalStorage)
   */
  function obtenerHistorial() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer historial de LocalStorage', e);
      return [];
    }
  }

  function guardarHistorial(lista) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (e) {
      console.error('Error al guardar historial en LocalStorage', e);
    }
  }

  /**
   * Guarda la cotización actual en el historial
   */
  function guardarCotizacionActual() {
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
    historial.unshift(nuevoItem); // Agregar al inicio
    guardarHistorial(historial);

    renderizarHistorial();
    showToast(`"${nombre}" guardado en historial`);
  }

  /**
   * Renderiza la lista de tarjetas de historial
   */
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
            <h4 class="quote-card-title">${escapeHTML(item.producto)}</h4>
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

    // Asignar eventos a los botones de cada tarjeta
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

  /**
   * Elimina una cotización individual
   */
  function eliminarCotizacion(id) {
    let historial = obtenerHistorial();
    const item = historial.find((i) => i.id === id);
    const nombre = item ? item.producto : 'Cotización';

    historial = historial.filter((i) => i.id !== id);
    guardarHistorial(historial);
    renderizarHistorial();
    showToast(`Eliminado: ${nombre}`, 'info');
  }

  /**
   * Borra todo el historial
   */
  function borrarTodoHistorial() {
    if (confirm('¿Estás seguro de que deseas borrar todas las cotizaciones guardadas?')) {
      localStorage.removeItem(STORAGE_KEY);
      renderizarHistorial();
      showToast('Historial completo eliminado', 'info');
    }
  }

  /**
   * Modal de Detalle
   */
  function abrirModalDetalle(id) {
    const historial = obtenerHistorial();
    const item = historial.find((i) => i.id === id);
    if (!item) return;

    currentModalItem = item;
    modalProducto.textContent = item.producto;
    modalFecha.textContent = `Guardado: ${item.fecha}`;

    const esPositiva = (item.gananciaUnidad >= 0);

    modalContenido.innerHTML = `
      <table class="detail-table">
        <tbody>
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
            <td>Flete aéreo (Peso × Tarifa):</td>
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

  /**
   * Carga los datos del modal en el formulario principal
   */
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

    // Scroll suave al formulario
    document.getElementById('seccion-formulario').scrollIntoView({ behavior: 'smooth' });
    inputs.producto.focus();
    showToast('Cotización cargada en el formulario');
  }

  /**
   * Botón NUEVA COTIZACIÓN
   */
  function nuevaCotizacion() {
    inputs.producto.value = '';
    inputs.precioUSA.value = '';
    inputs.venta.value = '';
    ejecutarCalculo();

    document.getElementById('seccion-formulario').scrollIntoView({ behavior: 'smooth' });
    inputs.producto.focus();
    showToast('Listo para nueva cotización');
  }

  /**
   * Botón LIMPIAR DATOS
   */
  function limpiarDatos() {
    inputs.producto.value = '';
    inputs.cantidad.value = '1';
    inputs.precioUSA.value = '';
    inputs.peso.value = '0.6';
    inputs.envioKg.value = '9.50';
    inputs.reempaque.value = '1.00';
    inputs.tc.value = '3.40';
    inputs.extras.value = '15.00';
    inputs.venta.value = '';

    ejecutarCalculo();
    showToast('Valores restaurados por defecto', 'info');
  }

  /**
   * Escapar HTML para seguridad en historial
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
   * Eventos de Escucha
   */
  // Cálculo automático en vivo mientras se escribe
  Object.values(inputs).forEach((input) => {
    if (input) {
      input.addEventListener('input', ejecutarCalculo);
      input.addEventListener('change', ejecutarCalculo);
    }
  });

  // Botones principales
  btnCalcular.addEventListener('click', () => {
    ejecutarCalculo();
    showToast('Cálculo actualizado', 'info');
  });

  btnGuardar.addEventListener('click', guardarCotizacionActual);
  btnNuevo.addEventListener('click', nuevaCotizacion);
  btnLimpiar.addEventListener('click', limpiarDatos);
  btnBorrarHistorial.addEventListener('click', borrarTodoHistorial);

  // Eventos de Modal
  btnCerrarModal.addEventListener('click', cerrarModal);
  btnCerrarModalBottom.addEventListener('click', cerrarModal);
  btnCargarModal.addEventListener('click', cargarItemEnFormulario);
  modalDetalle.addEventListener('click', (e) => {
    if (e.target === modalDetalle) cerrarModal();
  });

  // Cerrar modal con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalDetalle.classList.contains('is-active')) {
      cerrarModal();
    }
  });

  // Detección de conectividad (Online/Offline)
  function actualizarEstadoConexion() {
    if (!pwaStatus) return;
    const isOnline = navigator.onLine;
    const pulse = pwaStatus.querySelector('.status-pulse');
    const label = pwaStatus.querySelector('.status-label');

    if (pulse && label) {
      if (isOnline) {
        pulse.style.background = 'var(--emerald-profit)';
        pulse.style.boxShadow = '0 0 8px var(--emerald-profit)';
        label.textContent = 'Online';
      } else {
        pulse.style.background = 'var(--gold-primary)';
        pulse.style.boxShadow = '0 0 8px var(--gold-primary)';
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

  // Inicialización
  ejecutarCalculo();
  renderizarHistorial();
  console.log('[DUNES PARFUMS] Inicializado correctamente.');
});
