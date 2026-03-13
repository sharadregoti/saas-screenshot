import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express, { Request, Response } from 'express';
import { takeScreenshot } from './screenshot';

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'saas-screenshot',
    version: '1.0.0',
  });

  server.tool(
    'take_screenshot',
    'Take a screenshot of a web page. Supports optional login with username/password credentials.',
    {
      url: z.string().url().describe('The URL of the page to screenshot'),
      username: z.string().optional().describe('Username or email for login (optional)'),
      password: z.string().optional().describe('Password for login (optional)'),
    },
    async ({ url, username, password }) => {
      const result = await takeScreenshot({
        url,
        credentials: username && password ? { username, password } : undefined,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Screenshot saved: ${result.path} (filename: ${result.filename})`,
          },
        ],
      };
    }
  );

  return server;
}

async function startStdio(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server started (transport: stdio)');
}

async function startHttp(): Promise<void> {
  const app = express();
  app.use(express.json());

  const port = process.env.MCP_PORT ?? 3001;

  // Stateless mode: a fresh server+transport is created per request.
  // Each MCP request is fully independent — no session state is maintained.
  app.all('/mcp', async (req: Request, res: Response) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.listen(port, () => {
    console.log(`MCP server started (transport: http/streamable-http) on port ${port}`);
    console.log(`MCP endpoint: http://0.0.0.0:${port}/mcp`);
  });
}

async function main(): Promise<void> {
  const transport = process.env.MCP_TRANSPORT ?? 'http';

  if (transport === 'http') {
    await startHttp();
  } else {
    await startStdio();
  }
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
