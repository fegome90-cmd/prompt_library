# Prompt Manager - Diagnóstico Crítico y Roadmap de Work Orders

**Análisis:** Staff Engineer + Product Owner  
**Fecha:** Febrero 2025  
**Metodología:** Trifecta/Work-O (pragmático, audit-able, fail-closed)

---

## A. Diagnóstico de Brechas

### H-001: Fallback Dev expone acceso no autorizado
| Campo | Valor |
|-------|-------|
| **Severidad** | **P0 - CRÍTICO** |
| **Evidencia** | "Fallback dev: Usa primer usuario si no hay sesión" + "En desarrollo, cualquier email existente puede iniciar sesión sin contraseña" |
| **Riesgo** | En entorno staging/demo con `NODE_ENV=production` mal configurado, cualquiera accede como admin. Si el fallback se filtra a producción, bypass total de autenticación. |
| **Fix mínimo** | 1) Eliminar fallback por completo o usar env var explícita `DEV_AUTH_BYPASS=true` (no usar NODE_ENV). 2) Requerir flag explícito + warning en logs. 3) Tests que fallen si el bypass está activo en CI. |

---

### H-002: Credentials provider sin verificación de contraseña
| Campo | Valor |
|-------|-------|
| **Severidad** | **P0 - CRÍTICO** |
| **Evidencia** | "Provider: Credentials (email)" + "En desarrollo, cualquier email existente puede iniciar sesión sin contraseña" + "Password con bcrypt | Alta | Verificación real de contraseñas" (pendiente) |
| **Riesgo** | Cualquiera que conozca un email válido puede impersonar a ese usuario. No hay verificación de identidad. Acceso no autorizado a prompts, modificación, eliminación. |
| **Fix mínimo** | 1) Implementar campo `password` en User con hash bcrypt. 2) Modificar authorize() en auth.ts para verificar hash. 3) Crear flujo de signup con contraseña. 4) Tests de autenticación positiva/negativa. |

---

### H-003: JWT 30 días sin rotación ni invalidación
| Campo | Valor |
|-------|-------|
| **Severidad** | **P1 - ALTO** |
| **Evidencia** | "Estrategia: JWT (compatible con SQLite)" + "Sesiones: 30 días de duración" |
| **Riesgo** | Tokens comprometidos no pueden ser revocados. Si un token es robado, el atacante tiene acceso por 30 días. No hay rotation ni refresh token strategy. |
| **Fix mínimo** | 1) Reducir expiración a 1-4 horas con refresh tokens. 2) Implementar denylist en DB para revocación. 3) Agregar `iat` y `jti` claims para tracking. 4) Endpoint de logout que invalida token. |

---

### H-004: Rate limiting in-memory vulnerable a bypass
| Campo | Valor |
|-------|-------|
| **Severidad** | **P1 - ALTO** |
| **Evidencia** | "Rate limiting in-memory" + "Redis rate limiting | Media | Para multi-instancia" (pendiente) |
| **Riesgo** | Con múltiples instancias, cada una tiene su propio contador → rate limit real = N × limit. DoS más fácil. Headers inconsistentes entre instancias. |
| **Fix mínimo** | 1) Spike: confirmar si hay despliegue multi-instancia. 2) Si sí: implementar Redis con sliding window. 3) Si no: documentar limitación y agregar monitoreo de instancias. 4) Agregar header `X-RateLimit-Limit` consistente. |

---

### H-005: Sin suite de tests
| Campo | Valor |
|-------|-------|
| **Severidad** | **P1 - ALTO** |
| **Evidencia** | El informe NO menciona tests. Menciona "bun run lint" pero no "bun run test". vitest está en devDependencies pero no hay indicación de uso. |
| **Riesgo** | Refactors rompen funcionalidad sin detección. Auth changes no pueden ser verificados. No hay gates para PRs. Regresiones en producción. |
| **Fix mínimo** | 1) Configurar vitest con coverage. 2) Tests unitarios para auth-utils (canModifyPrompt, canDeletePrompt). 3) Tests de API con test DB. 4) GitHub Actions con test gate. |

---

### H-006: AuditLog estructura sin validación de PII
| Campo | Valor |
|-------|-------|
| **Severidad** | **P1 - ALTO** |
| **Evidencia** | "AuditLog: id, action, details, createdAt" + "details: JSON.stringify({ changes: Object.keys(updateData), changelog })" |
| **Riesgo** | El campo `details` serializa objetos completos. Puede contener PII (emails, bodies de prompts con datos sensibles). Logs accesibles podrían exponer datos personales. |
| **Fix mínimo** | 1) Definir schema de qué se loguea vs no. 2) Sanitizar emails: `a***@domain.com`. 3) No loguear bodies de prompts completos. 4) Agregar categoría de sensibilidad al log. |

---

### H-007: Endpoint /api/seed sin protección documentada
| Campo | Valor |
|-------|-------|
| **Severidad** | **P1 - ALTO** |
| **Evidencia** | "GET /api/seed - Poblar base de datos" (listado en API Reference sin mención de protección) |
| **Riesgo** | Si el endpoint está accesible en producción,任何人 puede poblar/sobrescribir datos. Posible data corruption o DoS. |
| **Fix mínimo** | 1) Verificar implementación actual (SPIKE). 2) Si no está protegido: agregar ADMIN_SECRET header. 3) Deshabilitar en producción por defecto. 4) Agregar a AuditLog si se ejecuta. |

