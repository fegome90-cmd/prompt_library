# 🚀 Prompt Library

> Sistema de gestión de prompts de IA con autenticación, versionado y feedback.

Una solución moderna y robusta para centralizar, iterar y gobernar los prompts de IA en entornos corporativos, construida con las últimas tecnologías del ecosistema Next.js.

## 📊 Estado del Proyecto

Actualmente en fase avanzada de desarrollo:

- **Work Orders:** 12 completadas / 15 totales (80%).
- **Prioridades Críticas (P0/P1/P2):** 100% completadas.
- **Calidad:** 100% Type-safe y con tests de unidad funcionales.

## ✨ Características Principales

### 🎯 Gestión de Prompts

- **Editor Full-featured:** Soporte para variables `{nombre}`, Markdown y previsualización.
- **Versionado:** Historial completo de cambios por prompt.
- **Metadatos:** Clasificación por categorías, tags y niveles de riesgo.

### 🛡️ Gobernanza y Seguridad

- **Roles:** Sistema basado en roles (Admin/User).
- **Audit Logs:** Registro detallado de todas las acciones sobre los prompts.
- **Rate Limiting:** Protección de endpoints críticos.
- **Filtros de Seguridad:** Detección de PII y niveles de riesgo de datos.

### 🔄 Feedback e Interacción

- **Métricas de Uso:** Contador de ejecuciones y favoritos.
- **Feedback:** Sistema de Thumbs Up/Down y comentarios por uso.
- **Discovery:** Búsqueda avanzada y filtrado por categorías.

## 🏗️ Arquitectura y Stack

El proyecto sigue una arquitectura limpia orientada al dominio (**Domain → Application → Infrastructure**).

### 🛠️ Technology Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Runtime:** [Bun](https://bun.sh/)
- **Lenguaje:** [TypeScript 5](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Base de Datos:** [Prisma ORM](https://www.prisma.io/) (SQLite/PostgreSQL)
- **Auth:** [NextAuth.js](https://next-auth.js.org/)
- **Testing:** [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/)

### 📐 Estructura de Capas

```text
┌─────────────────────────────────────────┐
│           Next.js 16 App Router          │
├─────────────────────────────────────────┤
│  src/app/api/     # REST endpoints       │
│  src/lib/         # Auth, DB, validators │
│  src/components/  # UI + domain layers   │
├─────────────────────────────────────────┤
│  Prisma ORM → SQLite (dev) / PG (prod)  │
└─────────────────────────────────────────┘
```

## 🚀 Inicio Rápido

### 1. Clonar e Instalar

```bash
bun install
```

### 2. Configurar Entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp .env.example .env
```

> [!IMPORTANT]
> Asegúrate de configurar `NEXTAUTH_SECRET` y `DATABASE_URL` para el correcto funcionamiento.

### 3. Preparar Base de Datos

```bash
bun run db:push    # Sincroniza el schema con la DB local
bun run db:generate # Genera el cliente de Prisma
```

### 4. Lanzar Desarrollo

```bash
bun run dev
```

## 🛠️ Comandos de Desarrollo

| Comando | Descripción |
| :--- | :--- |
| `bun run dev` | Inicia el servidor de desarrollo en puerto 3000 |
| `bun run lint` | Ejecuta ESLint y Typecheck |
| `bun run test:run` | Ejecuta la suite de tests unitarios (Vitest) |
| `bun run test:e2e` | Ejecuta tests end-to-end (Playwright) |
| `bun run build` | Genera el build optimizado para producción |
| `bun run db:migrate` | Crea una nueva migración de Prisma |

## 📁 Estructura del Directorio

```bash
src/
├── app/          # Rutas, API y layouts (Next.js App Router)
├── components/   # Componentes React (UI y Lógica de Negocio)
├── lib/          # Utilidades core (Auth, DB, Validation, Rate Limit)
├── services/     # Lógica de servicios y orquestación
├── types/        # Definiciones de tipos globales
└── __tests__/    # Suite de pruebas automatizadas
```

---
