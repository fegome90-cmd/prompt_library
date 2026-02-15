# Next.js 16 + App Router Patterns

> Patrones y convenciones para desarrollo con Next.js 16 App Router en este proyecto.

## Estructura de API Routes

### Ubicación
```
src/app/api/
├── route.ts              # /api
├── auth/
│   └── [...nextauth]/route.ts  # /api/auth/*
├── prompts/
│   ├── route.ts          # GET /api/prompts, POST /api/prompts
│   └── [id]/
│       ├── route.ts      # GET/PUT/DELETE /api/prompts/:id
│       ├── publish/route.ts   # POST /api/prompts/:id/publish
│       ├── deprecate/route.ts # POST /api/prompts/:id/deprecate
│       ├── feedback/route.ts  # POST /api/prompts/:id/feedback
│       └── versions/route.ts  # GET /api/prompts/:id/versions
```

### Patrón de Route Handler

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserWithDevFallback } from '@/lib/auth-utils';
import { createErrorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 1. Parse query params
    const { searchParams } = new URL(request.url);
    const param = searchParams.get('param');

    // 2. Query database
    const result = await db.model.findMany({
      where: { ... },
      include: { ... },
    });

    // 3. Return JSON response
    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(error, 'Mensaje de error');
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const user = await getUserWithDevFallback();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();

    // 3. Validación
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    // 4. Operación
    const result = await db.model.create({
      data: validation.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(error, 'Mensaje de error');
  }
}
```

## Dynamic Routes

### Parámetros de URL
```typescript
// app/api/prompts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // ...
}
```

### Catch-all Routes
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## Server vs Client Components

### Server Components (default)
- Renderizados en el servidor
- Sin interactividad del cliente
- Acceso directo a DB

```typescript
// app/prompts/page.tsx (Server Component)
import { db } from '@/lib/db';

export default async function PromptsPage() {
  const prompts = await db.prompt.findMany();
  return <PromptList prompts={prompts} />;
}
```

### Client Components
- Use `'use client'` directive
- Para interactividad, hooks, events

```typescript
// components/PromptList.tsx
'use client';

import { useState } from 'react';

export function PromptList({ prompts }) {
  const [selected, setSelected] = useState(null);
  // ...
}
```

## Middleware

El proyecto no usa middleware de Next.js actualmente. La autenticación se maneja con NextAuth.js en cada API route.

## Metadata y SEO

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prompt Library',
  description: 'Gestor de prompts de IA',
};
```

## Error Handling

### API Errors
```typescript
import { createErrorResponse } from '@/lib/api-utils';

// En catch block
return createErrorResponse(error, 'Error descriptivo');
```

### Not Found
```typescript
import { notFound } from 'next/navigation';

if (!prompt) {
  notFound(); // Renderiza not-found.tsx
}
```

## Paginación

```typescript
// Con query params
const page = parseInt(searchParams.get('page') || '1');
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  db.model.findMany({ skip, take: limit }),
  db.model.count(),
]);

return NextResponse.json({
  data: items,
  total,
  page,
  limit,
  hasMore: skip + items.length < total,
});
```

## Rate Limiting

```typescript
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_PRESETS,
  createRateLimitResponse,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, RATE_LIMIT_PRESETS.standard);

  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit) as NextResponse;
  }
  // ...
}
```
