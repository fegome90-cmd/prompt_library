# Operaciones de Base de Datos

Ejecuta operaciones de Prisma ORM.

## Uso

```
/db <operación>
```

## Operaciones Disponibles

| Operación | Descripción |
|-----------|-------------|
| `generate` | Generar Prisma Client |
| `push` | Sincronizar schema con DB (sin migraciones) |
| `migrate` | Crear y aplicar migración |
| `reset` | Resetear DB y ejecutar seed |
| `studio` | Abrir Prisma Studio |
| `status` | Ver estado de migraciones |

## Ejemplos

```bash
# Generar cliente después de cambiar schema
/db generate

# Sincronizar schema (desarrollo rápido)
/db push

# Crear migración nombrada
/db migrate

# Resetear todo
/db reset

# Explorar datos visualmente
/db studio
```

## Comandos Prisma

```bash
bunx prisma generate      # generate
bunx prisma db push       # push
bunx prisma migrate dev   # migrate
bunx prisma migrate reset # reset
bunx prisma studio        # studio
bunx prisma migrate status# status
```
