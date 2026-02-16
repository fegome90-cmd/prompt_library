/**
 * E2E Test Fixtures
 *
 * Provides shared test fixtures, helpers, and mock data for E2E tests.
 */

import { test as base, Page } from '@playwright/test';
import { LibraryPage } from '../pages/LibraryPage';
import { PromptComposerPage } from '../pages/PromptComposerPage';
import { StatsDashboardPage } from '../pages/StatsDashboardPage';

// Mock prompt data for tests
export const mockPrompts = [
  {
    id: 'test-prompt-1',
    title: 'Email de Bienvenida',
    description: 'Genera un email de bienvenida para nuevos clientes',
    body: 'Hola {nombre}, bienvenido a {empresa}. Estamos emocionados de tenerte con nosotros.',
    category: 'RRHH',
    tags: ['email', 'bienvenida', 'cliente'],
    status: 'published',
    riskLevel: 'low',
    version: '1.0',
    useCount: 25,
    thumbsUp: 20,
    thumbsDown: 2,
    isFavorite: true,
  },
  {
    id: 'test-prompt-2',
    title: 'Analisis de Sentimiento',
    description: 'Analiza el sentimiento de un texto dado',
    body: 'Analiza el siguiente texto y determina si el sentimiento es positivo, negativo o neutral: {texto}',
    category: 'General',
    tags: ['analisis', 'sentimiento', 'ia'],
    status: 'published',
    riskLevel: 'low',
    version: '1.0',
    useCount: 50,
    thumbsUp: 45,
    thumbsDown: 3,
    isFavorite: false,
  },
  {
    id: 'test-prompt-3',
    title: 'Contrato de Servicios',
    description: 'Genera un contrato basico de servicios',
    body: 'Contrato entre {parte_a} y {parte_b} para {servicio} por un monto de {monto}.',
    category: 'Legal',
    tags: ['contrato', 'legal', 'servicios'],
    status: 'published',
    riskLevel: 'medium',
    version: '2.0',
    useCount: 15,
    thumbsUp: 12,
    thumbsDown: 1,
    isFavorite: false,
  },
];

// PII test data
export const piiTestData = {
  lowRisk: 'Este es un texto normal sin datos sensibles',
  mediumRisk: 'Contactame a juan@email.com o al telefono +56912345678',
  highRisk: 'Mi RUT es 12.345.678-5 y gano $2.000.000 pesos',
  creditCard: 'Mi tarjeta es 4532-1234-5678-9012',
};

// Category test data
export const mockCategories = [
  { id: 'cat-1', name: 'General' },
  { id: 'cat-2', name: 'RRHH' },
  { id: 'cat-3', name: 'Legal' },
  { id: 'cat-4', name: 'Compras' },
];

// Extend base test with page objects
type PromptLibraryFixtures = {
  libraryPage: LibraryPage;
  composerPage: PromptComposerPage;
  statsPage: StatsDashboardPage;
};

export const test = base.extend<PromptLibraryFixtures>({
  libraryPage: async ({ page }, use) => {
    const libraryPage = new LibraryPage(page);
    await use(libraryPage);
  },
  composerPage: async ({ page }, use) => {
    const composerPage = new PromptComposerPage(page);
    await use(composerPage);
  },
  statsPage: async ({ page }, use) => {
    const statsPage = new StatsDashboardPage(page);
    await use(statsPage);
  },
});

export { expect } from '@playwright/test';
