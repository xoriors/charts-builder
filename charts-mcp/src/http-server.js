import express from 'express';
import chokidar from 'chokidar';
import path from 'path';
export class HttpServer {
    app;
    server = null;
    clients = [];
    watcher = null;
    port = 3000;
    currentWorkspacePath = null;
    constructor() {
        this.app = express();
        this.setupRoutes();
    }
    setupRoutes() {
        // SSE endpoint for live reload
        this.app.get('/events', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            // Send initial connection message
            res.write('data: connected\n\n');
            // Add client to list
            this.clients.push(res);
            console.error(`[HTTP] Client connected (${this.clients.length} total)`);
            // Remove client on disconnect
            req.on('close', () => {
                const index = this.clients.indexOf(res);
                if (index !== -1) {
                    this.clients.splice(index, 1);
                    console.error(`[HTTP] Client disconnected (${this.clients.length} remaining)`);
                }
            });
        });
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                clients: this.clients.length,
                workspace: this.currentWorkspacePath,
            });
        });
    }
    async start(workspacePath) {
        // Stop existing server and watcher if running
        await this.stop();
        this.currentWorkspacePath = workspacePath;
        // Serve static files from workspace
        this.app.use(express.static(workspacePath));
        // Start HTTP server
        await new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                console.error(`[HTTP] Server started on http://localhost:${this.port}`);
                console.error(`[HTTP] Serving workspace: ${workspacePath}`);
                resolve();
            });
            this.server.on('error', (error) => {
                console.error('[HTTP] Server error:', error);
                reject(error);
            });
        });
        // Setup file watcher with debouncing
        this.setupFileWatcher(workspacePath);
    }
    setupFileWatcher(workspacePath) {
        if (this.watcher) {
            this.watcher.close();
        }
        const watchPatterns = [
            path.join(workspacePath, '*.js'),
            path.join(workspacePath, '*.html'),
            path.join(workspacePath, '*.css'),
        ];
        this.watcher = chokidar.watch(watchPatterns, {
            ignoreInitial: true,
            persistent: true,
            awaitWriteFinish: {
                stabilityThreshold: 300, // Wait 300ms after last change
                pollInterval: 100,
            },
        });
        this.watcher.on('change', (filePath) => {
            const fileName = path.basename(filePath);
            console.error(`[Watcher] File changed: ${fileName}`);
            this.broadcastReload();
        });
        this.watcher.on('error', (error) => {
            console.error('[Watcher] Error:', error);
        });
        console.error('[Watcher] File watching started');
    }
    broadcastReload() {
        if (this.clients.length === 0) {
            console.error('[HTTP] No clients connected to broadcast reload');
            return;
        }
        console.error(`[HTTP] Broadcasting reload to ${this.clients.length} client(s)`);
        this.clients.forEach((client, index) => {
            try {
                client.write('data: reload\n\n');
            }
            catch (error) {
                console.error(`[HTTP] Error sending to client ${index}:`, error);
                // Remove dead client
                this.clients.splice(index, 1);
            }
        });
    }
    async stop() {
        // Close file watcher
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
            console.error('[Watcher] File watching stopped');
        }
        // Close all SSE connections
        this.clients.forEach(client => {
            try {
                client.end();
            }
            catch (error) {
                // Ignore errors when closing
            }
        });
        this.clients = [];
        // Close HTTP server
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => {
                    console.error('[HTTP] Server stopped');
                    resolve();
                });
            });
            this.server = null;
        }
        this.currentWorkspacePath = null;
    }
    getPort() {
        return this.port;
    }
    isRunning() {
        return this.server !== null;
    }
}
