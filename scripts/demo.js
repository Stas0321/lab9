const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const fail of [false, true]) {
  const r = spawnSync(process.execPath, ['scripts/pipeline.js', ...(fail ? ['--fail'] : [])], { cwd: root, stdio: 'inherit' });
  if ((!fail && r.status !== 0) || (fail && r.status !== 1)) process.exit(1);
}
console.log('Demo verified: success exits 0, intentional unit failure exits 1 and API stage is skipped.');
