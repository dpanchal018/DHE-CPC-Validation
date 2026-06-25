import { expect, type Page } from '@playwright/test';
import type { DropdownFieldConfig } from '../data/my-profile-dropdowns';
import type { ValidationRow } from './validation-report';

const COUNTRY_OF_RESIDENCE_SELECTOR = '#profileCountry';

export async function ensureCountryOfResidence(page: Page, country: string): Promise<void> {
  await selectSelect2Option(page, COUNTRY_OF_RESIDENCE_SELECTOR, country);

  const rendered = page.locator('#select2-profileCountry-container');
  await expect(rendered).toHaveText(country, { timeout: 10000 });
}

export async function selectSelect2Option(
  page: Page,
  selectSelector: string,
  value: string,
): Promise<void> {
  const dropdown = page.locator(selectSelector);
  const selectId = await dropdown.getAttribute('id');
  if (!selectId) {
    throw new Error(`Select2 dropdown ${selectSelector} is missing an id attribute`);
  }

  const rendered = page.locator(`#select2-${selectId}-container`);
  await rendered.click();

  const searchField = page.locator('.select2-container--open .select2-search__field');
  if (await searchField.count()) {
    await searchField.fill(value);
  }

  await page
    .locator('.select2-results__option')
    .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`) })
    .first()
    .click();
}

export async function validateSelectDropdown(
  page: Page,
  config: DropdownFieldConfig,
  expectedValues: string[],
): Promise<ValidationRow[]> {
  const dropdown = page.locator(config.selector);
  await expect(dropdown, `${config.label} should be attached`).toBeAttached();

  const isSelect2 = await dropdown.evaluate((element) =>
    element.classList.contains('select2-hidden-accessible'),
  );

  if (isSelect2) {
    return validateSelect2Dropdown(page, config, expectedValues);
  }

  await expect(dropdown, `${config.label} should be visible`).toBeVisible();

  const validationRows: ValidationRow[] = [];

  for (const expectedValue of expectedValues) {
    const selection = await selectNativeOptionByLabel(dropdown, expectedValue);

    if (!selection.found) {
      validationRows.push({
        expected: expectedValue,
        actual: '(not found in UI)',
        passed: false,
      });
      continue;
    }

    validationRows.push({
      expected: expectedValue,
      actual: selection.actual,
      passed: selection.actual === expectedValue,
    });
  }

  return validationRows;
}

async function validateSelect2Dropdown(
  page: Page,
  config: DropdownFieldConfig,
  expectedValues: string[],
): Promise<ValidationRow[]> {
  const dropdown = page.locator(config.selector);
  const selectId = await dropdown.getAttribute('id');
  if (!selectId) {
    throw new Error(`Select2 dropdown ${config.label} is missing an id attribute`);
  }

  const rendered = page.locator(`#select2-${selectId}-container`);
  await expect(rendered, `${config.label} Select2 should be visible`).toBeVisible();

  const validationRows: ValidationRow[] = [];

  for (const expectedValue of expectedValues) {
    await rendered.click();

    const searchField = page.locator('.select2-container--open .select2-search__field');
    if (await searchField.count()) {
      await searchField.fill(expectedValue);
    }

    const optionLocator = page
      .locator('.select2-results__option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(expectedValue)}\\s*$`) });

    if ((await optionLocator.count()) === 0) {
      await closeSelect2IfOpen(page);
      validationRows.push({
        expected: expectedValue,
        actual: '(not found in UI)',
        passed: false,
      });
      continue;
    }

    await optionLocator.first().click();

    const actualValue = (await rendered.textContent())?.trim() ?? '';
    validationRows.push({
      expected: expectedValue,
      actual: actualValue,
      passed: actualValue === expectedValue,
    });
  }

  return validationRows;
}

export async function validateDatalistDropdown(
  page: Page,
  config: DropdownFieldConfig,
  expectedValues: string[],
): Promise<ValidationRow[]> {
  const input = page.locator(config.selector);
  await expect(input, `${config.label} should be visible`).toBeVisible();

  const datalistId = config.datalistId;
  if (!datalistId) {
    throw new Error(`datalistId is required for ${config.label}`);
  }

  const validationRows: ValidationRow[] = [];

  for (const expectedValue of expectedValues) {
    await input.click();

    const matchedOption = await findDatalistOption(page, datalistId, expectedValue);

    if (!matchedOption) {
      validationRows.push({
        expected: expectedValue,
        actual: '(not found in UI)',
        passed: false,
      });
      continue;
    }

    await input.fill(matchedOption.value);
    const actualValue = matchedOption.text;
    const passed =
      actualValue === expectedValue || actualValue.startsWith(expectedValue);

    validationRows.push({
      expected: expectedValue,
      actual: actualValue,
      passed,
    });
  }

  return validationRows;
}

type DatalistOption = { text: string; value: string };

async function findDatalistOption(
  page: Page,
  datalistId: string,
  expectedValue: string,
): Promise<DatalistOption | null> {
  const options = await page.locator(`#${datalistId} option`).evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent?.trim() ?? '',
      value: element.value,
    })),
  );

  const exact = options.find((option) => option.text === expectedValue);
  if (exact) return exact;

  const prefix = options.find((option) => option.text.startsWith(expectedValue));
  if (prefix) return prefix;

  const contains = options.find((option) => option.text.includes(expectedValue));
  if (contains) return contains;

  return null;
}

async function selectNativeOptionByLabel(
  dropdown: ReturnType<Page['locator']>,
  expectedValue: string,
): Promise<{ found: boolean; actual: string }> {
  return dropdown.evaluate((select, expected) => {
    const option = Array.from(select.options).find(
      (entry) => entry.textContent?.trim() === expected,
    );

    if (!option) {
      return { found: false, actual: '' };
    }

    select.value = option.value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));

    return { found: true, actual: option.textContent?.trim() ?? '' };
  }, expectedValue);
}

async function closeSelect2IfOpen(page: Page): Promise<void> {
  if (await page.locator('.select2-container--open').count()) {
    await page.keyboard.press('Escape');
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitizeReportFileName(reportKey: string): string {
  return reportKey.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
}
