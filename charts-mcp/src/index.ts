#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WorkspaceManager } from './workspace-manager.js';
import { HttpServer } from './http-server.js';

const workspaceManager = new WorkspaceManager();
const httpServer = new HttpServer();

const server = new Server(
  {
    name: 'charts-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_supported_charts_libs',
        description: 'Returns metadata about supported charting libraries with usage instructions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'initialize_wk',
        description: 'Initialize a workspace for a specific charting library. Creates files and starts HTTP server.',
        inputSchema: {
          type: 'object',
          properties: {
            chart_lib_id: {
              type: 'string',
              description: 'ID of the charting library (e.g., "amcharts")',
            },
          },
          required: ['chart_lib_id'],
        },
      },
      {
        name: 'get_wk_path',
        description: 'Returns the absolute path of the current workspace folder',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'refresh',
        description: 'Triggers a reload of the chart viewer in the browser',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_supported_charts_libs': {
        const libs = workspaceManager.getSupportedLibraries();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(libs, null, 2),
            },
          ],
        };
      }

      case 'initialize_wk': {
        const { chart_lib_id } = args as { chart_lib_id: string };
        
        if (!chart_lib_id) {
          throw new Error('chart_lib_id is required');
        }

        const workspacePath = await workspaceManager.initializeWorkspace(chart_lib_id);
        await httpServer.start(workspacePath);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                workspace_path: workspacePath,
                url: `http://localhost:${httpServer.getPort()}`,
                message: `Workspace initialized for ${chart_lib_id}. Open browser at http://localhost:${httpServer.getPort()}`,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_wk_path': {
        const path = workspaceManager.getCurrentWorkspacePath();
        
        if (!path) {
          throw new Error('No workspace initialized. Call initialize_wk first.');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                workspace_path: path,
              }, null, 2),
            },
          ],
        };
      }

      case 'refresh': {
        httpServer.broadcastReload();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Reload signal sent to all connected clients',
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Charts MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});