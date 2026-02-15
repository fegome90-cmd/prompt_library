/**
 * WO-0005: Validación Zod para DTOs de API
 * Esquemas de validación para prompts
 */
import { z } from 'zod';

// Esquema para crear un prompt
export const createPromptSchema = z.object({
  title: z.string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .default(''),
  body: z.string()
    .min(1, 'El cuerpo del prompt es requerido'),
  category: z.string()
    .min(1, 'La categoría es requerida'),
  tags: z.array(z.string())
    .optional()
    .default([]),
  variablesSchema: z.array(z.any())
    .optional()
    .default([]),
  outputFormat: z.string()
    .optional(),
  examples: z.array(z.any())
    .optional()
    .default([]),
  riskLevel: z.enum(['low', 'medium', 'high'])
    .optional()
    .default('low'),
  changelog: z.string()
    .optional(),
  authorId: z.string()
    .optional(),
});

// Esquema para actualizar un prompt (todos los campos opcionales)
export const updatePromptSchema = z.object({
  title: z.string()
    .min(1, 'El título no puede estar vacío')
    .max(200, 'El título no puede exceder 200 caracteres')
    .optional(),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  body: z.string()
    .min(1, 'El cuerpo no puede estar vacío')
    .optional(),
  category: z.string()
    .min(1, 'La categoría no puede estar vacía')
    .optional(),
  tags: z.array(z.string())
    .optional(),
  variablesSchema: z.array(z.any())
    .optional(),
  outputFormat: z.string()
    .optional(),
  examples: z.array(z.any())
    .optional(),
  riskLevel: z.enum(['low', 'medium', 'high'])
    .optional(),
  changelog: z.string()
    .optional(),
  isFavorite: z.boolean()
    .optional(),
});

// Esquema para feedback
export const feedbackSchema = z.object({
  feedback: z.enum(['thumbs_up', 'thumbs_down'])
    .nullable()
    .optional(),
  comment: z.string()
    .max(200, 'El comentario no puede exceder 200 caracteres')
    .optional(),
  dataRiskLevel: z.enum(['low', 'medium', 'high'])
    .optional(),
  variablesUsed: z.record(z.string(), z.string())
    .optional(),
});

// Tipo para errores de validación
export type ValidationError = {
  error: string;
  details?: Record<string, string[]>;
};

// Helper para formatear errores de Zod
export function formatZodError(error: z.ZodError): ValidationError {
  const details: Record<string, string[]> = {};
  
  error.issues.forEach((err) => {
    const path = err.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });
  
  return {
    error: 'Datos inválidos',
    details,
  };
}
