# Frontend Improvement Plan - Prompt Library (v2.0)

> Fecha: 2026-02-17  
> Estado: Listo para ejecución  
> Versión: 2.0 (reescrito con análisis crítico)

---

## Resumen Ejecutivo

**Objetivo:** Elevar credibilidad, claridad y velocidad de uso del producto en landing y app sin romper comportamiento existente.

**Problemas críticos identificados:**

1. Links de navegación rotos (Documentación y Precios → `/app`)
2. Trust signals falsos (logos de Vercel, Linear, Stripe, Supabase sin relación real)
3. Screenshot placeholder sin valor de producto
4. Sin baseline de métricas para medir impacto

**Enfoque:** Ejecución por Work Orders con gates de verificación obligatorios.

---

## 1) Dirección de Diseño (FIJA)

Se adopta una dirección **Utility & Function** (sobria, densa, técnica) con acento violeta existente.

### Reglas de implementación obligatorias

| Regla | Aplicación |
|-------|------------|
| Jerarquía tipográfica | Espaciado y typografía antes de efectos decorativos |
| Animaciones funcionales | Solo feedback/transición, nunca decorativo |
| Anti-generic | Evitar "template SaaS genérico", gradientes excesivos, glows |
| Consistencia | Usar tokens y componentes existentes del proyecto |

---

## 2) Análisis Crítico del Estado Actual

### 2.1 Landing Page (`src/app/page.tsx`)

| Problema | Ubicación | Severidad | Impacto |
|----------|-----------|-----------|---------|
| Links rotos | Líneas 42-53 | **CRÍTICO** | UX confusión, bounce rate |
| Trust signals falsos | Líneas 114-119 | **ALTO** | Reputacional, credibilidad |
| Screenshot placeholder | Líneas 145-155 | **ALTO** | No muestra valor de producto |
| v2.0 claim sin evidencia | Línea 75 | MEDIO | claim no verificable |

### 2.2 App (`/app`)

| Problema | Severidad | Notas |
|----------|-----------|-------|
| Header sin jerarquía clara | MEDIO | Mejora oportunidad |
| PromptCard puede mejorar | MEDIO | Acciones y metadata |
| Empty states genéricos | BAJO | Oportunidad de mejora |

---

## 3) Métricas de Éxito

### 3.1 Landing

| Métrica | Baseline (Fase 0) | Target |
|---------|-------------------|--------|
| Lighthouse Mobile Performance | _Por medir_ | >= baseline |
| Lighthouse Accessibility | _Por medir_ | >= 90 |
| CTA Click-through Rate | _Por medir_ | +10% vs baseline |
| Bounce Rate | _Por medir_ | -5% vs baseline |

### 3.2 App

| Métrica | Target |
|---------|--------|
| Time-to-first-prompt | < 5 segundos |
| Búsqueda efectiva | < 1 segundo |
| Error states visibles | 0 regresiones |
| Accessibility score | >= 90 |

---

## 4) Fases de Ejecución

### Fase 0 - Baseline y Guardrails ⭐ OBLIGATORIA

**Objetivo:** Medir estado actual antes de cualquier cambio UI.

**Entregables:**

```
docs/plans/2026-02-17-frontend-baseline.md
```

| Entregable | Método | Tiempo estimado |
|------------|--------|-----------------|
| Lighthouse mobile/desktop | Chrome DevTools | 15 min |
| Lighthouse accessibility | Lighthouse audit | 15 min |
| Checklist a11y manual | Revisión teclado/foco | 30 min |
| Eventos analytics | Definir tracking | 30 min |

**Definition of Done:**

- [ ] Documento de baseline guardado en `docs/plans/`
- [ ] Lighthouse scores documentados (mobile + desktop)
- [ ] Checklist a11y completado para componentes críticos
- [ ] Eventos de tracking definidos (o fallback con console.log)
- [ ] Criterios de aceptación acordados para siguiente fase

**Gates de verificación:**

```bash
bun run lint
bun run test:run
bun run build
```

---

### Fase 1 - Fixes Críticos de Credibilidad

**Objetivo:** Eliminar fricción y riesgo reputacional inmediato.

#### WO-0017: Fix navegación + trust signals