---

### H-008: Ownership validation potencialmente insuficiente para IDOR
| Campo | Valor |
|-------|-------|
| **Severidad** | **P1 - ALTO** |
| **Evidencia** | "user: Solo puede modificar sus propios prompts" + roles owner/editor/reviewer/user. El informe no especifica cómo se valida el usuario actual vs el request. |
| **Riesgo** | Si la validación usa `authorId` del body en lugar de la sesión, es spoofeable. IDOR: usuario A modifica prompts de usuario B cambiando el ID en la request. |
| **Fix mínimo** | 1) SPIKE: auditar todos los endpoints mutadores (POST/PUT/DELETE). 2) Confirmar que authorId viene SIEMPRE de session. 3) Tests de IDOR: usuario A intenta modificar prompt de B. |

---

### H-009: Sin observabilidad ni correlation IDs
| Campo | Valor |
|-------|-------|
| **Severidad** | **P2 - MEDIO** |
| **Evidencia** | El informe NO menciona: structured logging, correlation IDs, metrics, tracing, ni alerting. |
| **Riesgo** | Imposible debuggear issues en producción. No hay visibilidad de errores. Rate limiting hits no son monitoreados. Ataques no detectados. |
| **Fix mínimo** | 1) Agregar correlation ID middleware. 2) Estructurar logs con pino o winston. 3) Agregar metrics básicos (request count, error rate, auth failures). 4) No loguear tokens ni PII completo. |

---

### H-010: Contratos de API inconsistentes
| Campo | Valor |
|-------|-------|
| **Severidad** | **P2 - MEDIO** |
| **Evidencia** | "GET /api/prompts?status=published&category=Ventas&search=prospect&page=1&limit=20" (ejemplo de query params). No hay especificación de códigos de error, estructura de response de error, o consistencia cross-endpoint. |
| **Riesgo** | Clientes pueden depender de comportamiento no documentado. Cambios rompen integraciones. Debugging difícil con errores genéricos. |
| **Fix mínimo** | 1) Definir ApiError interface estándar. 2) Usar códigos HTTP consistentes (401, 403, 404, 422, 429, 500). 3) Documentar con OpenAPI o similar. 4) Tests de contratos. |

---

### H-011: SQLite limita escalabilidad
| Campo | Valor |
|-------|-------|
| **Severidad** | **P2 - MEDIO** |
| **Evidencia** | "Base de Datos: SQLite + Prisma ORM" |
| **Riesgo** | SQLite no soporta writes concurrentes bien. Un proceso bloquea la DB. No escalable horizontalmente. Límite de tamaño de archivo. Backup más complejo. |
| **Fix mínimo** | 1) Documentar límites conocidos. 2) Agregar path de migración a PostgreSQL. 3) Monitorear tamaño de DB. 4) Considerar read replicas si hay reads pesados. |

---

### H-012: Soft delete sin garbage collection
| Campo | Valor |
|-------|-------|
| **Severidad** | **P2 - MEDIO** |
| **Evidencia** | "Soft delete (deprecated)" + status: deprecated |
| **Riesgo** | Prompts deprecados acumulan para siempre. DB crece indefinidamente. Queries deben filtrar status constantemente. Performance degrada. |
| **Fix mínimo** | 1) Definir política de retención (ej: 90 días). 2) Job de cleanup o endpoint admin. 3) Considerar hard delete con archive. 4) Agregar `deprecatedBy` y `deprecatedAt` si no existen. |

---

### H-013: Sin DX tooling (hooks, seed refresh)
| Campo | Valor |
|-------|-------|
| **Severidad** | **P3 - BAJO** |
| **Evidencia** | "bun run scripts/seed.ts" - script manual, no hay indicación de db:reset, husky hooks, o setup automatizado. |
| **Riesgo** | Onboarding lento. Developers olvidan correr seed. Inconsistencias entre ambientes locales. |
| **Fix mínimo** | 1) Agregar `bun run db:reset` que limpie y re-seed. 2) Git hooks para validar antes de commit. 3) README con steps claros. 4) Script de setup completo. |

---

## B. Roadmap por Olas

### Ola 0: P0 - Seguridad Crítica (Bloqueante para cualquier release)

```
┌─────────────────────────────────────────────────────────┐
│  WO-0101  ←── Spike: Verificar estado actual de auth   │
│     │                                                    │
│     ▼                                                    │
│  WO-0102  ←── Eliminar/Limitar fallback dev             │
│     │                                                    │
│     ▼                                                    │
│  WO-0103  ←── Implementar password verification        │
│                                            [GATE: Auth Tests] │
└─────────────────────────────────────────────────────────┘
```

### Ola 1: P1 - Confiabilidad y Testing

