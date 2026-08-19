import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = 'https://cdn.jsdelivr.net/npm/libarchive.js@2.0.2/dist/worker-bundle.js';
const dest = path.join(__dirname, 'public', 'worker-bundle.js');

https.get(url, (res) => {
  const file = fs.createWriteStream(dest);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded:', fs.statSync(dest).size, 'bytes');
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});