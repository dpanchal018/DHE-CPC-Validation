import { faker } from '@faker-js/faker';
import { expect, type Page } from '@playwright/test';
import { LAST_NAME_SELECTOR } from '../data/my-profile-fields';
import { getCpcSettings } from '../data/locale-config';
import type { RequiredProfileTestData } from './profile-test-data';
import { applyRequiredProfileTestData, pickRandomSelectableCountry } from './profile-test-data';
import {
  ensureCountryOfResidence,
  selectSelect2Option,
} from './dropdown-validation';
import { fillFormControl } from './form-input';

const BIRTHDAY_START = new Date(Date.UTC(1970, 0, 1));
const BIRTHDAY_END = new Date(Date.UTC(2010, 11, 12));
const CHILD_BIRTHDAY_START = new Date(Date.UTC(2000, 0, 1));

export type ChildProfileData = {
  name: string;
  birthday: string;
  gender: string;
};

export type FilledProfileData = {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  countryOfResidence: string;
  city: string;
  nationality: string;
  gender: string;
  birthday: string;
  language: string;
  maritalStatus: string;
  hasChildren: boolean;
  numberOfChildren?: string;
  children?: ChildProfileData[];
};

export function randomChildBirthday(): string {
  const today = new Date();
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const timestamp = faker.number.int({
    min: CHILD_BIRTHDAY_START.getTime(),
    max: end,
  });
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function randomBirthday(): string {
  const timestamp = faker.number.int({
    min: BIRTHDAY_START.getTime(),
    max: BIRTHDAY_END.getTime(),
  });
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isPlaceholderOption(text: string, prefixes: string[]): boolean {
  const normalized = text.trim().toLowerCase();
  return prefixes.some((prefix) => normalized.startsWith(prefix.toLowerCase()));
}

export async function fillMyProfileForm(
  page: Page,
  options?: { requiredFieldValues?: RequiredProfileTestData },
): Promise<FilledProfileData> {
  const {
    site,
    locale,
    dropdownPlaceholderPrefixes,
    languagePreferenceSelector,
  } = getCpcSettings();
  const isLegolandEn = site === 'LEGOLAND' && locale === 'EN';
  const profileSection = page.locator('#my-profile');
  const preservedRequired = options?.requiredFieldValues;

  if (preservedRequired) {
    await applyRequiredProfileTestData(page, getCpcSettings(), preservedRequired);
  }

  const title = await selectRandomNativeOption(
    page,
    'select[name="profileSalutation"]',
    dropdownPlaceholderPrefixes,
  );

  const firstName = preservedRequired?.firstName ?? faker.person.firstName();
  const lastName = preservedRequired?.lastName ?? faker.person.lastName();
  const email =
    preservedRequired?.email ??
    faker.internet.email({ firstName, lastName }).toLowerCase();
  const phoneCountryCode =
    preservedRequired?.phoneCountryCode ??
    (await fillRandomDatalistOption(page, '#country-code', 'codedatalistOptions'));
  const phone = preservedRequired?.phone ?? faker.string.numeric(9);

  if (!preservedRequired) {
    await fillFormControl(profileSection.locator('#firstName'), firstName);
    await fillFormControl(profileSection.locator(LAST_NAME_SELECTOR), lastName);
    await fillFormControl(profileSection.locator('#email'), email);
    await fillFormControl(profileSection.locator('#phone1'), phone);
  }

  const countryOfResidence = preservedRequired
    ? preservedRequired.countryOfResidence
    : await pickRandomSelectableCountry(page, getCpcSettings());

  if (!preservedRequired) {
    await ensureCountryOfResidence(page, countryOfResidence);
  }

  const city = await selectOptionalDropdownOption(
    page,
    '#city',
    dropdownPlaceholderPrefixes,
  );
  const nationality = await selectOptionalDropdownOption(
    page,
    '#nationality',
    dropdownPlaceholderPrefixes,
  );
  const gender = await selectRandomNativeOption(page, '#gender', dropdownPlaceholderPrefixes);
  const birthday = randomBirthday();
  const language = await selectRandomNativeOption(
    page,
    languagePreferenceSelector,
    dropdownPlaceholderPrefixes,
  );
  const maritalStatus = await selectRandomNativeOption(
    page,
    'select[name="maritalstatus"]',
    dropdownPlaceholderPrefixes,
  );

  await fillFormControl(profileSection.locator('#birthday'), birthday);

  const hasChildren = faker.datatype.boolean();
  if (hasChildren) {
    await profileSection.locator('label[for="kids"]').click();
    await expect(profileSection.locator('#numOfKids')).toBeVisible({ timeout: 10000 });

    const numberOfChildren = await selectRandomNativeOption(
      page,
      '#numOfKids',
      dropdownPlaceholderPrefixes,
    );

    const children = isLegolandEn
      ? await fillLegolandEnChildrenDetails(
          page,
          profileSection,
          numberOfChildren,
          dropdownPlaceholderPrefixes,
        )
      : undefined;

    return {
      title,
      firstName,
      lastName,
      email,
      phoneCountryCode,
      phone,
      countryOfResidence,
      city,
      nationality,
      gender,
      birthday,
      language,
      maritalStatus,
      hasChildren,
      numberOfChildren,
      children,
    };
  }

  await profileSection.locator('label[for="nokids"]').click();

  return {
    title,
    firstName,
    lastName,
    email,
    phoneCountryCode,
    phone,
    countryOfResidence,
    city,
    nationality,
    gender,
    birthday,
    language,
    maritalStatus,
    hasChildren,
  };
}

async function selectOptionalDropdownOption(
  page: Page,
  selector: string,
  placeholderPrefixes: string[],
): Promise<string> {
  const dropdown = page.locator(selector);
  if (!(await dropdown.isEnabled())) {
    return '';
  }

  return selectRandomDropdownOption(page, selector, placeholderPrefixes);
}

async function selectRandomDropdownOption(
  page: Page,
  selector: string,
  placeholderPrefixes: string[],
): Promise<string> {
  const dropdown = page.locator(selector);
  await expect(dropdown).toBeAttached();

  const isSelect2 = await dropdown.evaluate((element) =>
    element.classList.contains('select2-hidden-accessible'),
  );

  const options = await dropdown.locator('option').evaluateAll((elements) =>
    elements.map((element) => element.textContent?.trim() ?? ''),
  );
  const selectableOptions = options.filter(
    (text) => text && !isPlaceholderOption(text, placeholderPrefixes),
  );

  const selected = faker.helpers.arrayElement(selectableOptions);

  if (isSelect2) {
    await selectSelect2Option(page, selector, selected);
  } else {
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    await dropdown.selectOption({ label: selected });
  }

  return selected;
}

async function selectRandomNativeOption(
  page: Page,
  selector: string,
  placeholderPrefixes: string[],
): Promise<string> {
  const dropdown = page.locator(selector);
  await expect(dropdown).toBeVisible({ timeout: 10000 });

  const options = await dropdown.locator('option').evaluateAll((elements) =>
    elements.map((element) => element.textContent?.trim() ?? ''),
  );
  const selectableOptions = options.filter(
    (text) => text && !isPlaceholderOption(text, placeholderPrefixes),
  );

  const selected = faker.helpers.arrayElement(selectableOptions);
  await dropdown.selectOption({ label: selected });
  return selected;
}

async function fillRandomDatalistOption(
  page: Page,
  inputSelector: string,
  datalistId: string,
): Promise<string> {
  const options = await page.locator(`#${datalistId} option`).evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent?.trim() ?? '',
      value: element.value,
    })),
  );

  const selected = faker.helpers.arrayElement(options);
  await fillFormControl(page.locator(inputSelector), selected.value);
  return selected.text;
}

