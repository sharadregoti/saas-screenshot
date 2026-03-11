export interface Credentials {
  username: string;
  password: string;
}

export interface ScreenshotRequest {
  url: string;
  credentials?: Credentials;
}

export interface ScreenshotResponse {
  path: string;
  filename: string;
}
