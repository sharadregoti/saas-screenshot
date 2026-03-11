# saas-screenshot

A self-hostable REST API that takes screenshots of SaaS UIs using Playwright. Supports automatic login via username/password credentials.

## Stack

- **Node.js + TypeScript**
- **Express** — HTTP server
- **Playwright (Chromium)** — headless browser automation

## Setup

```bash
npm install
npx playwright install chromium
npm start
```

The server starts on port `3000` by default. Override with the `PORT` environment variable.

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