- **Archivos:** `src/app/page.tsx`
- **Estimación:** 60 min
- **Cambios:**
  - `href="/app"` → `href="#"` o link real de docs (Documentación)
  - `href="/app"` → `href="#"` o pricing page (Precios)
  - Eliminar "USADO POR EQUIPOS EN" con logos falsos
  - Verificar que "Comenzar gratis" sigue funcionando

**Definition of Done:**

- [ ] Link Documentación apunta a destino válido
- [ ] Link Precios apunta a destino válido  
- [ ] Section de trust signals eliminada o reemplazada
- [ ] No hay regresión en layout responsive

#### WO-0018: Screenshot real optimizada

- **Archivos:** `src/app/page.tsx`, `public/landing/`
- **Estimación:** 75 min
- **Cambios:**
  - Reemplazar placeholder con captura real del dashboard
  - Usar `next/image` con sizes apropiados
  - Verificar aspect ratio consistente
  - Añadir `alt` descriptivo

**Definition of Done:**

- [ ] Hero muestra screenshot real del producto
- [ ] No hay layout shift (CLS < 0.1)
- [ ] Imagen servida con Next/Image optimizada
- [ ] Fallback para slow connections

**Gates de verificación (Fase 1):**

```bash
bun run lint
bun run test:run  
bun run build
# Revisión visual: desktop + mobile
```

---

### Fase 2 - Landing Polish

**Objetivo:** Mejorar percepción de calidad sin sobrecargar performance.

#### WO-0019: Landing polish con motion accesible

- **Archivos:** `src/app/page.tsx`, `src/app/globals.css`
- **Estimación:** 3 horas
- **Cambios:**
  - Mejorar jerarquía visual del hero
  - Microinteracciones en feature cards
  - Respetar `prefers-reduced-motion`
  - Optimizar Lighthouse performance

**Definition of Done:**

- [ ] Lighthouse mobile >= baseline de Fase 0
- [ ] prefers-reduced-motion funciona correctamente
- [ ] No hay regresiones en responsive
- [ ] Animaciones son fluidas (60fps target)

**Features opcionales dentro de WO-0019:**

- Social proof real (métricas de GitHub, stars, etc.)
- Testimonios si hay usuarios reales
- Badge de "Open Source" si aplica

---

### Fase 3 - App Interface Polish

#### WO-0020: Header /app mejorado

- **Archivos:** `src/app/app/page.tsx`, `src/components/prompt-manager/`
- **Estimación:** 2 horas
- **Cambios:**
  - Jerarquía clara en header
  - Acceso persistente a búsqueda
  - Filtros y view toggle visibles
  - Feedback de estado (loading/error)

**Definition of Done:**

- [ ] Search mantiene comportamiento actual
- [ ] Filtros accesibles y funcionales
- [ ] Loading states visibles
- [ ] Error states con guidance

#### WO-0021: PromptCard + Empty States

- **Archivos:** `src/app/app/page.tsx`, `src/components/prompt-manager/`
- **Estimación:** 3 horas
- **Cambios:**
  - Acciones claras en cada card (copy, edit, delete)
  - Metadata legible (fecha, categoría, versión)
  - Empty states con CTAs accionables

**Definition of Done:**

- [ ] Cada PromptCard tiene acciones evidentes
- [ ] Empty state guía al usuario a crear primer prompt
- [ ] Consistencia con design tokens existentes

**Gates de verificación (Fase 3):**

```bash
bun run lint
bun run test:run
bun run build
# Testing: búsqueda, filtros, tabs, loading/error
```

---

### Fase 4 - Extensiones Opcionales

**Objetivo:** Añadir funcionalidades de confort sin comprometer estabilidad.

#### WO-0022: Features opcionales

- **Estimación:** 4 horas
- **Features candidatos:**
  - Command palette (Cmd/Ctrl + K)
  - Onboarding liviano para nuevos usuarios
  - Panel de atajos / settings mínimo

**Definition of Done:**

- [ ] Feature flag para rollout controlado
- [ ] Bundle size no aumenta > 10kb
- [ ] Documentación de uso actualizada
- [ ] Fallback si feature no está lista

---

## 5) Matriz de Work Orders

