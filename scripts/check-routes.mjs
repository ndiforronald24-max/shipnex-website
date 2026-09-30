#!/usr/bin/env node
/**
 * Route / navigation integrity check for the ShipNex SPA.
 *
 * Deliberately dependency-free (no test runner, no jsdom) so it runs in CI in
 * a couple of seconds. It exists because `tsc` cannot catch the failure modes
 * that actually bite users on a single-page app:
 *
 *   1. Duplicate route paths. React Router silently uses the FIRST match, so a
 *      copy-pasted path makes a page unreachable with no error anywhere.
 *   2. Dead navigation links. A `to="/typo"` in the header 404s for the user
 *      but type-checks perfectly, because `to` is just a string.
 *   3. Orphaned pages - imported but never routed (dead bundle weight).
 *   4. Unguarded admin routes - a real security check, not a style rule.
 *
 * Run: node scripts/check-routes.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = join(root, 'src');

const failures = [];
const warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);

const appSrc = readFileSync(join(src, 'App.tsx'), 'utf8');

// Each <Route> may be self-closing (<Route ... />) or a container wrapping
// children (<Route ...>{...}</Route>). The earlier version only matched the
// self-closing form and silently dropped /admin and both "*" catch-alls, which
// produced false "dead link" failures. Match either terminator.
const flat = appSrc.replace(/\s+/g, ' ');
const routeRe = /<Route\s+([^>]*?)(?:\/>|>)/g;

const routes = [];
let m;
while ((m = routeRe.exec(flat)) !== null) {
  const attrs = m[1];
  const pathM = /path="([^"]*)"/.exec(attrs);
  routes.push({
    path: pathM ? pathM[1] : null,
    guarded: /RoleRoute/.test(attrs) || /ProtectedRoute/.test(attrs),
  });
}

if (routes.length === 0) {
  fail('No <Route> elements parsed from src/App.tsx - the parser is broken, not the app.');
}

for (const r of routes) {
  if (r.path === '') fail('Route with empty path="" - likely a typo.');
}

// 1. duplicates -------------------------------------------------------------
// A duplicated concrete path is always a bug. A duplicated "*" is NOT: React
// Router nests, so a catch-all under the /admin layout and another at the
// top level are both correct and intentional. Only compare real paths.
const seen = new Map();
for (const r of routes) {
  if (r.path === null || r.path === '*') continue; // layout parent / catch-all
  if (seen.has(r.path)) {
    fail(`Duplicate route path "${r.path}". React Router only ever matches the first one.`);
  } else {
    seen.set(r.path, r);
  }
}

// Every catch-all must be a deliberate, non-empty fallback; count them so an
// accidental loss is visible.
const catchAlls = routes.filter((r) => r.path === '*').length;
if (catchAlls === 0) warn('No "*" catch-all route found - unknown URLs will render a blank page.');

// 4. admin routes declared outside a guard ----------------------------------
for (const r of routes) {
  if (r.path && r.path.startsWith('/admin/') && !r.guarded) {
    warn(`Admin route "${r.path}" has no role guard of its own - confirm it nests under the ProtectedRoute parent.`);
  }
}

// ------------------------------------------------------- imported pages ----
// Every page imported in App.tsx must resolve to a real file that default-exports.
const importRe = /import\s+(\w+)\s+from\s+'\.\/pages\/([^']+)'/g;
const imported = [];
while ((m = importRe.exec(appSrc)) !== null) {
  const alias = m[1];
  const rel = m[2];
  const file = [join(src, 'pages', `${rel}.tsx`), join(src, 'pages', `${rel}.ts`)]
    .find((c) => existsSync(c));
  if (!file) {
    fail(`App.tsx imports "./pages/${rel}" as ${alias} but no ${rel}.tsx/.ts exists.`);
    continue;
  }
  if (!/export\s+default/.test(readFileSync(file, 'utf8'))) {
    fail(`pages/${rel}.tsx has no default export but is imported as a component.`);
  }
  imported.push({ alias, rel, file });
}

// 3. orphaned pages ---------------------------------------------------------
// App.tsx is the router: it imports a page in order to route it. So a page that
// is imported but never mentioned again after its import statement is genuinely
// dead. (Element-attribute parsing is unreliable here because pages are often
// wrapped, e.g. element={<RoleRoute permission="x"><AdminStaffPage /></RoleRoute>}
// - the wrapper, not the page, is the first component in the attribute.)
const bodyAfterImports = appSrc.replace(/^\s*import[^;]+;\s*$/gm, '');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name) && !/\.d\.ts$/.test(name)) out.push(p);
  }
  return out;
}
for (const f of walk(join(src, 'pages'))) {
  const base = f.slice(src.length + 1).replace(/\\/g, '/').replace(/\.tsx?$/, '');
  const alias = imported.find((i) => i.file === f)?.alias;
  const importedAtAll = Boolean(alias);
  const mentioned = alias ? new RegExp(`\\b${alias}\\b`).test(bodyAfterImports) : false;

  if (!importedAtAll) {
    warn(`Page src/${base} is not imported by App.tsx at all - unreferenced file.`);
  } else if (!mentioned) {
    warn(`Page src/${base} is imported but never routed - dead bundle weight.`);
  }
}

// 2. dead navigation links --------------------------------------------------
const navTargets = [];
for (const comp of ['components/Header.tsx', 'components/Footer.tsx', 'components/AdminLayout.tsx']) {
  const p = join(src, comp);
  if (!existsSync(p)) continue;
  const body = readFileSync(p, 'utf8');
  const linkRe = /(?:to|href)=\{?"(\/[^"'{}]*)"/g;
  let lm;
  while ((lm = linkRe.exec(body)) !== null) navTargets.push({ comp, target: lm[1] });
}

// Matchable paths, including relative children of the /admin parent.
const matchable = new Set(seen.keys());
for (const r of routes) {
  if (r.path && r.path !== '*' && !r.path.startsWith('/')) matchable.add('/admin/' + r.path);
}

for (const { comp, target } of navTargets) {
  const clean = target.replace(/#.*$/, '') || '/';
  const noSlash = clean.length > 1 ? clean.replace(/\/$/, '') : clean;
  if (!matchable.has(clean) && !matchable.has(noSlash) && !matchable.has(target)) {
    fail(`${comp} links to "${target}" but no route matches it - dead link for users.`);
  }
}

// ------------------------------------------------------------- report ------
console.log(`Parsed ${routes.length} <Route> elements (${seen.size} with a path)`);
console.log(`Verified ${imported.length} page imports resolve and default-export`);
console.log(`Checked ${navTargets.length} navigation links across Header / Footer / AdminLayout`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log('  ~ ' + w);
}
if (failures.length) {
  console.error(`\n${failures.length} FAILURE(S):`);
  for (const f of failures) console.error('  x ' + f);
  process.exit(1);
}
console.log('\nAll route/navigation checks passed.');
