import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { ScreenshotRequest, ScreenshotResponse } from './types';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');

const USERNAME_SELECTORS = [
  'input[type=email]',
  'input[name*=email i]',
  'input[name*=user i]',
  'input[id*=email i]',
  'input[id*=user i]',
  'input[type=text]',
];

const SUBMIT_SELECTORS = [
  'button[type=submit]',
  'input[type=submit]',
  'button:has-text("Log in")',
  'button:has-text("Login")',
  'button:has-text("Sign in")',
  'button:has-text("Submit")',
];

async function findFirst(page: import('playwright').Page, selectors: string[]) {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.count() > 0) return el;
  }
  return null;
}

export async function takeScreenshot(req: ScreenshotRequest): Promise<ScreenshotResponse> {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(req.url, { waitUntil: 'networkidle' });

    if (req.credentials) {
      const usernameField = await findFirst(page, USERNAME_SELECTORS);
      if (!usernameField) throw new Error('Login failed: could not find username field');

      const passwordField = page.locator('input[type=password]').first();
      if (await passwordField.count() === 0) throw new Error('Login failed: could not find password field');

      await usernameField.fill(req.credentials.username);
      await passwordField.fill(req.credentials.password);

      const submitBtn = await findFirst(page, SUBMIT_SELECTORS);
      if (!submitBtn) throw new Error('Login failed: could not find submit button');

      const loginPageUrl = page.url();
      await submitBtn.click();
      // Wait until the URL changes — this confirms login redirect has occurred
      await page.waitForURL((url) => url.toString() !== loginPageUrl, { timeout: 15000 });

      // After login the app redirects to its default page — navigate to the intended URL
      await page.goto(req.url, { waitUntil: 'networkidle' });
    }

    const filename = `${Date.now()}.png`;
    const filePath = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filePath });

    return {
      path: path.relative(process.cwd(), filePath),
      filename,
    };
  } finally {
    await browser.close();
  }
}
