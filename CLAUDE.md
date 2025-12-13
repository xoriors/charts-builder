# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **chart visualization workspace manager** that uses the Model Context Protocol (MCP) to enable AI agents to create and manage interactive chart visualizations. The system consists of two MCP servers:

1. **charts-mcp** - Main MCP server for managing chart workspaces and live preview
2. **postgres-mcp** - PostgreSQL MCP server for database operations

## Architecture

### charts-mcp Server

The charts-mcp server is a TypeScript-based MCP server that provides tools for:
- Listing supported charting libraries (amCharts 5, Chart.js)
- Initializing isolated workspaces for chart development
- Running a live HTTP server with auto-reload functionality
- Managing workspace lifecycle

**Key Components:**

- **index.ts** - MCP server entry point that defines 4 tools:
  - `get_supported_charts_libs` - Returns metadata about available charting libraries
  - `initialize_wk` - Creates a new workspace with HTML/JS templates
  - `get_wk_path` - Returns current workspace absolute path
  - `refresh` - Triggers browser reload via SSE

- **workspace-manager.ts** - Handles workspace creation and file generation:
  - Creates timestamped workspace folders in `workspaces/` directory (3 levels up from charts-mcp)
  - Generates HTML files with embedded CDN links and live-reload SSE client
  - Generates starter JavaScript files with example charts
  - Maintains library metadata with usage instructions

- **http-server.ts** - Express server with live reload capabilities:
  - Serves static files from workspace directory on port 3000
  - Implements Server-Sent Events (SSE) for real-time browser communication
  - Watches `.js`, `.html`, `.css` files using chokidar with 300ms debounce
  - Broadcasts reload events to all connected SSE clients
  - Provides `/events` endpoint for SSE and `/health` for status checks

**Data Flow:**
1. AI agent calls `initialize_wk` with a chart library ID
2. WorkspaceManager creates a new workspace folder with template files
3. HttpServer starts serving the workspace and begins file watching
4. Browser connects to SSE endpoint at `/events`
5. When files change, watcher triggers `broadcastReload()` to all SSE clients
6. Browser receives reload event and refreshes the page

### postgres-mcp Server

Uses the `@modelcontextprotocol/server-postgres` package to provide PostgreSQL database access through MCP. This is a pre-built MCP server for database operations.

## Development Commands

### charts-mcp

```bash
cd charts-mcp

# Install dependencies
npm install

# Build TypeScript to dist/
npm run build

# Run compiled server
npm start

# Development mode with auto-restart (recommended)
npm run dev
```

### postgres-mcp

```bash
cd postgres-mcp

# Install dependencies
npm install

# Note: postgres-mcp has no build/dev scripts
# It uses the pre-built @modelcontextprotocol/server-postgres package
```

## TypeScript Configuration

The charts-mcp project uses Node16 module resolution with ES2022 target:
- **Module system**: ES Modules (type: "module" in package.json)
- **Output**: `dist/` directory
- **Source**: `src/` directory
- Import paths must include `.js` extension even for TypeScript files

## Workspace Structure

Workspaces are created in `workspaces/` at the repository root (not inside charts-mcp):
```
chart-agentv2/
├── charts-mcp/           # MCP server source
├── postgres-mcp/         # PostgreSQL MCP server
└── workspaces/           # Generated chart workspaces
    └── {lib}-{timestamp}/ # e.g., amcharts-1733678400000/
        ├── index.html    # HTML with CDN links and SSE client
        ├── chart.js      # Chart implementation
        └── README.md     # Library-specific instructions
```

## Adding New Chart Libraries

To add support for a new charting library:

1. Add library metadata to `WorkspaceManager.libraries` array in `workspace-manager.ts`:
   - `id`: Unique identifier
   - `name`: Display name
   - `instructions`: Usage patterns and best practices
   - `cdnLinks`: Array of CDN script URLs

2. Update `generateHTMLTemplate()` if library requires custom HTML structure (most libraries work with the default canvas/div setup)

3. Update `generateJSPlaceholder()` to provide a starter example for the new library

## Important Implementation Details

### File Watching and Reload

- Chokidar watches with `awaitWriteFinish` to prevent triggering during write operations
- 300ms stability threshold ensures file is fully written before triggering reload
- SSE keeps connections alive with `Connection: keep-alive` header
- Client-side reconnection logic handles server restarts gracefully

### MCP Tool Design

All tools return JSON-stringified responses in the format:
```typescript
{
  content: [{
    type: 'text',
    text: JSON.stringify(data, null, 2)
  }]
}
```

Error responses include `isError: true` flag.

### HTTP Server Port

Fixed port: **3000**. If changing this, update:
- `HttpServer.port` in http-server.ts
- Readme generation in workspace-manager.ts
- Tool response messages in index.ts

## MCP Server Communication

The charts-mcp server communicates via stdio (StdioServerTransport). It logs to stderr to avoid interfering with stdio protocol messages, which use stdout.

## File Extensions in Imports

Due to Node16 module resolution, all relative imports must include `.js` extension even when importing `.ts` files:
```typescript
import { WorkspaceManager } from './workspace-manager.js';  // Correct
```
