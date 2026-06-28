'use strict';

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
  'package.json'
];
const forbidden = ['.env.local', '.vercel', 'node_modules'];
const placeholders = ['[TÊN APP]', '[MÔ TẢ', 'Lorem ipsum', 'TODO:', 'FIXME'];
const errors = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Thiếu file bắt buộc: ${file}`);
}

for (const name of forbidden) {
  if (fs.existsSync(path.join(root, name))) errors.push(`Không được có trong release: ${name}`);
}

if (!errors.length) {
  const html = read('index.html');
  const app = read('app.js');
  const sw = read('service-worker.js');
  const manifest = JSON.parse(read('manifest.json'));

  if (!html.includes('id="app"')) errors.push('index.html thiếu root #app.');
  if (!html.includes('Sổ Thông Thái')) errors.push('index.html thiếu tên app.');
  if (!manifest.name || manifest.name !== 'Sổ Thông Thái') errors.push('manifest name không đúng.');
  if (!manifest.start_url || !manifest.display) errors.push('manifest thiếu start_url/display.');
  if (!sw.includes('wisdom-notebook-cache-v1.0.0')) errors.push('service-worker cache name chưa đúng version.');
  if (!app.includes('wisdom_notebook_records_v1')) errors.push('app.js thiếu localStorage key ổn định.');
  if (!app.includes('exportJson') || !app.includes('importJson')) errors.push('app.js thiếu export/import JSON.');

  for (const file of ['index.html', 'app.js', 'README.md', 'CHANGELOG.md']) {
    const content = read(file);
    for (const token of placeholders) {
      if (content.includes(token)) errors.push(`${file} còn placeholder: ${token}`);
    }
  }
}

if (errors.length) {
  console.error('VALIDATE FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('VALIDATE PASS - Wisdom Notebook V1.0.0 package is clean.');
