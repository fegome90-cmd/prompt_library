# Review de Código

Ejecuta code review usando el skill cm-review.

## Uso

```
/review [archivos]
```

## Descripción

Realiza una revisión rápida del código modificado o de archivos específicos, verificando:

- Calidad del código
- Seguridad
- Cumplimiento de patrones del proyecto
- Cobertura de tests

## Ejemplos

```bash
# Review de cambios recientes
/review

# Review de archivos específicos
/review src/lib/auth.ts src/app/api/prompts/route.ts
```

## Implementación

Usa el skill `cm-review` para realizar la revisión.
