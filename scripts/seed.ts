import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Password hashing configuration
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Iniciando semilla...');

  // Require explicit seed credentials; never ship a shared default password.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Production seeding requires explicit ALLOW_PRODUCTION_SEED=true.');
  }
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL;
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedAdminEmail || !seedAdminPassword || seedAdminPassword.length < 16) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (16+ characters) before seeding.');
  }
  const hashedPassword = await bcrypt.hash(seedAdminPassword, SALT_ROUNDS);
  
  const user = await prisma.user.upsert({
    where: { email: seedAdminEmail },
    update: { password: hashedPassword },
    create: {
      id: randomUUID(),
      email: seedAdminEmail,
      name: 'Administrador',
      role: 'owner',
      password: hashedPassword,
      updatedAt: new Date(),
    },
  });
  console.log('✅ Usuario administrador inicializado');

  // Crear categorías
  const categories = [
    { name: 'General', description: 'Prompts genéricos para mejorar respuestas de IA', color: '#EC4899', icon: 'Sparkles', order: 0 },
    { name: 'RRHH', description: 'Recursos Humanos', color: '#10B981', icon: 'Users', order: 1 },
    { name: 'Compras', description: 'Proveedores y adquisiciones', color: '#F59E0B', icon: 'ShoppingCart', order: 2 },
    { name: 'Legal', description: 'Documentos legales', color: '#EF4444', icon: 'Scale', order: 3 },
    { name: 'Comunicaciones', description: 'Correos y comunicaciones', color: '#3B82F6', icon: 'Mail', order: 4 },
    { name: 'Operaciones', description: 'Procesos operativos', color: '#8B5CF6', icon: 'Settings', order: 5 },
    { name: 'Finanzas', description: 'Reportes y análisis financiero', color: '#06B6D4', icon: 'DollarSign', order: 6 },
    { name: 'Investigación', description: 'Research y análisis de información', color: '#14B8A6', icon: 'Search', order: 7 },
    { name: 'Chatbots', description: 'Optimización de respuestas de IA', color: '#8B5CF6', icon: 'Bot', order: 8 },
    { name: 'Imágenes', description: 'Generación de imágenes con IA', color: '#F43F5E', icon: 'Image', order: 9 },
    { name: 'Ventas', description: 'GTM y ventas', color: '#0EA5E9', icon: 'TrendingUp', order: 10 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        id: randomUUID(),
        updatedAt: new Date(),
        ...cat,
      },
    });
  }
  console.log('✅ Categorías creadas:', categories.length);

  // Verificar si ya hay prompts
  const existingPrompts = await prisma.prompt.count();
  if (existingPrompts > 0) {
    console.log('ℹ️ Ya existen', existingPrompts, 'prompts. Saltando creación.');
    return;
  }

  // Crear prompts - versión simplificada para evitar errores
  const prompts = [
    // OFICINA / PRODUCTIVIDAD
    {
      title: 'Reescritura de email por objetivo',
      description: 'Reescribe un email según el objetivo: más claro, más corto, más firme',
      body: `Reescribe el siguiente email ajustándolo al objetivo indicado.

EMAIL ORIGINAL:
{email_original}

OBJETIVO DE LA REESCRITURA:
{objetivo}

INSTRUCCIONES:
1. Identifica el mensaje principal y los puntos clave
2. Ajusta el tono según el objetivo
3. Mantén el mensaje central intacto
4. Preserva la información crítica

FORMATO DE SALIDA:
## Email Reescrito
[Email reescrito]

## Cambios Realizados
- [Lista de cambios principales]`,
      category: 'Comunicaciones',
      tags: JSON.stringify(['email', 'reescritura', 'claridad', 'productividad']),
      variablesSchema: JSON.stringify([
        { name: 'email_original', label: 'Email original', type: 'textarea', help: 'Pega el email que quieres reescribir', required: true },
        { name: 'objetivo', label: 'Objetivo', type: 'select', help: 'Qué quieres lograr', options: ['Más claro', 'Más corto', 'Más firme', 'Más suave', 'Más profesional'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Responder email con contexto y tono',
      description: 'Genera respuestas profesionales con el tono adecuado',
      body: `Redacta una respuesta para el siguiente email.

EMAIL RECIBIDO:
{email_recibido}

CONTEXTO ADICIONAL:
{contexto}

TONO DESEADO:
{tono}

PUNTOS A INCLUIR:
{puntos}

INSTRUCCIONES:
1. Analiza el email recibido
2. Usa el tono especificado
3. Incluye TODOS los puntos indicados
4. Estructura: agradecimiento → respuesta → cierre`,
      category: 'Comunicaciones',
      tags: JSON.stringify(['email', 'respuesta', 'profesional', 'tono']),
      variablesSchema: JSON.stringify([
        { name: 'email_recibido', label: 'Email recibido', type: 'textarea', help: 'El email al que quieres responder', required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Información adicional', required: false },
        { name: 'tono', label: 'Tono', type: 'select', help: 'Estilo de la respuesta', options: ['Profesional y cálido', 'Formal', 'Directo', 'Amable', 'Firme'], required: true },
        { name: 'puntos', label: 'Puntos a incluir', type: 'textarea', help: 'Qué debes mencionar', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Asunto perfecto + alternativas',
      description: 'Genera líneas de asunto efectivas para emails',
      body: `Crea opciones de asunto para el siguiente email.

CONTENIDO DEL EMAIL:
{contenido}

PROPÓSITO DEL EMAIL:
{proposito}

INSTRUCCIONES:
1. El asunto debe ser específico
2. Máximo 50 caracteres
3. Incluye acción o beneficio
4. Evita palabras spam

FORMATO DE SALIDA:
## Asunto Recomendado
[El mejor asunto]

## Por qué funciona
[Explicación]

## 3 Alternativas
1. [Opción corta]
2. [Opción con acción]
3. [Opción con beneficio]`,
      category: 'Comunicaciones',
      tags: JSON.stringify(['email', 'asunto', 'subject-line']),
      variablesSchema: JSON.stringify([
        { name: 'contenido', label: 'Contenido', type: 'textarea', help: 'El cuerpo del email', required: true },
        { name: 'proposito', label: 'Propósito', type: 'select', help: 'Qué quieres lograr', options: ['Pedir información', 'Solicitar reunión', 'Confirmar', 'Dar noticia', 'Seguimiento', 'Pedir aprobación'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Email difícil (decir no / pedir / escalar)',
      description: 'Redacta emails delicados con profesionalismo',
      body: `Redacta un email para una situación delicada.

TIPO DE SITUACIÓN:
{tipo_situacion}

CONTEXTO:
{contexto}

QUÉ NECESITAS LOGRAR:
{objetivo}

RELACIÓN CON EL DESTINATARIO:
{relacion}

INSTRUCCIONES:
1. Empieza reconociendo la situación
2. Sé directo pero no abrupto
3. Explica el por qué
4. Ofrece alternativas cuando sea posible
5. Termina con próximos pasos claros`,
      category: 'Comunicaciones',
      tags: JSON.stringify(['email', 'difícil', 'conflicto']),
      variablesSchema: JSON.stringify([
        { name: 'tipo_situacion', label: 'Tipo de situación', type: 'select', help: 'Qué tipo de email', options: ['Decir que no', 'Pedir algo sensible', 'Escalar problema', 'Dar malas noticias', 'Rechazar oferta'], required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Describe la situación', required: true },
        { name: 'objetivo', label: 'Objetivo', type: 'textarea', help: 'Qué quieres lograr', required: true },
        { name: 'relacion', label: 'Relación', type: 'text', help: 'Con quién hablas', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Convertir texto en minuta',
      description: 'Transforma notas en minutas con decisiones y acciones',
      body: `Convierte las siguientes notas en una minuta profesional.

NOTAS DE LA REUNIÓN:
{notas}

FECHA:
{fecha}

PARTICIPANTES:
{participantes}

INSTRUCCIONES:
1. Estructura la información
2. Identifica decisiones
3. Extrae acciones con responsables
4. Usa lenguaje objetivo

FORMATO DE SALIDA:
# MINUTA DE REUNIÓN

## Información General
- Fecha: [fecha]
- Participantes: [lista]

## Temas Tratados
- [temas]

## Decisiones Tomadas
- [decisiones]

## Acciones Pendientes
| Acción | Responsable | Fecha |
|--------|-------------|-------|`,
      category: 'Operaciones',
      tags: JSON.stringify(['minuta', 'reunión', 'documentación']),
      variablesSchema: JSON.stringify([
        { name: 'notas', label: 'Notas', type: 'textarea', help: 'Tus notas de la reunión', required: true },
        { name: 'fecha', label: 'Fecha', type: 'text', help: 'Fecha de la reunión', required: true },
        { name: 'participantes', label: 'Participantes', type: 'text', help: 'Quienes asistieron', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Extraer Action Items',
      description: 'Identifica tareas, dueños, fechas y riesgos',
      body: `Extrae todos los action items del siguiente contenido.

CONTENIDO:
{contenido}

CONTEXTO:
{contexto}

INSTRUCCIONES:
1. Identifica CADA tarea
2. Asigna responsable si está mencionado
3. Extrae fechas límite
4. Evalúa riesgo
5. Prioriza por urgencia

FORMATO DE SALIDA:
## Action Items

| # | Tarea | Responsable | Fecha | Prioridad | Riesgo |
|---|-------|-------------|-------|-----------|--------|

## Análisis de Riesgos
[Identificar tareas riesgosas]

## Resumen
- Total tareas: X
- Con fecha: Y
- Alta prioridad: Z`,
      category: 'Operaciones',
      tags: JSON.stringify(['action-items', 'tareas', 'seguimiento']),
      variablesSchema: JSON.stringify([
        { name: 'contenido', label: 'Contenido', type: 'textarea', help: 'Texto del que extraer tasks', required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Información adicional', required: false },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Resumen ejecutivo 5 bullets',
      description: 'Resume en 5 bullets con implicancias',
      body: `Crea un resumen ejecutivo del siguiente contenido.

CONTENIDO:
{contenido}

AUDIENCIA:
{audiencia}

DECISIÓN ESPERADA:
{decision_esperada}

INSTRUCCIONES:
1. Máximo 5 bullets
2. Cada uno de una línea
3. El último es SIEMPRE "Qué significa"
4. Usa números y datos concretos

FORMATO DE SALIDA:
## Resumen Ejecutivo

• **[Punto 1]**
• **[Punto 2]**
• **[Punto 3]**
• **[Punto 4]**
• **Qué significa:** [Implicancia principal]

**Para decidir:** [Si hay decisión pendiente]`,
      category: 'Operaciones',
      tags: JSON.stringify(['resumen', 'ejecutivo', 'síntesis']),
      variablesSchema: JSON.stringify([
        { name: 'contenido', label: 'Contenido', type: 'textarea', help: 'Documento a resumir', required: true },
        { name: 'audiencia', label: 'Audiencia', type: 'text', help: 'Para quién es', required: true },
        { name: 'decision_esperada', label: 'Decisión esperada', type: 'textarea', help: 'Se espera alguna decisión?', required: false },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Notas a SOP',
      description: 'Transforma notas en procedimientos estructurados',
      body: `Convierte las siguientes notas en un SOP.

NOTAS:
{notas}

NOMBRE DEL PROCESO:
{nombre_proceso}

INSTRUCCIONES:
1. Organiza en pasos secuenciales
2. Cada paso debe ser accionable
3. Incluye criterios de éxito
4. Añade excepciones

FORMATO DE SALIDA:
# SOP: {nombre_proceso}

## Propósito
[Qué logra]

## Materiales
- [lista]

## Procedimiento

### Paso 1: [Título]
**Acción:** [Qué hacer]
**Criterio de éxito:** [Cómo verificar]

### Paso 2: [Título]
...

## Excepciones
| Situación | Acción alternativa |
|-----------|-------------------|`,
      category: 'Operaciones',
      tags: JSON.stringify(['SOP', 'procedimiento', 'documentación']),
      variablesSchema: JSON.stringify([
        { name: 'notas', label: 'Notas', type: 'textarea', help: 'Tus notas del proceso', required: true },
        { name: 'nombre_proceso', label: 'Nombre', type: 'text', help: 'Cómo se llama', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Memo de decisión',
      description: 'Documento para decisiones importantes',
      body: `Crea un memo de decisión.

CONTEXTO:
{contexto}

OPCIONES:
{opciones}

CRITERIOS:
{criterios}

RECOMENDACIÓN:
{recomendacion}

INSTRUCCIONES:
1. Presenta cada opción objetivamente
2. Analiza tradeoffs
3. Muestra el razonamiento
4. Incluye riesgos

FORMATO DE SALIDA:
# MEMO DE DECISIÓN

## Contexto
[Por qué se necesita]

## Opciones

### Opción A
**Ventajas:** ...
**Desventajas:** ...

### Opción B
...

## Análisis de Tradeoffs
| Criterio | Opción A | Opción B |
|----------|----------|----------|

## Recomendación
**Opción:** [X]
**Justificación:** ...

## Próximos Pasos
1. [Acción inmediata]`,
      category: 'Operaciones',
      tags: JSON.stringify(['decisión', 'memo', 'análisis']),
      variablesSchema: JSON.stringify([
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Qué decisión se necesita', required: true },
        { name: 'opciones', label: 'Opciones', type: 'textarea', help: 'Opciones disponibles', required: true },
        { name: 'criterios', label: 'Criterios', type: 'textarea', help: 'Factores importantes', required: true },
        { name: 'recomendacion', label: 'Recomendación', type: 'text', help: 'Tu recomendación', required: false },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Checklist QA para documentos',
      description: 'Verifica consistencia y faltantes',
      body: `Revisa el siguiente documento.

DOCUMENTO:
{documento}

TIPO:
{tipo_documento}

INSTRUCCIONES:
1. Verifica consistencia
2. Identifica faltantes
3. Detecta riesgos
4. Sugiere mejoras

FORMATO DE SALIDA:
# QA Checklist

## ✅ Correcto
- [Lista]

## ⚠️ Problemas Críticos
| Problema | Ubicación | Sugerencia |
|----------|-----------|------------|

## ❓ Faltante
- [Información que falta]

## 🔍 Ambigüedades
- [Frases confusas]

## 📊 Puntuación
| Aspecto | Score |
|---------|-------|
| Claridad | ⭐⭐⭐⭐☆ |
| Completitud | ⭐⭐⭐☆☆ |

**Listo para publicación:** SÍ/NO`,
      category: 'Operaciones',
      tags: JSON.stringify(['QA', 'revisión', 'calidad']),
      variablesSchema: JSON.stringify([
        { name: 'documento', label: 'Documento', type: 'textarea', help: 'Documento a revisar', required: true },
        { name: 'tipo_documento', label: 'Tipo', type: 'select', help: 'Qué tipo es', options: ['Informe', 'Propuesta', 'Contrato', 'Email', 'Presentación', 'Procedimiento'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    // INVESTIGACIÓN
    {
      title: 'Research rápido (15 min)',
      description: 'Investigación express: estado, vacíos, próximos pasos',
      body: `Realiza una investigación rápida.

TEMA:
{tema}

PROFUNDIDAD:
{profundidad}

PROPÓSITO:
{proposito}

INSTRUCCIONES:
1. Estado actual del tema
2. Fuentes clave
3. Vacíos de información
4. Próximos pasos

⚠️ No inventes información

FORMATO DE SALIDA:
# Research Express

## Resumen (2-3 oraciones)
[Lo más importante]

## Estado Actual
- [Hecho 1]
- [Hecho 2]

## Vacíos
- [Qué no sabemos]

## Fuentes Clave
| Fuente | Tipo | Relevancia |

## Próximos Pasos
1. [Acción específica]

**Confianza:** Alto/Medio/Bajo`,
      category: 'Investigación',
      tags: JSON.stringify(['research', 'investigación', 'análisis']),
      variablesSchema: JSON.stringify([
        { name: 'tema', label: 'Tema', type: 'textarea', help: 'Qué investigar', required: true },
        { name: 'profundidad', label: 'Profundidad', type: 'select', help: 'Cuánto detalle', options: ['Overview', 'Resumen con datos', 'Análisis con fuentes'], required: true },
        { name: 'proposito', label: 'Propósito', type: 'text', help: 'Para qué necesitas la info', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Deep Research (2-4 horas)',
      description: 'Investigación profunda con plan y verificación',
      body: `Realiza una investigación profunda.

TEMA:
{tema}

PREGUNTAS ESPECÍFICAS:
{preguntas}

TIEMPO:
{tiempo}

INSTRUCCIONES:
1. Plan de investigación
2. Identifica fuentes
3. Formula hipótesis
4. Verifica afirmaciones
5. Documenta incertidumbres

FORMATO DE SALIDA:
# Deep Research

## Plan
| Fase | Actividad | Estado |

## Preguntas
**P1:** [respuesta]
- Confianza: Alta/Media/Baja
- Fuentes: [lista]

## Hallazgos
### Hallazgo 1
**Afirmación:** ...
**Evidencia:** ...
**Fuentes:** ...

## Verificación Cruzada
| Afirmación | Fuente 1 | Fuente 2 | ¿Consistente? |

## Conclusiones
1. [Conclusión principal]
2. [Implicancias]`,
      category: 'Investigación',
      tags: JSON.stringify(['research', 'profundo', 'verificación']),
      variablesSchema: JSON.stringify([
        { name: 'tema', label: 'Tema', type: 'textarea', help: 'Tema general', required: true },
        { name: 'preguntas', label: 'Preguntas', type: 'textarea', help: 'Preguntas específicas', required: true },
        { name: 'tiempo', label: 'Tiempo', type: 'select', help: 'Tiempo disponible', options: ['2 horas', '3 horas', '4 horas'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Generador de queries de búsqueda',
      description: 'Crea queries optimizados para búsqueda',
      body: `Genera queries de búsqueda optimizados.

QUÉ BUSCAS:
{busqueda}

MOTOR:
{motor}

CONTEXTO:
{contexto}

INSTRUCCIONES:
1. Query optimizado
2. Operadores avanzados
3. Variaciones para refinar
4. Motores alternativos

FORMATO DE SALIDA:
# Queries de Búsqueda

## Query Principal
\`\`\`
[query lista para copiar]
\`\`\`

## Variaciones
### Si hay demasiados resultados:
1. [query + filtro]
2. [query + operador]

### Si hay pocos resultados:
1. [query simplificada]
2. [query con sinónimos]

## Operadores Útiles
- \`operador\` - [uso]

## Motores Alternativos
| Motor | Mejor para | Query |
|-------|------------|-------|`,
      category: 'Investigación',
      tags: JSON.stringify(['búsqueda', 'queries', 'google']),
      variablesSchema: JSON.stringify([
        { name: 'busqueda', label: 'Qué buscas', type: 'textarea', help: 'Qué información necesitas', required: true },
        { name: 'motor', label: 'Motor', type: 'select', help: 'Dónde buscar', options: ['Google', 'Google Scholar', 'GitHub', 'Reddit', 'LinkedIn'], required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Para qué es', required: false },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Matriz comparativa A vs B vs C',
      description: 'Comparación con criterios ponderados',
      body: `Crea una matriz comparativa.

OPCIONES:
{opciones}

CRITERIOS:
{criterios}

CONTEXTO:
{contexto}

INSTRUCCIONES:
1. Evalúa cada opción
2. Usa escala consistente
3. Aplica ponderación
4. Recomienda

FORMATO DE SALIDA:
# Matriz Comparativa

## Resumen
**Recomendación:** [Opción]

## Matriz
| Criterio | Peso | Opción A | Opción B | Opción C |
|----------|------|----------|----------|----------|

## Fortalezas por Opción
### Opción A
- ✅ [Fortaleza]

## Debilidades
### Opción A
- ❌ [Debilidad]

## Recomendación Final
**Opción:** [X]
**Justificación:** ...`,
      category: 'Investigación',
      tags: JSON.stringify(['comparación', 'matriz', 'decisión']),
      variablesSchema: JSON.stringify([
        { name: 'opciones', label: 'Opciones', type: 'textarea', help: 'Lista las opciones', required: true },
        { name: 'criterios', label: 'Criterios', type: 'textarea', help: 'Aspectos a evaluar', required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Para qué es esta comparación', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Fact-check estricto',
      description: 'Verifica separando lo que sé, infiero y no sé',
      body: `Realiza fact-check riguroso.

AFIRMACIONES:
{afirmaciones}

CONTEXTO:
{contexto}

RIGOR:
{rigor}

INSTRUCCIONES:
1. Separa HECHOS de OPINIONES
2. Distingue: SÉ / INFIERO / NO SÉ
3. Busca contradicciones
4. Califica confianza

⚠️ Sin evidencia = Sin verificar

FORMATO DE SALIDA:
# Fact-Check

## Análisis por Afirmación

### Afirmación 1
| Aspecto | Evaluación |
|---------|------------|
| Tipo | Hecho/Opinión |
| Lo que SÉ | ... |
| Lo que INFIERO | ... |
| Lo que NO SÉ | ... |
| Confianza | Alta/Media/Baja |

## Resumen
| Afirmación | Veredicto | Confianza |
|------------|-----------|-----------|

**Afirmaciones verificables:** X/Y`,
      category: 'Investigación',
      tags: JSON.stringify(['fact-check', 'verificación', 'rigor']),
      variablesSchema: JSON.stringify([
        { name: 'afirmaciones', label: 'Afirmaciones', type: 'textarea', help: 'Lista las afirmaciones', required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Dónde aparecieron', required: true },
        { name: 'rigor', label: 'Rigor', type: 'select', help: 'Nivel de exigencia', options: ['Estándar', 'Alto', 'Muy alto'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    // CHATBOTS
    {
      title: 'Clarificador de contexto',
      description: 'Preguntas mínimas necesarias antes de responder',
      body: `Analiza la petición e identifica información faltante.

PETICIÓN:
{peticion}

CONTEXTO:
{contexto}

INSTRUCCIONES:
1. Identifica supuestos implícitos
2. Detecta ambigüedades
3. Lista información faltante
4. Formula preguntas mínimas

FORMATO DE SALIDA:
# Análisis de Contexto

## Entendido
- [Lo que está claro]

## Información Faltante

### Crítica
1. **[Pregunta]** - Por qué importa: ...

### Importante
2. **[Pregunta]** - Por qué importa: ...

## Supuestos que Hago
1. [Supuesto] - Si es incorrecto, aclara

**Mínimo para continuar:** [X preguntas]`,
      category: 'Chatbots',
      tags: JSON.stringify(['contexto', 'clarificación', 'preguntas']),
      variablesSchema: JSON.stringify([
        { name: 'peticion', label: 'Petición', type: 'textarea', help: 'Qué pide el usuario', required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Info adicional disponible', required: false },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Output en formato específico',
      description: 'Respuestas en formato exacto: tabla, JSON, Markdown',
      body: `Genera respuesta en formato exacto.

CONSULTA:
{consulta}

FORMATO:
{formato}

ESQUEMA:
{esquema}

INSTRUCCIONES:
1. Sigue EXACTAMENTE el formato
2. Usa los campos especificados
3. No agregues campos extra
4. Si falta info, usa null

FORMATO DE SALIDA:
[Respuesta en formato exacto]

---
**Campos incluidos:** [lista]`,
      category: 'Chatbots',
      tags: JSON.stringify(['formato', 'tabla', 'JSON', 'estructura']),
      variablesSchema: JSON.stringify([
        { name: 'consulta', label: 'Consulta', type: 'textarea', help: 'Qué información necesitas', required: true },
        { name: 'formato', label: 'Formato', type: 'select', help: 'En qué formato', options: ['Tabla Markdown', 'JSON', 'Lista numerada', 'Lista bullets', 'CSV'], required: true },
        { name: 'esquema', label: 'Esquema', type: 'textarea', help: 'Qué campos incluir', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Crítico de prompt',
      description: 'Analiza prompts: ambigüedades, supuestos, riesgos',
      body: `Evalúa y critica el prompt.

PROMPT:
{prompt}

OBJETIVO:
{objetivo}

INSTRUCCIONES:
1. Identifica ambigüedades
2. Detecta supuestos implícitos
3. Señala riesgos de alucinación
4. Sugiere mejoras
5. Proporciona versión mejorada

FORMATO DE SALIDA:
# Análisis de Prompt

## Evaluación
| Aspecto | Puntuación |
|---------|------------|
| Claridad | ⭐⭐⭐☆☆ |
| Especificidad | ⭐⭐⭐⭐☆ |
| Control formato | ⭐⭐☆☆☆ |
| Anti-alucinación | ⭐⭐⭐☆☆ |

## Ambigüedades
1. "[Fragmento]" - Puede significar: A o B

## Supuestos Implícitos
- [Supuesto]: El prompt asume que...

## Riesgos de Alucinación
1. **[Riesgo]:** Podría inventar X

## Versión Mejorada
\`\`\`
[Prompt mejorado]
\`\`\``,
      category: 'Chatbots',
      tags: JSON.stringify(['crítica', 'mejora', 'prompt-engineering']),
      variablesSchema: JSON.stringify([
        { name: 'prompt', label: 'Prompt', type: 'textarea', help: 'El prompt a evaluar', required: true },
        { name: 'objetivo', label: 'Objetivo', type: 'textarea', help: 'Para qué se usa', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Generador de casos de prueba',
      description: 'Casos de test para prompts',
      body: `Genera casos de prueba.

PROMPT:
{prompt}

TIPO OUTPUT:
{tipo_output}

CANTIDAD:
{cantidad}

INSTRUCCIONES:
1. Casos normales
2. Casos borde
3. Casos negativos
4. Expected output

FORMATO DE SALIDA:
# Casos de Prueba

## Casos Normales

### Test 1
**Input:**
\`\`\`
[input]
\`\`\`
**Expected Output:**
\`\`\`
[output esperado]
\`\`\`

## Casos Borde

### Test N
**Input:** [input extremo]
**Expected:** [comportamiento]

## Casos Negativos
**Input:** [input problemático]
**Expected:** [rechazo/manejo]

## Resumen
| # | Nombre | Tipo | Prioridad |`,
      category: 'Chatbots',
      tags: JSON.stringify(['testing', 'QA', 'validación']),
      variablesSchema: JSON.stringify([
        { name: 'prompt', label: 'Prompt', type: 'textarea', help: 'El prompt a testear', required: true },
        { name: 'tipo_output', label: 'Tipo output', type: 'select', help: 'Qué tipo de respuesta', options: ['Texto libre', 'JSON', 'Tabla', 'Lista', 'Código'], required: true },
        { name: 'cantidad', label: 'Cantidad', type: 'select', help: 'Cuántos tests', options: ['5 básicos', '10 completos', '15 exhaustivos'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Evaluación/score de respuesta',
      description: 'Califica con rúbrica: exactitud, completitud, formato',
      body: `Evalúa la respuesta.

PROMPT ORIGINAL:
{prompt}

RESPUESTA:
{respuesta}

CRITERIOS ADICIONALES:
{criterios}

INSTRUCCIONES:
1. Evalúa cada dimensión
2. Usa escala 0-25
3. Justifica cada puntuación
4. Puntuación global

FORMATO DE SALIDA:
# Evaluación

## Score General
**Total:** X/100
**Veredicto:** ✅/⚠️/❌

## Rúbrica

### Exactitud (0-25)
| Aspecto | Puntos |
|---------|--------|
| Datos correctos | /10 |
| Sin alucinaciones | /10 |
| Coherencia | /5 |

### Completitud (0-25)
| Aspecto | Puntos |
|---------|--------|
| Cubre puntos | /10 |
| Profundidad | /10 |
| Sin omisiones | /5 |

### Formato (0-25)
### Utilidad (0-25)

## Desglose Visual
\`\`\`
Exactitud   : ████████░░ 20/25
Completitud : █████████░ 22/25
...
\`\`\`

## Mejoras
1. [Mejora específica]`,
      category: 'Chatbots',
      tags: JSON.stringify(['evaluación', 'score', 'rúbrica']),
      variablesSchema: JSON.stringify([
        { name: 'prompt', label: 'Prompt original', type: 'textarea', help: 'El prompt que generó la respuesta', required: true },
        { name: 'respuesta', label: 'Respuesta', type: 'textarea', help: 'La respuesta a evaluar', required: true },
        { name: 'criterios', label: 'Criterios extra', type: 'textarea', help: 'Criterios específicos', required: false },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    // IMÁGENES
    {
      title: 'Constructor de prompt de imagen',
      description: 'Genera prompts con sujeto, estilo, composición, luz, cámara',
      body: `Construye prompt para generar imagen.

SUJETO:
{sujeto}

ESTILO:
{estilo}

COMPOSICIÓN:
{composicion}

LUZ:
{luz}

TÉCNICO:
{tecnico}

AMBIENTE:
{ambiente}

FORMATO DE SALIDA:
# Prompt de Imagen

## Prompt Completo
\`\`\`
[Prompt listo para copiar]
\`\`\`

## Variaciones por Plataforma

### Midjourney
\`\`\`
[prompt con parámetros --ar 16:9 --v 6]
\`\`\`

### DALL-E 3
\`\`\`
[prompt optimizado]
\`\`\`

### Stable Diffusion
\`\`\`
[prompt con negative]
\`\`\`

## Negative Prompt
\`\`\`
[lo que NO quieres]
\`\`\``,
      category: 'Imágenes',
      tags: JSON.stringify(['imagen', 'prompt-imagen', 'Midjourney', 'DALL-E']),
      variablesSchema: JSON.stringify([
        { name: 'sujeto', label: 'Sujeto', type: 'textarea', help: 'Qué debe aparecer', required: true },
        { name: 'estilo', label: 'Estilo', type: 'select', help: 'Estilo visual', options: ['Fotorrealista', 'Ilustración', 'Óleo', 'Acuarela', 'Anime', '3D', 'Minimalista', 'Cyberpunk'], required: true },
        { name: 'composicion', label: 'Composición', type: 'text', help: 'Encuadre, ángulo', required: true },
        { name: 'luz', label: 'Luz', type: 'select', help: 'Tipo de iluminación', options: ['Natural suave', 'Golden hour', 'Dramática', 'Neon', 'Estudio', 'Backlight'], required: true },
        { name: 'tecnico', label: 'Técnico', type: 'text', help: 'Especificaciones técnicas', required: false },
        { name: 'ambiente', label: 'Ambiente', type: 'text', help: 'Atmósfera', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Generador de negative prompt',
      description: 'Crea negatives para evitar artefactos',
      body: `Genera negative prompt.

TIPO IMAGEN:
{tipo_imagen}

PROBLEMAS A EVITAR:
{problemas}

PLATAFORMA:
{plataforma}

FORMATO DE SALIDA:
# Negative Prompt

## Principal
\`\`\`
[negative prompt completo]
\`\`\`

## Por Categoría

### Anatomía
- [términos]

### Calidad
- [términos]

### Texto
- [términos]

## Versión Compacta
\`\`\`
[versión corta]
\`\`\``,
      category: 'Imágenes',
      tags: JSON.stringify(['negative-prompt', 'calidad', 'artefactos']),
      variablesSchema: JSON.stringify([
        { name: 'tipo_imagen', label: 'Tipo', type: 'select', help: 'Tipo de imagen', options: ['Retrato', 'Paisaje', 'Producto', 'Arte digital', 'Personaje'], required: true },
        { name: 'problemas', label: 'Problemas', type: 'textarea', help: 'Qué quieres evitar', required: true },
        { name: 'plataforma', label: 'Plataforma', type: 'select', help: 'Qué herramienta', options: ['Stable Diffusion', 'Midjourney', 'DALL-E 3', 'Leonardo'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Variador de estilo',
      description: 'Misma escena en 10 estilos diferentes',
      body: `Genera variaciones de estilo.

ESCENA:
{escena}

ESTILOS ESPECÍFICOS:
{estilos}

MANTENER CONSISTENTE:
{consistente}

FORMATO DE SALIDA:
# Variaciones de Estilo

## Escena Base
**Sujeto:** [sujeto]
**Composición:** [composición]

## Variaciones

### 1. Fotorrealista
\`\`\`
[prompt]
\`\`\`

### 2. Ilustración Digital
\`\`\`
[prompt]
\`\`\`

### 3. Pintura al Óleo
\`\`\`
[prompt]
\`\`\`

### 4. Acuarela
\`\`\`
[prompt]
\`\`\`

### 5. Anime
\`\`\`
[prompt]
\`\`\`

### 6. 3D Render
\`\`\`
[prompt]
\`\`\`

### 7. Minimalista
\`\`\`
[prompt]
\`\`\`

### 8. Vintage
\`\`\`
[prompt]
\`\`\`

### 9. Cyberpunk
\`\`\`
[prompt]
\`\`\`

### 10. Fantasía
\`\`\`
[prompt]
\`\`\``,
      category: 'Imágenes',
      tags: JSON.stringify(['variaciones', 'estilos', 'comparación']),
      variablesSchema: JSON.stringify([
        { name: 'escena', label: 'Escena', type: 'textarea', help: 'La escena a variar', required: true },
        { name: 'estilos', label: 'Estilos específicos', type: 'textarea', help: 'Si quieres estilos específicos', required: false },
        { name: 'consistente', label: 'Consistente', type: 'textarea', help: 'Qué no debe cambiar', required: false },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    // VENTAS
    {
      title: 'Prospecting brief',
      description: 'Analiza empresa, pains, ángulo, 3 aperturas de email',
      body: `Crea prospecting brief.

EMPRESA:
{empresa}

INDUSTRIA:
{industria}

ROL CONTACTO:
{rol}

PRODUCTO:
{producto}

FORMATO DE SALIDA:
# Prospecting Brief

## Análisis de Empresa
**Industria:** ...
**Tamaño probable:** ...
**Tendencias:** ...

## Pains Probables
| Pain | Síntomas | Urgencia | Solución |
|------|----------|----------|----------|

## Ángulo de Ataque
**Ángulo:** [Qué problema abordar]
**Hook:** [Frase conecta pain-solución]

## Aperturas de Email

### Apertura 1: Directa
**Asunto:** [asunto]
\`\`\`
[email 100 palabras]
\`\`\`

### Apertura 2: Insight
**Asunto:** [asunto]
\`\`\`
[email 100 palabras]
\`\`\`

### Apertura 3: Curiosidad
**Asunto:** [asunto]
\`\`\`
[email 100 palabras]
\`\`\`

## Score de Fit
| Criterio | Score |
|----------|-------|
| Match pain | ⭐⭐⭐⭐ |
| Accesibilidad | ⭐⭐⭐ |`,
      category: 'Ventas',
      tags: JSON.stringify(['prospecting', 'outreach', 'B2B']),
      variablesSchema: JSON.stringify([
        { name: 'empresa', label: 'Empresa', type: 'text', help: 'Empresa objetivo', required: true },
        { name: 'industria', label: 'Industria', type: 'text', help: 'Sector', required: true },
        { name: 'rol', label: 'Rol contacto', type: 'text', help: 'Cargo del contacto', required: true },
        { name: 'producto', label: 'Producto', type: 'textarea', help: 'Qué vendes', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Objection handler',
      description: 'Responde objeciones con diagnóstico y alternativas',
      body: `Crea respuestas para objeciones.

OBJECIÓN:
{objecion}

CONTEXTO:
{contexto}

TIPO CLIENTE:
{tipo_cliente}

PRODUCTO:
{producto}

FORMATO DE SALIDA:
# Análisis de Objeción

## Diagnóstico
| Aspecto | Análisis |
|---------|----------|
| Tipo | Precio/Timing/Confianza/etc. |
| Qué hay detrás | [Razón real] |
| Interés real | Alto/Medio/Bajo |

## Respuesta Principal

### Versión Corta (15 seg)
\`\`\`
[Respuesta directa]
\`\`\`

### Versión Extendida
\`\`\`
[Respuesta con contexto]
\`\`\`

## Técnicas

### Reframing
[Cambiar perspectiva]

### Pregunta de Sondeo
\`\`\`
[Profundizar]
\`\`\`

## Alternativas
1. [Si objeción es real]
2. [Si no cede]

## Qué NO Decir
- [Frase que empeora]
- [Frase presionante]

## Probabilidad de Éxito
Alta/Media/Baja`,
      category: 'Ventas',
      tags: JSON.stringify(['objeciones', 'ventas', 'negociación']),
      variablesSchema: JSON.stringify([
        { name: 'objecion', label: 'Objeción', type: 'textarea', help: 'Qué dijo el prospect', required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Punto de la conversación', required: true },
        { name: 'tipo_cliente', label: 'Tipo cliente', type: 'select', help: 'Perfil', options: ['Decisor', 'Influencer', 'Usuario', 'Bloqueador', 'Champion'], required: true },
        { name: 'producto', label: 'Producto', type: 'text', help: 'Qué vendes', required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    // PROMPTS FALTANTES DE LA LISTA CURADA
    {
      title: 'Resumen con trazabilidad',
      description: 'Resume con evidencia y grado de confianza por cada afirmación',
      body: `Crea un resumen con trazabilidad completa.

CONTENIDO:
{contenido}

CONTEXTO:
{contexto}

DETALLE:
{detalle}

INSTRUCCIONES:
1. Cada afirmación debe tener evidencia
2. Asigna grado de confianza
3. Indica la fuente de cada dato
4. Si algo es inferido, márcalo

FORMATO DE SALIDA:
# Resumen con Trazabilidad

## Puntos Clave

### Punto 1
| Aspecto | Detalle |
|---------|---------|
| **Afirmación** | [Qué se afirma] |
| **Evidencia** | [Dato que lo respalda] |
| **Fuente** | [De dónde viene] |
| **Confianza** | 🟢 Alta / 🟡 Media / 🔴 Baja |

### Punto 2
...

## Tabla de Afirmaciones
| # | Afirmación | Evidencia | Confianza |
|---|------------|-----------|-----------|

## Síntesis
[2-3 oraciones con solo afirmaciones de alta confianza]

## Puntos a Verificar
- [Punto dudoso] - Razón: [por qué]`,
      category: 'Investigación',
      tags: JSON.stringify(['resumen', 'trazabilidad', 'fuentes', 'confianza']),
      variablesSchema: JSON.stringify([
        { name: 'contenido', label: 'Contenido', type: 'textarea', help: 'Texto a resumir', required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Para qué es', required: true },
        { name: 'detalle', label: 'Nivel detalle', type: 'select', help: 'Cuánto detalle', options: ['Alto', 'Medio', 'Bajo'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Extractor de insights',
      description: 'Identifica patrones, implicancias, riesgos y oportunidades',
      body: `Extrae insights profundos del contenido.

CONTENIDO:
{contenido}

CONTEXTO:
{contexto}

ENFOQUE:
{enfoque}

INSTRUCCIONES:
1. Ve más allá de lo obvio
2. Identifica patrones no declarados
3. Considera implicancias de segundo orden
4. Busca riesgos ocultos y oportunidades

FORMATO DE SALIDA:
# Análisis de Insights

## Patrones Identificados

### Patrón 1
**Qué se observa:** [Descripción]
**Evidencia:** [Dónde aparece]
**Implicancia:** [Qué significa]

## Insights Principales
| Insight | Tipo | Impacto | Acción |
|---------|------|---------|--------|
| ... | Oportunidad/Riesgo/Tendencia | Alto/Medio/Bajo | ... |

## Riesgos
1. **[Riesgo]** - Probabilidad: Alta/Media - Mitigación: [...]

## Oportunidades
1. **[Oportunidad]** - Potencial: Alto/Medio - Requisito: [...]

## Implicancias de Segundo Orden
Si [X], entonces podría [Y]

## Recomendaciones
1. [Recomendación específica]`,
      category: 'Investigación',
      tags: JSON.stringify(['insights', 'análisis', 'patrones', 'oportunidades']),
      variablesSchema: JSON.stringify([
        { name: 'contenido', label: 'Contenido', type: 'textarea', help: 'Texto a analizar', required: true },
        { name: 'contexto', label: 'Contexto', type: 'textarea', help: 'Para qué es', required: true },
        { name: 'enfoque', label: 'Enfoque', type: 'select', help: 'Tipo de insights', options: ['General', 'Riesgos', 'Oportunidades', 'Patrones', 'Tendencias'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Texto largo a plan operativo',
      description: 'Convierte documentos extensos en planes con hitos y métricas',
      body: `Transforma el documento en un plan operativo ejecutable.

DOCUMENTO:
{documento}

OBJETIVO:
{objetivo}

RECURSOS:
{recursos}

HORIZONTE:
{horizonte}

INSTRUCCIONES:
1. Descompón en fases/hitos
2. Define Definition of Done
3. Establece métricas
4. Asigna responsables
5. Identifica dependencias

FORMATO DE SALIDA:
# Plan Operativo

## Objetivo SMART
[Específico, Medible, Alcanzable, Relevante, Temporal]

## Resumen
| Aspecto | Detalle |
|---------|---------|
| Duración | X semanas |
| Fases | N fases |
| Hitos | M hitos |

## Fases

### Fase 1: [Nombre]
**Objetivo:** [Qué se logra]
**Actividades:**
- [ ] Actividad 1.1
- [ ] Actividad 1.2

**Definition of Done:**
- [ ] [Criterio 1]

**Métricas:**
| Métrica | Target |
|---------|--------|

**Responsable:** [Rol]

---

## Cronograma
\`\`\`
Fase 1: [====] Semanas 1-3
Fase 2: [    ====] Semanas 4-6
\`\`\`

## Dependencias
[Fase 1] → [Fase 2] → [Fase 3]

## KPIs
| KPI | Fórmula | Target |
|-----|---------|--------|

## Riesgos
| Riesgo | Probabilidad | Mitigación |

## Próximos Pasos
1. [Acción inmediata]`,
      category: 'Operaciones',
      tags: JSON.stringify(['plan-operativo', 'hitos', 'KPIs', 'proyecto']),
      variablesSchema: JSON.stringify([
        { name: 'documento', label: 'Documento', type: 'textarea', help: 'Documento extenso', required: true },
        { name: 'objetivo', label: 'Objetivo', type: 'text', help: 'Qué se quiere lograr', required: true },
        { name: 'recursos', label: 'Recursos', type: 'textarea', help: 'Personas, presupuesto', required: false },
        { name: 'horizonte', label: 'Horizonte', type: 'select', help: 'Timeframe', options: ['1 mes', '3 meses', '6 meses', '1 año'], required: true },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Optimización iterativa de prompt',
      description: 'Propone variantes y ayuda a escoger la mejor',
      body: `Optimiza iterativamente el prompt.

PROMPT ACTUAL:
{prompt_actual}

PROBLEMA A MEJORAR:
{problema}

ITERACIONES PREVIAS:
{iteraciones}

INSTRUCCIONES:
1. Genera 3-5 variantes
2. Cada una aborda aspecto diferente
3. Analiza pros y contras
4. Recomienda la mejor

FORMATO DE SALIDA:
# Optimización de Prompt

## Análisis del Prompt Actual
**Fortalezas:**
- [Fortaleza 1]

**Debilidades:**
- [Debilidad 1]

**Problema a resolver:** [problema]

## Variantes Propuestas

### Variante A
\`\`\`
[Prompt modificado]
\`\`\`
**Cambios:** [Qué cambió]
**Dirección:** [Qué mejora]
**Trade-off:** [Qué podría empeorar]

### Variante B
\`\`\`
[Prompt modificado]
\`\`\`
...

### Variante C
\`\`\`
[Prompt modificado]
\`\`\`
...

## Comparación
| Criterio | Original | Var A | Var B | Var C |
|----------|----------|-------|-------|-------|
| Claridad | ⭐⭐⭐ | ⭐⭐⭐⭐ | ... | ... |

## Recomendación
**Variante:** [X]
**Justificación:** [Por qué]

## Plan de Testing
1. Test con [input]: comparar outputs

## Próximos Pasos
1. [Paso inmediato]`,
      category: 'Chatbots',
      tags: JSON.stringify(['optimización', 'iteración', 'prompt-engineering']),
      variablesSchema: JSON.stringify([
        { name: 'prompt_actual', label: 'Prompt actual', type: 'textarea', help: 'El prompt a optimizar', required: true },
        { name: 'problema', label: 'Problema', type: 'textarea', help: 'Qué no funciona', required: true },
        { name: 'iteraciones', label: 'Iteraciones previas', type: 'textarea', help: 'Qué ya probaste', required: false },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Recetas combinables de prompts',
      description: 'Bloques/snippets reutilizables para construir prompts de imagen',
      body: `Genera bloques modulares para construir prompts de imagen.

CATEGORÍA:
{categoria}

ELEMENTOS:
{elementos}

ESTILO BASE:
{estilo_base}

INSTRUCCIONES:
1. Crea bloques modulares
2. Cada bloque debe ser combinable
3. Incluye ejemplos de combinación

FORMATO DE SALIDA:
# Bloques de Prompt Reutilizables

## Bloques Base

### BLOQUE_SUJETO
\`\`\`
[Descripción placeholder del sujeto]
\`\`\`
**Uso:** [Cuándo usar]
**Combina con:** [Otros bloques]

### BLOQUE_ESTILO
\`\`\`
[Especificación de estilo]
\`\`\`
**Uso:** [Cuándo usar]

### BLOQUE_COMPOSICION
\`\`\`
[Especificación de composición]
\`\`\`
**Uso:** [Cuándo usar]

### BLOQUE_LUZ
\`\`\`
[Especificación de iluminación]
\`\`\`
**Uso:** [Cuándo usar]

### BLOQUE_AMBIENTE
\`\`\`
[Especificación de ambiente]
\`\`\`
**Uso:** [Cuándo usar]

### BLOQUE_TECNICO
\`\`\`
[Especificaciones técnicas]
\`\`\`
**Uso:** [Cuándo usar]

## Ejemplos de Combinación

### Receta 1: Retrato Profesional
\`\`\`
[BLOQUE_SUJETO] + [BLOQUE_ESTILO] + [BLOQUE_LUZ] + [BLOQUE_TECNICO]
\`\`\`
= [Prompt resultante]

### Receta 2: Escena Ambientada
\`\`\`
[BLOQUE_SUJETO] + [BLOQUE_COMPOSICION] + [BLOQUE_AMBIENTE]
\`\`\`
= [Prompt resultante]

## Quick Reference
| Bloque | Keywords | Mejor para |
|--------|----------|------------|

## Tips de Combinación
1. [Tip de orden]
2. [Tip de compatibilidad]`,
      category: 'Imágenes',
      tags: JSON.stringify(['bloques', 'recetas', 'modular', 'combinable']),
      variablesSchema: JSON.stringify([
        { name: 'categoria', label: 'Categoría', type: 'select', help: 'Tipo de bloques', options: ['Retratos', 'Paisajes', 'Productos', 'Personajes', 'General'], required: true },
        { name: 'elementos', label: 'Elementos', type: 'textarea', help: 'Qué aspectos necesitas', required: true },
        { name: 'estilo_base', label: 'Estilo base', type: 'text', help: 'Estilo de referencia', required: false },
      ]),
      status: 'published' as const,
      riskLevel: 'low' as const,
      authorId: user.id,
      publishedAt: new Date(),
    },
  ];

  for (const promptData of prompts) {
    // FIX-001: Resolve categoryId from category name
    const categoryRecord = await prisma.category.findFirst({
      where: { name: promptData.category },
      select: { id: true },
    });

    if (!categoryRecord) {
      console.warn(`⚠️ Category '${promptData.category}' not found, skipping prompt: ${promptData.title}`);
      continue;
    }

    await prisma.prompt.create({
      data: {
        id: randomUUID(),
        updatedAt: new Date(),
        title: promptData.title,
        description: promptData.description,
        body: promptData.body,
        categoryId: categoryRecord.id,
        tags: promptData.tags,
        variablesSchema: promptData.variablesSchema,
        status: promptData.status,
        riskLevel: promptData.riskLevel,
        authorId: promptData.authorId,
        publishedAt: promptData.publishedAt,
      },
    });
  }
  console.log('✅ Prompts creados:', prompts.length);

  console.log('🎉 Semilla completada exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
