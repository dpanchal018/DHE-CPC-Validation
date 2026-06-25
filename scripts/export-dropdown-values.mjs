import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(scriptDir, '..', 'output');
const jsonPath = path.join(outDir, 'dropdown-values.json');

if (!fs.existsSync(jsonPath)) {
  console.error('Missing dropdown-values.json — run: node scripts/scrape-dropdown-values.mjs');
  process.exit(1);
}

const dropdowns = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const HEADERS = [
  'Dropdown Label',
  'Field Name',
  'Field ID',
  'Field Type',
  'Option #',
  'Option Text',
  'Option Value',
];

const rows = [];
const summaryRows = [];

for (const dropdown of dropdowns) {
  const fieldType = dropdown.fieldType || 'select';
  summaryRows.push({
    'Dropdown Label': dropdown.label,
    'Field Name': dropdown.name,
    'Field ID': dropdown.id,
    'Field Type': fieldType,
    'Option Count': dropdown.optionCount,
  });

  dropdown.options.forEach((opt, index) => {
    rows.push({
      'Dropdown Label': dropdown.label,
      'Field Name': dropdown.name,
      'Field ID': dropdown.id,
      'Field Type': fieldType,
      'Option #': index + 1,
      'Option Text': opt.text,
      'Option Value': opt.value,
    });
  });
}

function escapeCsv(value) {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const csvLines = [
  HEADERS.join(','),
  ...rows.map((row) =>
    HEADERS.map((h) => escapeCsv(row[h])).join(','),
  ),
];
const csvPath = path.join(outDir, 'dropdown-values.csv');
fs.writeFileSync(csvPath, csvLines.join('\r\n'), 'utf8');

const workbook = XLSX.utils.book_new();

const allSheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
XLSX.utils.book_append_sheet(workbook, allSheet, 'All Options');

const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

for (const dropdown of dropdowns) {
  const sheetName = sanitizeSheetName(dropdown.label || dropdown.name);
  const sheetRows = dropdown.options.map((opt, index) => ({
    'Option #': index + 1,
    'Option Text': opt.text,
    'Option Value': opt.value,
  }));
  const sheet = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
}

const xlsxPath = path.join(outDir, 'dropdown-values.xlsx');
XLSX.writeFile(workbook, xlsxPath);

console.log('\n=== Export Complete ===\n');
console.log('CSV  : ' + csvPath);
console.log('Excel: ' + xlsxPath);
console.log('\nSummary:');
console.log('  Dropdown fields : ' + dropdowns.length);
console.log('  Total options   : ' + rows.length);
console.log('  Excel sheets    : Summary + All Options + ' + dropdowns.length + ' per-field sheets\n');

function sanitizeSheetName(name) {
  const cleaned = String(name).replace(/[\\/*?:\[\]]/g, '').trim().slice(0, 31);
  return cleaned || 'Field';
}
