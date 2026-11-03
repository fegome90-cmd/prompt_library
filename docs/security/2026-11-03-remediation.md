# Remediación de seguridad — Prompt Library (2026-11-03)

Estado: correcciones propuestas en PR; no equivalen a una certificación de seguridad ni a remediación de datos históricos.

## Hallazgos, causa y mitigación

| Riesgo | Causa observada | Corrección propuesta |
|---|---|---|
| Bases SQLite publicadas | `db/custom.db` y `prisma/dev.db` versionados con usuarios, correos, hashes y registros | Dejar de versionarlas; excluir SQLite y añadir guard de CI |
| Credenciales de inicialización compartidas | Contraseña administrativa fija en un script y documentación | `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` obligatorios; sin valores fijos |
| Endpoint de inicialización por HTTP | `GET /api/seed` con bypass vía encabezado E2E y acceso inseguro en desarrollo | Eliminar la ruta y sembrar datos sólo por CLI en tests locales |
| Secreto predecible para sesiones | Fallback fijo si falta `NEXTAUTH_SECRET` | Eliminar fallback; NextAuth v4 debe fallar cerrado sin secreto en producción |
| Creación involuntaria de propietario | `GET /api/user` creaba un usuario `owner` sin autenticación | Responder únicamente datos seguros del usuario de la sesión; 401 sin sesión |
| Mutaciones sin autorización | Publicar y deprecar prompts sin sesión/roles | Autenticar y comprobar rol y asignación; auditoría con identidad de la sesión |
| Suplantación en auditoría y feedback | `userId` y `reviewerId` confiados desde JSON enviado por el cliente | Derivar IDs del usuario autenticado y rechazar suplantación en feedback |
| Filtración de drafts e historial | Enumeración de estados privados, versiones e historial sin control de acceso | Restringir según sesión y autor/revisor; no exponer correos en lecturas públicas |
| Persistencia innecesaria de variables | `variablesUsed` almacenaba los valores proporcionados por usuarios | Registrar sólo nombres de variables nuevas (los datos antiguos requieren saneamiento) |
| Registro indiscriminado | Signup expuesto sin habilitación ni límite | Desactivado por defecto, opt-in explícito con rate limiting |
| Información técnica en health check | La respuesta pública mostraba detalles internos de errores | Respuestas genéricas al cliente, detalles sólo en logs |

## Operación y compatibilidad

1. En entornos desplegados, configurar un secreto **único y aleatorio** para `NEXTAUTH_SECRET` mediante el gestor de secretos de la plataforma. Ejemplo de generación local: `openssl rand -base64 32`. No agregarlo a Git.
2. Habilitar creación pública de cuentas sólo si es realmente necesaria: `ENABLE_PUBLIC_SIGNUP=true`. Por defecto el endpoint devuelve 403.
3. Provisionar un administrador con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` (mínimo 16 caracteres) usando el script local `bun run scripts/seed.ts`; nunca mediante `GET /api/seed`. El script rota la contraseña del usuario objetivo cuando se ejecuta de nuevo.
4. En producción, una ejecución intencional del script requiere `ALLOW_PRODUCTION_SEED=true` **además** de credenciales explícitas. No dejar esa variable habilitada después de usarla.
5. Las operaciones publicar/deprecar y la lectura de historiales pasan a requerir sesión. Los integradores externos deben autenticarse; una llamada anónima puede recibir 401/403.
6. Las rutas de lectura pública exponen sólo prompts publicados. Los borradores requieren usuario autorizado, y su historial de versiones no se expone anónimamente.
7. Ejecutar CI completo y pruebas de contrato de API; verificar secretos y reglas de red del despliegue real antes de producción.

## Pendiente fuera del alcance del pull request

**Eliminación del historial:** borrar archivos en el HEAD no borra versiones pasadas de Git ni copias en forks, cachés o clones. Debe evaluarse `git-filter-repo --sensitive-data-removal` con respaldo previo, coordinación con colaboradores y eventual soporte de GitHub. NO intentar una reescritura de historial mediante un PR normal.

**Rotación:** suponer comprometidas las contraseñas compartidas o cuyos hashes estuvieron expuestos; identificar cuentas afectadas y rotar o deshabilitar sus credenciales en las bases de datos activas. Revisar sesiones existentes, `NEXTAUTH_SECRET` real y cualquier token legítimo. Ningún commit de código realiza esa rotación de forma remota.

**Retención preexistente:** revisar filas históricas de `PromptUsage.variablesUsed` (antes se guardaban valores), `AuditLog.details` y prompts creados en desarrollo para determinar si hay datos personales. El nuevo código evita nuevas capturas de valores, pero no anonimiza registros ya existentes.

**Limitación de rate limiting:** el limitador actual utiliza estado en memoria por proceso y direcciones IP derivadas de cabeceras HTTP; no es una defensa suficiente frente a ataques distribuidos o proxies no confiables. Para producción con múltiples instancias, integrar límites en un almacenamiento compartido y una estrategia de proxies confiables.

**Auditoría post-merge:** revalidar acceso público a endpoints desde fuera del entorno y desplegar una versión actualizada. El cambio en GitHub no modifica servidores activos por sí solo.

Referencias:
- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
- https://next-auth.js.org/configuration/options#secret
