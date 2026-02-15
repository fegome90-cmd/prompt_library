# Prompt Manager - Informe del Proyecto

**Fecha:** Febrero 2025  
**Versión:** 1.0.0-dev  
**Framework:** Next.js 16 con App Router

---

## 📊 Resumen Ejecutivo

**Prompt Manager** es una aplicación web completa para gestionar, organizar y utilizar prompts de IA de manera eficiente. Incluye autenticación, control de roles, rate limiting, y una biblioteca de 30 prompts profesionales curados.

| Métrica | Valor |
|---------|-------|
| Archivos TypeScript | 84 |
| Componentes React | 54 |
| API Endpoints | 12 |
| Modelos de Base de Datos | 9 |
| Prompts Curados | 30 |
| Categorías | 11 |

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Lenguaje** | TypeScript 5 |
| **Base de Datos** | SQLite + Prisma ORM |
| **Autenticación** | NextAuth.js v4 |
| **Estado Global** | Zustand |
| **UI Components** | shadcn/ui (Radix) |
| **Estilos** | Tailwind CSS 4 |
| **Iconos** | Lucide React |
| **Animaciones** | Framer Motion |

### Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (12 endpoints)
│   │   ├── auth/          # NextAuth.js
│   │   ├── prompts/       # CRUD de prompts
│   │   ├── categories/    # Gestión de categorías
│   │   ├── stats/         # Estadísticas
│   │   ├── user/          # Usuario actual
│   │   └── seed/          # Poblado de BD
│   ├── auth/              # Páginas de autenticación
│   │   ├── signin/        # Login
│   │   └── error/         # Errores de auth
│   └── page.tsx           # Página principal
├── components/
│   ├── ui/                # 54 componentes shadcn/ui
│   ├── prompt-manager/    # Componentes específicos
│   └── providers/         # Context providers
├── lib/
│   ├── db.ts              # Prisma client singleton
│   ├── auth.ts            # NextAuth config
│   ├── auth-utils.ts      # Utilidades de auth
│   ├── rate-limit.ts      # Rate limiting
│   ├── store.ts           # Zustand store
│   ├── validators/        # Zod schemas
│   └── prompt-utils.ts    # Utilidades de prompts
├── types/                 # TypeScript types
└── prisma/
    └── schema.prisma      # 9 modelos
```

---

## 🗄️ Modelo de Datos

### Entidades Principales

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│   Prompt    │>────│  Category   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ email       │     │ title       │     │ name        │
│ name        │     │ description │     │ description │
│ role        │     │ body        │     │ color       │
│ image       │     │ category    │     │ icon        │
│ emailVerified│    │ tags        │     │ order       │
└─────────────┘     │ variables   │     └─────────────┘
      │             │ status      │
      │             │ version     │
      ▼             │ riskLevel   │
┌─────────────┐     │ useCount    │
│ AuditLog    │     │ isFavorite  │
├─────────────┤     └─────────────┘
│ id          │           │
│ action      │           ▼
│ details     │     ┌─────────────┐
│ createdAt   │     │PromptVersion│
└─────────────┘     ├─────────────┤
                    │ version     │
                    │ body        │
                    │ changelog   │
                    └─────────────┘
```

### Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **owner** | Acceso total, puede eliminar prompts |
| **editor** | Puede modificar todos los prompts |
| **reviewer** | Puede modificar prompts asignados |
| **user** | Solo puede modificar sus propios prompts |

---

## 🔐 Seguridad

### Autenticación
- **Provider:** Credentials (email)
- **Estrategia:** JWT (compatible con SQLite)
- **Sesiones:** 30 días de duración
- **Fallback dev:** Usa primer usuario si no hay sesión

### Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| POST /prompts | 30 requests | 1 minuto |
| PUT /prompts/:id | 30 requests | 1 minuto |
| DELETE /prompts/:id | 10 requests | 1 minuto |

### Headers de Seguridad
- `Retry-After`: Segundos hasta reset
- `X-RateLimit-Remaining`: Requests restantes
- `X-RateLimit-Reset`: Timestamp de reset

---

## 📚 Biblioteca de Prompts

### Distribución por Categoría

| Categoría | Prompts | Descripción |
|-----------|---------|-------------|
| **Operaciones** | 7 | Minutas, SOPs, action items, planes |
| **Investigación** | 7 | Research, fact-check, matrices, insights |
| **Chatbots** | 6 | Optimización, testing, evaluación de prompts |
| **Imágenes** | 4 | Generación de imágenes, negative prompts |
| **Comunicaciones** | 4 | Emails, respuestas, asuntos |
| **Ventas** | 2 | Prospecting, objection handling |

### Características de los Prompts

