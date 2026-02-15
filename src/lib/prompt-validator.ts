/**
 * Prompt Validator: Valida la calidad de prompts antes de guardar
 * No requiere LLM - usa regex y reglas
 */

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  score: number; // 0-100
  suggestions: string[];
}

// Configuración de validación
const CONFIG = {
  minTitleLength: 5,
  maxTitleLength: 100,
  minBodyLength: 30,
  maxBodyLength: 15000,
  minDescriptionLength: 10,
  maxDescriptionLength: 500,
  requiredVariables: 1,
  maxVariables: 20,
};

// Palabras que indican contenido placeholder/temporal
const FORBIDDEN_PATTERNS = [
  { pattern: /\b(tbd|todo|to-do)\b/gi, message: 'Contiene "TBD/TODO" - completa el contenido' },
  { pattern: /\b(lorem ipsum|placeholder)\b/gi, message: 'Contiene texto de ejemplo' },
  { pattern: /\?{3,}/g, message: 'Contiene muchos signos de interrogación' },
  { pattern: /!{3,}/g, message: 'Contiene muchos signos de exclamación' },
  { pattern: /\[\s*...\s*\]/g, message: 'Contiene corchetes de ejemplo' },
];

// Palabras que indican prompt muy genérico
const GENERIC_PATTERNS = [
  { pattern: /\b(simple|basic|easy)\s+(task|thing|example)/gi, message: 'El prompt es muy genérico' },
  { pattern: /^h(ola|ey|ello)/gi, message: 'Saludo muy informal' },
];

export function validatePrompt(data: {
  title: string;
  description: string;
  body: string;
  category?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // ========== Validación de Título ==========
  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'El título es requerido', severity: 'error' });
    score -= 30;
  } else if (data.title.length < CONFIG.minTitleLength) {
    errors.push({ field: 'title', message: `El título debe tener al menos ${CONFIG.minTitleLength} caracteres`, severity: 'error' });
    score -= 20;
  } else if (data.title.length > CONFIG.maxTitleLength) {
    errors.push({ field: 'title', message: `El título no puede exceder ${CONFIG.maxTitleLength} caracteres`, severity: 'error' });
    score -= 15;
  } else if (!/^[a-zA-Z0-9\sáéíóúñÁÉÍÓÚÑ¿¡?!.,-]+$/.test(data.title)) {
    errors.push({ field: 'title', message: 'El título contiene caracteres especiales no permitidos', severity: 'warning' });
    score -= 5;
  }

  // ========== Validación de Descripción ==========
  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'La descripción es requerida', severity: 'error' });
    score -= 20;
  } else if (data.description.length < CONFIG.minDescriptionLength) {
    errors.push({ field: 'description', message: `La descripción debe tener al menos ${CONFIG.minDescriptionLength} caracteres`, severity: 'warning' });
    score -= 10;
  } else if (data.description.length > CONFIG.maxDescriptionLength) {
    errors.push({ field: 'description', message: `La descripción no puede exceder ${CONFIG.maxDescriptionLength} caracteres`, severity: 'warning' });
    score -= 5;
  }

  // ========== Validación de Body ==========
  if (!data.body || data.body.trim().length === 0) {
    errors.push({ field: 'body', message: 'El cuerpo del prompt es requerido', severity: 'error' });
    score -= 40;
  } else if (data.body.length < CONFIG.minBodyLength) {
    errors.push({ field: 'body', message: `El prompt debe tener al menos ${CONFIG.minBodyLength} caracteres`, severity: 'error' });
    score -= 25;
  } else if (data.body.length > CONFIG.maxBodyLength) {
    errors.push({ field: 'body', message: `El prompt no puede exceder ${CONFIG.maxBodyLength} caracteres`, severity: 'error' });
    score -= 15;
  }

  // ========== Patrones prohibidos ==========
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(data.body)) {
      errors.push({ field: 'body', message, severity: 'error' });
      score -= 15;
    }
  }

  // ========== Patrones genéricos ==========
  for (const { pattern, message } of GENERIC_PATTERNS) {
    if (pattern.test(data.body) || pattern.test(data.title)) {
      errors.push({ field: 'body', message, severity: 'warning' });
      score -= 10;
    }
  }

  // ========== Validación de Variables ==========
  const variables = extractVariables(data.body);
  if (variables.length === 0) {
    errors.push({ field: 'body', message: 'Agrega al menos una variable como {nombre} o {tema}', severity: 'warning' });
    score -= 10;
    suggestions.push('Usa variables como {variable} para hacer el prompt reutilizable');
  } else if (variables.length > CONFIG.maxVariables) {
    errors.push({ field: 'body', message: `Demasiadas variables (${variables.length}). Máximo ${CONFIG.maxVariables}`, severity: 'warning' });
    score -= 5;
  }

  // ========== Validación de Categoría ==========
  if (!data.category) {
    errors.push({ field: 'category', message: 'Selecciona una categoría', severity: 'error' });
    score -= 15;
  }

  // ========== Sugerencias de Mejora ==========
  // Detectar si falta estructura
  if (data.body.length > 500 && !data.body.includes('\n')) {
    suggestions.push('Considera usar párrafos o listas para mejorar la lectura');
  }

  // Detectar si tiene instrucciones claras
  if (!/(actúa|actuar|eres|soy|necesito|quiero|crea|genera|escribe)/i.test(data.body)) {
    suggestions.push('Agrega una instrucción clara como "Crea..." o "Escribe..."');
  }

  // Detectar si tiene contexto
  if (data.body.length > 200 && data.body.split(/\s+/).length < 20) {
    suggestions.push('Considera agregar más contexto o detalles');
  }

  // ========== Scoring final ==========
  score = Math.max(0, Math.min(100, score));

  // Calcular severidad
  const hasErrors = errors.some(e => e.severity === 'error');
  const valid = errors.filter(e => e.severity === 'error').length === 0;

  return {
    valid,
    errors: errors.sort((a, b) => {
      const order = { error: 0, warning: 1 };
      return order[a.severity] - order[b.severity];
    }),
    score,
    suggestions,
  };
}

/**
 * Extrae variables del formato {variable}
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map(m => m.slice(1, -1)))];
}

/**
 * Valida una sola variable
 */
export function validateVariable(name: string, label: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({ field: 'variable.name', message: 'El nombre es requerido', severity: 'error' });
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    errors.push({ field: 'variable.name', message: 'Usa solo letras, números y guiones bajos', severity: 'error' });
  }

  if (!label || label.trim().length === 0) {
    errors.push({ field: 'variable.label', message: 'La etiqueta es requerida', severity: 'error' });
  }

  return errors;
}

/**
 * Obtiene mensaje humanizado del score
 */
export function getScoreMessage(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Excelente', color: 'text-green-600' };
  if (score >= 70) return { label: 'Bueno', color: 'text-green-500' };
  if (score >= 50) return { label: 'Regular', color: 'text-yellow-500' };
  if (score >= 30) return { label: 'Necesita mejoras', color: 'text-orange-500' };
  return { label: 'Revisar', color: 'text-red-500' };
}
