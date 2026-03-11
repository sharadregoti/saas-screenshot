import express, { Request, Response, NextFunction } from 'express';
import { takeScreenshot } from './screenshot';
import { ScreenshotRequest } from './types';

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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Screenshot service listening on port ${port}`);
});
