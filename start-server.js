import express from 'express';
import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const clients = [];

// Workspace path
const workspacePath = path.join(__dirname, 'workspaces', 'chartjs-1765194933');

// SSE endpoint for live reload
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.write('data: connected\n\n');
  clients.push(res);
  console.log(`Client connected (${clients.length} total)`);

  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
      console.log(`Client disconnected (${clients.length} remaining)`);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: clients.length,
    workspace: workspacePath,
  });
});

// Serve static files from workspace
app.use(express.static(workspacePath));

// Start server
app.listen(port, () => {
  console.log(`\n🚀 Server started on http://localhost:${port}`);
  console.log(`📁 Serving workspace: ${workspacePath}`);
  console.log(`\n✨ Open http://localhost:${port} in your browser to view the chart!\n`);
});

// Setup file watcher
const watchPatterns = [
  path.join(workspacePath, '*.js'),
  path.join(workspacePath, '*.html'),
  path.join(workspacePath, '*.css'),
];

const watcher = chokidar.watch(watchPatterns, {
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100,
  },
});

watcher.on('change', (filePath) => {
  console.log(`File changed: ${path.basename(filePath)}`);
  console.log(`Broadcasting reload to ${clients.length} clients`);

  clients.forEach(client => {
    client.write('data: reload\n\n');
  });
});

watcher.on('error', (error) => {
  console.error('Watcher error:', error);
});

console.log('File watcher started - watching for changes...');