```
┌─────────────────────────────────────────────────────────┐
│  WO-0104  ←── Configurar test harness (vitest)         │
│     │                                                    │
│     ├────── WO-0105  ←── Tests de auth-utils            │
│     │                                                    │
│     ├────── WO-0106  ←── Tests de API (CRUD prompts)    │
│     │                                                    │
│     ▼                                                    │
│  WO-0107  ←── Fix JWT rotation/invalidation            │
│     │                                                    │
│     ▼                                                    │
│  WO-0108  ←── AuditLog sanitization PII                │
│     │                                                    │
│     ▼                                                    │
│  WO-0109  ←── Proteger /api/seed                       │
│     │                                                    │
│     ▼                                                    │
│  WO-0110  ←── IDOR audit + tests                       │
│                                    [GATE: Coverage > 60%] │
└─────────────────────────────────────────────────────────┘
```

### Ola 2: P2 - Observabilidad y Escalabilidad

```
┌─────────────────────────────────────────────────────────┐
│  WO-0111  ←── Structured logging + correlation ID      │
│     │                                                    │
│     ▼                                                    │
│  WO-0112  ←── API contracts standardization            │
│     │                                                    │
│     ▼                                                    │
│  WO-0113  ←── Rate limit Redis (si multi-instance)     │
│     │                                                    │
│     ▼                                                    │
│  WO-0114  ←── Soft delete GC policy                    │
│     │                                                    │
│     ▼                                                    │
│  WO-0115  ←── SQLite limits documentation              │
└─────────────────────────────────────────────────────────┘
```

### Ola 3: P3 - Developer Experience

```
┌─────────────────────────────────────────────────────────┐
│  WO-0116  ←── DX tooling (hooks, db:reset, setup)      │
│     │                                                    │
│     ▼                                                    │
│  WO-0117  ←── OAuth providers (optional)               │
│     │                                                    │
│     ▼                                                    │
│  WO-0118  ←── Export/Import JSON                       │
└─────────────────────────────────────────────────────────┘
```

---

## C. Backlog de Work Orders (YAML)

