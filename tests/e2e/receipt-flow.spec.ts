import { test, expect } from '@playwright/test';

/**
 * End-to-end smoke covering the six seed receipts path:
 * queue → select → detail visible → copilot panel present.
 * Full agent execution requires MODEL_API_KEY and is covered in evaluation/golden cases.
 */
test.describe('Receipt queue and detail', () => {
  test('dashboard loads and shows queue', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByLabel('Receipt queue')).toBeVisible({ timeout: 15_000 });
  });

  test('selecting a receipt updates detail pane', async ({ page }) => {
    await page.goto('/dashboard');
    const queue = page.getByLabel('Receipt queue');
    await expect(queue).toBeVisible({ timeout: 15_000 });

    // Click first option if present
    const first = queue.getByRole('option').first();
    if (await first.count()) {
      await first.click();
      await expect(page.getByRole('article')).toBeVisible();
    }
  });

  test('copilot panel is present', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'AI Copilot' })).toBeVisible({ timeout: 15_000 });
  });

  test('approval panel is present', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByLabel('Pending approvals').or(page.getByText('No items pending human review'))).toBeVisible({
      timeout: 15_000,
    });
  });
});
