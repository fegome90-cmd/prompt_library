#!/bin/bash
# PostToolUse Hook - Recordar prisma generate después de editar schema
# Se ejecuta después de Edit en prisma/schema.prisma

if [[ "$CLAUDE_FILE_PATH" == *"prisma/schema.prisma" ]]; then
    echo ""
    echo "⚠️  Schema de Prisma modificado. Recuerda ejecutar:"
    echo ""
    echo "    bun run db:generate    # Para regenerar el cliente"
    echo "    bun run db:push        # Para sincronizar con la DB (dev)"
    echo "    bun run db:migrate     # Para crear migración (prod)"
    echo ""
fi
