import path from 'path';
import XLSX from 'xlsx';
import { getCpcSettings } from '../data/locale-config';

export function getDropdownExcelPath(): string {
  return getCpcSettings().dropdownExcelFile;
}

export const LEGOLAND_DROPDOWN_EXCEL = path.join(
  process.cwd(),
  'Legoland Dropdown Values.xlsx',
);

/**
 * Finds a header cell matching `dropdownName` (e.g. "Title") and reads
 * all non-empty values in that column below the header row.
 */
export function readDropdownValuesFromExcel(
  excelPath: string,
  dropdownName: string,
): string[] {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];

  let headerRowIndex = -1;
  let columnIndex = -1;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      if (String(row[colIndex]).trim().toLowerCase() === dropdownName.trim().toLowerCase()) {
        headerRowIndex = rowIndex;
        columnIndex = colIndex;
        break;
      }
    }
    if (columnIndex !== -1) break;
  }

  if (columnIndex === -1) {
    throw new Error(`Dropdown "${dropdownName}" not found in Excel file: ${excelPath}`);
  }

  const values: string[] = [];
  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex++) {
    const cellValue = String(rows[rowIndex][columnIndex] ?? '').trim();
    if (cellValue) {
      values.push(cellValue);
    }
  }

  return values;
}
