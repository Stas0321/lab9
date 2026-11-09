const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), mode = process.argv[2];
if (!['unit', 'api'].includes(mode)) throw new Error('Use unit|api');
const out = path.join(root, 'reports'); fs.mkdirSync(out, { recursive: true });
const json = path.join(out, `${mode}.json`);
const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), '--runInBand', '--config', JSON.stringify({
  rootDir: root, testEnvironment: 'node', testMatch: [`<rootDir>/tests/${mode}/**/*.test.js`], testTimeout: 15000,
}), '--json', '--outputFile', json], { cwd: root, stdio: 'inherit', env: process.env });
if (fs.existsSync(json)) {
  const data = JSON.parse(fs.readFileSync(json));
  const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const tests = data.testResults.flatMap(s => s.assertionResults);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><testsuites><testsuite name="${mode}" tests="${tests.length}" failures="${data.numFailedTests}">${tests.map(t => `<testcase name="${escape(t.fullName)}" time="${(t.duration || 0) / 1000}">${t.status === 'failed' ? `<failure message="Test failed">${escape(t.failureMessages.join('\n'))}</failure>` : ''}</testcase>`).join('')}</testsuite></testsuites>`;
  fs.writeFileSync(path.join(out, `${mode}.junit.xml`), xml);
}
process.exitCode = result.status ?? 1;
