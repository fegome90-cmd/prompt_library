# Test Suite Plan - Target: 90% Code Coverage

## 📊 Estado Actual de Cobertura

### Archivos con Tests Actuales

| Archivo | Cobertura | Tests |
|---------|-----------|-------|
| `src/__tests__/setup.test.ts` | ✅ | 2 |
| `src/__tests__/api/prompts.test.ts` | ~30% | 9 |
| `src/__tests__/api/categories.test.ts` | ~25% | 7 |
| `src/__tests__/lib/api-utils.test.ts` | ✅ 100% | 10 |
| `src/__tests__/lib/auth-bypass.test.ts` | ✅ 100% | 6 |
| `src/__tests__/lib/password.test.ts` | ✅ 100% | 8 |

### Bibliotecas SIN Tests

- `src/lib/auth-utils.ts` - Funciones de auth (hasRole, canModifyPrompt, canDeletePrompt, getDevUser)
- `src/lib/rate-limit.ts` - Rate limiting
- `src/lib/prompt-utils.ts` - Utilidades de parsing y filtrado
- `src/lib/validators/prompt.ts` - Esquemas Zod
- `src/lib/pii-detector.ts` - Detector de PII
- `src/lib/logger.ts` - Logger estructurado
- `src/lib/utils.ts` - Función cn()
- `src/lib/db.ts` - Singleton Prisma

---

## 🎯 Plan de Cobertura - 90%

### Fase 1: Tests de Librerías Core (Alta Prioridad)

#### 1.1 `src/lib/auth-utils.ts` - Tests de Funciones de Auth

```typescript
// auth-utils.test.ts
describe('hasRole', () => {
  it('should return false for null user', () => {})
  it('should return true for user with matching role', () => {})
  it('should return false for user without matching role', () => {})
  it('should handle multiple roles', () => {})
})

describe('canModifyPrompt', () => {
  it('owner can modify any prompt', () => {})
  it('editor can modify any prompt', () => {})
  it('reviewer can modify any prompt', () => {})
  it('user can only modify own prompt', () => {})
  it('user cannot modify other user prompts', () => {})
  it('null user cannot modify', () => {})
})

describe('canDeletePrompt', () => {
  it('owner can delete', () => {})
  it('editor can delete', () => {})
  it('reviewer cannot delete', () => {})
  it('user cannot delete', () => {})
  it('null user cannot delete', () => {})
})

describe('getCurrentUser', () => {
  it('should return user from session', () => {})
  it('should return null when no session', () => {})
})

describe('requireAuth', () => {
  it('should return user when authenticated', () => {})
  it('should throw when not authenticated', () => {})
})
```

#### 1.2 `src/lib/rate-limit.ts` - Tests de Rate Limiting

```typescript
// rate-limit.test.ts
describe('checkRateLimit', () => {
  it('should allow first request', () => {})
  it('should track request count', () => {})
  it('should block when limit exceeded', () => {})
  it('should reset after window expires', () => {})
  it('should calculate retryAfter correctly', () => {})
  it('should handle different identifiers separately', () => {})
})

describe('getClientIdentifier', () => {
  it('should parse x-forwarded-for header', () => {})
  it('should use x-real-ip header', () => {})
  it('should fallback to default', () => {})
  it('should take first IP from chain', () => {})
})

describe('RATE_LIMIT_PRESETS', () => {
  it('should have strict preset', () => {})
  it('should have standard preset', () => {})
  it('should have relaxed preset', () => {})
})

describe('createRateLimitResponse', () => {
  it('should return 429 status', () => {})
  it('should include rate limit headers', () => {})
  it('should include retryAfter', () => {})
})
```

#### 1.3 `src/lib/prompt-utils.ts` - Tests de Utilidades

```typescript
// prompt-utils.test.ts
describe('parseJsonField', () => {
  it('should return default for null', () => {})
  it('should return default for undefined', () => {})
  it('should return default for empty string', () => {})
  it('should parse valid JSON string', () => {})
  it('should return default for invalid JSON', () => {})
  it('should return value if already parsed', () => {})
})

describe('parseTags', () => {
  it('should parse JSON string array', () => {})
  it('should return empty array for null', () => {})
  it('should return empty array for invalid JSON', () => {})
})

describe('normalizePrompt', () => {
  it('should map author relation', () => {})
  it('should map reviewer relation', () => {})
  it('should parse tags from string', () => {})
  it('should parse variablesSchema', () => {})
  it('should parse examples', () => {})
})

describe('normalizePrompts', () => {
  it('should return empty array for non-array input', () => {})
  it('should normalize all prompts', () => {})
})

describe('filterBySearch', () => {
  it('should match title', () => {})
  it('should match description', () => {})
  it('should match tags', () => {})
  it('should be case insensitive', () => {})
  it('should return true for empty search', () => {})
})

describe('filterByCategory', () => {
  it('should filter by category', () => {})
  it('should return true for null category', () => {})
})

describe('filterByTags', () => {
  it('should filter by selected tags', () => {})
  it('should return true for empty tags', () => {})
})

describe('filterByFavorites', () => {
  it('should filter favorites', () => {})
  it('should return true when not filtering favorites', () => {})
})

describe('filterPrompts', () => {
  it('should apply all filters', () => {})
  it('should handle partial filters', () => {})
})

describe('extractAllTags', () => {
  it('should extract unique sorted tags', () => {})
  it('should handle prompts without tags', () => {})
})

describe('getCategoryColor', () => {
  it('should return color for known category', () => {})
  it('should return default for unknown category', () => {})
})
```

