const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const failedDemo = process.argv.includes('--fail');
const out = process.env.PIPELINE_OUTPUT || path.join(root, 'artifacts', failedDemo ? 'failed' : 'success');
fs.mkdirSync(out, { recursive: true });
const stages = [['build', 'scripts/build.js'], ['unit', 'scripts/test.js', 'unit'], ['api', 'scripts/test.js', 'api']];
const results = []; let failed = false;
for (const [name, script, mode] of stages) {
  if (failed) { results.push({ stage: name, status: 'skipped' }); continue; }
  const r = spawnSync(process.execPath, [script, ...(mode ? [mode] : [])], { cwd: root, encoding: 'utf8',
    env: { ...process.env, CI_FORCE_FAILURE: failedDemo ? '1' : '0' } });
  fs.writeFileSync(path.join(out, name + '.log'), (r.stdout || '') + (r.stderr || ''));
  const exitCode = r.status ?? 1;
  results.push({ stage: name, status: exitCode === 0 ? 'success' : 'failure', exitCode });
  console.log(`${name}: ${exitCode === 0 ? 'PASS' : 'FAIL'} (exit ${exitCode})`);
  failed = exitCode !== 0;
  for (const extension of ['json', 'junit.xml']) {
    const report = path.join(root, 'reports', `${name}.${extension}`);
    if (fs.existsSync(report)) fs.copyFileSync(report, path.join(out, `${name}.${extension}`));
  }
}
const data = { date: new Date().toISOString(), kind: 'local reproduction of CI commands (not GitHub Actions)', forcedFailure: failedDemo, status: failed ? 'failure' : 'success', stages: results };
fs.writeFileSync(path.join(out, 'pipeline.json'), JSON.stringify(data, null, 2));
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="uk"><meta charset="utf-8"><title>ЛР9 — локальний pipeline</title><style>body{font:18px system-ui;max-width:900px;margin:50px auto;background:#f5f7fb}article{background:white;padding:25px;border-radius:12px}.success{color:#08734e}.failure{color:#c22}li{padding:12px}</style><article><h1>ЛР9 · ${failedDemo ? 'Навмисна помилка' : 'Успішний запуск'}</h1><p>Локальне відтворення команд CI. Це не звіт GitHub Actions.</p><p>${data.date}</p><ol>${results.map(r => `<li class="${r.status}">${r.stage}: ${r.status}${r.exitCode === undefined ? '' : ` (exit ${r.exitCode})`}</li>`).join('')}</ol><p>JSON, JUnit XML та журнали лежать поруч із цим файлом. Навмисна помилка: очікується тариф 7001 коп. замість правильних 7000.</p></article></html>`);
process.exitCode = failed ? 1 : 0;
