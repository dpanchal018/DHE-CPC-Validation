import { test, type Page } from '@playwright/test';
import type { FilledProfileData } from './profile-form-fill';

export async function attachFullPageScreenshot(page: Page, name: string) {
  const screenshot = await page.screenshot({ fullPage: true });
  await test.info().attach(name, {
    body: screenshot,
    contentType: 'image/png',
  });
}

export async function attachProfileFilledScreenshot(
  page: Page,
  filledData: FilledProfileData,
) {
  const profileSection = page.locator('#my-profile');
  await profileSection.scrollIntoViewIfNeeded();

  const formScreenshot = await profileSection.screenshot({ animations: 'disabled' });
  await test.info().attach('my-profile-filled-form', {
    body: formScreenshot,
    contentType: 'image/png',
  });

  const filledSummary = formatFilledDataSummary(filledData);
  await test.info().attach('my-profile-filled-data', {
    body: filledSummary,
    contentType: 'text/plain',
  });

  const htmlReport = buildFilledProfileHtmlReport(filledData, formScreenshot);
  await test.info().attach('my-profile-filled-report', {
    body: htmlReport,
    contentType: 'text/html',
  });

  const fullPageScreenshot = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await test.info().attach('my-profile-filled-full-page', {
    body: fullPageScreenshot,
    contentType: 'image/png',
  });
}

function formatFilledDataSummary(data: FilledProfileData): string {
  const lines = [
    'My Profile — Faker filled values',
    '================================',
    `Title              : ${data.title}`,
    `First Name         : ${data.firstName}`,
    `Last Name          : ${data.lastName}`,
    `Email              : ${data.email}`,
    `Phone Country Code : ${data.phoneCountryCode}`,
    `Phone              : ${data.phone}`,
    `Country of Residence: ${data.countryOfResidence}`,
    `City               : ${data.city}`,
    `Nationality        : ${data.nationality}`,
    `Gender             : ${data.gender}`,
    `Birthday           : ${data.birthday}`,
    `Language           : ${data.language}`,
    `Marital Status     : ${data.maritalStatus}`,
    `Has Children       : ${data.hasChildren ? 'Yes' : 'No'}`,
  ];

  if (data.numberOfChildren) {
    lines.push(`Number of Children : ${data.numberOfChildren}`);
  }

  if (data.children?.length) {
    data.children.forEach((child, index) => {
      lines.push(`Child ${index + 1} Name     : ${child.name}`);
      lines.push(`Child ${index + 1} Birthday : ${child.birthday}`);
      lines.push(`Child ${index + 1} Gender   : ${child.gender}`);
    });
  }

  return lines.join('\n');
}

function buildFilledProfileHtmlReport(
  data: FilledProfileData,
  formScreenshot: Buffer,
): string {
  const rows: Array<[string, string]> = [
    ['Title', data.title],
    ['First Name', data.firstName],
    ['Last Name', data.lastName],
    ['Email', data.email],
    ['Phone Country Code', data.phoneCountryCode],
    ['Phone', data.phone],
    ['Country of Residence', data.countryOfResidence],
    ['City', data.city],
    ['Nationality', data.nationality],
    ['Gender', data.gender],
    ['Birthday', data.birthday],
    ['Language', data.language],
    ['Marital Status', data.maritalStatus],
    ['Has Children', data.hasChildren ? 'Yes' : 'No'],
  ];

  if (data.numberOfChildren) {
    rows.push(['Number of Children', data.numberOfChildren]);
  }

  if (data.children?.length) {
    data.children.forEach((child, index) => {
      const childNumber = String(index + 1);
      rows.push([`Child ${childNumber} Name`, child.name]);
      rows.push([`Child ${childNumber} Birthday`, child.birthday]);
      rows.push([`Child ${childNumber} Gender`, child.gender]);
    });
  }

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('\n');

  const imageBase64 = formScreenshot.toString('base64');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>My Profile Filled Data</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 16px; color: #1a1a1a; }
    h2 { margin-top: 0; }
    table { border-collapse: collapse; width: 100%; max-width: 720px; margin-bottom: 24px; }
    th, td { border: 1px solid #d0d7de; padding: 10px 12px; text-align: left; vertical-align: top; }
    th { background: #f6f8fa; width: 38%; font-weight: 600; }
    td { background: #fff; font-family: Consolas, monospace; }
    img { display: block; max-width: 100%; border: 1px solid #d0d7de; border-radius: 4px; }
    .caption { margin: 8px 0 0; color: #57606a; font-size: 14px; }
  </style>
</head>
<body>
  <h2>My Profile — Faker filled values</h2>
  <table>${tableRows}</table>
  <h3>Form screenshot</h3>
  <img src="data:image/png;base64,${imageBase64}" alt="My Profile form after Faker fill" />
  <p class="caption">Screenshot captured after all fields were filled with random test data.</p>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
