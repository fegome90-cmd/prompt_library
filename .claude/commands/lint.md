# Lint y Type Check

Ejecuta ESLint y TypeScript type checking.

## Uso

```
/lint [tipo]
```

## Tipos Disponibles

- `eslint` o vacío - Solo ESLint
- `types` - Solo type checking
- `all` - Ambos (default)

## Ejemplos

```bash
# Ejecutar todo
/lint

# Solo ESLint
/lint eslint

# Solo type checking
/lint types
```

## Comandos

```bash
# ESLint
bun run lint

# TypeScript type checking
bunx tsc --noEmit

# Ambos
bun run lint && bunx tsc --noEmit
```
