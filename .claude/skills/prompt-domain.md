# Prompt Domain - Lógica de Negocio

> Reglas y patrones específicos del dominio de gestión de prompts.

## Ciclo de Vida del Prompt

```
┌─────────┐    publish    ┌───────────┐    deprecate    ┌────────────┐
│  DRAFT  │ ───────────► │ PUBLISHED │ ─────────────► │ DEPRECATED │
└─────────┘              └───────────┘                 └────────────┘
     ▲                        │
     │        unpublish       │
     └────────────────────────┘
```

### Estados
- `draft` - En desarrollo, solo visible para el autor
- `published` - Disponible para todos los usuarios
- `deprecated` - Marcado como obsoleto, sin uso recomendado

## Operaciones de Negocio

### Publicar Prompt
```typescript
// POST /api/prompts/[id]/publish
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserWithDevFallback();
  if (!user) return unauthorized();

  const prompt = await db.prompt.findUnique({ where: { id: params.id } });
  if (!prompt) return notFound();

  // Solo el autor o admin puede publicar
  if (prompt.authorId !== user.id && user.role !== 'admin') {
    return forbidden();
  }

  // Validar que tenga contenido mínimo
  if (!prompt.body || prompt.body.length < 10) {
    return badRequest('El prompt debe tener contenido');
  }

  const updated = await db.prompt.update({
    where: { id: params.id },
    data: {
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
      reviewerId: user.id,
    },
  });

  // Log de auditoría
  await db.auditLog.create({
    data: {
      id: randomUUID(),
      promptId: prompt.id,
      userId: user.id,
      action: 'publish',
      details: JSON.stringify({ version: prompt.version }),
    },
  });

  return json(updated);
}
```

### Deprecar Prompt
```typescript
// POST /api/prompts/[id]/deprecate
const updated = await db.prompt.update({
  where: { id },
  data: {
    status: 'deprecated',
    deprecatedAt: new Date(),
    updatedAt: new Date(),
  },
});
```

### Registrar Feedback
```typescript
// POST /api/prompts/[id]/feedback
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { feedback, comment } = await request.json();

  // feedback: 'thumbsUp' | 'thumbsDown'

  await db.$transaction([
    // Incrementar contador
    db.prompt.update({
      where: { id: params.id },
      data: {
        [feedback]: { increment: 1 },
      },
    }),

    // Registrar uso
    db.promptUsage.create({
      data: {
        id: randomUUID(),
        promptId: params.id,
        feedback,
        comment,
      },
    }),
  ]);

  return json({ success: true });
}
```

## Variables de Prompt

### Schema de Variables
```typescript
// En prompt.variablesSchema (JSON string)
const variablesSchema = [
  {
    name: 'nombre_variable',
    type: 'string' | 'number' | 'boolean',
    required: true,
    description: 'Descripción de la variable',
    default: 'valor por defecto',
  },
];

// Guardar
prompt.variablesSchema = JSON.stringify(variablesSchema);

// Leer
const schema = JSON.parse(prompt.variablesSchema);
```

### Interpolación
```typescript
function interpolatePrompt(body: string, variables: Record<string, unknown>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return String(variables[key] ?? match);
  });
}
```

## Versionado

### Crear Nueva Versión
```typescript
// Antes de actualizar un prompt publicado
const currentVersion = await db.prompt.findUnique({ where: { id } });

// Guardar versión anterior
await db.promptVersion.create({
  data: {
    id: randomUUID(),
    promptId: id,
    version: currentVersion.version,
    body: currentVersion.body,
    variablesSchema: currentVersion.variablesSchema,
    changelog: 'Descripción de cambios',
    authorId: user.id,
  },
});

// Actualizar prompt con nueva versión
await db.prompt.update({
  where: { id },
  data: {
    body: newBody,
    version: incrementVersion(currentVersion.version), // "1.0.0" → "1.1.0"
    updatedAt: new Date(),
  },
});
```

### Incrementar Versión
```typescript
function incrementVersion(version: string, type: 'major' | 'minor' | 'patch' = 'minor'): string {
  const [major, minor, patch] = version.split('.').map(Number);

  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
  }
}
```

## Detección de PII

```typescript
import { detectPII } from '@/lib/pii-detector';

function validatePromptContent(body: string): { valid: boolean; warnings: string[] } {
  const piiResult = detectPII(body);

  if (piiResult.hasPII) {
    return {
      valid: false,
      warnings: piiResult.matches.map(m => `Posible PII detectado: ${m.type}`),
    };
  }

  return { valid: true, warnings: [] };
}
```

## Niveles de Riesgo

| Nivel | Descripción | Uso |
|-------|-------------|-----|
| `low` | Sin datos sensibles | Uso libre |
| `medium` | Puede contener datos internos | Revisar antes de usar |
| `high` | Datos sensibles o críticos | Solo usuarios autorizados |

## Estadísticas

```typescript
// GET /api/stats
export async function GET() {
  const [
    totalPrompts,
    publishedCount,
    categoriesCount,
    topPrompts,
    recentFeedback,
  ] = await Promise.all([
    db.prompt.count(),
    db.prompt.count({ where: { status: 'published' } }),
    db.category.count(),
    db.prompt.findMany({
      where: { status: 'published' },
      orderBy: { useCount: 'desc' },
      take: 5,
    }),
    db.promptUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { Prompt: { select: { title: true } } },
    }),
  ]);

  return NextResponse.json({
    totalPrompts,
    publishedCount,
    categoriesCount,
    topPrompts,
    recentFeedback,
  });
}
```

## Rate Limiting por Operación

```typescript
import { RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

const RATE_LIMITS = {
  // Lectura: más permisivo
  list: RATE_LIMIT_PRESETS.relaxed,    // 100 req/min
  read: RATE_LIMIT_PRESETS.standard,   // 30 req/min

  // Escritura: más restrictivo
  create: RATE_LIMIT_PRESETS.strict,  // 10 req/min
  update: RATE_LIMIT_PRESETS.strict,  // 10 req/min
  delete: RATE_LIMIT_PRESETS.strict,  // 5 req/min
};
```
