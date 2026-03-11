import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { takeScreenshot } from './screenshot';

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
