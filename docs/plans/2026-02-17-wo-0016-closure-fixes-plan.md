# WO-0016 Closure Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** cerrar WO-0016 resolviendo el bloqueo de creación de prompt (`401`), completando A11y mínimo pendiente y dejando evidencia formal de baseline.

**Architecture:** se prioriza root cause first para el `401` (sin parches ciegos), luego fixes de UX/A11y de bajo riesgo y finalmente evidencia (Lighthouse + tracking). Se mantiene alcance acotado a cierre de WO-0016; no se mezcla con rediseño de WO-0017+.

**Tech Stack:** Next.js App Router, NextAuth, Prisma, Zustand, Vitest, Playwright, ESLint.

### Task 1: Root Cause del 401 en `POST /api/prompts`

**Files:**
- Modify: `src/app/api/prompts/route.ts`
- Modify: `src/lib/auth-utils.ts`
- Test: `src/__tests__/api/prompts.test.ts`
- Update: `docs/plans/2026-02-17-frontend-baseline.md`

**Step 1: Write the failing test**

Crear/activar test que cubra este caso exacto:
- Usuario no autenticado + `DEV_AUTH_BYPASS !== 'true'` => `POST /api/prompts` retorna `401`.
- Usuario autenticado o bypass explícito => retorna `200`/`201` con prompt creado.

Ejemplo de casos mínimos:
- `test_post_prompt_returns_401_without_session_or_bypass`
- `test_post_prompt_creates_prompt_with_dev_bypass_or_session`

**Step 2: Run test to verify it fails**

Run: `bun run test:run src/__tests__/api/prompts.test.ts`
Expected: FAIL en al menos un caso relacionado con sesión/bypass o sin cobertura del escenario actual.

**Step 3: Add temporary diagnostics (no behavior change yet)**

Agregar logging estructurado temporal en `POST` para confirmar:
- si `getCurrentUser()` retorna null,
- valor efectivo de `NODE_ENV` y `DEV_AUTH_BYPASS` (sin exponer secretos),
- ruta de ejecución en `getUserWithDevFallback()`.

**Step 4: Reproduce and capture evidence once**

Run:
- `bun run dev`
- reproducir flujo Playwright/UI de crear prompt

Expected:
- evidencia clara de por qué cae en `401` (sin sesión real, bypass deshabilitado, etc.).

**Step 5: Implement minimal root-cause fix**

Aplicar solo una de estas rutas (sin mezclar):
1. Si el producto requiere sesión real para crear: mantener `401`, pero alinear UI para no ofrecer “Guardar” sin auth (Task 2).
2. Si entorno dev requiere crear sin login para baseline: habilitar bypass solo en dev documentado (`DEV_AUTH_BYPASS=true`) y testear explícitamente esa ruta.

**Step 6: Run tests and verify**

Run:
- `bun run test:run src/__tests__/api/prompts.test.ts`
- `bun run lint`

Expected: PASS en tests nuevos + lint sin errores.

**Step 7: Commit**

```bash
git add src/app/api/prompts/route.ts src/lib/auth-utils.ts src/__tests__/api/prompts.test.ts docs/plans/2026-02-17-frontend-baseline.md
git commit -m "fix(wo-0016): resolve root cause for prompt create 401 path"
```

### Task 2: Alinear UX de creación con estado de autenticación

**Files:**
- Modify: `src/app/app/page.tsx`
- Modify: `src/components/prompt-manager/prompt-editor.tsx`
- Test: `src/__tests__/app/prompt-creation-auth.test.tsx` (create if missing)

**Step 1: Write the failing test**

Casos mínimos:
- sin auth: CTA crear prompt muestra mensaje/redirect a signin o botón deshabilitado.
- con auth/bypass: flujo de apertura/guardado disponible.

**Step 2: Run test to verify it fails**

Run: `bun run test:run src/__tests__/app/prompt-creation-auth.test.tsx`
Expected: FAIL inicial.

**Step 3: Implement minimal UI behavior**

- Evitar intento de guardado cuando backend responderá 401 por diseño.
- Mostrar feedback claro: “Debes iniciar sesión para crear prompts”.
- Si aplica, link a `/auth/signin`.

**Step 4: Run tests and verify**

