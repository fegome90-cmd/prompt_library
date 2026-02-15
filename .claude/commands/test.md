# Ejecutar Tests

Ejecuta la suite de tests con Vitest.

## Uso

```
/test [opciones]
```

## Opciones Disponibles

- `--run` - Ejecutar una sola vez (sin watch mode)
- `--coverage` - Generar reporte de cobertura
- `[archivo]` - Ejecutar tests de un archivo específico

## Ejemplos

```bash
# Ejecutar todos los tests en watch mode
/test

# Ejecutar tests una vez
/test --run

# Ejecutar con cobertura
/test --coverage

# Tests de un archivo específico
/test src/__tests__/api/prompts.test.ts
```

## Implementación

1. Si hay argumentos adicionales, pasarlos a `bun run test`
2. Si no hay argumentos, ejecutar `bun run test` en modo interactivo

---

**Comando a ejecutar:**
```bash
bun run test $ARGUMENTS
```
