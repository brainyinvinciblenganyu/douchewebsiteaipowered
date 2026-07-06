import fs from 'fs';
import path from 'path';
import express, { type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './auth/index.js';

function loadDotEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    console.error('Failed to load .env.local', error);
  }
}

loadDotEnvLocal();

const app = express();

app.use(express.json());
app.use(cookieParser());
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server requests)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Reflect the requesting origin (e.g. localhost, local IPs like 192.168.x.x) to support testing
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'Backend running' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

app.use('/api/auth', authRoutes);

const port = Number(process.env.BACKEND_PORT || 3001);
app.listen(port, () => {
  console.log(`✓ Backend running on port ${port}`);
  console.log('✓ Auth routes mounted at /api/auth');
});

