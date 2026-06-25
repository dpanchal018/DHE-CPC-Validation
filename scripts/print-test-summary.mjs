import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const runPaths = loadRunPaths();
const resultsPath = runPaths.jsonReport;
const validationDir = runPaths.validationResultsDir;
const terminalSummaryFile = runPaths.terminalSummaryFile;
const enExcelPath = path.join(process.cwd(), 'Legoland Dropdown Values.xlsx');

const DROPDOWN_TABLE_ORDER = [
  'required-fields-blank-save.json',
  'title.json',
  'phone-country-code.json',
  'country-of-residence.json',
  'city.json',
  'nationality.json',
  'gender.json',
  'language-preference.json',
  'marital-status.json',
];

const REPORT_KEY_TO_EN_HEADER = {
  'title.json': 'Title',
  'phone-country-code.json': 'Phone Country Code',
  'country-of-residence.json': 'Country of Residence',
  'city.json': 'City (UAE Residents only)',
  'nationality.json': 'Nationality (UAE Residents only)',
  'gender.json': 'Gender',
  'language-preference.json': 'Language Preference',
  'marital-status.json': 'Marital Status',
};

const EN_COLUMN_WIDTHS = { expected: 22, actual: 22, status: 8 };
const EN_TABLE_WIDTH = 70;

const AR_COLUMN_WIDTHS = { expected: 22, expectedEn: 22, actual: 22, status: 8 };
const AR_TABLE_WIDTH =
  2 +
  AR_COLUMN_WIDTHS.expected +
  3 +
  AR_COLUMN_WIDTHS.expectedEn +
  3 +
  AR_COLUMN_WIDTHS.actual +
  3 +
  AR_COLUMN_WIDTHS.status;

if (!fs.existsSync(resultsPath)) {
  console.log('No test results file found. Run tests first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const tests = collectTests(report.suites);
const showEnglishColumn = process.env.LEGOLAND_LOCALE?.trim().toUpperCase() === 'AR';

const passed = tests.filter((t) => t.passed).length;
const failed = tests.length - passed;
const width = 62;

const enExcelColumns = showEnglishColumn ? loadEnExcelColumns() : {};
const outputLines = [];

outputLines.push('');
printValidationTables();

outputLines.push('='.repeat(width));
outputLines.push('  TEST RESULTS SUMMARY');
outputLines.push('='.repeat(width));

for (const test of tests) {
  const status = test.passed ? 'PASS' : 'FAIL';
  outputLines.push(`  [${status}] ${test.name}`);
}

outputLines.push('-'.repeat(width));
outputLines.push(`  Total  : ${tests.length}`);
outputLines.push(`  Passed : ${passed}`);
outputLines.push(`  Failed : ${failed}`);
outputLines.push(`  Overall: ${failed === 0 ? 'PASS' : 'FAIL'}`);
outputLines.push('='.repeat(width));

const summaryText = outputLines.join('\n');
console.log(summaryText);

if (terminalSummaryFile) {
  fs.writeFileSync(terminalSummaryFile, summaryText + '\n', 'utf8');
}

process.exit(failed > 0 ? 1 : 0);

function loadRunPaths() {
  const metaPath = path.join(process.cwd(), 'output', 'current-run.json');
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }

  return {
    jsonReport: path.join(process.cwd(), 'output', 'playwright-results.json'),
    validationResultsDir: path.join(process.cwd(), 'output', 'validation-results'),
    terminalSummaryFile: null,
  };
}

function logLine(line = '') {
  outputLines.push(line);
}

function printValidationTables() {
  if (!fs.existsSync(validationDir)) return;

  const availableFiles = fs
    .readdirSync(validationDir)
    .filter((file) => file.endsWith('.json'));

  const orderedFiles = [
    ...DROPDOWN_TABLE_ORDER.filter((file) => availableFiles.includes(file)),
    ...availableFiles
      .filter((file) => !DROPDOWN_TABLE_ORDER.includes(file))
      .sort(),
  ];

  for (const file of orderedFiles) {
    const data = JSON.parse(
      fs.readFileSync(path.join(validationDir, file), 'utf8'),
    );
    if (!data.rows?.length) continue;

    const enHeader = REPORT_KEY_TO_EN_HEADER[file];
    const enValues =
      showEnglishColumn && enHeader ? enExcelColumns[enHeader] ?? [] : [];

    const tableWidth = showEnglishColumn ? AR_TABLE_WIDTH : EN_TABLE_WIDTH;

    logLine('='.repeat(tableWidth));
    logLine(`  ${String(data.dropdown).toUpperCase()} DROPDOWN VALUE VALIDATION`);
    logLine('='.repeat(tableWidth));

    if (showEnglishColumn) {
      logLine(
        padArabicRow(
          'Expected Value',
          'Expected Value (EN)',
          'UI Value',
          'Status',
        ),
      );
    } else {
      logLine(padEnglishRow('Expected Value', 'UI Value', 'Status'));
    }

    logLine('-'.repeat(tableWidth));

    for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
      const row = data.rows[rowIndex];

      if (showEnglishColumn) {
        const expectedEn = enValues[rowIndex] ?? '';
        logLine(
          padArabicRow(
            row.expected,
            expectedEn,
            row.actual,
            row.passed ? 'PASS' : 'FAIL',
          ),
        );
      } else {
        logLine(
          padEnglishRow(
            row.expected,
            row.actual,
            row.passed ? 'PASS' : 'FAIL',
          ),
        );
      }
    }

    const rowPassed = data.rows.filter((r) => r.passed).length;
    const rowFailed = data.rows.length - rowPassed;

    logLine('-'.repeat(tableWidth));
    logLine(`  Total  : ${data.rows.length}`);
    logLine(`  Passed : ${rowPassed}`);
    logLine(`  Failed : ${rowFailed}`);
    logLine(`  Overall: ${rowFailed === 0 ? 'PASS' : 'FAIL'}`);
    logLine('='.repeat(tableWidth));
    logLine('');
  }
}