#### 1.4 `src/lib/validators/prompt.ts` - Tests de Zod Schemas

```typescript
// validators/prompt.test.ts
describe('createPromptSchema', () => {
  it('should validate valid prompt', () => {})
  it('should reject empty title', () => {})
  it('should reject title too long', () => {})
  it('should reject empty body', () => {})
  it('should reject invalid category', () => {})
  it('should reject invalid riskLevel', () => {})
  it('should apply defaults', () => {})
})

describe('updatePromptSchema', () => {
  it('should allow partial updates', () => {})
  it('should validate partial data', () => {})
})

describe('feedbackSchema', () => {
  it('should validate thumbs_up', () => {})
  it('should validate thumbs_down', () => {})
  it('should allow null feedback', () => {})
  it('should validate comment length', () => {})
  it('should validate dataRiskLevel', () => {})
})

describe('formatZodError', () => {
  it('should format errors correctly', () => {})
  it('should handle multiple errors', () => {})
})
```

#### 1.5 `src/lib/pii-detector.ts` - Tests de Detector PII

```typescript
// pii-detector.test.ts
describe('detectPII', () => {
  it('should detect email', () => {})
  it('should detect Chilean phone', () => {})
  it('should detect RUT', () => {})
  it('should detect credit card', () => {})
  it('should detect IP address', () => {})
  it('should detect date patterns', () => {})
  it('should detect salary', () => {})
  it('should deduplicate matches', () => {})
  it('should return empty for clean text', () => {})
})

describe('hasHighRiskPII', () => {
  it('should return true for RUT', () => {})
  it('should return true for credit card', () => {})
  it('should return true for salary', () => {})
  it('should return false for low risk', () => {})
})

describe('getPIIWarning', () => {
  it('should return null for clean text', () => {})
  it('should return warning message', () => {})
  it('should limit matches in message', () => {})
})

describe('getRiskLevel', () => {
  it('should return high for RUT', () => {})
  it('should return high for credit card', () => {})
  it('should return medium for email', () => {})
  it('should return medium for phone', () => {})
  it('should return low for clean text', () => {})
})
```

#### 1.6 `src/lib/logger.ts` - Tests de Logger

```typescript
// logger.test.ts
describe('logger', () => {
  it('should log debug messages', () => {})
  it('should log info messages', () => {})
  it('should log warn messages', () => {})
  it('should log error messages', () => {})
  it('should filter by log level', () => {})
  it('should format JSON in production', () => {})
  it('should format readable in development', () => {})
})

describe('logApiError', () => {
  it('should log API errors', () => {})
  it('should extract error message', () => {})
})

describe('logOperation', () => {
  it('should log operations', () => {})
})
```

#### 1.7 `src/lib/utils.ts` - Tests de Utilidades

```typescript
// utils.test.ts
describe('cn', () => {
  it('should merge class names', () => {})
  it('should handle arrays', () => {})
  it('should handle objects', () => {})
  it('should handle falsy values', () => {})
  it('should handle tailwind classes', () => {})
})
```

---

### Fase 2: Tests de API Routes (Media Prioridad)

#### 2.1 Tests de `/api/prompts` (GET)

```typescript
// api/prompts-get.test.ts
describe('GET /api/prompts', () => {
  it('should return published prompts by default', () => {})
  it('should filter by status', () => {})
  it('should filter by category', () => {})
  it('should filter by search', () => {})
  it('should filter favorites', () => {})
  it('should return paginated response', () => {})
  it('should handle pagination params', () => {})
})
```

#### 2.2 Tests de `/api/prompts` (POST)

```typescript
// api/prompts-post.test.ts
describe('POST /api/prompts', () => {
  it('should create prompt with valid data', () => {})
  it('should reject invalid data', () => {})
  it('should require authentication', () => {})
  it('should apply rate limiting', () => {})
  it('should create audit log', () => {})
})
```

#### 2.3 Tests de `/api/prompts/[id]`

```typescript
// api/prompts-id.test.ts
describe('GET /api/prompts/[id]', () => {
  it('should return prompt by id', () => {})
  it('should return 404 for non-existent', () => {})
})

describe('PUT /api/prompts/[id]', () => {
  it('should update prompt', () => {})
  it('should validate ownership', () => {})
  it('should validate role permissions', () => {})
})

describe('DELETE /api/prompts/[id]', () => {
  it('should soft delete prompt', () => {})
  it('should require owner/editor role', () => {})
})
```

