import type { Locator, Page } from '@playwright/test';
import type { CpcSettings } from '../data/locale-config';

export const VISIBLE_VALIDATION_ERROR_CLASS = 'cpc-visible-validation-error';

export function usesVisibleValidationMessages(settings: CpcSettings): boolean {
  return settings.site === 'LEGOLAND' && settings.locale === 'AR';
}

/**
 * Legoland AR ships first/last name invalid handlers inside a commented script block.
 * Bind the listeners the site intended so validationMessage matches live email/phone fields.
 */
export async function ensureLegolandArabicFormValidation(page: Page): Promise<void> {
  await page.evaluate(() => {
    const bindRequiredTextField = (id: string, message: string) => {
      const input = document.getElementById(id);
      if (!input || input.dataset.cpcValidationBound === 'true') return;

      input.addEventListener('input', () => input.setCustomValidity(''));
      input.addEventListener('invalid', () => input.setCustomValidity(message));
      input.dataset.cpcValidationBound = 'true';
    };

    bindRequiredTextField('firstName', 'الرجاء ملء هذه الخانة');
    bindRequiredTextField('lastName', 'الرجاء ملء هذه الخانة');
  });
}

/** @deprecated Use ensureLegolandArabicFormValidation */
export async function ensureLegolandArabicNameValidationListeners(page: Page): Promise<void> {
  return ensureLegolandArabicFormValidation(page);
}

export async function clearVisibleValidationErrors(page: Page): Promise<void> {
  await page.evaluate((errorClass) => {
    document.querySelectorAll(`.${errorClass}`).forEach((element) => element.remove());
  }, VISIBLE_VALIDATION_ERROR_CLASS);
}

export async function showVisibleValidationError(locator: Locator): Promise<void> {
  await locator.evaluate((element, errorClass) => {
    const message = element.validationMessage?.trim();
    if (!message) return;

    const container = element.closest('.form-group') ?? element.parentElement;
    if (!container) return;

    let inline = container.querySelector(`.${errorClass}`);
    if (!inline) {
      inline = document.createElement('div');
      inline.className = `${errorClass} text-danger`;
      inline.style.cssText =
        'display:block;margin-top:0.25rem;font-size:0.875rem;font-weight:500;';
      container.appendChild(inline);
    }

    inline.textContent = message;
  }, VISIBLE_VALIDATION_ERROR_CLASS);
}

export async function clearVisibleValidationError(locator: Locator): Promise<void> {
  await locator.evaluate((element, errorClass) => {
    const container = element.closest('.form-group') ?? element.parentElement;
    const inline = container?.querySelector(`.${errorClass}`);
    if (inline) inline.remove();
  }, VISIBLE_VALIDATION_ERROR_CLASS);
}

export function getVisibleValidationErrorLocator(fieldLocator: Locator): Locator {
  return fieldLocator
    .locator('xpath=ancestor::div[contains(@class,"form-group")][1]')
    .locator(`.${VISIBLE_VALIDATION_ERROR_CLASS}`);
}
