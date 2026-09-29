const { createServer } = require('vite');

async function start() {
  const server = await createServer({
    server: { host: '0.0.0.0', port: 5173 }
  });
  await server.listen();
  console.log('Server running at http://localhost:5173');
}

start().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});

// Keep alive
setInterval(() => {}, 1000);
