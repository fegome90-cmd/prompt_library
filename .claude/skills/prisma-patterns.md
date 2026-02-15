# Prisma ORM Patterns

> Patrones y convenciones para el uso de Prisma ORM en este proyecto.

## Configuración

### Schema Location
```
prisma/
├── schema.prisma    # Definición de modelos
└── dev.db           # SQLite database (dev)
```

### Client Singleton
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

## Modelos del Proyecto

### Prompt
```prisma
model Prompt {
  id              String   @id
  title           String
  description     String
  body            String
  category        String
  tags            String          // JSON array
  variablesSchema String          @default("[]")
  outputFormat    String?
  status          String          @default("draft")  // draft | published | deprecated
  riskLevel       String          @default("low")
  version         String          @default("1.0.0")
  useCount        Int             @default(0)
  thumbsUp        Int             @default(0)
  thumbsDown      Int             @default(0)
  isFavorite      Boolean         @default(false)
  authorId        String
  reviewerId      String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime
  publishedAt     DateTime?
  deprecatedAt    DateTime?

  @@index([status])
  @@index([category])
  @@index([authorId])
}
```

### User
```prisma
model User {
  id        String   @id
  email     String   @unique
  name      String
  password  String?  // bcrypt hash
  role      String   @default("user")
}
```

## Patrones de Query

### Find Many con Filtros
```typescript
const prompts = await db.prompt.findMany({
  where: {
    status: 'published',
    category: categoryParam,
    OR: [
      { title: { contains: search } },
      { description: { contains: search } },
    ],
  },
  include: {
    User_Prompt_authorIdToUser: {
      select: { id: true, name: true, email: true },
    },
  },
  orderBy: [
    { isFavorite: 'desc' },
    { updatedAt: 'desc' },
  ],
});
```

### Find Unique
```typescript
const prompt = await db.prompt.findUnique({
  where: { id },
  include: {
    User_Prompt_authorIdToUser: true,
    PromptVersion: true,
  },
});

if (!prompt) {
  return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
}
```

### Create
```typescript
import { randomUUID } from 'crypto';

const prompt = await db.prompt.create({
  data: {
    id: randomUUID(),
    title: data.title,
    body: data.body,
    authorId: user.id,
    updatedAt: new Date(),
  },
  include: {
    User_Prompt_authorIdToUser: {
      select: { id: true, name: true },
    },
  },
});
```

### Update
```typescript
const updated = await db.prompt.update({
  where: { id },
  data: {
    title: data.title,
    updatedAt: new Date(),
  },
});
```

### Delete
```typescript
await db.prompt.delete({
  where: { id },
});
```

### Transaction
```typescript
const [prompt, auditLog] = await db.$transaction([
  db.prompt.create({ data: promptData }),
  db.auditLog.create({ data: logData }),
]);
```

### Count + FindMany (Parallel)
```typescript
const [items, total] = await Promise.all([
  db.prompt.findMany({ where, skip, take: limit }),
  db.prompt.count({ where }),
]);
```

## Relaciones

### Navegar Relaciones
```typescript
// En schema: Prompt tiene authorId → User
// En query:
include: {
  User_Prompt_authorIdToUser: {
    select: { id: true, name: true, email: true },
  },
}

// Acceder:
const authorName = prompt.User_Prompt_authorIdToUser.name;
```

### Campos JSON
```typescript
// Guardar como string JSON
tags: JSON.stringify(data.tags),

// Leer y parsear
const tags = JSON.parse(prompt.tags);
```

## Índices

Los índices mejoran queries frecuentes:
```prisma
@@index([status])           // Filtro por status
@@index([category, status]) // Filtro combinado
@@index([authorId])         // Por autor
@@index([updatedAt])        // Ordenamiento
```

## Migraciones

```bash
# Desarrollo: sincronizar sin migración
bunx prisma db push

# Producción: crear migración
bunx prisma migrate dev --name nombre_migracion

# Regenerar cliente después de cambios
bunx prisma generate
```

## Convenciones

1. **IDs**: Usar `randomUUID()` para generar IDs
2. **Timestamps**: Siempre actualizar `updatedAt` en updates
3. **JSON**: Serializar arrays/objetos con `JSON.stringify()`
4. **Soft Delete**: Considerar `deletedAt` en lugar de delete físico
5. **Relaciones**: Usar `include` con `select` para limitar campos

## Errores Comunes

### P2025 - Record not found
```typescript
try {
  const prompt = await db.prompt.delete({ where: { id } });
} catch (error) {
  if (error.code === 'P2025') {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
  throw error;
}
```

### P2002 - Unique constraint
```typescript
if (error.code === 'P2002') {
  return NextResponse.json(
    { error: 'Ya existe un registro con este valor' },
    { status: 409 }
  );
}
```
