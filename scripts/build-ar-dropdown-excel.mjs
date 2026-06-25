import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';
import XLSX from 'xlsx';

const PAGE_URL =
  process.env.LEGOLAND_CPC_URL ??
  'https://cloud.explore.legoland.ae/CPC_LL_AR?sfid=MDAzUXMwMDAwMEVBMDNWSUFU#my-profile';

const AR_DROPDOWN_FIELDS = [
  {
    key: 'title',
    excelHeader: 'اللقب (السيد/آنسة/السيدة)',
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
    excelHeader: 'بلد الإقامة',
    selector: '#profileCountry',
    type: 'select',
  },
  {
    key: 'city',
    excelHeader: 'المدينة (المقيمين في دولة الإمارات العربية المتحدة فقط)',
    selector: '#city',
    type: 'select',
  },
  {
    key: 'nationality',
    excelHeader: 'الجنسية (المقيمين في دولة الإمارات العربية المتحدة فقط)',
    selector: '#nationality',
    type: 'select',
  },
  {
    key: 'gender',
    excelHeader: 'الجنس',
    selector: '#gender',
    type: 'select',
  },
  {
    key: 'language',
    excelHeader: 'اللغة المفضلة',
    selector: 'select[name="profilelang"]',
    type: 'select',
  },
  {
    key: 'marital',
    excelHeader: 'الحالة الاجتماعية',
    selector: 'select[name="maritalstatus"]',
    type: 'select',
  },
];

const UAE_COUNTRY = 'الإمارات العربية المتحدة';
const PLACEHOLDER_PREFIXES = ['select', 'اختر'];

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

  await page.goto(PAGE_URL, { waitUntil: 'commit', timeout: 90000 });
  await page.waitForSelector('#my-profile-tab', { timeout: 60000 });
  await page.waitForTimeout(3000);

  const columns = [];

  for (const field of AR_DROPDOWN_FIELDS) {
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
    ['LEGOLAND® Dubai – Dropdown Field Values (Arabic)'],
    headerRow,
    ...dataRows,
  ];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Dropdown Values');

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const outPath = path.join(scriptDir, '..', 'Legoland Dropdown Values AR.xlsx');
  XLSX.writeFile(workbook, outPath);

  console.log(`\nArabic Excel written: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
