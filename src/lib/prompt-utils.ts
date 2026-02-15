/**
 * Utilidades centralizadas para el manejo de prompts
 * Evita duplicación de código y parseos inconsistentes
 */

import type { Prompt, VariableSchema, PromptExample } from '@/types';
import { logger } from './logger';

/**
 * Parsea un campo que puede ser string JSON o array
 */
export function parseJsonField<T>(value: T | string | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value !== 'string') return value;
  if (!value.trim()) return defaultValue;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    logger.warn('Failed to parse JSON field', { value: value.substring(0, 50) });
    return defaultValue;
  }
}

/**
 * Parsea los tags de un prompt (string JSON -> array)
 */
export function parseTags(tags: string[] | string | null | undefined): string[] {
  return parseJsonField(tags, []);
}

/**
 * Parsea el schema de variables de un prompt
 */
export function parseVariablesSchema(schema: VariableSchema[] | string | null | undefined): VariableSchema[] {
  return parseJsonField(schema, []);
}

/**
 * Parsea los ejemplos de un prompt
 */
export function parseExamples(examples: PromptExample[] | string | null | undefined): PromptExample[] {
  return parseJsonField(examples, []);
}

/**
 * Normaliza un prompt para uso en frontend
 * Convierte todos los campos JSON string a arrays/objetos
 * Mapea los nombres de relaciones de Prisma a nombres amigables
 */
export function normalizePrompt(prompt: Record<string, unknown>): Prompt {
  // Mapear relaciones de Prisma a nombres amigables
  const author = prompt.User_Prompt_authorIdToUser || prompt.author;
  const reviewer = prompt.User_Prompt_reviewerIdToUser || prompt.reviewer;
  const versions = prompt.PromptVersion || prompt.versions;

  return {
    ...prompt,
    // Mapear nombres de relaciones
    author: author as Prompt['author'],
    reviewer: reviewer as Prompt['reviewer'] | undefined,
    versions: versions as Prompt['versions'],
    // Parsear campos JSON
    tags: parseTags(prompt.tags as string[] | string),
    variablesSchema: parseVariablesSchema(prompt.variablesSchema as VariableSchema[] | string),
    examples: parseExamples(prompt.examples as PromptExample[] | string),
  } as Prompt;
}

/**
 * Normaliza una lista de prompts
 */
export function normalizePrompts(prompts: unknown[]): Prompt[] {
  if (!Array.isArray(prompts)) return [];
  return prompts.map(p => normalizePrompt(p as Record<string, unknown>));
}

/**
 * Normaliza texto para búsqueda
 * - Minúsculas
 * - Quita acentos
 * - Quita puntuación
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^\w\s]/g, ' ') // quitar puntuación
    .trim();
}

/**
 * Filtra prompts por búsqueda (búsqueda fuzzy mejorada)
 * - Maneja errores de tipeo
 * - Busca en título, descripción, tags y body
 * - Ignora acentos
 */
export function filterBySearch(prompt: Prompt, search: string): boolean {
  if (!search.trim()) return true;
  
  const normalizedSearch = normalizeText(search);
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 1);
  
  if (searchWords.length === 0) return true;
  
  // Normalizar todos los campos del prompt
  const searchableText = normalizeText([
    prompt.title,
    prompt.description,
    prompt.body,
    ...parseTags(prompt.tags),
  ].join(' '));
  
  // Verificar si TODAS las palabras de búsqueda están presentes
  // (búsqueda AND, más precisa)
  const allWordsMatch = searchWords.every(word => {
    // Búsqueda exacta primero
    if (searchableText.includes(word)) return true;
    
    // Búsqueda con tolerancia a errores (levenshtein básico)
    const words = searchableText.split(/\s+/);
    return words.some(w => {
      if (w.length < 3) return false;
      return getLevenshteinDistance(word, w) <= Math.floor(w.length / 3);
    });
  });
  
  return allWordsMatch;
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 * Usada para búsqueda fuzzy
 */
function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Ordena resultados por relevancia
 */
export function sortByRelevance<T extends { title: string; description: string; tags: string[] }>(
  items: T[],
  search: string
): T[] {
  if (!search.trim()) return items;
  
  const normalizedSearch = normalizeText(search);
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 1);
  
  return items
    .map(item => {
      const searchableText = normalizeText([
        item.title,
        item.description,
        ...item.tags,
      ].join(' '));
      
      let score = 0;
      
      for (const word of searchWords) {
        // Título coincide exactamente = +10
        if (item.title.toLowerCase().includes(word)) score += 10;
        // Descripción coincide = +5
        if (item.description.toLowerCase().includes(word)) score += 5;
        // Tags coinciden = +3
        if (item.tags.some(t => t.toLowerCase().includes(word))) score += 3;
        // Coincide en cualquier parte = +1
        if (searchableText.includes(word)) score += 1;
      }
      
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

/**
 * Filtra prompts por categoría
 */
export function filterByCategory(prompt: Prompt, category: string | null): boolean {
  if (!category) return true;
  return prompt.category === category;
}

/**
 * Filtra prompts por tags
 */
export function filterByTags(prompt: Prompt, selectedTags: string[]): boolean {
  if (selectedTags.length === 0) return true;
  
  const promptTags = parseTags(prompt.tags);
  return selectedTags.some(tag => promptTags.includes(tag));
}

/**
 * Filtra prompts por favoritos
 */
export function filterByFavorites(prompt: Prompt, onlyFavorites: boolean): boolean {
  if (!onlyFavorites) return true;
  return prompt.isFavorite === true;
}

/**
 * Aplica todos los filtros a una lista de prompts
 */
export function filterPrompts(
  prompts: Prompt[],
  options: {
    search?: string;
    category?: string | null;
    tags?: string[];
    onlyFavorites?: boolean;
  }
): Prompt[] {
  const { search = '', category = null, tags = [], onlyFavorites = false } = options;
  
  return prompts.filter(prompt => {
    if (!filterBySearch(prompt, search)) return false;
    if (!filterByCategory(prompt, category)) return false;
    if (!filterByTags(prompt, tags)) return false;
    if (!filterByFavorites(prompt, onlyFavorites)) return false;
    return true;
  });
}

/**
 * Extrae todos los tags únicos de una lista de prompts
 */
export function extractAllTags(prompts: Prompt[]): string[] {
  const tagSet = new Set<string>();
  prompts.forEach(prompt => {
    const tags = parseTags(prompt.tags);
    tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

/**
 * Estilo unificado para badges de categoría
 * El nombre de la categoría es el identificador, el color no añade significado
 */
export const CATEGORY_STYLE = 'bg-muted text-muted-foreground';

/**
 * Obtiene el estilo de una categoría (ahora unificado para todas)
 * @deprecated Usar CATEGORY_STYLE directamente
 */
export function getCategoryStyle(_category: string): string {
  return CATEGORY_STYLE;
}
