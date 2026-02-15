/**
 * Auto-tagger: Sugiere tags automáticamente basándose en keywords del contenido
 * No requiere LLM - usa keyword matching en español
 */

interface TagRule {
  tag: string;
  keywords: string[];
  weight: number;
}

// Reglas de categorización por keywords
// weight = prioridad (mayor = más específico)
const TAG_RULES: TagRule[] = [
  // Comunicación
  { tag: 'email', keywords: ['email', 'correo', 'gmail', 'outlook', 'asunto', 'destinatario', 'remitente'], weight: 3 },
  { tag: 'whatsapp', keywords: ['whatsapp', 'mensaje', 'wsp', 'whatsapp business'], weight: 3 },
  { tag: 'comunicacion', keywords: ['comunicar', 'mensaje', 'redactar', 'escribir'], weight: 1 },

  // Programación
  { tag: 'codigo', keywords: ['código', 'codigo', 'programar', 'programación', 'developer', 'dev'], weight: 3 },
  { tag: 'python', keywords: ['python', 'def ', 'import ', 'pip install', '.py'], weight: 4 },
  { tag: 'javascript', keywords: ['javascript', 'js', 'node', 'const ', 'function ', '=>'], weight: 4 },
  { tag: 'sql', keywords: ['sql', 'query', 'consulta', 'base de datos', 'select ', 'insert ', 'mysql'], weight: 4 },
  { tag: 'api', keywords: ['api', 'endpoint', 'rest', 'http', 'post', 'get', 'put', 'delete'], weight: 3 },
  
  // Datos
  { tag: 'excel', keywords: ['excel', 'spreadsheet', 'hoja de cálculo', 'csv', 'fórmula', 'macro'], weight: 3 },
  { tag: 'google-sheets', keywords: ['google sheets', 'googlesheet', 'sheet'], weight: 3 },
  { tag: 'analisis', keywords: ['analizar', 'análisis', 'datos', 'gráfico', 'reporte'], weight: 2 },

  // RRHH
  { tag: 'rh', keywords: ['reclutar', 'entrevista', 'candidato', 'empleo', 'trabajador', 'rrhh', 'recurso humano'], weight: 3 },
  { tag: 'contrato', keywords: ['contrato', 'laboral', 'empleo', 'trabajo'], weight: 3 },
  { tag: 'onboarding', keywords: ['onboarding', 'bienvenida', 'nuevo empleado', 'incorporación'], weight: 3 },

  // Legal
  { tag: 'legal', keywords: ['legal', 'contrato', 'términos', 'condiciones', 'aviso'], weight: 3 },
  { tag: 'privacidad', keywords: ['privacidad', 'datos personales', 'protección', 'política'], weight: 3 },

  // Marketing
  { tag: 'marketing', keywords: ['marketing', 'publicidad', 'promocionar', 'venta', 'campaña'], weight: 2 },
  { tag: 'seo', keywords: ['seo', 'google', 'buscador', 'posicionamiento', 'keywords'], weight: 3 },
  { tag: 'redes-sociales', keywords: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'red social'], weight: 3 },

  // Educación
  { tag: 'educacion', keywords: ['educar', 'enseñar', 'aprender', 'curso', 'tutorial', 'explicar'], weight: 2 },
  { tag: 'resumen', keywords: ['resumir', 'sintetizar', 'resumen', 'extracto', 'abstract'], weight: 2 },

  // Traducción
  { tag: 'traduccion', keywords: ['traducir', 'traducción', 'ingles', 'inglés', 'español', 'francés', 'idioma'], weight: 3 },

  // Producto
  { tag: 'producto', keywords: ['producto', 'descripción', 'ficha', 'catálogo'], weight: 2 },
  { tag: 'precio', keywords: ['precio', 'costo', 'tarifa', 'valor', 'descuento'], weight: 2 },

  // Soporte
  { tag: 'soporte', keywords: ['soporte', 'ayuda', 'faq', 'pregunta frecuente', 'atención'], weight: 2 },
  { tag: 'chatbot', keywords: ['chatbot', 'asistente', 'bot', 'atención cliente'], weight: 3 },
];

/**
 * Normaliza texto para búsqueda
 * - Minúsculas
 * - Quita acentos
 * - Quita puntuación
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^\w\s]/g, ' ') // quitar puntuación
    .trim();
}

/**
 * Extrae variables del prompt
 * Ejemplo: "Hola {nombre}, bienvenido a {empresa}" -> ["nombre", "empresa"]
 */
export function extractVariables(body: string): string[] {
  const matches = body.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map(m => m.slice(1, -1)))];
}

/**
 * Sugiere tags automáticamente basándose en el contenido
 * @param text - Texto a analizar (título + descripción + body)
 * @returns Array de tags sugeridos ordenados por relevancia
 */
export function autoTag(text: string): string[] {
  if (!text || text.length < 5) return [];

  const normalized = normalize(text);
  const scores: Record<string, number> = {};

  for (const rule of TAG_RULES) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword)) {
        scores[rule.tag] = (scores[rule.tag] || 0) + rule.weight;
      }
    }
  }

  // Ordenar por score y retornar top 5
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return sorted;
}

/**
 * Versión simple que solo retorna el tag principal
 */
export function getMainCategory(text: string): string {
  const tags = autoTag(text);
  return tags[0] || 'general';
}

/**
 * Análisis de complejidad del prompt
 * Basado en cantidad de variables y largo del texto
 */
export function analyzeComplexity(body: string, variablesSchema: unknown[]): {
  level: 'simple' | 'medium' | 'complex';
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  // Largo del texto
  if (body.length < 100) {
    score += 1;
    reasons.push('prompt corto');
  } else if (body.length > 2000) {
    score += 3;
    reasons.push('prompt largo');
  } else {
    score += 2;
  }

  // Cantidad de variables
  const variables = extractVariables(body);
  if (variables.length === 0) {
    score += 1;
    reasons.push('sin variables');
  } else if (variables.length <= 2) {
    score += 1;
    reasons.push('pocas variables');
  } else if (variables.length >= 5) {
    score += 3;
    reasons.push('muchas variables');
  }

  // Variables en schema
  if (variablesSchema && Array.isArray(variablesSchema)) {
    if (variablesSchema.length >= 3) {
      score += 2;
      reasons.push('formulario complejo');
    }
  }

  // Detectar indicadores de complejidad
  const complexIndicators = [
    /si\s+.*entonces/i,           // condicionales
    /primero.*después/i,          // secuencias
    / paso \d+/i,                 // pasos numerados
    /tenga\s+en\s+cuenta/i,       // advertencias
    /importante/i,                // énfasis
  ];

  for (const indicator of complexIndicators) {
    if (indicator.test(body)) {
      score += 1;
      reasons.push('estructura compleja');
      break;
    }
  }

  // Clasificar
  let level: 'simple' | 'medium' | 'complex';
  if (score <= 3) level = 'simple';
  else if (score <= 6) level = 'medium';
  else level = 'complex';

  return { level, score, reasons };
}
