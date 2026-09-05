const assert = require('assert');
const { calculateDunesQuotation } = require('../js/calculator');

console.log('--- Iniciando Tests Matemáticos de DUNES PARFUMS ---');

// Caso 1: Caso de prueba extraído directamente del Excel original (COTIZADOR IMPORTACION DUNES PARFUMS.xlsx)
{
  const inputExcel = {
    cantidad: 1,
    precioUSA: 20.90,
    peso: 0.8,
    envioKg: 10,
    reempaque: 0,
    tc: 3.45,
    extras: 0,
    venta: 175.00
  };

  const res = calculateDunesQuotation(inputExcel);

  console.log('Caso 1 (Excel):', res);

  assert.strictEqual(res.totalUSA, 20.90, 'Total USA debe ser 20.90');
  assert.strictEqual(res.flete, 8.00, 'Flete debe ser 0.8 * 10 = 8.00');
  assert.strictEqual(res.totalEnvio, 8.00, 'Total envío debe ser 8.00');
  assert.strictEqual(res.precioTotalUSD, 28.90, 'Precio total USD debe ser 20.9 + 8 = 28.90');
  assert.strictEqual(res.precioTotalSoles, 99.71, 'Precio total soles debe ser 28.9 * 3.45 = 99.705 (redondeado 99.71)');
  assert.strictEqual(res.costoUnidad, 99.71, 'Costo por unidad debe ser 99.71');
  assert.strictEqual(res.gananciaUnidad, 75.30, 'Ganancia por unidad debe ser 175 - 99.705 - 0 = 75.295 redondeado a 75.30');
  assert.strictEqual(res.gananciaTotal, 75.30, 'Ganancia total debe ser 75.30');
  console.log('✔ Caso 1 (Excel) superado con éxito.');
}

// Caso 2: Caso de prueba del prompt maestro
{
  const inputPrompt = {
    cantidad: 1,
    precioUSA: 33.50,
    peso: 0.60,
    envioKg: 9.50,
    reempaque: 1.00,
    tc: 3.40,
    extras: 15.00,
    venta: 175.00
  };

  const res = calculateDunesQuotation(inputPrompt);

  console.log('Caso 2 (Prompt Maestro):', res);

  // Total USA = 33.50 * 1 = 33.50
  assert.strictEqual(res.totalUSA, 33.50, 'Total USA debe ser 33.50');
  // Flete = 0.60 * 9.50 = 5.70
  assert.strictEqual(res.flete, 5.70, 'Flete debe ser 5.70');
  // Total Gasto Envio = 5.70 + 1.00 = 6.70
  assert.strictEqual(res.totalEnvio, 6.70, 'Total envío debe ser 6.70');
  // Precio Total USD = 33.50 + 6.70 = 40.20
  assert.strictEqual(res.precioTotalUSD, 40.20, 'Precio total USD debe ser 40.20');
  // Precio Total Soles = 40.20 * 3.40 = 136.68
  assert.strictEqual(res.precioTotalSoles, 136.68, 'Precio total soles debe ser 136.68');
  // Costo por unidad = 136.68 / 1 = 136.68
  assert.strictEqual(res.costoUnidad, 136.68, 'Costo unidad debe ser 136.68');
  // Ganancia por unidad = 175 - 136.68 - 15 = 23.32
  assert.strictEqual(res.gananciaUnidad, 23.32, 'Ganancia por unidad debe ser 23.32');
  // Ganancia total = 23.32 * 1 = 23.32
  assert.strictEqual(res.gananciaTotal, 23.32, 'Ganancia total debe ser 23.32');
  // Margen = (23.32 / 175) * 100 = 13.33%
  assert.strictEqual(res.margen, 13.33, 'Margen debe ser 13.33%');
  console.log('✔ Caso 2 (Prompt Maestro) superado con éxito.');
}

// Caso 3: Cantidades múltiples y precio venta 0 (evitar división por cero)
{
  const inputMultiples = {
    cantidad: 3,
    precioUSA: 50.00,
    peso: 1.80,
    envioKg: 9.50,
    reempaque: 2.00,
    tc: 3.40,
    extras: 20.00,
    venta: 0
  };

  const res = calculateDunesQuotation(inputMultiples);

  // Total USA = 50 * 3 = 150
  assert.strictEqual(res.totalUSA, 150.00);
  // Flete = 1.8 * 9.50 = 17.10
  assert.strictEqual(res.flete, 17.10);
  // Total Envio = 17.10 + 2.00 = 19.10
  assert.strictEqual(res.totalEnvio, 19.10);
  // Total USD = 150 + 19.10 = 169.10
  assert.strictEqual(res.precioTotalUSD, 169.10);
  // Total Soles = 169.10 * 3.40 = 574.94
  assert.strictEqual(res.precioTotalSoles, 574.94);
  // Costo Unidad = 574.94 / 3 = 191.65
  assert.strictEqual(res.costoUnidad, 191.65);
  // Margen cuando venta es 0 debe ser 0% sin NaN
  assert.strictEqual(res.margen, 0.00);
  console.log('✔ Caso 3 (Múltiples y Venta 0) superado con éxito.');
}

// Caso 4: Caso de prueba del nuevo flujo de pruebas sin navegador
{
  const inputPromptNuevo = {
    producto: 'Dior Sauvage EDT 100ml',
    cantidad: 1,
    precioUSA: 19.95,
    peso: 0.6,
    envioKg: 9.50,
    reempaque: 1.00,
    tc: 3.40,
    extras: 15.00,
    venta: 139.00
  };

  const res = calculateDunesQuotation(inputPromptNuevo);

  console.log('Caso 4 (Validación Directa Solicitada):', res);

  assert.strictEqual(res.totalUSA, 19.95, 'Total USA debe ser 19.95 USD');
  assert.strictEqual(res.flete, 5.70, 'Flete debe ser 0.6 * 9.50 = 5.70 USD');
  assert.strictEqual(res.totalEnvio, 6.70, 'Total envío debe ser 5.70 + 1 = 6.70 USD');
  assert.strictEqual(res.precioTotalUSD, 26.65, 'Total USD debe ser 19.95 + 6.70 = 26.65 USD');
  assert.strictEqual(res.precioTotalSoles, 90.61, 'Costo Perú debe ser 26.65 * 3.40 = 90.61 S/');
  assert.strictEqual(res.costoUnidad, 90.61, 'Costo unidad debe ser 90.61 S/');
  assert.strictEqual(res.gananciaUnidad, 33.39, 'Ganancia unidad debe ser 139 - 90.61 - 15 = 33.39 S/');
  assert.strictEqual(res.gananciaTotal, 33.39, 'Ganancia total debe ser 33.39 S/');
  console.log('✔ Caso 4 (Validación Directa Solicitada) superado con éxito.');
}

console.log('--- TODOS LOS TESTS MATEMÁTICOS PASARON SATISFACTORIAMENTE ---');

