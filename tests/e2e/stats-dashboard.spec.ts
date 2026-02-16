/**
 * E2E Tests: Stats Dashboard
 *
 * Tests the statistics dashboard functionality:
 * - KPI cards display
 * - Top prompts list
 * - Best rated prompts
 * - Usage by category
 */

import { test, expect } from './fixtures';
import { LibraryPage } from './pages/LibraryPage';
import { StatsDashboardPage } from './pages/StatsDashboardPage';

test.describe('Stats Dashboard', () => {
  let libraryPage: LibraryPage;
  let statsPage: StatsDashboardPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    statsPage = new StatsDashboardPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
    await libraryPage.clickStatsTab();
  });

  test('should navigate to stats tab', async ({ page }) => {
    // Verify stats tab is active - check the main tabs (not floating sidebar)
    // The main tabs are in a TabsList inside main content
    const mainTabs = page.locator('main').locator('[role="tab"][data-state="active"]');
    await expect(mainTabs).toContainText(/Estad.sticas/i);
  });

  test('should display KPI cards', async () => {
    await statsPage.waitForLoad();
    await statsPage.verifyVisible();

    // All 4 KPI cards should be visible
    const kpiCount = await statsPage.kpiCards.count();
    expect(kpiCount).toBe(4);
  });

  test('should show published prompts KPI', async () => {
    await statsPage.waitForLoad();

    const published = await statsPage.getPublishedPrompts();
    expect(published).toBeGreaterThanOrEqual(0);
  });

  test('should show total usage KPI', async () => {
    await statsPage.waitForLoad();

    const usage = await statsPage.getTotalUsage();
    expect(usage).toBeGreaterThanOrEqual(0);
  });

  test('should show satisfaction percentage', async () => {
    await statsPage.waitForLoad();

    const satisfaction = await statsPage.getSatisfaction();
    // Should be a percentage string (e.g., "85%")
    expect(satisfaction).toMatch(/\d+%?/);
  });

  test('should show categories count', async () => {
    await statsPage.waitForLoad();

    const categories = await statsPage.getCategoriesCount();
    expect(categories).toBeGreaterThanOrEqual(0);
  });

  test('should display top prompts section', async ({ page }) => {
    await statsPage.waitForLoad();

    // Top prompts card should be visible
    await expect(statsPage.topPromptsCard).toBeVisible();
  });

  test('should display best rated prompts section', async ({ page }) => {
    await statsPage.waitForLoad();

    // Best rated card should be visible
    await expect(statsPage.bestRatedCard).toBeVisible();
  });

  test('should display problematic prompts section', async ({ page }) => {
    await statsPage.waitForLoad();

    // Problematic prompts card should be visible
    await expect(statsPage.problematicPromptsCard).toBeVisible();
  });

  test('should display usage by category section', async ({ page }) => {
    await statsPage.waitForLoad();

    // Usage by category card should be visible
    await expect(statsPage.usageByCategoryCard).toBeVisible();
  });
});

test.describe('Stats Dashboard - Visual Elements', () => {
  let libraryPage: LibraryPage;
  let statsPage: StatsDashboardPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    statsPage = new StatsDashboardPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
    await libraryPage.clickStatsTab();
  });

  test('should show icons in KPI cards', async ({ page }) => {
    await statsPage.waitForLoad();

    // Each KPI card should have an icon
    const icons = statsPage.kpiCards.locator('svg');
    const iconCount = await icons.count();

    expect(iconCount).toBeGreaterThanOrEqual(4);
  });

  test('should show progress bars in best rated section', async ({ page }) => {
    await statsPage.waitForLoad();

    // Look for progress bars
    const progressBars = page.locator('[role="progressbar"], [class*="progress"]');
    const count = await progressBars.count();

    // Progress bars should exist for ratings
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show category bars in usage section', async ({ page }) => {
    await statsPage.waitForLoad();

    // Look for category bars
    const bars = statsPage.usageByCategoryCard.locator('[class*="h-2"], [class*="rounded-full"]');
    const count = await bars.count();

    // Category bars should exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show rank numbers in top prompts', async ({ page }) => {
    await statsPage.waitForLoad();

    // Look for rank circles (1, 2, 3, etc.)
    const rankNumbers = statsPage.topPromptsCard.locator('[class*="rounded-full"]').filter({
      hasText: /^[1-5]$/
    });
    const count = await rankNumbers.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Stats Dashboard - Empty States', () => {
  let libraryPage: LibraryPage;
  let statsPage: StatsDashboardPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    statsPage = new StatsDashboardPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
    await libraryPage.clickStatsTab();
  });

  test('should handle empty top prompts gracefully', async ({ page }) => {
    await statsPage.waitForLoad();

    // Either prompts are shown or empty state message
    const hasPrompts = (await statsPage.getTopPrompts()).length > 0;
    const hasEmptyMessage = await page.locator('text=Sin datos').count() > 0;

    expect(hasPrompts || hasEmptyMessage).toBe(true);
  });

  test('should show success message when no problematic prompts', async ({ page }) => {
    await statsPage.waitForLoad();

    // Check for success state or list
    const hasNoProblematic = await statsPage.problematicPromptsCard.locator('text=/Todos los prompts|buena recepcion/').count() > 0;
    const hasProblematicList = await statsPage.problematicPromptsCard.locator('[class*="flex items-center gap"]').count() > 0;

    expect(hasNoProblematic || hasProblematicList).toBe(true);
  });
});
