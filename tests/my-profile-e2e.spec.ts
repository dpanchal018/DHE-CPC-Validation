import { test, expect } from '@playwright/test';
import { LAST_NAME_SELECTOR } from './data/my-profile-fields';
import { getCpcSettings } from './data/locale-config';
import { openCpcMyProfile } from './utils/navigation';
import { attachProfileFilledScreenshot } from './utils/screenshot';
import {
  validateMyProfileTab,
  validateMyProfileFields,
} from './utils/my-profile-field-checks';
import { readDropdownValuesFromExcel } from './utils/excel-dropdown-values';
import {
  validateSelectDropdown,
  validateDatalistDropdown,
  ensureCountryOfResidence,
} from './utils/dropdown-validation';
import { writeValidationReport } from './utils/validation-report';
import { fillMyProfileForm } from './utils/profile-form-fill';
import { applyRequiredProfileTestData } from './utils/profile-test-data';
import { validateBlankFormRequiredMessages } from './utils/required-field-validation';

const cpcSettings = getCpcSettings();

test.describe(cpcSettings.suiteTitle, () => {
  test('My Profile tab and fields validation', async ({ page }) => {
    test.setTimeout(3600000);

    await openCpcMyProfile(page);

    let requiredFieldData: Awaited<
      ReturnType<typeof validateBlankFormRequiredMessages>
    > | undefined;

    if (cpcSettings.blankFormSaveValidation) {
      requiredFieldData = await test.step(
        'Validate required fields one-by-one on Save',
        async () => validateBlankFormRequiredMessages(page, cpcSettings),
      );
    }

    await test.step('Verify My Profile tab is selected', async () => {
      await validateMyProfileTab(page);
    });

    await test.step('Validate all fields on My Profile page', async () => {
      await validateMyProfileFields(page);
    });

    await test.step('All My Profile dropdown values match Excel', async () => {
      for (const dropdownConfig of cpcSettings.dropdownFields) {
        const expectedValues = readDropdownValuesFromExcel(
          cpcSettings.dropdownExcelFile,
          dropdownConfig.excelHeader,
        );

        const validationRows = await test.step(
          `Validate ${dropdownConfig.label} dropdown`,
          async () => {
            if (dropdownConfig.requiresCountryOfResidence) {
              await ensureCountryOfResidence(
                page,
                dropdownConfig.requiresCountryOfResidence,
              );

              const dependentDropdown = page.locator(dropdownConfig.selector);
              await expect(dependentDropdown).toBeVisible({ timeout: 10000 });
              await expect(dependentDropdown).toBeEnabled({ timeout: 10000 });
            }

            if (dropdownConfig.type === 'select') {
              return validateSelectDropdown(page, dropdownConfig, expectedValues);
            }
            return validateDatalistDropdown(page, dropdownConfig, expectedValues);
          },
        );

        const report = { dropdown: dropdownConfig.label, rows: validationRows };
        writeValidationReport(`${dropdownConfig.reportKey}.json`, report);
      }
    });

    if (requiredFieldData) {
      await applyRequiredProfileTestData(page, cpcSettings, requiredFieldData);
    }

    await test.step('Fill My Profile form with Faker data', async () => {
      const data = await fillMyProfileForm(page, {
        requiredFieldValues: requiredFieldData,
      });

      const profileSection = page.locator('#my-profile');
      await expect(profileSection.locator('#firstName')).toHaveValue(data.firstName);
      await expect(profileSection.locator(LAST_NAME_SELECTOR)).toHaveValue(data.lastName);
      await expect(profileSection.locator('#email')).toHaveValue(data.email);
      await expect(profileSection.locator('#phone1')).toHaveValue(data.phone);
      await expect(profileSection.locator('#birthday')).toHaveValue(data.birthday);
      await expect(page.locator('#select2-profileCountry-container')).toHaveText(
        data.countryOfResidence,
      );

      if (data.children?.length) {
        for (let index = 0; index < data.children.length; index++) {
          const child = data.children[index];
          await expect(profileSection.locator(`#kidsName${index}`)).toHaveValue(child.name);
          await expect(profileSection.locator(`#kids-birthday${index}`)).toHaveValue(
            child.birthday,
          );
          await expect(profileSection.locator(`#gender${index}`)).toHaveValue(child.gender);
        }
      }

      await attachProfileFilledScreenshot(page, data);
    });
  });
});