function loadEnExcelColumns() {
  if (!fs.existsSync(enExcelPath)) {
    return {};
  }

  const columns = {};
  for (const header of Object.values(REPORT_KEY_TO_EN_HEADER)) {
    columns[header] = readDropdownValuesFromExcel(enExcelPath, header);
  }
  return columns;
}

function readDropdownValuesFromExcel(excelPath, dropdownName) {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let headerRowIndex = -1;
  let columnIndex = -1;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      if (
        String(row[colIndex]).trim().toLowerCase() ===
        dropdownName.trim().toLowerCase()
      ) {
        headerRowIndex = rowIndex;
        columnIndex = colIndex;
        break;
      }
    }
    if (columnIndex !== -1) break;
  }

  if (columnIndex === -1) {
    return [];
  }

  const values = [];
  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex++) {
    const cellValue = String(rows[rowIndex][columnIndex] ?? '').trim();
    if (cellValue) {
      values.push(cellValue);
    }
  }

  return values;
}

function padArabicRow(expected, expectedEn, actual, status) {
  return `  ${pad(expected, AR_COLUMN_WIDTHS.expected)} | ${pad(
    expectedEn,
    AR_COLUMN_WIDTHS.expectedEn,
  )} | ${pad(actual, AR_COLUMN_WIDTHS.actual)} | ${pad(status, AR_COLUMN_WIDTHS.status)}`;
}

function padEnglishRow(expected, actual, status) {
  return `  ${pad(expected, EN_COLUMN_WIDTHS.expected)} | ${pad(
    actual,
    EN_COLUMN_WIDTHS.actual,
  )} | ${pad(status, EN_COLUMN_WIDTHS.status)}`;
}

function pad(value, width) {
  const text =
    String(value).length > width
      ? String(value).slice(0, width - 1) + '…'
      : String(value);
  return text.padEnd(width, ' ');
}

function collectTests(suites, suitePath = '') {
  const results = [];

  for (const suite of suites) {
    const currentPath = suite.title
      ? suitePath
        ? `${suitePath} > ${suite.title}`
        : suite.title
      : suitePath;

    if (suite.specs) {
      for (const spec of suite.specs) {
        results.push({
          name: spec.title,
          suite: currentPath,
          file: suite.file,
          passed: spec.ok,
        });
      }
    }

    if (suite.suites) {
      results.push(...collectTests(suite.suites, currentPath));
    }
  }

  return results;
}
