import fs from 'fs';
import path from 'path';
import { getValidationResultsDir } from './report-paths';

export type ValidationRow = {
  expected: string;
  actual: string;
  passed: boolean;
};

export type ValidationReport = {
  dropdown: string;
  rows: ValidationRow[];
};

export function writeValidationReport(
  fileName: string,
  report: ValidationReport,
): string {
  const dir = getValidationResultsDir();
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
  return filePath;
}

export function formatValidationTable(report: ValidationReport): string {
  const width = 70;
  const lines: string[] = [];

  lines.push('='.repeat(width));
  lines.push(`  ${report.dropdown.toUpperCase()} DROPDOWN VALUE VALIDATION`);
  lines.push('='.repeat(width));
  lines.push(
    padRow('Expected Value', 'UI Value', 'Status', 22, 22, 8),
  );
  lines.push('-'.repeat(width));

  for (const row of report.rows) {
    lines.push(
      padRow(
        row.expected,
        row.actual,
        row.passed ? 'PASS' : 'FAIL',
        22,
        22,
        8,
      ),
    );
  }

  const passed = report.rows.filter((r) => r.passed).length;
  const failed = report.rows.length - passed;

  lines.push('-'.repeat(width));
  lines.push(`  Total  : ${report.rows.length}`);
  lines.push(`  Passed : ${passed}`);
  lines.push(`  Failed : ${failed}`);
  lines.push(`  Overall: ${failed === 0 ? 'PASS' : 'FAIL'}`);
  lines.push('='.repeat(width));

  return lines.join('\n');
}

function padRow(
  expected: string,
  actual: string,
  status: string,
  expectedWidth: number,
  actualWidth: number,
  statusWidth: number,
): string {
  return `  ${pad(expected, expectedWidth)} | ${pad(actual, actualWidth)} | ${pad(status, statusWidth)}`;
}

function pad(value: string, width: number): string {
  const text = value.length > width ? value.slice(0, width - 1) + '…' : value;
  return text.padEnd(width, ' ');
}
