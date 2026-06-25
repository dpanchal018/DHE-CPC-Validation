import { expect, type Page } from '@playwright/test';
import { getCpcSettings } from '../data/locale-config';
import { ensureLegolandArabicFormValidation } from './form-validation-setup';

export async function openCpcMyProfile(page: Page) {
  const settings = getCpcSettings();
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(settings.cpcUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

      if (settings.site === 'LEGOLAND' && settings.locale === 'EN') {
        await ensureLegolandEnglish(page);
      }

      if (settings.site === 'LEGOLAND' && settings.locale === 'AR') {
        await ensureLegolandArabic(page);
        await ensureLegolandArabicFormValidation(page);
      }

      await expect(page.locator('#my-profile-tab')).toBeVisible({ timeout: 90000 });
      await expect(page.locator('#my-profile')).toBeVisible({ timeout: 90000 });
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await page.waitForTimeout(2000);
    }
  }
}

async function ensureLegolandEnglish(page: Page) {
  const myProfileTab = page.locator('#my-profile-tab');
  const tabLabel = (await myProfileTab.textContent())?.replace(/\s+/g, ' ').trim() ?? '';

  if (/MY PROFILE/i.test(tabLabel)) {
    return;
  }

  const englishLink = page.getByRole('link', { name: 'ENGLISH' });
  if (await englishLink.count() === 0) {
    return;
  }

  await englishLink.click();
  await page.waitForLoadState('domcontentloaded');
  await expect(myProfileTab).toHaveText(/MY PROFILE/i, { timeout: 30000 });
}

async function ensureLegolandArabic(page: Page) {
  const myProfileTab = page.locator('#my-profile-tab');
  const tabLabel = (await myProfileTab.textContent())?.replace(/\s+/g, ' ').trim() ?? '';

  if (/الملف الشخصي/.test(tabLabel)) {
    return;
  }

  const arabicLink = page.getByRole('link', { name: /ARABIC|العربية/i });
  if (await arabicLink.count() === 0) {
    return;
  }

  await arabicLink.first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(myProfileTab).toHaveText(/الملف الشخصي/, { timeout: 30000 });
}

/** @deprecated Use openCpcMyProfile() */
export async function openLegolandMyProfile(page: Page) {
  return openCpcMyProfile(page);
}
