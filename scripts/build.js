const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(path.join(root, 'sut-b/src')).filter(f => f.endsWith('.js'));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, 'sut-b/src', file)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.cpSync(path.join(root, 'sut-b/src'), path.join(root, 'dist/src'), { recursive: true });
fs.cpSync(path.join(root, 'sut-b/migrations'), path.join(root, 'dist/migrations'), { recursive: true });
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/build.json'), JSON.stringify({ success: true, node: process.version,
  date: new Date().toISOString(), checkedFiles: files, output: 'dist/' }, null, 2));
console.log(`Build OK: checked ${files.length} JavaScript files; copied source and SQL migrations to dist/`);
