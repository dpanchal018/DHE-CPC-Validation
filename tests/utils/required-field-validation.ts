import { faker } from '@faker-js/faker';
import { test, expect, type Page } from '@playwright/test';
import type { CpcSettings } from '../data/locale-config';
import { LAST_NAME_SELECTOR, type ProfileField } from '../data/my-profile-fields';
import {
  clearVisibleValidationErrors,
  getVisibleValidationErrorLocator,
  showVisibleValidationError,
  usesVisibleValidationMessages,
} from './form-validation-setup';
import {
  applyRequiredProfileTestData,
  buildRequiredProfileTestData,
  type RequiredProfileTestData,
} from './profile-test-data';
import { writeValidationReport } from './validation-report';

const REQUIRED_FIELD_SELECTOR_ORDER = [
  '#firstName',
  LAST_NAME_SELECTOR,
  '#email',
  '#country-code',
  '#phone1',
  '#profileCountry',
];

type FieldValidityState = {
  valid: boolean;
  message: string;
};

type RequiredFieldReportRow = {
  field: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export async function validateBlankFormRequiredMessages(
  page: Page,
  settings: CpcSettings,
): Promise<RequiredProfileTestData> {
  const profileSection = page.locator('#my-profile');
  const saveButton = profileSection.getByRole('button', { name: settings.saveButtonName });
  const orderedFields = getOrderedRequiredFields(settings.profileFields);
  const testData = await buildRequiredProfileTestData(page, settings);
  const showVisibleErrors = usesVisibleValidationMessages(settings);

  await expect(saveButton, 'Save button should be visible').toBeVisible({
    timeout: 60000,
  });

  const reportRows: RequiredFieldReportRow[] = [];
  const validationPauseMs = getSequentialValidationPauseMs();

  for (const field of orderedFields) {
    await test.step(`Validate required message for ${field.label}`, async () => {
      const locator = profileSection.locator(field.selector);

      await triggerRequiredFieldValidation(page, saveButton, locator, showVisibleErrors);
      await pauseForValidationVisibility(page, validationPauseMs);

      const state = await readFieldValidity(locator);
      let visibleOnScreen = true;

      if (showVisibleErrors) {
        const visibleError = getVisibleValidationErrorLocator(locator);
        visibleOnScreen = (await visibleError.count()) > 0;
        await expect(
          visibleError,
          `${field.label} validation message should be visible on screen`,
        ).toBeVisible();
        await expect(visibleError).toHaveText(state.message);
      }

      const passed =
        !state.valid && state.message.trim().length > 0 && visibleOnScreen;

      reportRows.push({
        field: field.label,
        expected: 'Validation message shown on Save',
        actual: state.message || '(no validation message)',
        passed,
      });

      expect(
        state.valid,
        `${field.label} should be invalid when empty and Save is clicked`,
      ).toBe(false);
      expect(
        state.message.trim(),
        `${field.label} should show a validation message on Save`,
      ).not.toBe('');

      await applyRequiredProfileTestData(page, settings, testData, field.selector);

      const filledState = await readFieldValidity(locator);
      expect(
        filledState.valid,
        `${field.label} should be valid after filling test data`,
      ).toBe(true);

      if (validationPauseMs > 0) {
        await pauseForValidationVisibility(page, Math.min(validationPauseMs, 1500));
      }
    });
  }

  writeValidationReport('required-fields-blank-save.json', {
    dropdown: 'Required fields (sequential Save validation)',
    rows: reportRows.map((row) => ({
      expected: `${row.field}: ${row.expected}`,
      actual: row.actual,
      passed: row.passed,
    })),
  });

  return testData;
}

function getOrderedRequiredFields(profileFields: ProfileField[]): ProfileField[] {
  const requiredFields = profileFields.filter((field) => field.required);

  return REQUIRED_FIELD_SELECTOR_ORDER.map((selector) =>
    requiredFields.find((field) => field.selector === selector),
  ).filter((field): field is ProfileField => Boolean(field));
}

async function triggerRequiredFieldValidation(
  page: Page,
  saveButton: ReturnType<Page['locator']>,
  locator: ReturnType<Page['locator']>,
  showVisibleErrors: boolean,
): Promise<void> {
  await clearVisibleValidationErrors(page);
  await scrollFieldForValidation(locator);
  await saveButton.click();

  if (showVisibleErrors) {
    await locator.evaluate((element) => {
      element.checkValidity();
    });
    await showVisibleValidationError(locator);
  } else {
    await showNativeFieldValidation(locator);
  }
}

async function readFieldValidity(
  locator: ReturnType<Page['locator']>,
): Promise<FieldValidityState> {
  return locator.evaluate((element) => ({
    valid: element.validity.valid,
    message: element.validationMessage,
  }));
}

function getSequentialValidationPauseMs(): number {
  const configured = process.env.SEQUENTIAL_VALIDATION_PAUSE_MS?.trim();
  if (configured) {
    const parsed = Number.parseInt(configured, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return process.env.CI ? 0 : 4000;
}

async function pauseForValidationVisibility(page: Page, pauseMs: number): Promise<void> {
  if (pauseMs <= 0) return;
  await page.waitForTimeout(pauseMs);
}

async function scrollFieldForValidation(
  locator: ReturnType<Page['locator']>,
): Promise<void> {
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
}

async function showNativeFieldValidation(
  locator: ReturnType<Page['locator']>,
): Promise<void> {
  await locator.focus();
  await locator.evaluate((element) => {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.checkValidity();
      if (!element.validity.valid) {
        element.reportValidity();
      }
    }
  });
}