#### 2.4 Tests de Acciones de Prompts

```typescript
// api/prompts-actions.test.ts
describe('POST /api/prompts/[id]/publish', () => {
  it('should publish draft prompt', () => {})
  it('should set publishedAt timestamp', () => {})
  it('should reject published prompt', () => {})
})

describe('POST /api/prompts/[id]/deprecate', () => {
  it('should deprecate prompt', () => {})
  it('should set deprecatedAt', () => {})
})

describe('POST /api/prompts/[id]/feedback', () => {
  it('should record thumbs up', () => {})
  it('should record thumbs down', () => {})
  it('should increment useCount', () => {})
  it('should validate feedback type', () => {})
})
```

#### 2.5 Tests de Categorías

```typescript
// api/categories-route.test.ts
describe('GET /api/categories', () => {
  it('should return all categories', () => {})
  it('should order by order field', () => {})
})
```

#### 2.6 Tests de Stats

```typescript
// api/stats.test.ts
describe('GET /api/stats', () => {
  it('should return overview stats', () => {})
  it('should return top prompts', () => {})
  it('should return best rated prompts', () => {})
  it('should return problematic prompts', () => {})
  it('should calculate usage by category', () => {})
  it('should calculate average rating', () => {})
})
```

#### 2.7 Tests de Usuario

```typescript
// api/user.test.ts
describe('GET /api/user', () => {
  it('should return current user', () => {})
  it('should return 401 when not authenticated', () => {})
})
```

#### 2.8 Tests de Auth Signup

```typescript
// api/auth-signup.test.ts
describe('POST /api/auth/signup', () => {
  it('should create new user', () => {})
  it('should hash password', () => {})
  it('should reject duplicate email', () => {})
  it('should validate email format', () => {})
  it('should validate password length', () => {})
  it('should set default role', () => {})
})
```

---

### Fase 3: Tests de Componentes (Baja Prioridad para Cobertura)

#### 3.1 Tests de Componentes UI

```typescript
// components/ui/button.test.tsx
// components/ui/input.test.tsx
// components/ui/card.test.tsx
```

#### 3.2 Tests de Componentes de Prompt Manager

```typescript
// components/prompt-manager/prompt-composer.test.tsx
// components/prompt-manager/prompt-editor.test.tsx
```

---

## 📋 Archivos de Test a Crear

| # | Archivo | Prioridad | Líneas Estimadas |
|---|---------|-----------|------------------|
| 1 | `src/__tests__/lib/auth-utils.test.ts` | Alta | 120 |
| 2 | `src/__tests__/lib/rate-limit.test.ts` | Alta | 100 |
| 3 | `src/__tests__/lib/prompt-utils.test.ts` | Alta | 180 |
| 4 | `src/__tests__/lib/validators.test.ts` | Alta | 80 |
| 5 | `src/__tests__/lib/pii-detector.test.ts` | Alta | 80 |
| 6 | `src/__tests__/lib/logger.test.ts` | Media | 60 |
| 7 | `src/__tests__/lib/utils.test.ts` | Media | 40 |
| 8 | `src/__tests__/api/prompts-get.test.ts` | Media | 80 |
| 9 | `src/__tests__/api/prompts-post.test.ts` | Media | 70 |
| 10 | `src/__tests__/api/prompts-id.test.ts` | Media | 100 |
| 11 | `src/__tests__/api/prompts-actions.test.ts` | Media | 80 |
| 12 | `src/__tests__/api/categories-route.test.ts` | Media | 40 |
| 13 | `src/__tests__/api/stats.test.ts` | Media | 60 |
| 14 | `src/__tests__/api/user.test.ts` | Media | 30 |
| 15 | `src/__tests__/api/auth-signup.test.ts` | Media | 60 |

---

## 🏃 Ejecución

```bash
# Ejecutar todos los tests
bun run test

# Cobertura
bun run test:coverage

# Ver reporte HTML
open coverage/index.html
```

---

## ✅ Checklist de Implementación

### Fase 1: Librerías Core

- [ ] auth-utils.test.ts
- [ ] rate-limit.test.ts
- [ ] prompt-utils.test.ts
- [ ] validators.test.ts
- [ ] pii-detector.test.ts
- [ ] logger.test.ts
- [ ] utils.test.ts

### Fase 2: API Routes

- [ ] prompts-get.test.ts
- [ ] prompts-post.test.ts
- [ ] prompts-id.test.ts
- [ ] prompts-actions.test.ts
- [ ] categories-route.test.ts
- [ ] stats.test.ts
- [ ] user.test.ts
- [ ] auth-signup.test.ts

---

*Plan generado para alcanzar 90% de cobertura de código*
*Fecha: Febrero 2025*
