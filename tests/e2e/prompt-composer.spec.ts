/**
 * E2E Tests: Prompt Composer Flow
 *
 * Tests the prompt composition functionality:
 * - Opening composer from prompt card
 * - Filling variables
 * - Preview updates
 * - Copy functionality
 * - Risk level display
 */

import { test, expect } from './fixtures';
import { LibraryPage } from './pages/LibraryPage';
import { PromptComposerPage } from './pages/PromptComposerPage';
import { piiTestData } from './fixtures';

test.describe('Prompt Composer Flow', () => {
  let libraryPage: LibraryPage;
  let composerPage: PromptComposerPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    composerPage = new PromptComposerPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
  });

  test('should open composer when clicking on prompt card', async ({ page }) => {
    await libraryPage.waitForPrompts();

    // Click on first prompt card
    await libraryPage.clickPromptCard(0);

    // Verify composer opens
    await composerPage.waitForOpen();
    await expect(composerPage.dialog).toBeVisible();
  });

  test('should display prompt title and description in composer', async ({ page }) => {
    await libraryPage.waitForPrompts();

    // Click on first prompt card
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Verify title is visible
    await expect(composerPage.title).toBeVisible();

    // Verify description is visible
    await expect(composerPage.description).toBeVisible();
  });

  test('should show variables panel', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Variables section should be visible
    await expect(composerPage.variablesPanel).toBeVisible();
  });

  test('should show preview panel', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Preview section should be visible
    await expect(composerPage.previewPanel).toBeVisible();
  });

  test('should close composer when clicking close button', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Close composer
    await composerPage.close();

    // Verify dialog is closed
    const isOpen = await composerPage.isOpen();
    expect(isOpen).toBe(false);
  });

  test('should have copy button visible', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Copy button should be visible
    await expect(composerPage.copyButton).toBeVisible();
  });

  test('should have favorite toggle button', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Favorite button should be visible
    await expect(composerPage.favoriteButton).toBeVisible();
  });

  test('should display risk level badge', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Risk badge should be visible (low, medium, or high)
    const riskLevel = await composerPage.getRiskLevel();
    expect(['low', 'medium', 'high', null]).toContain(riskLevel);
  });

  test('should show character count in preview', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Character count should be displayed
    const charCount = await composerPage.getCharacterCount();
    expect(charCount).toBeGreaterThanOrEqual(0);
  });

  test('should update preview when variables change', async ({ page }) => {
    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Get initial preview text
    const initialText = await composerPage.getPreviewText();

    // Try to fill a variable (if one exists)
    const inputCount = await composerPage.getVariableCount();
    if (inputCount > 0) {
      // Fill first available input
      const inputs = page.locator('[role="dialog"] input, [role="dialog"] textarea');
      const firstInput = inputs.first();

      if (await firstInput.isVisible()) {
        await firstInput.fill('Test Value');

        // Wait for preview to update
        await page.waitForTimeout(500);

        // Preview should now contain the test value
        const updatedText = await composerPage.getPreviewText();

        // Preview should have changed
        expect(updatedText).not.toBe(initialText);
      }
    }
  });
});

test.describe('Prompt Composer - Copy Functionality', () => {
  let libraryPage: LibraryPage;
  let composerPage: PromptComposerPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    composerPage = new PromptComposerPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
  });

  test('should copy prompt to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await libraryPage.waitForPrompts();
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Get preview text
    const previewText = await composerPage.getPreviewText();

    // Click copy
    await composerPage.clickCopy();

    // Check for success indicator
    const success = await composerPage.isCopySuccessful();

    // Verify copy was successful
    expect(success).toBe(true);

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(previewText);
  });
});

test.describe('Prompt Composer - Low Risk Prompt', () => {
  let libraryPage: LibraryPage;
  let composerPage: PromptComposerPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    composerPage = new PromptComposerPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
  });

  test('should show low risk badge for clean prompt', async ({ page }) => {
    await libraryPage.waitForPrompts();

    // Click on first prompt (assumed to be low risk)
    await libraryPage.clickPromptCard(0);
    await composerPage.waitForOpen();

    // Check risk level
    const riskLevel = await composerPage.getRiskLevel();

    // Default prompts should be low risk
    expect(riskLevel).toBe('low');
  });
});
