/**
 * Page Object Model for the Stats Dashboard
 *
 * Encapsulates interactions with:
 * - KPI cards
 * - Top prompts list
 * - Best rated prompts
 * - Problematic prompts
 * - Usage by category
 */

import { Page, Locator, expect } from '@playwright/test';

export class StatsDashboardPage {
  readonly page: Page;
  readonly container: Locator;
  readonly kpiCards: Locator;
  readonly topPromptsCard: Locator;
  readonly bestRatedCard: Locator;
  readonly problematicPromptsCard: Locator;
  readonly usageByCategoryCard: Locator;

  // KPI specific locators
  readonly publishedPromptsKpi: Locator;
  readonly totalUsageKpi: Locator;
  readonly satisfactionKpi: Locator;
  readonly categoriesKpi: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="stats-dashboard"], .space-y-6').first();

    // KPI Cards
    this.kpiCards = this.container.locator('> .grid > div');
    this.publishedPromptsKpi = this.kpiCards.filter({ hasText: /Publicados|Published/ });
    this.totalUsageKpi = this.kpiCards.filter({ hasText: /Usos|Usage|Totales/ });
    this.satisfactionKpi = this.kpiCards.filter({ hasText: /Satisfaccion|Satisfaction/ });
    this.categoriesKpi = this.kpiCards.filter({ hasText: /Categorias|Categories/ });

    // Chart/List Cards
    this.topPromptsCard = this.container.locator('text=/Mas Usados|Most Used|Top/').locator('..').first();
    this.bestRatedCard = this.container.locator('text=/Mejor Valorados|Best Rated/').locator('..').first();
    this.problematicPromptsCard = this.container.locator('text=/Atencion|Attention|Problematic|Requieren/').locator('..').first();
    this.usageByCategoryCard = this.container.locator('text=/Por Categoria|By Category/').locator('..').first();
  }

  /**
   * Wait for stats to load
   */
  async waitForLoad() {
    await this.container.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for loading state to finish
    await this.page.waitForFunction(() => {
      const loading = document.body.textContent?.includes('Cargando estadisticas');
      const kpis = document.querySelectorAll('.grid.grid-cols-2 > div');
      return !loading && kpis.length > 0;
    }, { timeout: 15000 });
  }

  /**
   * Get KPI value by name
   */
  async getKpiValue(kpiName: string): Promise<string> {
    const kpiCard = this.kpiCards.filter({ hasText: new RegExp(kpiName, 'i') });
    const valueElement = kpiCard.locator('p.text-2xl');
    return await valueElement.textContent() || '0';
  }

  /**
   * Get number of published prompts
   */
  async getPublishedPrompts(): Promise<number> {
    const text = await this.getKpiValue('Publicados');
    return parseInt(text, 10) || 0;
  }

  /**
   * Get total usage count
   */
  async getTotalUsage(): Promise<number> {
    const text = await this.getKpiValue('Usos');
    return parseInt(text, 10) || 0;
  }

  /**
   * Get satisfaction percentage
   */
  async getSatisfaction(): Promise<string> {
    return await this.getKpiValue('Satisfaccion');
  }

  /**
   * Get categories count
   */
  async getCategoriesCount(): Promise<number> {
    const text = await this.getKpiValue('Categorias');
    return parseInt(text, 10) || 0;
  }

  /**
   * Get top prompts list items
   */
  async getTopPrompts(): Promise<string[]> {
    const items = this.topPromptsCard.locator('[class*="flex items-center gap"]');
    const count = await items.count();
    const prompts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent() || '';
      prompts.push(text.trim());
    }
    return prompts;
  }

  /**
   * Check if there are problematic prompts
   */
  async hasProblematicPrompts(): Promise<boolean> {
    const emptyMessage = this.problematicPromptsCard.locator('text=/Todos los prompts|All prompts/');
    return !(await emptyMessage.isVisible());
  }

  /**
   * Verify stats dashboard is visible
   */
  async verifyVisible() {
    await expect(this.container).toBeVisible({ timeout: 10000 });
    await expect(this.kpiCards.first()).toBeVisible();
  }

  /**
   * Get usage by category data
   */
  async getUsageByCategory(): Promise<{ category: string; uses: number }[]> {
    const items = this.usageByCategoryCard.locator('[class*="space-y"]');
    const count = await items.count();
    const categories: { category: string; uses: number }[] = [];

    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent() || '';
      const match = text.match(/(.+?)\s+(\d+)\s*usos/);
      if (match) {
        categories.push({
          category: match[1].trim(),
          uses: parseInt(match[2], 10)
        });
      }
    }
    return categories;
  }
}
