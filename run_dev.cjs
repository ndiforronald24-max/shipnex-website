const { spawn } = require('child_process');
const fs = require('fs');

const child = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
  cwd: __dirname,
  shell: true
});

let output = '';
child.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  fs.writeFileSync('dev_server_log.txt', output);
});

child.stderr.on('data', (data) => {
  const text = data.toString();
  output += text;
  fs.writeFileSync('dev_server_log.txt', output);
});

child.on('error', (err) => {
  fs.writeFileSync('dev_server_log.txt', 'Failed to start: ' + err.message);
});

// Keep alive for 5 seconds to capture initial output
setTimeout(() => {
  // Don't kill the server - let it keep running
}, 5000);
