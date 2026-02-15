#!/bin/bash
# PostToolUse Hook - Auto-lint after editing TypeScript files
# Se ejecuta después de Edit/Write en archivos .ts o .tsx

# Solo ejecutar si el archivo editado es TypeScript
if [[ "$CLAUDE_FILE_PATH" == *.ts ]] || [[ "$CLAUDE_FILE_PATH" == *.tsx ]]; then
    echo "🔍 Ejecutando lint en $CLAUDE_FILE_PATH..."

    # Ejecutar ESLint solo en el archivo modificado
    bun run lint "$CLAUDE_FILE_PATH" 2>&1 | head -20

    # Type check rápido (solo errores, sin warnings)
    bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -10
fi
