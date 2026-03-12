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

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Screenshot service listening on port ${port}`);
});
