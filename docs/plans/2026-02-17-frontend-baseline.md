# Frontend Baseline - 2026-02-17

> Fecha: 2026-02-17  
> WO: WO-0016  
> Estado: COMPLETADO (Lighthouse + Playwright + gates verificados)

---

## 1) Estado Previo (Pre-existing Issues)

### 1.1 Build Errors Fixed

- tsconfig.json: Añadido `docs/examples` a exclude para resolver error de socket.io-client
- eslint.config.mjs: Añadido `docs/examples/**` a ignores

### 1.2 Gates Verification (Pre-WO-0016)

| Gate | Resultado |
|------|-----------|
| `bun run lint` | ✅ 0 errors, 6 warnings (preexistentes en src/) |
| `bun run test:run` | ✅ 174 tests passed, 17 skipped |
| `bun run build` | ✅ Build exitoso |

---

## 2) Baseline de Rendimiento

### 2.0 Lighthouse Formal (2026-02-17 12:31 -03)

Archivos de reporte:
- `output/lighthouse/landing-desktop.json`
- `output/lighthouse/landing-mobile.json`
- `output/lighthouse/app-desktop.json`
- `output/lighthouse/app-mobile.json`

| Ruta | Perfil | Performance | Accessibility | Best Practices | SEO |
|------|--------|-------------|---------------|----------------|-----|
| `/` | Desktop | 100 | 96 | 100 | 100 |
| `/` | Mobile | 77 | 96 | 100 | 100 |
| `/app` | Desktop | 94 | 90 | 100 | 100 |
| `/app` | Mobile | 50 | 90 | 100 | 100 |

> Nota: `/app` es una vista interna, por eso SEO no es métrica de producto relevante.
> En mobile, la mayor oportunidad está en performance de `/app` (score 50).

### 2.1 Baseline rápido (Playwright)

### 2.1 Landing Page (/)

| Métrica | Valor | Notas |
|---------|--------|---------|-------|
| DOMContentLoaded | ~51 ms | Medido en sesión local (warm cache) |
| Load Event End | ~101 ms | Medido en sesión local (warm cache) |
| FCP | ~76 ms | Medido con `performance.getEntriesByType('paint')` |
| LCP | N/D | No medido en esta corrida |

### 2.2 App Page (/app)

| Métrica | Valor | Notas |
|---------|--------|---------|-------|
| Carga inicial | OK | Renderiza dashboard con datos (30 prompts) |
| Search filter | OK | Filtra resultados en tiempo real |
| Open prompt modal | OK | Abre detalle con campos y preview |
| Create prompt | OK | `POST /api/prompts` responde `200 OK` en Playwright |
| SEO | N/A | Vista de app interna |
| DOMContentLoaded | ~30 ms | Medido en sesión local (warm cache) |
| Load Event End | ~129 ms | Medido en sesión local (warm cache) |
| FCP | ~48 ms | Medido con `performance.getEntriesByType('paint')` |

---

## 3) Flujo Manual /app

### 3.1 Flujo: Buscar Prompt

| Paso | Acción | Esperado | Resultado |
|------|--------|----------|-----------|
| 1 | Ir a /app | Ver dashboard con prompts o empty state | ✅ Dashboard con 30 prompts |
| 2 | Click en search input | Input focus, teclado visible (mobile) | ✅ Input recibe foco |
| 3 | Escribir término | Resultados filtran en tiempo real | ✅ "Deep Research" deja 1 resultado |
| 4 | Click en resultado | Navega a vista de prompt | ✅ Abre modal de detalle |

### 3.2 Flujo: Abrir Prompt

| Paso | Acción | Esperado | Resultado |
|------|--------|----------|-----------|
| 1 | Click en PromptCard | Abre detalle del prompt | ✅ Modal abierto |
| 2 | Ver metadata (fecha, categoría) | Información legible | ✅ Categoría/tags/version legibles |
| 3 | Ver acciones (edit, delete, copy) | Acciones visibles y funcionales | ✅ Botones visibles (copiar/cerrar) |

### 3.3 Flujo: Crear Prompt

