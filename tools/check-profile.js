#!/usr/bin/env node
/*
 * Checks js/data.js: template text still to replace, broken links, missing files.
 *
 *   node tools/check-profile.js            exit code 1 only on real errors
 *   node tools/check-profile.js --strict   also fail while template text remains
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const check = require(path.join(ROOT, 'js', 'profile-check.js'));

const sandbox = { window: {} };
try {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8'), sandbox, { filename: 'js/data.js' });
} catch (e) {
  console.error(`✖ js/data.js could not be read: ${e.message}`);
  console.error('  (A missing comma or quote is the usual suspect.)');
  process.exit(1);
}
const P = sandbox.window.PROFILE;
const issues = check(P);

// Files the profile points at must exist.
const local = (p) => p && !/^(https?:|mailto:|data:)/i.test(p);
[['avatar', P && P.avatar], ['resume', P && P.resume], ['wallpaperImage', P && P.wallpaperImage]].forEach(([k, v]) => {
  if (local(v) && !fs.existsSync(path.join(ROOT, v))) issues.push({ level: 'error', path: k, message: `points to "${v}", but that file does not exist.` });
});

const groups = { error: '✖ Errors', todo: '• Still to fill in', tip: '· Tips' };
const verbose = process.argv.includes('--verbose');
Object.keys(groups).forEach((level) => {
  const list = issues.filter((i) => i.level === level);
  if (!list.length) return;
  console.log(`\n${groups[level]} (${list.length})`);
  if (level !== 'todo' || verbose) return list.forEach((i) => console.log(`  ${i.path}: ${i.message}`));
  // One line per entry ("experience[0]: company, role, …") keeps the list readable.
  const byEntry = new Map();
  list.forEach((i) => {
    const entry = i.path.match(/^[^.[]+(\[\d+\])?/)[0];
    const field = i.path.slice(entry.length).replace(/^\./, '') || '(value)';
    byEntry.set(entry, (byEntry.get(entry) || []).concat(field));
  });
  byEntry.forEach((fields, entry) => console.log(`  ${entry}: ${fields.join(', ')}`));
  console.log('  (run with --verbose to see the exact text)');
});

const errors = issues.filter((i) => i.level === 'error').length;
const todos = issues.filter((i) => i.level === 'todo').length;
console.log(`\n${errors ? '✖' : '✔'} js/data.js: ${errors} error(s), ${todos} placeholder(s) left.`);
process.exit(errors || (process.argv.includes('--strict') && todos) ? 1 : 0);