- **Variables dinámicas:** Cada prompt tiene 2-6 campos de input
- **Tipos de input:** text, textarea, select
- **Metadatos:** tags, risk level, versión, uso count
- **Versionado:** Historial de cambios automático

### Ejemplo de Prompt Completo

```markdown
Title: Reescritura de email por objetivo
Category: Comunicaciones
Variables:
  - email_original (textarea)
  - objetivo (select: Más claro, Más corto, Más firme, etc.)

Body:
Reescribe el siguiente email ajustándolo al objetivo indicado.

EMAIL ORIGINAL:
{email_original}

OBJETIVO DE LA REESCRITURA:
{objetivo}

INSTRUCCIONES:
1. Identifica el mensaje principal y los puntos clave
2. Ajusta el tono según el objetivo
...
```

---

## 🔌 API Reference

### Prompts

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/prompts` | Listar prompts (con filtros y paginación) |
| `POST` | `/api/prompts` | Crear nuevo prompt |
| `GET` | `/api/prompts/:id` | Obtener prompt específico |
| `PUT` | `/api/prompts/:id` | Actualizar prompt |
| `DELETE` | `/api/prompts/:id` | Soft delete (deprecated) |
| `POST` | `/api/prompts/:id/publish` | Publicar prompt |
| `POST` | `/api/prompts/:id/deprecate` | Deprecar prompt |
| `POST` | `/api/prompts/:id/feedback` | Enviar feedback |
| `GET` | `/api/prompts/:id/versions` | Ver historial |

### Otros

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/categories` | Listar categorías |
| `GET` | `/api/stats` | Estadísticas del sistema |
| `GET` | `/api/user` | Usuario actual |
| `GET` | `/api/seed` | Poblar base de datos |

### Query Parameters

```
GET /api/prompts?status=published&category=Ventas&search=prospect&page=1&limit=20
```

---

## 🎨 UI/UX

### Componentes Principales

1. **PromptCard** - Tarjeta de prompt para grid
2. **PromptComposer** - Modal para usar prompts
3. **PromptEditor** - Editor de prompts
4. **FloatingSidebar** - Acceso rápido
5. **StatsDashboard** - Dashboard de estadísticas
6. **SecurityBanner** - Banner de seguridad PII

### Temas
- **Light/Dark mode** via next-themes
- **CSS Variables** para personalización
- **Responsive** - Mobile-first design

### Atajos de Teclado
- `Ctrl + Shift + P` - Abrir panel rápido

---

## 📈 Estado del Proyecto

### ✅ Completado

| Feature | Estado |
|---------|--------|
| CRUD de Prompts | ✅ |
| Autenticación NextAuth | ✅ |
| Control de roles | ✅ |
| Rate limiting | ✅ |
| 30 prompts curados | ✅ |
| Versionado de prompts | ✅ |
| Sistema de auditoría | ✅ |
| UI responsive | ✅ |
| Dark mode | ✅ |
| Búsqueda y filtros | ✅ |
| Paginación | ✅ |
| Soft delete | ✅ |

### ⚠️ Mejoras Futuras

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| Password con bcrypt | Alta | Verificación real de contraseñas |
| Redis rate limiting | Media | Para multi-instancia |
| OAuth providers | Media | Google, GitHub login |
| Export/Import | Baja | JSON, CSV |
| AI integration | Baja | Generación automática |

---

## 🚀 Cómo Ejecutar

```bash
# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push

# Poblar con datos de prueba
bun run scripts/seed.ts

# Iniciar desarrollo
bun run dev

# Verificar código
bun run lint
```

### Variables de Entorno

```env
DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## 📝 Notas de Desarrollo

### WOs Completados

1. **WO-0001**: Ownership validation en API
2. **WO-0002**: Regresión en hidratación
3. **WO-0003**: Validación de status
4. **WO-0004**: Formato de respuesta consistente
5. **WO-0005**: Validación Zod en endpoints
6. **WO-0006**: PII detection
7. **WO-0007**: Auditoría de seguridad
8. **WO-0008**: Paginación opcional
9. **WO-0009**: Fix de version parsing

### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/lib/db.ts` | Singleton PrismaClient |
| `src/lib/auth.ts` | Config NextAuth |
| `src/lib/auth-utils.ts` | Utilidades de permisos |
| `src/lib/rate-limit.ts` | Rate limiting in-memory |
| `src/lib/store.ts` | Estado global Zustand |
| `scripts/seed.ts` | Datos iniciales |

---

## 👥 Usuario por Defecto

```
Email: admin@empresa.com
Rol: owner
```

En desarrollo, cualquier email existente puede iniciar sesión sin contraseña.

---

*Generado automáticamente - Prompt Manager v1.0.0*
