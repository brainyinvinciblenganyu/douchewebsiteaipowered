import fs from 'fs';
import path from 'path';
import { createProduct } from './lib/db/queries.ts';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^"|"$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

async function run() {
  try {
    const product = await createProduct({
      name: 'Debug product',
      description: 'Product create debug',
      category: 'Furniture',
      tags: ['debug'],
      price: 12345,
      currency: 'FCFA',
      vendor_user_id: 'cc9b8617-2c55-48b9-9e21-e8970b2afd80',
      asset_name: 'test.glb',
      asset_type: 'model/gltf-binary',
      asset_size: 123,
      asset_data: null,
      asset_file: Buffer.from([0, 1, 2, 3]),
      status: 'published',
    });
    console.log('created', product);
  } catch (error) {
    console.error('ERROR', error);
  }
}

run();
