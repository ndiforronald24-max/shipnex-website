const { spawn } = require('child_process');
const path = require('path');

const child = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname),
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start dev server:', err.message);
});

child.on('exit', (code) => {
  console.log(`Dev server exited with code ${code}`);
});