```yaml
# ============================================================================
# WO-0101: SPIKE - Verificar estado actual de autenticación
# ============================================================================
wo:
  id: WO-0101
  title: "SPIKE: Auditar implementación actual de autenticación"
  type: spike
  priority: P0
  area: security
  rationale: |
    El informe menciona "Fallback dev" y "sin contraseña" pero no especifica:
    - Si el fallback está realmente en producción
    - Cómo está implementado el authorize() de NextAuth
    - Si hay algún mecanismo de verificación parcial
    
    Necesitamos evidencia antes de proponer el fix correcto.
  scope:
    include:
      - src/lib/auth.ts
      - src/lib/auth-utils.ts
      - src/app/api/auth/[...nextauth]/route.ts
      - .env (check for DEV_AUTH flags)
    exclude:
      - Cambios de código
  dependencies: []
  acceptance_criteria:
    - AC1: Documentar línea exacta donde se implementa fallback
    - AC2: Confirmar si authorize() verifica password
    - AC3: Verificar variables de entorno relacionadas con auth
    - AC4: Confirmar si PrismaAdapter está activo
  dod:
    tests: N/A (spike)
    security: Documentar vulnerabilidades encontradas
    observability: N/A
    docs: Crear documento AUTH_STATE.md con findings
    evidence: Screenshots de código relevante
  verify:
    commands:
      - "cat AUTH_STATE.md | grep -E '(fallback|password|authorize)'"
    expected: "Documento con hallazgos específicos"
  risk:
    failure_modes: "No encontrar la implementación (código ofuscado o dinámico)"
    rollback: "N/A - spike no cambia código"
  status: pending

# ============================================================================
# WO-0102: Eliminar/limitar fallback de autenticación dev
# ============================================================================
wo:
  id: WO-0102
  title: "Eliminar o asegurar fallback de autenticación en desarrollo"
  type: fix
  priority: P0
  area: security
  rationale: |
    H-001: "Fallback dev: Usa primer usuario si no hay sesión" es un riesgo crítico.
    Depende de WO-0101 para saber exactamente dónde modificar.
  scope:
    include:
      - src/lib/auth-utils.ts (getUserWithDevFallback)
      - src/lib/auth.ts
    exclude:
      - Cambios en UI
      - Cambios en DB
  dependencies:
    - WO-0101
  acceptance_criteria:
    - AC1: Si NODE_ENV === 'production', fallback debe fallar SIEMPRE
    - AC2: Si se usa fallback, debe requerir env var explícita DEV_AUTH_BYPASS=true
    - AC3: Loguear warning si fallback está activo
    - AC4: Documentar en AUTH_STATE.md cómo funciona el nuevo sistema
  dod:
    tests:
      - Test: fallback retorna null en production
      - Test: fallback retorna null sin DEV_AUTH_BYPASS
      - Test: fallback funciona con DEV_AUTH_BYPASS=true y warning en logs
    security: No bypass posible en producción
    observability: Warning logged cuando bypass activo
    docs: Actualizar AUTH_STATE.md
    evidence: Logs mostrando warning
  verify:
    commands:
      - "NODE_ENV=production bun run test --grep fallback"
      - "grep -r 'DEV_AUTH_BYPASS' src/"
    expected: "Tests pasan, variable documentada"
  risk:
    failure_modes: "Romper desarrollo local si no hay alternativa"
    rollback: "Revertir commit, restaurar fallback anterior"
  status: pending

# ============================================================================
# WO-0103: Implementar verificación de contraseña
# ============================================================================
wo:
  id: WO-0103
  title: "Implementar verificación de contraseña con bcrypt"
  type: feature
  priority: P0
  area: security
  rationale: |
    H-002: "Cualquier email existente puede iniciar sesión sin contraseña"
    Es la vulnerabilidad más grave. Requiere:
    - Campo password en User
    - Hash con bcrypt
    - Modificar authorize()
  scope:
    include:
      - prisma/schema.prisma (campo password)
      - src/lib/auth.ts (authorize function)
      - src/app/api/user/route.ts (signup endpoint)
      - scripts/seed.ts (generar passwords)
    exclude:
      - UI de signup (mvp: solo API)
      - Password reset
  dependencies:
    - WO-0102
  acceptance_criteria:
    - AC1: User tiene campo password (hashed)
    - AC2: authorize() verifica bcrypt.compare(input, stored)
    - AC3: POST /api/user/signup crea usuario con password hashed
    - AC4: Login falla con contraseña incorrecta
    - AC5: Login funciona con contraseña correcta
  dod:
    tests:
      - Test: signup crea usuario con password hasheado
      - Test: login exitoso con credenciales correctas
      - Test: login falla con contraseña incorrecta
      - Test: login falla con email inexistente
      - Test: password no se almacena en plain text
    security: Bcrypt con salt rounds >= 12
    observability: Loguear intentos de login fallidos (sin password)
    docs: Documentar flujo de auth en README
    evidence: Logs de tests
  verify:
    commands:
      - "bun run test --grep 'auth\\|password\\|login'"
      - "bun run lint"
    expected: "Todos los tests pasan, lint clean"
  risk:
    failure_modes: "Usuarios existentes sin password no pueden loguear"
    rollback: "Migración down, revertir authorize()"
  status: pending

# ============================================================================
# WO-0104: Configurar test harness
# ============================================================================
wo:
  id: WO-0104
  title: "Configurar suite de tests con vitest"
  type: enabler
  priority: P1
  area: testing
  rationale: |
    H-005: No hay suite de tests mencionada. Vitest está en devDependencies
    pero sin uso documentado. Es prerequisito para todos los WOs de P1.
  scope:
    include:
      - vitest.config.ts
      - src/__tests__/setup.ts
      - package.json (scripts de test)
      - .github/workflows/test.yml (CI gate)
    exclude:
      - Tests específicos (van en WOs separados)
  dependencies: []
  acceptance_criteria:
    - AC1: `bun run test` ejecuta tests
    - AC2: Coverage habilitado con threshold 50%
    - AC3: CI corre tests en cada PR
    - AC4: Test DB configurada (archivo separado o in-memory)
  dod:
    tests: Un test dummy que pasa
    security: N/A
    observability: Coverage report generado
    docs: README actualizado con cómo correr tests
    evidence: Screenshot de CI passing
  verify:
    commands:
      - "bun run test"
      - "cat coverage/coverage-summary.json | grep 'lines'"
    expected: "Tests pasan, coverage >= 50%"
  risk:
    failure_modes: "Configuración compleja rompe dev flow"
    rollback: "Eliminar vitest.config.ts y workflow"
  status: pending

# ============================================================================
# WO-0105: Tests de auth-utils
# ============================================================================
wo:
  id: WO-0105
  title: "Tests unitarios para funciones de autorización"
  type: test
  priority: P1
  area: testing
  rationale: |
    H-005 + H-008: Las funciones canModifyPrompt, canDeletePrompt, hasRole
    son críticas para seguridad. Necesitan tests exhaustivos.
  scope:
    include:
      - src/lib/auth-utils.ts
      - src/__tests__/lib/auth-utils.test.ts
    exclude:
      - Tests de integración (WO-0106)
  dependencies:
    - WO-0104
  acceptance_criteria:
    - AC1: canModifyPrompt cubre todos los roles
    - AC2: canDeletePrompt solo permite owner/editor
    - AC3: hasRole funciona con arrays
    - AC4: getUserWithDevFallback testado (con y sin bypass)
    - AC5: Coverage > 90% para auth-utils.ts
  dod:
    tests: Los tests son el entregable
    security: Tests incluyen casos de edge (null user, role malformado)
    observability: N/A
    docs: Inline comments en tests explicando casos
    evidence: Coverage report
  verify:
    commands:
      - "bun run test --grep auth-utils"
      - "bun run test --coverage --reporter=json 2>/dev/null | grep auth-utils"
    expected: "Coverage >= 90% en auth-utils"
  risk:
    failure_modes: "Tests flaky por mocks incorrectos"
    rollback: "Eliminar archivo de test"
  status: pending

# ============================================================================
# WO-0106: Tests de API (CRUD prompts)
# ============================================================================
wo:
  id: WO-0106
  title: "Tests de integración para API de prompts"
  type: test
  priority: P1
  area: testing
  rationale: |
    H-005 + H-008: Necesitamos verificar que los endpoints de API
    funcionan correctamente y que ownership validation es correcto.
  scope:
    include:
      - src/app/api/prompts/route.ts
      - src/app/api/prompts/[id]/route.ts
      - src/__tests__/api/prompts.test.ts
    exclude:
      - Otros endpoints (categories, stats)
  dependencies:
    - WO-0104
    - WO-0105
  acceptance_criteria:
    - AC1: GET /api/prompts retorna lista
    - AC2: POST /api/prompts crea prompt con usuario autenticado
    - AC3: PUT /api/prompts/:id valida ownership
    - AC4: DELETE /api/prompts/:id valida ownership y rol
    - AC5: Rate limiting responde 429 cuando excedido
    - AC6: Tests de IDOR: usuario A no modifica prompt de B
  dod:
    tests: Los tests son el entregable
    security: Tests de IDOR incluidos
    observability: Tests loguean requests
    docs: README con ejemplos de API test
    evidence: Coverage report de API routes
  verify:
    commands:
      - "bun run test --grep prompts"
    expected: "Todos los tests de API pasan"
  risk:
    failure_modes: "Test DB contamina DB de dev"
    rollback: "Eliminar tests"
  status: pending

# ============================================================================
# WO-0107: JWT rotation e invalidation
# ============================================================================
wo:
  id: WO-0107
  title: "Implementar rotación de JWT y capacidad de invalidación"
  type: feature
  priority: P1
  area: security
  rationale: |
    H-003: "JWT 30 días sin rotación ni invalidación"
    Tokens comprometidos no pueden ser revocados.
  scope:
    include:
      - src/lib/auth.ts
      - prisma/schema.prisma (tabla TokenDenylist o similar)
      - src/app/api/auth/logout/route.ts
    exclude:
      - Refresh tokens completos (MVP: solo denylist)
  dependencies:
    - WO-0104
  acceptance_criteria:
    - AC1: JWT expira en 4 horas (configurable)
    - AC2: Logout agrega token a denylist
    - AC3: authorize() checkea denylist antes de aceptar token
    - AC4: denylist se limpia de tokens expirados automáticamente
  dod:
    tests:
      - Test: token inválido después de logout
      - Test: token válido antes de expiración
      - Test: denylist cleanup funciona
    security: Denylist no expone info sensible
    observability: Loguear invalidaciones
    docs: Documentar flujo de logout
    evidence: Logs de tests
  verify:
    commands:
      - "bun run test --grep 'jwt\\|logout\\|denylist'"
    expected: "Tests pasan"
  risk:
    failure_modes: "Performance degrada con denylist grande"
    rollback: "Desactivar denylist check"
  status: pending

# ============================================================================
# WO-0108: AuditLog sanitization
# ============================================================================
wo:
  id: WO-0108
  title: "Sanitizar PII en AuditLog"
  type: fix
  priority: P1
  area: security
  rationale: |
    H-006: "details: JSON.stringify(...) puede contener PII"
    Los logs pueden exponer emails y contenido de prompts.
  scope:
    include:
      - src/lib/audit-sanitizer.ts (nuevo)
      - src/app/api/prompts/[id]/route.ts
      - src/app/api/prompts/route.ts
    exclude:
      - Migración de logs existentes
  dependencies:
    - WO-0104
  acceptance_criteria:
    - AC1: Emails se loguean como "a***@domain.com"
    - AC2: Bodies de prompts se truncan a 100 chars
    - AC3: No se loguean variables con datos sensibles
    - AC4: Helper sanitizeForAudit() disponible
  dod:
    tests:
      - Test: email se enmascara
      - Test: body largo se trunca
      - Test: objeto complejo se sanitiza recursivamente
    security: Logs aprobados por security review
    observability: N/A
    docs: Documentar qué se loguea
    evidence: Ejemplo de log sanitizado
  verify:
    commands:
      - "bun run test --grep 'audit\\|sanitize'"
      - "grep -r 'sanitizeForAudit' src/"
    expected: "Tests pasan, helper utilizado"
  risk:
    failure_modes: "Logs pierden info útil para debugging"
    rollback: "Revertir sanitización"
  status: pending

# ============================================================================
# WO-0109: Proteger /api/seed
# ============================================================================
wo:
  id: WO-0109
  title: "Proteger endpoint /api/seed contra acceso no autorizado"
  type: fix
  priority: P1
  area: security
  rationale: |
    H-007: Endpoint sin protección documentada.
    Puede sobrescribir datos de producción.
  scope:
    include:
      - src/app/api/seed/route.ts
    exclude:
      - Cambios en scripts/seed.ts
  dependencies:
    - WO-0104
  acceptance_criteria:
    - AC1: GET /api/seed retorna 403 sin ADMIN_SECRET
    - AC2: GET /api/seed retorna 403 en production
    - AC3: Funciona con header x-admin-secret correcto
    - AC4: Agrega entrada a AuditLog cuando se ejecuta
  dod:
    tests:
      - Test: 403 sin header
      - Test: 403 en production
      - Test: 200 con header correcto
      - Test: AuditLog creado
    security: Endpoint inaccesible en producción por defecto
    observability: Loguear intentos de acceso
    docs: Documentar cómo usar el endpoint
    evidence: Logs de tests
  verify:
    commands:
      - "bun run test --grep 'seed'"
      - "curl -s http://localhost:3000/api/seed | grep 403"
    expected: "403 sin credenciales"
  risk:
    failure_modes: "Romper scripts de setup"
    rollback: "Revertir protección"
  status: pending

# ============================================================================
# WO-0110: IDOR audit + tests
# ============================================================================
wo:
  id: WO-0110
  title: "Auditar y testear IDOR en todos los endpoints mutadores"
  type: fix
  priority: P1
  area: security
  rationale: |
    H-008: Ownership validation puede ser insuficiente.
    Necesitamos verificar que authorId siempre viene de session.
  scope:
    include:
      - src/app/api/prompts/[id]/route.ts
      - src/app/api/prompts/[id]/publish/route.ts
      - src/app/api/prompts/[id]/deprecate/route.ts
      - src/__tests__/security/idor.test.ts
    exclude:
      - Endpoints de solo lectura
  dependencies:
    - WO-0105
    - WO-0106
  acceptance_criteria:
    - AC1: PUT ignora authorId del body (usa session)
    - AC2: POST ignora authorId del body (usa session)
    - AC3: DELETE valida que user tiene permisos
    - AC4: Tests de IDOR para cada endpoint mutador
  dod:
    tests:
      - Test: user A no puede modificar prompt de B
      - Test: user A no puede eliminar prompt de B
      - Test: editor puede modificar prompt de B
      - Test: owner puede eliminar cualquier prompt
    security: Todos los casos IDOR cubiertos
    observability: N/A
    docs: Documentar modelo de permisos
    evidence: Coverage report
  verify:
    commands:
      - "bun run test --grep 'idor'"
    expected: "Todos los tests IDOR pasan"
  risk:
    failure_modes: "Romper funcionalidad existente"
    rollback: "Revertir cambios de validación"
  status: pending

# ============================================================================
# WO-0111: Structured logging + correlation ID
# ============================================================================
wo:
  id: WO-0111
  title: "Implementar logging estructurado con correlation IDs"
  type: feature
  priority: P2
  area: observability
  rationale: |
    H-009: Sin observabilidad documentada.
    Imposible debuggear producción.
  scope:
    include:
      - src/lib/logger.ts (nuevo)
      - src/middleware.ts (correlation ID)
      - src/app/api/**/route.ts (usar logger)
    exclude:
      - Logs de frontend
      - Integración con APM externo
  dependencies:
    - WO-0108
  acceptance_criteria:
    - AC1: Cada request tiene X-Correlation-ID
    - AC2: Logger structured con niveles (info, warn, error)
    - AC3: No se loguean tokens ni passwords
    - AC4: Logs incluyen timestamp, level, correlationId, message
  dod:
    tests:
      - Test: middleware agrega correlation ID
      - Test: logger no loguea passwords
    security: Logs sanitizados
    observability: Logs estructurados funcionando
    docs: Documentar uso de logger
    evidence: Ejemplo de log JSON
  verify:
    commands:
      - "bun run test --grep 'logger\\|correlation'"
      - "grep -r 'correlationId' src/"
    expected: "Tests pasan, middleware activo"
  risk:
    failure_modes: "Performance degrada con mucho logging"
    rollback: "Desactivar middleware"
  status: pending

# ============================================================================
# WO-0112: API contracts standardization
# ============================================================================
wo:
  id: WO-0112
  title: "Estandarizar contratos de API"
  type: refactor
  priority: P2
  area: api
  rationale: |
    H-010: API contracts inconsistentes.
    Errores no tienen formato estándar.
  scope:
    include:
      - src/lib/api-response.ts (nuevo)
      - src/app/api/**/route.ts
    exclude:
      - OpenAPI spec (fase posterior)
  dependencies:
    - WO-0104
  acceptance_criteria:
    - AC1: ApiError interface definida: { error: string, code?: string, details?: object }
    - AC2: Status codes consistentes (401, 403, 404, 422, 429, 500)
    - AC3: Helper functions: success(), error(), paginated()
    - AC4: Todos los endpoints usan los helpers
  dod:
    tests:
      - Test: error response tiene formato correcto
      - Test: paginated response tiene metadata
    security: No exponer stack traces en producción
    observability: N/A
    docs: Documentar ApiError interface
    evidence: Ejemplos de responses
  verify:
    commands:
      - "bun run test --grep 'api-response'"
      - "grep -r 'ApiError' src/"
    expected: "Tests pasan, helpers usados"
  risk:
    failure_modes: "Romper clientes existentes"
    rollback: "Revertir cambios de response"
  status: pending

# ============================================================================
# WO-0113: Rate limit Redis
# ============================================================================
wo:
  id: WO-0113
  title: "Migrar rate limiting a Redis si hay multi-instancia"
  type: feature
  priority: P2
  area: scalability
  rationale: |
    H-004: Rate limiting in-memory no funciona con múltiples instancias.
    Requiere SPIKE previo para confirmar arquitectura.
  scope:
    include:
      - src/lib/rate-limit.ts
      - docker-compose.yml (Redis service, si aplica)
    exclude:
      - Cambios si solo hay una instancia
  dependencies:
    - WO-0104
  acceptance_criteria:
    - AC1: SPIKE confirma si hay multi-instancia
    - AC2: Si sí: Redis implementado con sliding window
    - AC3: Si no: documentar limitación
    - AC4: Fallback a in-memory si Redis no disponible
  dod:
    tests:
      - Test: rate limit funciona con Redis
      - Test: fallback funciona sin Redis
    security: Redis no expuesto públicamente
    observability: Métricas de rate limit hits
    docs: Documentar arquitectura de rate limiting
    evidence: Diagrama de arquitectura
  verify:
    commands:
      - "bun run test --grep 'rate-limit'"
      - "cat docs/rate-limiting.md"
    expected: "Tests pasan, docs actualizados"
  risk:
    failure_modes: "Redis downtime bloquea requests"
    rollback: "Usar in-memory fallback"
  status: pending

# ============================================================================
# WO-0114: Soft delete GC policy
# ============================================================================
wo:
  id: WO-0114
  title: "Implementar política de garbage collection para soft deletes"
  type: feature
  priority: P2
  area: data
  rationale: |
    H-012: Prompts deprecados acumulan para siempre.
    DB crece indefinidamente.
  scope:
    include:
      - src/lib/gc-prompts.ts (nuevo)
      - src/app/api/admin/gc/route.ts (nuevo)
      - prisma/schema.prisma (agregar deprecatedBy si falta)
    exclude:
      - Cron automático (MVP: endpoint manual)
  dependencies:
    - WO-0109
  acceptance_criteria:
    - AC1: Política documentada: 90 días retención
    - AC2: Endpoint DELETE /api/admin/gc ejecuta cleanup
    - AC3: Logs de qué se eliminó
    - AC4: Protegido con ADMIN_SECRET
  dod:
    tests:
      - Test: prompts > 90 días se marcan para eliminar
      - Test: endpoint protegido
    security: Endpoint protegido
    observability: Loguear cleanup
    docs: Documentar política
    evidence: Logs de GC
  verify:
    commands:
      - "bun run test --grep 'gc\\|cleanup'"
    expected: "Tests pasan"
  risk:
    failure_modes: "Eliminar datos que se necesitaban"
    rollback: "Restaurar desde backup"
  status: pending

# ============================================================================
# WO-0115: SQLite limits documentation
# ============================================================================
wo:
  id: WO-0115
  title: "Documentar límites de SQLite y path de migración"
  type: docs
  priority: P2
  area: scalability
  rationale: |
    H-011: SQLite tiene límites conocidos que deben documentarse
    para que el equipo tome decisiones informadas.
  scope:
    include:
      - docs/database-limits.md (nuevo)
      - docs/migration-postgres.md (nuevo)
    exclude:
      - Cambios de código
  dependencies: []
  acceptance_criteria:
    - AC1: Documento lista límites de SQLite
    - AC2: Documento thresholds para considerar migración
    - AC3: Guía de migración a PostgreSQL
    - AC4: Monitoreo recomendado (DB size, query times)
  dod:
    tests: N/A
    security: N/A
    observability: Recomendaciones de monitoreo
    docs: Documentos creados
    evidence: Links a documentos
  verify:
    commands:
      - "ls docs/database-limits.md docs/migration-postgres.md"
    expected: "Archivos existen"
  risk:
    failure_modes: "N/A - solo documentación"
    rollback: "N/A"
  status: pending

# ============================================================================
# WO-0116: DX tooling
# ============================================================================
wo:
  id: WO-0116
  title: "Mejorar DX con tooling de desarrollo"
  type: feature
  priority: P3
  area: dx
  rationale: |
    H-013: Sin DX tooling documentado.
    Onboarding lento.
  scope:
    include:
      - package.json (scripts: db:reset, setup)
      - .husky/pre-commit
      - README.md
    exclude:
      - Git hooks complejos
  dependencies:
    - WO-0104
  acceptance_criteria:
    - AC1: `bun run db:reset` limpia y re-seed
    - AC2: `bun run setup` configura todo
    - AC3: Pre-commit corre lint
    - AC4: README con onboarding guide
  dod:
    tests: N/A
    security: N/A
    observability: N/A
    docs: README actualizado
    evidence: Comandos funcionan
  verify:
    commands:
      - "bun run db:reset"
      - "bun run setup"
    expected: "Comandos ejecutan sin error"
  risk:
    failure_modes: "Scripts rompen en algunos OS"
    rollback: "Eliminar scripts"
  status: pending

# ============================================================================
# WO-0117: OAuth providers
# ============================================================================
wo:
  id: WO-0117
  title: "Agregar OAuth providers (Google, GitHub)"
  type: feature
  priority: P3
  area: auth
  rationale: |
    "OAuth providers | Media | Google, GitHub login" (pendiente)
    Feature request, no bloqueante.
  scope:
    include:
      - src/lib/auth.ts
      - .env.example
    exclude:
      - UI específica de OAuth
  dependencies:
    - WO-0103
  acceptance_criteria:
    - AC1: Google OAuth funciona
    - AC2: GitHub OAuth funciona
    - AC3: Usuario se crea automáticamente si no existe
    - AC4: Emails verificados por OAuth se marcan
  dod:
    tests:
      - Test: OAuth callback crea usuario
      - Test: OAuth con email existente linkea cuenta
    security: OAuth secrets no en código
    observability: Loguear OAuth logins
    docs: Configurar OAuth apps documentado
    evidence: Login con Google funciona
  verify:
    commands:
      - "bun run test --grep 'oauth'"
    expected: "Tests pasan"
  risk:
    failure_modes: "OAuth provider downtime"
    rollback: "Desactivar provider"
  status: pending

# ============================================================================
# WO-0118: Export/Import JSON
# ============================================================================
wo:
  id: WO-0118
  title: "Implementar export/import de prompts en JSON"
  type: feature
  priority: P3
  area: product
  rationale: |
    "Export/Import | Baja | JSON, CSV" (pendiente)
    Feature nice-to-have.
  scope:
    include:
      - src/app/api/prompts/export/route.ts (nuevo)
      - src/app/api/prompts/import/route.ts (nuevo)
    exclude:
      - CSV (MVP: solo JSON)
      - UI de import
  dependencies:
    - WO-0104
  acceptance_criteria:
    - AC1: GET /api/prompts/export retorna JSON con todos los prompts
    - AC2: POST /api/prompts/import crea prompts desde JSON
    - AC3: Validación de schema en import
    - AC4: Protección con auth
  dod:
    tests:
      - Test: export contiene todos los prompts
      - Test: import crea prompts correctamente
      - Test: import rechaza JSON inválido
    security: Import validado y limitado
    observability: Loguear imports
    docs: Documentar formato de JSON
    evidence: Ejemplo de JSON export
  verify:
    commands:
      - "bun run test --grep 'export\\|import'"
    expected: "Tests pasan"
  risk:
    failure_modes: "Import masivo sobrecarga DB"
    rollback: "N/A - nuevos endpoints"
  status: pending
```

