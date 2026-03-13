# saas-screenshot

A self-hostable REST API that takes screenshots of SaaS UIs using Playwright. Supports automatic login via username/password credentials.

## Stack

- **Node.js + TypeScript**
- **Express** — HTTP server
- **Playwright (Chromium)** — headless browser automation
- **MCP SDK** — Model Context Protocol server

## Setup

```bash
npm install
npx playwright install chromium
```

### Start the REST API

```bash
npm start
```

The server starts on port `3000` by default. Override with the `PORT` environment variable.

### Start the MCP server

```bash
npm run start:mcp
```

The MCP server starts on port `3001` by default using the **Streamable HTTP** transport. Override with environment variables:

| Variable | Default | Description |
|---|---|---|
| `MCP_TRANSPORT` | `http` | Transport mode: `http` or `stdio` |
| `MCP_PORT` | `3001` | Port for HTTP transport |

The MCP endpoint is available at `http://0.0.0.0:<MCP_PORT>/mcp`.

**HTTP transport (default, for remote/internet access):**

```bash
npm run start:mcp
# or explicitly:
MCP_TRANSPORT=http MCP_PORT=3001 npm run start:mcp
```

**stdio transport (for local MCP clients that manage the process):**

```bash
MCP_TRANSPORT=stdio npm run start:mcp
```

#### MCP tool: `take_screenshot`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | The page URL to screenshot |
| `username` | `string` | No | Username or email for login |
| `password` | `string` | No | Password for login |

## API

### `POST /screenshot`

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | The page URL to screenshot |
| `credentials.username` | `string` | No | Username or email for login |
| `credentials.password` | `string` | No | Password for login |

**Example — no login required:**

```bash
curl -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Example — with login:**

```bash
curl -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8585/admin/filters/new",
    "credentials": {
      "username": "admin@example.com",
      "password": "secret"
    }
  }'
```

**Response:**

```json
{
  "path": "screenshots/1773247182920.png",
  "filename": "1773247182920.png"
}
```

Screenshots are saved to the `screenshots/` directory at the project root.

### `GET /screenshot`

Takes a screenshot via query parameters — useful for quick testing in a browser.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | The page URL to screenshot |
| `username` | `string` | No | Username or email for login |
| `password` | `string` | No | Password for login |

**Example — no login:**

```bash
curl "http://localhost:3000/screenshot?url=https://example.com"
```

**Example — with login:**

```bash
curl "http://localhost:3000/screenshot?url=http://localhost:8080/admin/filters/new&username=abcd@gmail.com&password=1234"
```

**Response:** same as `POST /screenshot`.

---

### `GET /screenshots/:filename`

Serves a previously generated screenshot by filename.

| Parameter | Type | Description |
|---|---|---|
| `filename` | `string` | The filename returned by `POST /screenshot` |

**Example:**

```bash
curl http://localhost:3000/screenshots/1773247182920.png --output screenshot.png
```

Returns the PNG image file, or `404` if not found.

**Typical workflow:**

```bash
# 1. Generate a screenshot
RESPONSE=$(curl -s -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}')

FILENAME=$(echo $RESPONSE | jq -r '.filename')

# 2. Download the image
curl http://localhost:3000/screenshots/$FILENAME --output screenshot.png
```

## How login works

When credentials are provided, Playwright:

1. Navigates to the given URL (which typically redirects to the login page)
2. Auto-detects the username field (tries `input[type=email]`, name/id patterns, then `input[type=text]`)
3. Fills in username and password
4. Clicks the submit button
5. Waits for the URL to change (confirming a successful login redirect)
6. Navigates to the originally requested URL
7. Takes the screenshot

## Screenshot behaviour

- Viewport: **1440×900** (matches a typical laptop/desktop browser window)
- Captures only the visible viewport — not the full scrollable page
- Output format: PNG
