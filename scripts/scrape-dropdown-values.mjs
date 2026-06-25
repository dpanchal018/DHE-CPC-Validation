import { chromium } from '@playwright/test';

const PAGE_URL =
  'https://cloud.explore.legoland.ae/CPC_LL?sfid=MDAzUXMwMDAwMEVBMDNWSUFU#my-profile';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const dropdowns = await page.evaluate(function () {
    function getLabel(el) {
      var id = el.getAttribute('id');
      if (id) {
        var label = document.querySelector('label[for="' + id + '"]');
        if (label && label.textContent && label.textContent.trim()) {
          return label.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
        }
      }
      var name = el.getAttribute('name') || '';
      var idAttr = el.getAttribute('id') || '';
      return name || idAttr || 'Unknown';
    }

    function isVisible(el) {
      var style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    var selects = document.querySelectorAll('select');
    var results = [];

    var datalists = document.querySelectorAll('datalist');
    for (var d = 0; d < datalists.length; d++) {
      var datalist = datalists[d];
      var linkedInput = document.querySelector('[list="' + datalist.id + '"]');
      if (!linkedInput || !isVisible(linkedInput)) continue;

      var dlOptions = Array.from(datalist.options).map(function (o) {
        return { text: o.textContent.trim(), value: o.value };
      });

      results.push({
        label: getLabel(linkedInput) || 'Phone Country Code',
        name: linkedInput.getAttribute('name') || '',
        id: linkedInput.getAttribute('id') || '',
        optionCount: dlOptions.length,
        options: dlOptions,
        fieldType: 'datalist',
      });
    }

    for (var i = 0; i < selects.length; i++) {
      var el = selects[i];
      if (!isVisible(el)) continue;

      var options = Array.from(el.options).map(function (o) {
        return {
          text: o.text.trim(),
          value: o.value,
        };
      });

      results.push({
        label: getLabel(el),
        name: el.getAttribute('name') || '',
        id: el.getAttribute('id') || '',
        optionCount: options.length,
        options: options,
      });
    }

    return results;
  });

  console.log('\n=== Legoland CPC - Dropdown Field Values ===\n');
  console.log('URL: ' + PAGE_URL + '\n');
  console.log('Total dropdown fields: ' + dropdowns.length + '\n');

  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.join(scriptDir, '..', 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'dropdown-values.json');
  fs.writeFileSync(jsonPath, JSON.stringify(dropdowns, null, 2), 'utf8');
  console.log('Full JSON saved to: output/dropdown-values.json\n');

  dropdowns.forEach(function (dropdown, index) {
    console.log('═'.repeat(90));
    console.log('Dropdown ' + (index + 1) + ': ' + dropdown.label);
    console.log('  Name  : ' + (dropdown.name || '(none)'));
    console.log('  ID    : ' + (dropdown.id || '(none)'));
    console.log('  Count : ' + dropdown.optionCount + ' options');
    console.log('─'.repeat(90));

    dropdown.options.forEach(function (opt, optIndex) {
      var valuePart = opt.value ? ' [value: ' + opt.value + ']' : '';
      console.log('  ' + String(optIndex + 1).padStart(3) + '. ' + opt.text + valuePart);
    });
    console.log('');
  });

  await browser.close();
}

main().catch(function (err) {
  console.error('Scrape failed:', err);
  process.exit(1);
});
