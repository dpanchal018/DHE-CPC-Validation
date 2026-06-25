import type { Locator } from '@playwright/test';
import { clearVisibleValidationError } from './form-validation-setup';

/** Fill a native control and dispatch input/change so custom validity clears (AR CPC). */
export async function fillFormControl(locator: Locator, value: string): Promise<void> {
  await locator.fill(value);
  await clearVisibleValidationError(locator);
  await locator.evaluate((element) => {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}