---

## D. Matriz de Cobertura

| Hallazgo | ID | Severidad | WO(s) | Ola | Dependencias |
|----------|-----|-----------|-------|-----|--------------|
| Fallback dev expone acceso | H-001 | P0 | WO-0101, WO-0102 | Ola 0 | WO-0101 → WO-0102 |
| Sin verificación de contraseña | H-002 | P0 | WO-0103 | Ola 0 | WO-0102 |
| JWT sin rotación/invalidación | H-003 | P1 | WO-0107 | Ola 1 | WO-0104 |
| Rate limit in-memory bypass | H-004 | P1 | WO-0113 | Ola 2 | WO-0104 |
| Sin suite de tests | H-005 | P1 | WO-0104, WO-0105, WO-0106 | Ola 1 | WO-0104 → WO-0105, WO-0106 |
| AuditLog con PII | H-006 | P1 | WO-0108 | Ola 1 | WO-0104 |
| Endpoint /api/seed sin protección | H-007 | P1 | WO-0109 | Ola 1 | WO-0104 |
| IDOR potencial | H-008 | P1 | WO-0110 | Ola 1 | WO-0105, WO-0106 |
| Sin observabilidad | H-009 | P2 | WO-0111 | Ola 2 | WO-0108 |
| API contracts inconsistentes | H-010 | P2 | WO-0112 | Ola 2 | WO-0104 |
| SQLite limita escalabilidad | H-011 | P2 | WO-0115 | Ola 2 | - |
| Soft delete sin GC | H-012 | P2 | WO-0114 | Ola 2 | WO-0109 |
| Sin DX tooling | H-013 | P3 | WO-0116 | Ola 3 | WO-0104 |

