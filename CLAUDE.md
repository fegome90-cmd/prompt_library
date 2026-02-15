# Prompt Library

> Sistema de gestión de prompts de IA con autenticación, versionado y feedback.

## Quick Start

```bash
bun run dev           # Desarrollo (puerto 3000)
bun run test:run      # Ejecutar tests
bun run lint          # Lint + typecheck
bun run db:push       # Sincronizar DB
```

## Arquitectura

```
┌─────────────────────────────────────────┐
│           Next.js 16 App Router          │
├─────────────────────────────────────────┤
│  src/app/api/     # REST endpoints       │
│  src/lib/         # Auth, DB, validators │
│  src/components/  # UI + domain          │
├─────────────────────────────────────────┤
│  Prisma ORM → SQLite (dev) / PG (prod)  │
└─────────────────────────────────────────┘
```

**Stack:** Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, Prisma, NextAuth.js, Vitest, Bun

## Patrones Clave

- **API Routes**: NextRequest/NextResponse, validación Zod, rate limiting, auth con `getUserWithDevFallback()`
- **Prisma**: Singleton `db` de `@/lib/db`, filtro `status: 'published'` por defecto
- **React**: shadcn/ui base, React Hook Form + Zod, TanStack Query, Zustand
- **Seguridad**: NextAuth.js + bcrypt, PII detection, audit log

## Estructura

```
src/
├── app/api/          # REST: prompts, categories, stats, auth
├── lib/              # db.ts, auth.ts, validators/, rate-limit.ts
├── components/ui/    # shadcn/ui
└── __tests__/        # Mirror de src/
```

## Setup

```bash
bun install
cp .env.example .env           # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
bun run db:generate && bun run db:push
chmod +x .claude/hooks/*.sh
```

## Referencias

- `prisma/schema.prisma` - Modelos completos (Prompt, User, AuditLog, etc.)
- `.claude/skills/nextjs-patterns.md` - Patrones Next.js 16
- `.claude/skills/prisma-patterns.md` - Patrones Prisma ORM
- `.claude/skills/prompt-domain.md` - Lógica de negocio
- `.claude/commands/` - Comandos: /test, /lint, /db, /review
