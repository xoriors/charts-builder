export declare class HttpServer {
    private app;
    private server;
    private clients;
    private watcher;
    private readonly port;
    private currentWorkspacePath;
    constructor();
    private setupRoutes;
    start(workspacePath: string): Promise<void>;
    private setupFileWatcher;
    broadcastReload(): void;
    stop(): Promise<void>;
    getPort(): number;
    isRunning(): boolean;
}
