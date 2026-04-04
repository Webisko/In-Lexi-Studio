import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const checkDist = process.argv.includes('--check-dist');

const requiredSourceFiles = [
  'app.js',
  'package.json',
  'astro.config.mjs',
  'tailwind.admin.config.mjs',
  'admin/index.html',
  'admin/app.js',
  'admin/tailwind.src.css',
  'api/server.js',
  'api/routes.js',
  'prisma/schema.prisma',
  '.github/workflows/deploy.yml',
];

const requiredDistFiles = ['dist/index.html', 'admin/tailwind.generated.css'];
const failures = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

function assertDirectory(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
    failures.push(`Missing required directory: ${relativePath}`);
  }
}

function assertIncludes(relativePath, needle, label) {
  const contents = readText(relativePath);
  if (!contents.includes(needle)) {
    failures.push(`Expected ${label} in ${relativePath}`);
  }
}

for (const relativePath of requiredSourceFiles) {
  assertFile(relativePath);
}

assertDirectory('public/uploads');
assertIncludes('app.js', "require('./api/server.js')", 'Passenger entrypoint');
assertIncludes('package.json', '"build"', 'build script');
assertIncludes('package.json', '"build:admin"', 'admin build script');
assertIncludes('package.json', '"format:check"', 'format check script');
assertIncludes('.github/workflows/deploy.yml', 'npm ci', 'dependency install step');
assertIncludes('.github/workflows/deploy.yml', 'npm run build', 'build step');

if (checkDist) {
  for (const relativePath of requiredDistFiles) {
    assertFile(relativePath);
  }

  const distIndex = readText('dist/index.html');
  if (!distIndex.includes('In Lexi Studio')) {
    failures.push('dist/index.html does not contain the expected site marker.');
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, checkDist, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checkDist,
      checkedSourceFiles: requiredSourceFiles.length,
      checkedDistFiles: checkDist ? requiredDistFiles.length : 0,
    },
    null,
    2,
  ),
);
