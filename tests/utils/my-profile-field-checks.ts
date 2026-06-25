import { getCpcSettings } from '../data/locale-config';
import { expect, type Page } from '@playwright/test';

export async function validateMyProfileTab(page: Page) {
  const myProfileTab = page.locator('#my-profile-tab');

  await expect(myProfileTab).toBeVisible();
  await expect(myProfileTab).toHaveClass(/active/);
  await expect(myProfileTab).toHaveAttribute('aria-selected', 'true');
  await expect(myProfileTab).toHaveAttribute('href', '#my-profile');
  await expect(page).toHaveURL(/#my-profile/);

  await expect(page.locator('#interests-tab')).not.toHaveClass(/active/);
  await expect(page.locator('#communications-tab')).not.toHaveClass(/active/);

  await expect(page.locator('#my-profile')).toHaveClass(/show/);
}

export async function validateMyProfileFields(page: Page) {
  const {
    sectionHeadings,
    saveButtonName,
    profileFields,
    dropdownOptionCounts,
    phoneCountryCodeOptionCount,
  } = getCpcSettings();
  const profileSection = page.locator('#my-profile');

  for (const heading of sectionHeadings) {
    await expect(
      profileSection.locator('h4').filter({ hasText: heading }),
    ).toBeVisible();
  }

  await expect(
    profileSection.getByRole('button', { name: saveButtonName }),
  ).toBeVisible();

  for (const field of profileFields) {
    const locator = profileSection.locator(field.selector);

    await expect(locator, `${field.label} should exist in DOM`).toHaveCount(1);

    if (field.visible !== false) {
      await expect(locator, `${field.label} should be visible`).toBeVisible();
    } else {
      await expect(locator, `${field.label} should be hidden by default`).toBeHidden();
    }

    switch (field.fieldType) {
      case 'dropdown':
        await expect(locator).toHaveJSProperty('tagName', 'SELECT');
        const optionCount = await locator.locator('option').count();
        const expectedCount = dropdownOptionCounts[field.selector];
        if (expectedCount) {
          expect(optionCount, `${field.label} option count`).toBe(expectedCount);
        }
        break;

      case 'text':
        await expect(locator).toHaveAttribute('type', 'text');
        break;

      case 'email':
        await expect(locator).toHaveAttribute('type', 'email');
        break;

      case 'phone':
        await expect(locator).toHaveAttribute('type', 'tel');
        break;

      case 'date':
        await expect(locator).toHaveAttribute('type', 'date');
        break;

      case 'radio':
        await expect(locator).toHaveAttribute('type', 'radio');
        if (field.selector === '#kids' || field.selector === '#nokids') {
          await expect(locator).toHaveAttribute('name', 'kidsExists');
        }
        break;

      case 'datalist':
        await expect(locator).toHaveAttribute('list', 'codedatalistOptions');
        const datalistOptions = await page.locator('#codedatalistOptions option').count();
        expect(datalistOptions, 'Phone country code options').toBe(
          phoneCountryCodeOptionCount,
        );
        break;
    }

    if (field.required) {
      await expect(locator, `${field.label} should be required`).toHaveAttribute(
        'required',
        '',
      );
    }
  }
}