---

## E. Resumen Ejecutivo

### Prioridad de Ejecución

```
SEMANA 1-2 (Ola 0 - P0 Crítico):
├── WO-0101: SPIKE auth state
├── WO-0102: Fix fallback dev
└── WO-0103: Password verification
    GATE: Auth tests passing

SEMANA 3-4 (Ola 1 - P1 Testing/Confiabilidad):
├── WO-0104: Test harness
├── WO-0105: Auth-utils tests
├── WO-0106: API tests
├── WO-0107: JWT rotation
├── WO-0108: AuditLog sanitization
├── WO-0109: Protect /api/seed
└── WO-0110: IDOR audit
    GATE: Coverage > 60%

SEMANA 5-6 (Ola 2 - P2 Observabilidad):
├── WO-0111: Structured logging
├── WO-0112: API contracts
├── WO-0113: Rate limit Redis
├── WO-0114: Soft delete GC
└── WO-0115: SQLite docs

SEMANA 7+ (Ola 3 - P3 Nice-to-have):
├── WO-0116: DX tooling
├── WO-0117: OAuth providers
└── WO-0118: Export/Import
```

### Gates Obligatorios

| Gate | Criterio | Después de |
|------|----------|------------|
| **GATE_AUTH** | Todos los tests de autenticación pasan | WO-0103 |
| **GATE_COVERAGE** | Coverage > 60% en código crítico | WO-0110 |
| **GATE_SECURITY** | Security review de cambios de auth | WO-0103, WO-0107 |

### Riesgos Críticos Identificados

1. **Auth bypass en producción** - Mitigado por WO-0102
2. **Impersonación sin contraseña** - Mitigado por WO-0103
3. **Tokens no revocables** - Mitigado por WO-0107
4. **Acceso no autorizado a datos ajenos** - Mitigado por WO-0110

---

*Documento generado siguiendo metodología Trifecta/Work-O*
*Próximo paso: Ejecutar WO-0101 (SPIKE) para confirmar estado actual*
