import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';
import XLSX from 'xlsx';

const PAGE_URL =
  process.env.CPC_URL ??
  'https://cloud.explore.trexglamping.com/TREX_CPC_QA#my-profile';

const OUT_FILE =
  process.env.DROPDOWN_EXCEL_OUT ??
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'T-Rex Glamping Dropdown Values.xlsx');

const DROPDOWN_FIELDS = [
  {
    key: 'title',
    excelHeader: 'Title',
    selector: 'select[name="profileSalutation"]',
    type: 'select',
  },
  {
    key: 'phone-country-code',
    excelHeader: 'Phone Country Code',
    datalistId: 'codedatalistOptions',
    selector: '#country-code',
    type: 'datalist',
  },
  {
    key: 'country',
    excelHeader: 'Country of Residence',
    selector: '#profileCountry',
    type: 'select',
  },
  {
    key: 'city',
    excelHeader: 'City (UAE Residents only)',
    selector: '#city',
    type: 'select',
  },
  {
    key: 'nationality',
    excelHeader: 'Nationality (UAE Residents only)',
    selector: '#nationality',
    type: 'select',
  },
  {
    key: 'gender',
    excelHeader: 'Gender',
    selector: '#gender',
    type: 'select',
  },
  {
    key: 'language',
    excelHeader: 'Language Preference',
    selector: 'select[name="profileLang"]',
    type: 'select',
  },
  {
    key: 'marital',
    excelHeader: 'Marital Status',
    selector: 'select[name="maritalstatus"]',
    type: 'select',
  },
];

const UAE_COUNTRY = 'United Arab Emirates';
const PLACEHOLDER_PREFIXES = ['select'];

function isPlaceholder(text) {
  const normalized = text.trim().toLowerCase();
  return PLACEHOLDER_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

async function readSelectOptions(page, selector) {
  const options = await page.locator(selector).locator('option').evaluateAll((elements) =>
    elements.map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
  );
  return options.filter((text) => text && !isPlaceholder(text));
}

async function readDatalistOptions(page, datalistId) {
  return page.locator(`#${datalistId} option`).evaluateAll((elements) =>
    elements
      .map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      .filter(Boolean),
  );
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('#my-profile-tab', { timeout: 90000 });
  await page.waitForTimeout(5000);

  const columns = [];

  for (const field of DROPDOWN_FIELDS) {
    let values = [];

    if (field.type === 'datalist') {
      values = await readDatalistOptions(page, field.datalistId);
    } else {
      if (field.key === 'city' || field.key === 'nationality') {
        await page.locator('#select2-profileCountry-container').click();
        const searchField = page.locator('.select2-container--open .select2-search__field');
        if (await searchField.count()) {
          await searchField.fill(UAE_COUNTRY);
        }
        await page
          .locator('.select2-results__option')
          .filter({ hasText: UAE_COUNTRY })
          .first()
          .click();
        await page.waitForTimeout(1000);
      }

      values = await readSelectOptions(page, field.selector);
    }

    columns.push({ header: field.excelHeader, values });
    console.log(`${field.key}: ${values.length} values`);
  }

  await browser.close();

  const maxRows = Math.max(...columns.map((column) => column.values.length), 0);
  const headerRow = columns.map((column) => column.header);
  const dataRows = [];

  for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
    dataRows.push(columns.map((column) => column.values[rowIndex] ?? ''));
  }

  const sheetRows = [
    ['T-Rex Glamping – Dropdown Field Values'],
    headerRow,
    ...dataRows,
  ];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Dropdown Values');
  XLSX.writeFile(workbook, OUT_FILE);

  console.log(`\nT-Rex Excel written: ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
