import { chromium } from '@playwright/test';

const URL =
  'https://cloud.explore.legoland.ae/CPC_LL?sfid=MDAzUXMwMDAwMEVBMDNWSUFU#my-profile';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const fields = await page.evaluate(function () {
    var results = [];
    var seen = new Set();

    function getSection(el) {
      var node = el;
      while (node) {
        var prev = node.previousElementSibling;
        if (prev && prev.matches('h4, h3, h2') && prev.textContent && prev.textContent.trim()) {
          return prev.textContent.trim();
        }
        node = node.parentElement;
      }
      return 'My Profile';
    }

    function getLabel(el) {
      var id = el.getAttribute('id');
      if (id) {
        var label = document.querySelector('label[for="' + id + '"]');
        if (label && label.textContent && label.textContent.trim()) {
          return label.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
        }
      }

      var parentLabel = el.closest('label');
      if (parentLabel && parentLabel.textContent && parentLabel.textContent.trim()) {
        return parentLabel.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
      }

      var aria = el.getAttribute('aria-label');
      if (aria) return aria.replace(/\*/g, '').trim();

      var placeholder = el.getAttribute('placeholder');
      if (placeholder) return placeholder.trim();

      var name = el.getAttribute('name') || '';
      var idAttr = el.getAttribute('id') || '';
      return name || idAttr || 'Unknown';
    }

    function inferDataType(el) {
      var tag = el.tagName.toLowerCase();
      if (tag === 'select') return 'dropdown';

      if (el instanceof HTMLInputElement) {
        if (el.type === 'radio') return 'radio';
        if (el.type === 'checkbox') return 'checkbox';
        if (el.type === 'email') return 'email';
        if (el.type === 'tel') return 'phone';
        if (el.type === 'date' || el.type === 'datetime-local') return 'date';
        if (el.type === 'number') return 'number';
        return 'text';
      }

      if (tag === 'textarea') return 'text (multiline)';
      return 'text';
    }

    function isVisible(el) {
      var style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    var controls = document.querySelectorAll('input:not([type="hidden"]), select, textarea');

    for (var i = 0; i < controls.length; i++) {
      var el = controls[i];
      if (!isVisible(el)) continue;

      var name = el.getAttribute('name') || '';
      var id = el.getAttribute('id') || '';
      var dataType = inferDataType(el);
      var label = getLabel(el);
      var section = getSection(el);
      var required =
        el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';

      var key = dataType + '::' + name + '::' + id + '::' + label;
      if (seen.has(key)) continue;
      seen.add(key);

      var field = {
        label: label,
        name: name,
        id: id,
        dataType: dataType,
        required: required,
        section: section,
        options: undefined,
      };

      if (el instanceof HTMLSelectElement) {
        field.options = Array.from(el.options)
          .map(function (o) { return o.text.trim(); })
          .filter(function (t) { return t && !t.toLowerCase().startsWith('select'); });
      }

      results.push(field);
    }

    return results;
  });

  console.log('\n=== Legoland CPC - My Profile Fields ===\n');
  console.log('URL: ' + URL + '\n');
  console.log('Total fields found: ' + fields.length + '\n');
  console.log('─'.repeat(90));

  var currentSection = '';
  fields.forEach(function (field, index) {
    if (field.section !== currentSection) {
      currentSection = field.section;
      console.log('\n[' + currentSection + ']\n');
    }
    var req = field.required ? 'Yes' : 'No';
    console.log(String(index + 1).padStart(2) + '. ' + field.label);
    console.log('     Data Type : ' + field.dataType);
    console.log('     Required  : ' + req);
    if (field.name) console.log('     Name      : ' + field.name);
    if (field.id) console.log('     ID        : ' + field.id);
    if (field.options && field.options.length) {
      var preview = field.options.slice(0, 5).join(', ');
      if (field.options.length > 5) preview += '...';
      console.log('     Options   : ' + preview);
    }
    console.log('─'.repeat(90));
  });

  await browser.close();
}

main().catch(function (err) {
  console.error('Scrape failed:', err);
  process.exit(1);
});
