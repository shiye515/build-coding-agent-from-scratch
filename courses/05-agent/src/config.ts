import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

const isGlobal = !fs.existsSync(path.join(process.cwd(), '../..', 'settings.json'));

const configDir = isGlobal ? path.join(os.homedir(), '.tcode') : path.join(process.cwd(), '../..');

if (isGlobal && !fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

if (isGlobal && !fs.existsSync(path.join(configDir, 'settings.json'))) {
  fs.writeFileSync(
    path.join(configDir, 'settings.json'),
    JSON.stringify(
      {
        env: {
          BASE_URL: 'https://api.deepseek.com/anthropic',
          MODEL: 'deepseek-v4-flash',
          API_KEY: 'your-api-key-here',
          CONTEXT_WINDOW: 100000,
        },
      },
      null,
      2,
    ) + '\n',
  );
}

const envPath = path.join(process.cwd(), '../..', '.env');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

const settingsPath = path.join(configDir, 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

export const BASE_URL = settings.env.BASE_URL;
export const MODEL = settings.env.MODEL;
export const API_KEY = process.env.API_KEY || settings.env.API_KEY || '';
export const CONTEXT_WINDOW = settings.env.CONTEXT_WINDOW || 100000;

if (!API_KEY || API_KEY === 'your-api-key-here') {
  console.error('API_KEY is not configured');
  console.error(`Please set it in ${settingsPath}`);
  process.exit(1);
}
