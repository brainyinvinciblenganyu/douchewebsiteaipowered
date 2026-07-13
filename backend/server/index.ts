import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './auth/index.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import productRoutes from './routes/products.routes.js';
import orderRoutes from './routes/orders.routes.js';
import brainyRoutes from './routes/brainy.routes.js';

import { productAssetUpload } from './middleware/uploadProductAsset.js';
import { initDatabase } from './db/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDotEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
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
await initDatabase();

const app = express();

app.use(express.json({ limit: '50mb' }));
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// Accept vendor product creation payloads.
// Supports multipart/form-data uploads for 3D files.
app.use(
  '/api/products',
  productAssetUpload.fields([
    { name: 'asset_file', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'model', maxCount: 1 },
  ]),
  productRoutes,
);

app.use('/api/recommendations', recommendationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/brainy', brainyRoutes);

// Error handler for Multer (file upload) errors and centralized errors
app.use((err: any, _req: Request, res: Response, next: (err?: any) => void) => {
  console.error('Unhandled error in request pipeline', err && err.message ? err.message : err);
  if (err && (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE')) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  // Fallback to generic 500 for other errors
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.BACKEND_PORT || 3001);
app.listen(port, () => {
  console.log(`✓ Backend running on port ${port}`);
  console.log('✓ Auth routes mounted at /api/auth');
  console.log('✓ Recommendation routes mounted at /api/recommendations');
});