Run:
- `bun run test:run src/__tests__/app/prompt-creation-auth.test.tsx`
- `bun run lint`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/app/page.tsx src/components/prompt-manager/prompt-editor.tsx src/__tests__/app/prompt-creation-auth.test.tsx
git commit -m "fix(wo-0016): align prompt creation UX with auth requirements"
```

### Task 3: A11y hardening mínimo (skip link + accessible names)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/app/page.tsx`
- Modify: `src/components/prompt-manager/prompt-editor.tsx`
- Test: `src/__tests__/app/a11y-smoke.test.tsx` (create if missing)

**Step 1: Write the failing test**

Cobertura mínima:
- Existe skip link al inicio (`href="#main-content"` o equivalente).
- Icon buttons críticos tienen nombre accesible (`aria-label`).
- Inputs del modal de creación tienen nombre accesible.

**Step 2: Run test to verify it fails**

Run: `bun run test:run src/__tests__/app/a11y-smoke.test.tsx`
Expected: FAIL inicial en al menos skip link o labels.

**Step 3: Implement minimal accessibility fixes**

- Añadir skip link en layout/page principal.
- Asegurar `aria-label` en botones icon-only.
- Revisar inputs del modal para label asociada.

**Step 4: Run tests and verify**

Run:
- `bun run test:run src/__tests__/app/a11y-smoke.test.tsx`
- `bun run lint`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/page.tsx src/app/app/page.tsx src/components/prompt-manager/prompt-editor.tsx src/__tests__/app/a11y-smoke.test.tsx
git commit -m "fix(wo-0016): add skip link and accessible names for critical controls"
```

### Task 4: Tracking mínimo para criterios de WO-0016

**Files:**
- Create: `src/lib/analytics.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/app/page.tsx`
- Test: `src/__tests__/lib/analytics.test.ts`

**Step 1: Write the failing test**

Casos:
- `trackEvent` no lanza excepción sin provider.
- Hace fallback a logger/console en dev.

**Step 2: Run test to verify it fails**

Run: `bun run test:run src/__tests__/lib/analytics.test.ts`
Expected: FAIL inicial.

**Step 3: Implement minimal analytics wrapper**

- `trackEvent(eventName, props)` con fallback controlado.
- Instrumentar:
  - `landing_cta_click`
  - `app_opened`
  - `prompt_created` (solo cuando hay éxito real)

**Step 4: Run tests and verify**

Run:
- `bun run test:run src/__tests__/lib/analytics.test.ts`
- `bun run lint`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/analytics.ts src/app/page.tsx src/app/app/page.tsx src/__tests__/lib/analytics.test.ts
git commit -m "feat(wo-0016): add minimal analytics events for baseline closure"
```

### Task 5: Evidencia final y cierre de WO-0016

**Files:**
- Modify: `docs/plans/2026-02-17-frontend-baseline.md`
- Modify: `WORK-ORDERS.yaml`

**Step 1: Execute Lighthouse formal**

Run manual:
- Chrome DevTools Lighthouse mobile + desktop para `/`
- (Opcional) captura adicional para `/app` autenticado

**Step 2: Record baseline evidence**

Actualizar `docs/plans/2026-02-17-frontend-baseline.md` con:
- scores formales,
- timestamp,
- entorno medido,
- limitaciones.

**Step 3: Full verification gates**

Run:
- `bun run lint`
- `bun run test:run`
- `bun run build`

Expected: PASS.

**Step 4: Mark WO status**

Actualizar `WORK-ORDERS.yaml`:
- `WO-0016.estado` -> `[x] COMPLETADO`
- nota breve con evidencia Lighthouse y estado de fix 401.

**Step 5: Commit**

```bash
git add docs/plans/2026-02-17-frontend-baseline.md WORK-ORDERS.yaml
git commit -m "chore(wo-0016): close baseline workorder with formal evidence"
```

## Exit Criteria

- `WO-0016` en `COMPLETADO`.
- `401` de creación resuelto o explícitamente manejado por UX según política de auth.
- Checklist A11y con estado final (sin “por verificar” en ítems críticos).
- Lighthouse formal documentado.
- Eventos mínimos definidos e instrumentados.
