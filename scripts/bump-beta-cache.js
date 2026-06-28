#!/usr/bin/env node
// Increments every ?v=N query string in beta/index.html after a build.
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../beta/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const matches = [...html.matchAll(/\?v=(\d+)/g)];
if (matches.length === 0) {
  console.log('bump-beta-cache: no ?v= params found, skipping');
  process.exit(0);
}

const current = Math.max(...matches.map(m => parseInt(m[1], 10)));
const next = current + 1;

html = html.replace(/\?v=\d+/g, `?v=${next}`);
fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`bump-beta-cache: v${current} → v${next}`);
