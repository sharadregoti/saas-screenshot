import express, { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { takeScreenshot } from './screenshot';
import { ScreenshotRequest } from './types';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');

const app = express();
app.use(express.json());

app.post('/screenshot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as ScreenshotRequest;
    if (!body.url || typeof body.url !== 'string') {
      res.status(400).json({ error: 'url is required and must be a string' });
      return;
    }
    const result = await takeScreenshot(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/screenshot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, username, password } = req.query;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url query parameter is required' });
      return;
    }
    const body: ScreenshotRequest = { url };
    if (username || password) {
      body.credentials = {
        username: typeof username === 'string' ? username : '',
        password: typeof password === 'string' ? password : '',
      };
    }
    const result = await takeScreenshot(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/screenshots/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }
  res.sendFile(filePath);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const basePort = parseInt(process.env.PORT ?? '3000', 10);
const maxAttempts = 3;

function startServer(port: number, attempt: number): void {
  const server = app.listen(port);
  server.on('listening', () => {
    console.log(`Screenshot service listening on port ${port}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && attempt < maxAttempts) {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1, attempt + 1);
    } else {
      console.error(`Failed to start server after ${attempt} attempt(s): ${err.message}`);
      process.exit(1);
    }
  });
}

startServer(basePort, 1);
