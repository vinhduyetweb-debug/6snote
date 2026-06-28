const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const version = '1.2.0';
const required = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'service-worker.js',
  'icon.svg',
  'README.md',
  'CHANGELOG.md',
  'package.json'
];
const forbidden = ['.env.local', '.vercel', 'node_modules'];
const placeholders = ['[TÊN APP]', '[MÔ TẢ', '[CHỨC NĂNG', 'TODO:', 'FIXME:', 'lorem ipsum'];
const requiredStorageKeys = [
  'wisdom_notebook_records_v1',
  'wisdom_notebook_settings_v1',
  'wisdom_notebook_draft_v1',
  'wisdom_notebook_last_backup_v1'
];

const errors = [];
function fail(message) { errors.push(message); }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) fail(`Missing required file: ${file}`);
}
for (const item of forbidden) {
  if (fs.existsSync(path.join(root, item))) fail(`Forbidden release artifact found: ${item}`);
}

if (!errors.length) {
  const manifest = JSON.parse(read('manifest.json'));
  if (!manifest.name || !manifest.short_name || !manifest.start_url || !manifest.icons?.length) fail('manifest.json thiếu name/short_name/start_url/icons.');
  if (manifest.display !== 'standalone') fail('manifest.json display phải là standalone.');

  const html = read('index.html');
  if (!html.includes('id="app"')) fail('index.html thiếu root container #app.');
  if (!html.includes('data-app-version="1.2.0"')) fail('index.html thiếu data-app-version 1.2.0.');
  if (!html.includes('manifest.json')) fail('index.html chưa link manifest.json.');

  const sw = read('service-worker.js');
  if (!sw.includes(`wisdom-notebook-cache-v${version}`)) fail('service-worker.js cache name chưa đúng version.');
  if (!sw.includes('./index.html')) fail('service-worker.js thiếu offline fallback index.html.');

  const app = read('app.js');
  for (const key of requiredStorageKeys) {
    if (!app.includes(key)) fail(`app.js thiếu localStorage key ổn định: ${key}`);
  }
  if (!app.includes('Capture → Distill') && !html.includes('Capture → Distill')) fail('App thiếu pipeline học tập Capture → Distill.');
  if (!app.includes('buildQuiz') || !html.includes('Quiz nhanh')) fail('App thiếu quiz mode.');
  if (!app.includes('getDueCards') || !html.includes('Ôn tập')) fail('App thiếu review/spaced repetition.');

  const allText = required.map((file) => read(file)).join('\n').toLowerCase();
  for (const token of placeholders) {
    if (allText.includes(token.toLowerCase())) fail(`Còn placeholder nội bộ: ${token}`);
  }
}

if (errors.length) {
  console.error('VALIDATION FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('VALIDATION PASS - Wisdom Notebook Learning Pro V1.2.0');