| WO | Fase | Prioridad | Estimación | Dependencias |
|----|------|-----------|-------------|---------------|
| WO-0016 | Fase 0 | P1 | 90min | - |
| WO-0017 | Fase 1 | P1 | 60min | WO-0016 |
| WO-0018 | Fase 1 | P1 | 75min | WO-0016 |
| WO-0019 | Fase 2 | P2 | 3h | WO-0017, WO-0018 |
| WO-0020 | Fase 3 | P2 | 2h | WO-0019 |
| WO-0021 | Fase 3 | P2 | 3h | WO-0019 |
| WO-0022 | Fase 4 | P3 | 4h | WO-0020, WO-0021 |

---

## 6) Diagrama de Dependencias

```
[WO-0016] ─────┬─────► [WO-0017] ─────┐
               │                       │
               └─────► [WO-0018] ──────┼──► [WO-0019] ──┬──► [WO-0020]
                                                           │
                                                           ├──► [WO-0022]
                                                           │
                                                     [WO-0021]
```

**Reglas:**

1. ✅ WO-0016 debe completarse antes de cualquier cambio UI
2. ✅ WO-0017 y WO-0018 pueden ejecutarse en paralelo (post WO-0016)
3. ✅ WO-0019 requiere ambos WO-0017 y WO-0018
4. ✅ WO-0020 y WO-0021 requieren WO-0019
5. ✅ WO-0022 requiere WO-0020 Y WO-0021

---

## 7) Verificación por Fase

### Gates obligatorios (por cada WO)

```bash
# 1. Lint
bun run lint

# 2. Tests
bun run test:run

# 3. Build
bun run build
```

### Checks adicionales para cambios UI

| Check | Herramienta | Frecuencia |
|-------|-------------|------------|
| Revisión visual desktop | Browser | Por WO |
| Revisión visual mobile | DevTools | Por WO |
| Keyboard navigation | Manual | Por WO |
| Focus states | Manual | Por WO |
| prefers-reduced-motion | DevTools | Por WO |
| Lighthouse | Chrome DevTools | Por fase |

---

## 8) Análisis de Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Scope creep visual | ALTA | MEDIO | PRs pequeños, revisión de diseño antes de merge |
| Regresiones en /app | MEDIA | ALTO | Tests de regresión, testing manual |
| Performance degrade | MEDIA | ALTO | Lighthouse gates, animaciones CSS primero |
| Métricas sin baseline | MEDIA | MEDIO | Fase 0 obligatoria antes de cambios |
| Timeline overrun | ALTA | BAJO | Buffer de 20%, WOs priorizados |

### Rollback Strategy

Si en cualquier punto:

- Lighthouse performance cae > 10 puntos
- Error rate aumenta > 1%
- Tests fallan

**Acción:** Revertir último PR y revisar con equipo.

---

## 9) Timeline Sugerido

| Semana | Fase | WOs | Objetivo |
|--------|------|-----|----------|
| Semana 1 | Fase 0 | WO-0016 | Baseline y preparación |
| Semana 1-2 | Fase 1 | WO-0017, WO-0018 | Fixes críticos |
| Semana 2-3 | Fase 2 | WO-0019 | Landing polish |
| Semana 3-4 | Fase 3 | WO-0020, WO-0021 | App polish |
| Semana 5 | Fase 4 | WO-0022 | Opcional |

**Total estimado:** 5-6 semanas (con contexto de trabajo paralelo)

---

## 10) Próximo Paso Inmediato

**Ejecutar WO-0016 (Fase 0)** antes de cualquier cambio visual.

```bash
# Verificar estado actual
bun run lint
bun run test:run
bun run build

# Luego crear baseline
# Crear docs/plans/2026-02-17-frontend-baseline.md
```

---

## Anexo: Checklist de A11y (Fase 0)

- [ ] Foco visible en todos los interactive elements
- [ ] Navegación por teclado funciona
- [ ] Contraste >= 4.5:1 en texto crítico
- [ ] Labels asociados a inputs
- [ ] Imágenes tienen alt text
- [ ] ARIA labels donde corresponde
- [ ] Skip links si hay navegación extensa
- [ ] Error messages descriptivos

---

_Documento creado: 2026-02-17_  
_Última actualización: 2026-02-17_  
_Owner: Frontend Team_
