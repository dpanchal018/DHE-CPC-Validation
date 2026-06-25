import { faker } from '@faker-js/faker';
import { expect, type Page } from '@playwright/test';
import type { CpcSettings } from '../data/locale-config';
import { selectSelect2Option } from './dropdown-validation';
import { clearVisibleValidationError } from './form-validation-setup';
import { fillFormControl } from './form-input';

export type RequiredProfileTestData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneCountryCodeValue: string;
  phone: string;
  countryOfResidence: string;
};

export async function buildRequiredProfileTestData(
  page: Page,
  settings: CpcSettings,
): Promise<RequiredProfileTestData> {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  const datalistOptions = await page.locator('#codedatalistOptions option').evaluateAll(
    (elements) =>
      elements.map((element) => ({
        text: element.textContent?.trim() ?? '',
        value: element.value,
      })),
  );
  const phoneCode = faker.helpers.arrayElement(datalistOptions);
  const countryOfResidence = await pickRandomSelectableCountry(page, settings);

  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phoneCountryCode: phoneCode.text,
    phoneCountryCodeValue: phoneCode.value,
    phone: faker.string.numeric(9),
    countryOfResidence,
  };
}

export async function applyRequiredProfileTestData(
  page: Page,
  settings: CpcSettings,
  testData: RequiredProfileTestData,
  fieldSelector?: string,
): Promise<void> {
  const profileSection = page.locator('#my-profile');

  const applyField = async (selector: string, apply: () => Promise<void>) => {
    if (fieldSelector && fieldSelector !== selector) return;
    await apply();
  };

  await applyField('#firstName', async () => {
    await fillFormControl(profileSection.locator('#firstName'), testData.firstName);
  });

  await applyField('input[name="lastName"]', async () => {
    await fillFormControl(
      profileSection.locator('input[name="lastName"]'),
      testData.lastName,
    );
  });

  await applyField('#email', async () => {
    await fillFormControl(profileSection.locator('#email'), testData.email);
  });

  await applyField('#country-code', async () => {
    await fillFormControl(
      profileSection.locator('#country-code'),
      testData.phoneCountryCodeValue,
    );
  });

  await applyField('#phone1', async () => {
    await fillFormControl(profileSection.locator('#phone1'), testData.phone);
  });

  await applyField('#profileCountry', async () => {
    await selectSelect2Option(page, '#profileCountry', testData.countryOfResidence);
    await clearVisibleValidationError(profileSection.locator('#profileCountry'));
    await expect(page.locator('#select2-profileCountry-container')).toHaveText(
      testData.countryOfResidence,
      { timeout: 10000 },
    );
  });
}

export async function pickRandomSelectableCountry(
  page: Page,
  settings: CpcSettings,
): Promise<string> {
  const options = await listSelectableCountries(page, settings);

  if (!options.length) {
    throw new Error('No selectable country options found for Country of Residence');
  }

  return faker.helpers.arrayElement(options);
}

async function listSelectableCountries(page: Page, settings: CpcSettings): Promise<string[]> {
  return page.locator('#profileCountry option').evaluateAll(
    (elements, prefixes) =>
      elements
        .map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
        .filter((text) => {
          if (!text) return false;
          const normalized = text.toLowerCase();
          return !prefixes.some((prefix) => normalized.startsWith(prefix.toLowerCase()));
        }),
    settings.dropdownPlaceholderPrefixes,
  );
}
