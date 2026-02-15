/**
 * E2E Tests: Security Banner and PII Detection
 *
 * Tests the security warning functionality:
 * - Security banner displays on page load
 * - PII detection in composer
 * - Risk level indicators
 * - Warning display for sensitive data
 */

import { test, expect } from './fixtures';
import { LibraryPage } from './pages/LibraryPage';
import { PromptComposerPage } from './pages/PromptComposerPage';
import { piiTestData } from './fixtures';

test.describe('Security Banner', () => {
  let libraryPage: LibraryPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
  });

  test('should display security reminder banner on page load', async ({ page }) => {
    // Security banner should be visible
    const securityBanner = page.locator('[class*="warning"], [class*="Shield"]')
      .filter({ hasText: /Seguridad|Security/i });

    await expect(securityBanner.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show security reminder text', async ({ page }) => {
    // Check for key security terms in the banner
    const bannerText = await page.locator('[class*="warning"]').first().textContent() || '';

    expect(bannerText).toMatch(/No pegues datos sensibles|sensitive|PII|RUT|datos cl/i);
  });

  test('should be dismissible', async ({ page }) => {
    // Find and click dismiss button on security banner
    const dismissButton = page.locator('[class*="warning"] button')
      .filter({ has: page.locator('svg') })
      .first();

    if (await dismissButton.isVisible()) {
      await dismissButton.click();

      // Banner should no longer be visible
      await page.waitForTimeout(500);

      // Check if banner is hidden or removed
      const banner = page.locator('[class*="warning"]').first();
      const isVisible = await banner.isVisible();
      expect(isVisible).toBe(false);
    }
  });
});

test.describe('PII Detection in Composer', () => {
  let libraryPage: LibraryPage;
  let composerPage: PromptComposerPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    composerPage = new PromptComposerPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
  });

  test('should detect email as medium risk', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Fill variable with email
    const inputs = page.locator('[role="dialog"] input, [role="dialog"] textarea');
    const firstInput = inputs.first();

    if (await firstInput.isVisible()) {
      await firstInput.fill(piiTestData.mediumRisk);
      await page.waitForTimeout(1000);

      // Risk level should be medium
      const riskLevel = await composerPage.getRiskLevel();
      expect(riskLevel).toBe('medium');
    }
  });

  test('should detect RUT as high risk', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Fill variable with RUT
    const inputs = page.locator('[role="dialog"] input, [role="dialog"] textarea');
    const firstInput = inputs.first();

    if (await firstInput.isVisible()) {
      await firstInput.fill(piiTestData.highRisk);
      await page.waitForTimeout(1000);

      // Risk level should be high
      const riskLevel = await composerPage.getRiskLevel();
      expect(riskLevel).toBe('high');
    }
  });

  test('should detect credit card as high risk', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Fill variable with credit card number
    const inputs = page.locator('[role="dialog"] input, [role="dialog"] textarea');
    const firstInput = inputs.first();

    if (await firstInput.isVisible()) {
      await firstInput.fill(piiTestData.creditCard);
      await page.waitForTimeout(1000);

      // Risk level should be high
      const riskLevel = await composerPage.getRiskLevel();
      expect(riskLevel).toBe('high');
    }
  });

  test('should show high risk warning when copying', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Fill with high risk data
    const inputs = page.locator('[role="dialog"] input, [role="dialog"] textarea');
    const firstInput = inputs.first();

    if (await firstInput.isVisible()) {
      await firstInput.fill(piiTestData.highRisk);
      await page.waitForTimeout(500);

      // Try to copy
      await composerPage.clickCopy();

      // High risk warning should appear
      const warningVisible = await composerPage.isHighRiskWarningVisible();
      expect(warningVisible).toBe(true);
    }
  });

  test('should allow dismissing high risk warning', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Fill with high risk data
    const inputs = page.locator('[role="dialog"] input, [role="dialog"] textarea');
    const firstInput = inputs.first();

    if (await firstInput.isVisible()) {
      await firstInput.fill(piiTestData.highRisk);
      await page.waitForTimeout(500);

      // Try to copy - triggers warning
      await composerPage.clickCopy();

      // Dismiss warning
      await composerPage.dismissHighRiskWarning();
      await page.waitForTimeout(500);

      // Warning should be dismissed
      const warningVisible = await composerPage.isHighRiskWarningVisible();
      expect(warningVisible).toBe(false);
    }
  });

  test('should update risk badge color based on risk level', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    const inputs = page.locator('[role="dialog"] input, [role="dialog"] textarea');
    const firstInput = inputs.first();

    if (await firstInput.isVisible()) {
      // Start with low risk
      await firstInput.fill(piiTestData.lowRisk);
      await page.waitForTimeout(500);

      let riskLevel = await composerPage.getRiskLevel();
      expect(riskLevel).toBe('low');

      // Change to high risk
      await firstInput.fill(piiTestData.highRisk);
      await page.waitForTimeout(500);

      riskLevel = await composerPage.getRiskLevel();
      expect(riskLevel).toBe('high');
    }
  });
});

test.describe('Security Warning Display', () => {
  let libraryPage: LibraryPage;
  let composerPage: PromptComposerPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    composerPage = new PromptComposerPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
  });

  test('should show PII type badges when data detected', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Fill with PII data
    const inputs = page.locator('[role="dialog"] input, [role="dialog"] textarea');
    const firstInput = inputs.first();

    if (await firstInput.isVisible()) {
      await firstInput.fill(piiTestData.mediumRisk);
      await page.waitForTimeout(1000);

      // Look for "Ver detalles" button
      const detailsButton = page.locator('button:has-text("Ver detalles"), button:has-text("detalles")');
      if (await detailsButton.count() > 0) {
        await detailsButton.first().click();

        // Badge for detected type should be visible
        const badge = page.locator('[class*="badge"], [class*="Badge"]')
          .filter({ hasText: /email|correo/i });
        await expect(badge.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
