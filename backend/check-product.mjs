const base = 'http://localhost:3001';
const email = 'me@codewithgillis.com';
const password = 'unused';
const form = new FormData();
form.append('name', 'Test product');
form.append('description', 'Debug product creation');
form.append('category', 'Furniture');
form.append('price', '12345');
form.append('currency', 'FCFA');
form.append('vendor_user_id', 'cc9b8617-2c55-48b9-9e21-e8970b2afd80');
form.append('status', 'published');
form.append('tags', 'debug');
const fileContent = new Uint8Array([0, 1, 2, 3, 4]);
form.append('asset_file', new Blob([fileContent]), 'test.glb');

try {
  const res = await fetch(`${base}/api/products`, { method: 'POST', body: form });
  console.log('status', res.status);
  console.log(await res.text());
} catch (e) {
  console.error('request failed', e);
}
