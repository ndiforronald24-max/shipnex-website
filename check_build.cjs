const { execSync } = require('child_process');
const fs = require('fs');
try {
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: __dirname });
  fs.writeFileSync('build_result.txt', 'TypeScript compilation: SUCCESS\n' + (output || 'No errors found'));
} catch (err) {
  const msg = 'TypeScript compilation: FAILED\n' + (err.stdout || '') + (err.stderr || '') + err.message;
  fs.writeFileSync('build_result.txt', msg);
}
