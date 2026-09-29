const { execSync } = require('child_process');
try {
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: __dirname });
  console.log('TypeScript compilation: SUCCESS');
  console.log(output || 'No errors found');
} catch (err) {
  console.log('TypeScript compilation: FAILED');
  console.log(err.stdout || err.message);
  if (err.stderr) console.log(err.stderr);
}
