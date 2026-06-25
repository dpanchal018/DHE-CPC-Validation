import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const suiteName = process.env.REPORT_SUITE_NAME?.trim() || process.argv[2]?.trim();

if (!suiteName) {
  console.error('[ERROR] REPORT_SUITE_NAME is required.');
  console.error('Usage: node scripts/prepare-report-run.mjs "DHE Legoland EN"');
  process.exit(1);
}

const timestamp = formatTimestamp(new Date());
const suiteDir = path.join(projectRoot, 'reports', suiteName);
const runNumber = getNextRunNumber(suiteDir);
const runLabel = `${suiteName} ${timestamp} R${runNumber}`;
const runFolder = path.join(suiteDir, runLabel);

const paths = {
  suiteName,
  runLabel,
  runFolder,
  jsonReport: path.join(runFolder, 'playwright-results.json'),
  htmlReportDir: path.join(runFolder, 'html'),
  htmlReportIndex: path.join(runFolder, 'html', 'index.html'),
  validationResultsDir: path.join(runFolder, 'validation-results'),
  terminalSummaryFile: path.join(runFolder, 'terminal-summary.txt'),
};

fs.mkdirSync(paths.validationResultsDir, { recursive: true });
fs.mkdirSync(paths.htmlReportDir, { recursive: true });

const outputDir = path.join(projectRoot, 'output');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'current-run.json'), JSON.stringify(paths, null, 2), 'utf8');

const setEnvBat = [
  '@echo off',
  `set PLAYWRIGHT_JSON_REPORT=${paths.jsonReport}`,
  `set PLAYWRIGHT_HTML_REPORT_DIR=${paths.htmlReportDir}`,
  `set VALIDATION_RESULTS_DIR=${paths.validationResultsDir}`,
  `set REPORT_RUN_LABEL=${runLabel}`,
  `set REPORT_RUN_FOLDER=${runFolder}`,
  '',
].join('\r\n');

fs.writeFileSync(path.join(outputDir, 'set-report-env.bat'), setEnvBat, 'utf8');

console.log(`Report folder: ${runFolder}`);
console.log(`Run label    : ${runLabel}`);

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function getNextRunNumber(directory) {
  if (!fs.existsSync(directory)) {
    return 1;
  }

  let maxRun = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const match = entry.name.match(/ R(\d+)$/);
    if (match) {
      maxRun = Math.max(maxRun, Number.parseInt(match[1], 10));
    }
  }

  return maxRun + 1;
}
