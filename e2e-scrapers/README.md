# E2E Scrapers - Playwright Tests

Tests end-to-end para scrapers usando Playwright.

## 📁 Estructura

```
e2e-scrapers/
├── README.md                           # Este archivo
└── mercado-libre/
    └── mercado-libre.spec.ts          # Tests para Mercado Libre scraper
```

## 🚀 Ejecución

### Ejecutar todos los tests

```bash
pnpm run test:scrapers
```

### Modo headless (sin interfaz gráfica)

```bash
pnpm run test:scrapers
```

### Modo headed (con Chrome visible)

```bash
pnpm run test:scrapers:headed
```

### Modo UI (interfaz interactiva)

```bash
pnpm run test:scrapers:ui
```

### Modo debug (paso a paso)

```bash
pnpm run test:scrapers:debug
```

### Ejecutar un test específico

```bash
npx playwright test mercado-libre.spec.ts
```

### Ejecutar un test específico por nombre

```bash
npx playwright test -g "should search for products"
```

## 📊 Tests disponibles

### Mercado Libre (`mercado-libre.spec.ts`)

#### 1. **should navigate and search for products**

- Navega a Mercado Libre home
- Busca "samsung s25 ultra"
- Verifica que carga los resultados

#### 2. **should sort by lowest price**

- Navega a resultados de búsqueda
- Cambia el orden a "Menor precio"
- Verifica que se ordenó

#### 3. **should extract product information**

- Prueba diferentes selectores para encontrar productos
- Extrae información de productos (título, URL)
- Verifica que encontró al menos algunos productos

#### 4. **should inspect page structure**

- Analiza la estructura HTML de la página
- Identifica clases CSS relevantes
- Identifica atributos data-\* disponibles
- Genera un reporte de estructura

## 🔍 Cómo usar para debugging

### 1. Modo UI (recomendado)

```bash
pnpm run test:scrapers:ui
```

Abre una interfaz interactiva donde puedes:

- Ver los tests
- Hacer click en cada paso
- Inspeccionar el DOM en tiempo real
- Pausar y reanudar

### 2. Modo headed

```bash
pnpm run test:scrapers:headed
```

Ejecuta con Chrome visible pero no interactivo. Puedes:

- Ver exactamente qué hace el scraper
- Verificar visualmente los pasos

### 3. Modo debug

```bash
pnpm run test:scrapers:debug
```

Abre Playwright Inspector. Puedes:

- Ejecutar paso a paso
- Inspeccionar elementos
- Probar selectores

## 📊 Salida esperada

```
✅ Mercado Libre Scraper › should navigate and search for products
   ✓ Took 15s

✅ Mercado Libre Scraper › should sort by lowest price
   ✓ Took 8s

✅ Mercado Libre Scraper › should extract product information
   ✓ Found 45 elements with selector: li
   ✓ Found 5 products
   ✓ Took 10s

✅ Mercado Libre Scraper › should inspect page structure
   ✓ Found 15 relevant CSS classes
   ✓ Found 8 data attributes
   ✓ Took 12s

Total: 4 passed (45s)
```

## 🛠️ Agregar nuevos tests

Para agregar tests para otro scraper:

1. Crea una carpeta:

   ```bash
   mkdir e2e-scrapers/amazon
   ```

2. Crea un archivo `.spec.ts`:

   ```bash
   touch e2e-scrapers/amazon/amazon.spec.ts
   ```

3. Escribe los tests siguiendo el patrón en `mercado-libre.spec.ts`

4. Ejecuta:
   ```bash
   pnpm run test:scrapers
   ```

## 📸 Artefactos

Los tests generan:

- Screenshots en caso de fallo: `test-results/`
- Videos: `test-results/video.webm`
- HTML report: `playwright-report/index.html`

Ver reporte HTML:

```bash
npx playwright show-report
```

## 💡 Tips

### Esperar elementos

```typescript
await page.waitForLoadState('networkidle'); // Red lista
await page.waitForSelector('li'); // Elemento existe
await expect(element).toBeVisible(); // Elemento visible
```

### Selectores role-based (recomendado)

```typescript
page.getByRole('button', { name: 'Buscar' });
page.getByRole('combobox', { name: 'Más relevantes' });
page.getByText('Menor precio');
```

### Selectores por data-\*

```typescript
page.locator('li[data-item-id]');
page.locator('[data-testid="product-item"]');
```

### Debugging

```typescript
// Pausar en un punto
await page.pause();

// Ver logs en consola
page.on('console', (msg) => console.log(msg));

// Tomar screenshot
await page.screenshot({ path: 'debug.png' });
```

## 🔗 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Locators](https://playwright.dev/docs/locators)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging](https://playwright.dev/docs/debug)

## 📝 Configuración

Ver `playwright.config.ts` en la raíz del proyecto para cambiar:

- Navegador (chromium, firefox, webkit)
- Timeout
- Retries
- Reporter
- Screenshots/Videos