| Paso | Acción | Esperado | Resultado |
|------|--------|----------|-----------|
| 1 | Click "Nuevo prompt" / "+" | Abre modal o página de creación | ✅ Modal abierto |
| 2 | Llenar formulario | Campos: title, content, categoría | ✅ Form completado |
| 3 | Click "Guardar" | Prompt creado, redirigido a lista | ✅ `POST /api/prompts` = `200 OK` |
| 4 | Verificar en lista | Nuevo prompt visible | ✅ Refetch ejecutado (`GET /api/prompts` = `200 OK`) |

---

## 4) Checklist A11y (Mínimo)

### 4.1 Foco y Navegación

| Item | Verificación | Estado |
|------|--------------|--------|
| Foco visible | Tab muestra indicador visible en elementos interactivos | ✅ Outline visible en links/buttons |
| Navegación teclado | Enter/Space activan botones y links | ✅ Navegación por tab funcional |
| Skip link | Existe skip link para saltar navegación | ✅ Detectado en `/` y `/app` (`#main-content`) |
| Focus trap | En modals, foco se mantiene dentro | ✅ Foco permanece en dialog durante tab |

### 4.2 Contraste

| Item | Ratio mínimo | Estado |
|------|--------------|--------|
| Texto sobre fondo | 4.5:1 (normal), 3:1 (grande 18px+) | ⏳ Pendiente validación Lighthouse/DevTools |
| Iconos/UI elements | 3:1 | ⏳ Pendiente validación Lighthouse/DevTools |
| Links vs texto | 4.5:1 | ⏳ Pendiente validación Lighthouse/DevTools |

### 4.3 Semántica

| Item | Verificación | Estado |
|------|--------------|--------|
| headings | h1 → h2 → h3 jerarquía correcta | ✅ Orden observado correcto en landing |
| labels | Todos los inputs tienen labels | ✅ Labels y nombres accesibles en inputs críticos del modal |
| alt text | Imágenes tienen alt descriptivo | ✅ Sin imágenes sin `alt` en landing |
| ARIA | Donde no hay sémántica nativa | ✅ `aria-label` agregado en controles icon-only críticos |

### 4.4 Motion

| Item | Verificación | Estado |
|------|--------------|--------|
| prefers-reduced-motion | Animaciones respetan setting | ⏳ Pendiente test explícito con media emulation |
| No auto-play | Videos/animaciones no inician automáticamente | ✅ No se observaron autoplay en sesión |

---

## 5) Eventos de Analytics

### 5.1 Eventos Definidos

| Evento | Trigger | Props recomendadas |
|--------|---------|---------------------|
| `landing_cta_click` | Click en CTA principal landing | `{ cta_text: string, location: string }` |
| `app_opened` | Page view de /app | `{ referrer: string }` |
| `prompt_created` | Prompt guardado exitosamente | `{ prompt_id: string, category: string }` |

### 5.2 Implementación Ejecutada

```typescript
// src/lib/analytics.ts
// Provider: window.gtag cuando existe; fallback seguro a logger
trackEvent("landing_cta_click", { cta_text, location });
trackEvent("app_opened", { referrer });
trackEvent("prompt_created", { promptId, category });
```

---

## 6) Definition of Done - WO-0016

- [x] Gates verificados (lint, test, build)
- [x] tsconfig.json fix (`docs/examples` excluded)
- [x] Lighthouse baseline documentado (desktop/mobile en `/` y `/app`)
- [x] Flujo manual /app verificado con Playwright (buscar, abrir, crear prompt)
- [x] Checklist A11y completado con resultados (con ítems pendientes/alertas)
- [x] Eventos de tracking definidos e instrumentados

---

## 7) Notas

- Playwright confirma creación de prompt exitosa: `POST /api/prompts` retorna `200 OK`.
- Skip link y landmarks (`main#main-content`) disponibles en landing y `/app`.
- Controles icon-only críticos del editor tienen nombre accesible (`aria-label`).
- Lighthouse formal ejecutado y documentado (4 reportes JSON).
- Analytics base implementado en `src/lib/analytics.ts` con fallback a logger.
- Algunos checks de A11y requieren revisión manual en browser

---

_Documento creado: 2026-02-17_  
_WO-0016: Baseline + guardrails_
