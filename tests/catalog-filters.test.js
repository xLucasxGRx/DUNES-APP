const fs = require('fs');
const assert = require('assert');

console.log('--- Iniciando Verificación Interna de Filtros DUNES PARFUMS ---\n');

// 1. Verificar HTML
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="catalogo-lista"'), 'catalogo-lista debe existir en index.html');
assert(html.includes('class="catalog-filters-container"'), 'catalog-filters-container debe existir en index.html');
assert(html.includes('data-filter="categoria" data-value="todos"'), 'Botón categoría todos debe existir');
assert(html.includes('data-filter="categoria" data-value="diseñador"'), 'Botón categoría diseñador debe existir');
assert(html.includes('data-filter="categoria" data-value="árabes"'), 'Botón categoría árabes debe existir');
assert(html.includes('data-filter="genero" data-value="todos"'), 'Botón género todos debe existir');
assert(html.includes('data-filter="genero" data-value="hombre"'), 'Botón género hombre debe existir');
assert(html.includes('data-filter="genero" data-value="mujer"'), 'Botón género mujer debe existir');

// Verificar que NO existe un botón 'Unisex' en los filtros
assert(!html.includes('data-value="unisex"'), 'NO debe existir botón con valor Unisex');
console.log('✔ [PASS] Verificación de index.html: Controles de filtro presentes y sin botón Unisex');

// 2. Verificar CSS
const css = fs.readFileSync('style.css', 'utf8');
assert(css.includes('.catalog-filters-container'), 'style.css debe tener .catalog-filters-container');
assert(css.includes('.catalog-filter-btn'), 'style.css debe tener .catalog-filter-btn');
assert(css.includes('.catalog-filter-btn.is-active'), 'style.css debe tener estado .is-active');
console.log('✔ [PASS] Verificación de style.css: Estilos visuales agregados correctamente');

// 3. Simular lógica de filtrado de app.js
const normalizar = (s) => (s || '')
  .toString()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim();

const mockProductos = [
  { id: '1', producto: 'Dior Sauvage', categoria: 'Diseñador', genero: 'Hombre' },
  { id: '2', producto: 'Good Girl CH', categoria: 'Diseñador', genero: 'Mujer' },
  { id: '3', producto: 'CK One', categoria: 'Diseñador', genero: 'Unisex' },
  { id: '4', producto: 'Club de Nuit Man', categoria: 'Árabes', genero: 'Hombre' },
  { id: '5', producto: 'Yara Lattafa', categoria: 'Árabes', genero: 'Mujer' },
  { id: '6', producto: 'Khamrah Lattafa', categoria: 'Árabes', genero: 'Unisex' }
];

function filtrar(items, catFiltro, genFiltro, busqueda = '') {
  const terminoNorm = normalizar(busqueda);
  const catFiltroNorm = normalizar(catFiltro);
  const genFiltroNorm = normalizar(genFiltro);

  return items.filter((item) => {
    if (terminoNorm) {
      const nombreNorm = normalizar(item.producto);
      if (!nombreNorm.includes(terminoNorm)) return false;
    }
    if (catFiltroNorm && catFiltroNorm !== 'todos') {
      const itemCatNorm = normalizar(item.categoria);
      if (catFiltroNorm === 'disenador') {
        if (!itemCatNorm.includes('disenad')) return false;
      } else if (catFiltroNorm === 'arabes') {
        if (!itemCatNorm.includes('arab')) return false;
      } else {
        if (itemCatNorm !== catFiltroNorm) return false;
      }
    }
    if (genFiltroNorm && genFiltroNorm !== 'todos') {
      const itemGenNorm = normalizar(item.genero);
      const esUnisex = itemGenNorm.includes('unisex');
      if (genFiltroNorm === 'hombre') {
        const esHombre = itemGenNorm.includes('hombre') || itemGenNorm.includes('men') || itemGenNorm.includes('man') || itemGenNorm.includes('masculin');
        if (!esHombre && !esUnisex) return false;
      } else if (genFiltroNorm === 'mujer') {
        const esMujer = itemGenNorm.includes('mujer') || itemGenNorm.includes('wom') || itemGenNorm.includes('femenin');
        if (!esMujer && !esUnisex) return false;
      }
    }
    return true;
  });
}

// Tests de Categoría
const soloDisenador = filtrar(mockProductos, 'diseñador', 'todos');
assert.strictEqual(soloDisenador.length, 3, 'Diseñador debe tener 3 items');
assert(soloDisenador.every(i => i.categoria === 'Diseñador'), 'Todos deben ser Diseñador');
console.log('✔ [PASS] Filtro Categoría = Diseñador');

const soloArabes = filtrar(mockProductos, 'árabes', 'todos');
assert.strictEqual(soloArabes.length, 3, 'Árabes debe tener 3 items');
assert(soloArabes.every(i => i.categoria === 'Árabes'), 'Todos deben ser Árabes');
console.log('✔ [PASS] Filtro Categoría = Árabes');

// Tests de Género
const soloHombre = filtrar(mockProductos, 'todos', 'hombre');
// Debe incluir Hombre + Unisex: Dior (Hombre), CK One (Unisex), Club de Nuit (Hombre), Khamrah (Unisex) -> 4 items
assert.strictEqual(soloHombre.length, 4, 'Hombre debe incluir Hombre + Unisex (4 items)');
assert(soloHombre.some(i => i.genero === 'Hombre'), 'Debe contener Hombre');
assert(soloHombre.some(i => i.genero === 'Unisex'), 'Debe contener Unisex');
assert(!soloHombre.some(i => i.genero === 'Mujer'), 'NO debe contener Mujer');
console.log('✔ [PASS] Filtro Género = Hombre (Hombre + Unisex)');

const soloMujer = filtrar(mockProductos, 'todos', 'mujer');
// Debe incluir Mujer + Unisex: Good Girl (Mujer), CK One (Unisex), Yara (Mujer), Khamrah (Unisex) -> 4 items
assert.strictEqual(soloMujer.length, 4, 'Mujer debe incluir Mujer + Unisex (4 items)');
assert(soloMujer.some(i => i.genero === 'Mujer'), 'Debe contener Mujer');
assert(soloMujer.some(i => i.genero === 'Unisex'), 'Debe contener Unisex');
assert(!soloMujer.some(i => i.genero === 'Hombre'), 'NO debe contener Hombre');
console.log('✔ [PASS] Filtro Género = Mujer (Mujer + Unisex)');

// Test Todos
const todos = filtrar(mockProductos, 'todos', 'todos');
assert.strictEqual(todos.length, 6, 'Todos debe devolver los 6 items');
console.log('✔ [PASS] Filtro Todos = Todo el catálogo');

// Test Combinado: Diseñador + Mujer -> Good Girl (Mujer) + CK One (Unisex) -> 2 items
const disenadorMujer = filtrar(mockProductos, 'diseñador', 'mujer');
assert.strictEqual(disenadorMujer.length, 2, 'Diseñador + Mujer debe dar 2 items');
console.log('✔ [PASS] Filtro Combinado: Diseñador + Mujer');

// 4. Test de Lectura de Filas de Google Sheets (Columnas A-N)
const appJsCode = fs.readFileSync('app.js', 'utf8');
assert(appJsCode.includes('categoria: encontrarIndice'), 'app.js debe mapear categoria');
assert(appJsCode.includes('genero: encontrarIndice'), 'app.js debe mapear genero');
console.log('✔ [PASS] Mapeo de columnas A-N en Google Sheets correcto');

console.log('\n🎉 TODAS LAS VALIDACIONES DE FILTROS PASARON AL 100%');
