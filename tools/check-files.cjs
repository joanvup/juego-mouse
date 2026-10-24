/* Verificación de integridad de archivos y referencias del proyecto. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;

function report(ok, label, detail) {
  console.log((ok ? '✔ ' : '✖ ') + label + (detail ? ' — ' + detail : ''));
  if (!ok) errors++;
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

/* index.html */
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs = [];
const re = /(?:src|href)="([^"]+)"/g;
let m;
while ((m = re.exec(index))) {
  const ref = m[1];
  if (/^(https?:|data:|#|mailto:)/.test(ref)) continue;
  refs.push(ref);
}
refs.forEach((ref) => report(exists(ref), 'archivo referenciado: ' + ref));

/* manifest */
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
report(manifest.name && manifest.short_name, 'manifest con nombre y nombre corto');
report(!!manifest.start_url && exists(manifest.start_url.replace(/^\.\//, '')), 'start_url existe: ' + manifest.start_url);
(manifest.icons || []).forEach((icon) => report(exists(icon.src), 'icono del manifest: ' + icon.src));
report(manifest.display === 'fullscreen' || manifest.display === 'standalone', 'modo de pantalla de la PWA');

/* service worker */
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const assetsBlock = sw.match(/const ASSETS = \[([\s\S]*?)\];/);
const swAssets = Array.from(assetsBlock[1].matchAll(/'\.\/([^']*)'/g)).map((x) => x[1]);
let swMissing = [];
swAssets.forEach((rel) => {
  const p = rel === '' ? 'index.html' : rel;
  if (!exists(p)) swMissing.push(p);
});
report(swMissing.length === 0, 'archivos del service worker existen (' + swAssets.length + ')', swMissing.join(', '));

/* documentos */
const docs = fs.readdirSync(path.join(ROOT, 'docs')).filter((f) => f.endsWith('.md'));
docs.forEach((doc) => {
  const text = fs.readFileSync(path.join(ROOT, 'docs', doc), 'utf8');
  const links = Array.from(text.matchAll(/\]\(([^)]+)\)/g)).map((x) => x[1]);
  links.forEach((link) => {
    if (/^(https?:|#)/.test(link)) return;
    const target = path.resolve(path.join(ROOT, 'docs'), link.split('#')[0]);
    report(fs.existsSync(target), 'enlace de ' + doc + ': ' + link);
  });
});
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
Array.from(readme.matchAll(/\]\(([^)]+)\)/g)).map((x) => x[1]).forEach((link) => {
  if (/^(https?:|#)/.test(link)) return;
  report(exists(link.split('#')[0]), 'enlace del README: ' + link);
});

/* niveles y plantillas */
const { loadGame } = require('../tests/helpers/load-game.cjs');
const MA = loadGame();
report(MA.Levels.count() === 100, '100 niveles cargados');
report(MA.Templates.list().length === 7, '7 plantillas registradas: ' + MA.Templates.list().join(', '));
report(Object.keys(MA.Skills.all).length >= 20, 'habilidades definidas: ' + Object.keys(MA.Skills.all).length);
const validation = MA.Levels.validate();
report(validation.ok, 'validación de niveles', validation.errors.join(' | '));

/* sin recursos externos en el código de la aplicación */
const appFiles = [];
function walk(dir) {
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/artifacts|node_modules|img/.test(entry.name)) walk(rel);
    } else if (/\.(js|css|html)$/.test(entry.name)) appFiles.push(rel);
  });
}
['src', 'styles'].forEach(walk);
appFiles.push('index.html');
const external = [];
appFiles.forEach((rel) => {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const matches = Array.from(text.matchAll(/https?:\/\/[^\s'"<>)]+/g)).map((x) => x[0]);
  matches.forEach((url) => {
    if (/creativecommons\.org|127\.0\.0\.1|localhost/.test(url)) return;
    external.push(rel + ' → ' + url);
  });
});
report(external.length === 0, 'sin URLs externas en la aplicación', external.join(' | '));

console.log(errors === 0 ? '\nIntegridad correcta.' : '\n' + errors + ' problemas encontrados.');
process.exitCode = errors === 0 ? 0 : 1;
