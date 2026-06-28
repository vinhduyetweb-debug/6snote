const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'service-worker.js',
  'icon.svg',
  'README.md',
  'CHANGELOG.md',
  'package.json',
  'data/wisdom-public.json'
];

const errors = [];
const fail = (msg) => errors.push(msg);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) fail(`Missing required file: ${file}`);
}

if (!errors.length) {
  const html = read('index.html');
  const app = read('app.js');
  const sw = read('service-worker.js');
  const manifest = JSON.parse(read('manifest.json'));
  const publicData = JSON.parse(read('data/wisdom-public.json'));

  if (!html.includes('id="app"')) fail('index.html must include #app root container.');
  if (!html.includes('data-app-version="1.3.0"')) fail('index.html must expose app version 1.3.0.');
  if (!html.includes('solarDate') || !html.includes('lunarDate')) fail('index.html must include solar/lunar date UI.');
  if (!html.includes('dailyPickTitle')) fail('index.html must include daily random note UI.');
  if (!html.includes('contextSlogan')) fail('index.html must include contextual slogan UI.');

  if (manifest.name !== 'Sổ Thông Thái - Public Learning Library Pro') fail('manifest name mismatch.');
  if (manifest.display !== 'standalone') fail('manifest display must be standalone.');
  if (!Array.isArray(manifest.icons) || !manifest.icons.length) fail('manifest must include icons.');

  if (!sw.includes("wisdom-notebook-cache-v1.3.0")) fail('service-worker cache name must include v1.3.0.');
  if (!sw.includes('data/wisdom-public.json')) fail('service-worker must cache public data file.');

  if (!app.includes("const APP_VERSION = '1.3.0'")) fail('app.js version mismatch.');
  if (!app.includes('indexedDB.open')) fail('app.js must use IndexedDB for large knowledge storage.');
  if (!app.includes('wisdom_notebook_records_v1')) fail('app.js must preserve legacy localStorage key for migration.');
  if (!app.includes('DAILY_PICK_KEY')) fail('app.js must contain daily pick history logic.');
  if (!app.includes('convertSolar2Lunar')) fail('app.js must contain lunar calendar conversion.');
  if (!app.includes('syncPublicLibrary')) fail('app.js must contain public library sync.');

  if (publicData.schemaVersion !== 3) fail('public data schemaVersion must be 3.');
  if (!publicData.publicDataVersion) fail('public data missing publicDataVersion.');
  if (!Array.isArray(publicData.items) || publicData.items.length < 30) fail('public data should contain at least 30 quality lessons.');
  const ids = new Set();
  for (const item of publicData.items || []) {
    for (const key of ['id', 'title', 'summary', 'track', 'coreIdea', 'whyItMatters', 'mentalModel', 'example', 'action']) {
      if (!item[key]) fail(`public item ${item.id || 'unknown'} missing ${key}`);
    }
    if (!Array.isArray(item.tags) || !item.tags.length) fail(`public item ${item.id || 'unknown'} missing tags`);
    if (!Array.isArray(item.flashcards) || item.flashcards.length < 3) fail(`public item ${item.id || 'unknown'} needs >=3 flashcards`);
    if (ids.has(item.id)) fail(`duplicate public item id: ${item.id}`);
    ids.add(item.id);
  }

  const banned = ['.env.local', '.vercel', 'node_modules'];
  for (const name of banned) {
    if (fs.existsSync(path.join(root, name))) fail(`Release must not contain ${name}`);
  }

  const placeholderPatterns = [/TODO/i, /\[TÊN APP\]/i, /lorem ipsum/i];
  for (const file of ['index.html', 'app.js', 'style.css', 'README.md', 'CHANGELOG.md']) {
    const content = read(file);
    for (const pattern of placeholderPatterns) {
      if (pattern.test(content)) fail(`${file} contains placeholder text: ${pattern}`);
    }
  }
}

if (errors.length) {
  console.error('VALIDATION FAILED');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log('VALIDATION PASS: Wisdom Notebook V1.3.0 Public Learning Library Pro package is clean.');
