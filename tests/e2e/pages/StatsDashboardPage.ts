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
    this.container = page.locator('[data-testid="stats-dashboard"]');

    // KPI Cards - use data-testid for stable selectors
    this.kpiCards = this.container.locator('[data-testid="kpi-grid"] > div');
    this.publishedPromptsKpi = this.container.locator('[data-testid="kpi-published"]');
    this.totalUsageKpi = this.container.locator('[data-testid="kpi-usage"]');
    this.satisfactionKpi = this.container.locator('[data-testid="kpi-satisfaction"]');
    this.categoriesKpi = this.container.locator('[data-testid="kpi-categories"]');

    // Chart/List Cards - use data-testid for stable selectors
    this.topPromptsCard = this.container.locator('[data-testid="top-prompts-card"]');
    this.bestRatedCard = this.container.locator('[data-testid="best-rated-card"]');
    this.problematicPromptsCard = this.container.locator('[data-testid="problematic-prompts-card"]');
    this.usageByCategoryCard = this.container.locator('[data-testid="usage-by-category-card"]');
  }

  /**
   * Wait for stats to load
   */
  async waitForLoad() {
    await this.container.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for KPI grid to be populated
    await this.page.waitForFunction(() => {
      const kpiGrid = document.querySelector('[data-testid="kpi-grid"]');
      const kpiCards = kpiGrid?.querySelectorAll('[data-testid^="kpi-"]');
      return kpiCards && kpiCards.length >= 4;
    }, { timeout: 15000 });
  }

  /**
   * Get KPI value by name (using data-testid)
   */
  async getKpiValue(kpiName: string): Promise<string> {
    // Map common names to testids
    const testidMap: Record<string, string> = {
      'publicados': 'kpi-published',
      'published': 'kpi-published',
      'usos': 'kpi-usage',
      'usage': 'kpi-usage',
      'totales': 'kpi-usage',
      'satisfaccion': 'kpi-satisfaction',
      'satisfaction': 'kpi-satisfaction',
      'categorias': 'kpi-categories',
      'categories': 'kpi-categories',
    };

    const testid = testidMap[kpiName.toLowerCase()] || `kpi-${kpiName.toLowerCase()}`;
    const kpiCard = this.container.locator(`[data-testid="${testid}"]`);

    // Wait for card to be visible
    await kpiCard.waitFor({ state: 'visible', timeout: 10000 });

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
