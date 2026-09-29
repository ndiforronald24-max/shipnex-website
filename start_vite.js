import { createServer } from 'vite';

async function start() {
  try {
    const server = await createServer({
      configFile: './vite.config.ts',
      server: {
        host: '0.0.0.0',
        port: 5173,
      },
    });
    await server.listen();
    console.log('Dev server running at http://localhost:5173');
    console.log('Network access at http://0.0.0.0:5173');
  } catch (err) {
    console.error('Failed to start dev server:', err);
  }
}

start();