async function fillLegolandEnChildrenDetails(
  page: Page,
  profileSection: ReturnType<Page['locator']>,
  numberOfChildren: string,
  placeholderPrefixes: string[],
): Promise<ChildProfileData[]> {
  const childCount = Number.parseInt(numberOfChildren, 10);
  if (!childCount || childCount < 1) {
    return [];
  }

  const firstChildName = profileSection.locator('#kidsName0');
  await expect(firstChildName).toBeVisible({ timeout: 10000 });

  const children: ChildProfileData[] = [];

  for (let index = 0; index < childCount; index++) {
    const nameInput = profileSection.locator(`#kidsName${index}`);
    const birthdayInput = profileSection.locator(`#kids-birthday${index}`);
    const genderSelect = profileSection.locator(`#gender${index}`);

    await nameInput.scrollIntoViewIfNeeded();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await expect(birthdayInput).toBeVisible({ timeout: 10000 });
    await expect(genderSelect).toBeVisible({ timeout: 10000 });

    const name = faker.person.firstName();
    const birthday = randomChildBirthday();

    await fillFormControl(nameInput, name);
    await fillFormControl(birthdayInput, birthday);
    const gender = await selectRandomNativeOption(
      page,
      `#gender${index}`,
      placeholderPrefixes,
    );

    children.push({ name, birthday, gender });
  }

  return children;
}
