interface ChartLibrary {
    id: string;
    name: string;
    instructions: string;
    cdnLinks: string[];
}
export declare class WorkspaceManager {
    private currentWorkspacePath;
    private readonly workspacesRoot;
    private readonly libraries;
    constructor();
    getSupportedLibraries(): ChartLibrary[];
    initializeWorkspace(chartLibId: string): Promise<string>;
    getCurrentWorkspacePath(): string | null;
    private generateHTMLTemplate;
    private generateJSPlaceholder;
    private generateReadme;
}
export {};
