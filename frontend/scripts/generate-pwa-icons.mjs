/**
 * Generate PWA icons from the source logo.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const sourceLogo = join(publicDir, 'logo.png');

const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

async function generateIcons() {
  console.log('Generating PWA icons from:', sourceLogo);
  
  // Ensure icons directory exists
  const iconsDir = join(publicDir, 'icons');
  await mkdir(iconsDir, { recursive: true });

  for (const { size, name } of sizes) {
    const outputPath = join(iconsDir, name);
    await sharp(sourceLogo)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }, // #0f172a (theme color)
      })
      .png()
      .toFile(outputPath);
    console.log(`  Created: ${name} (${size}x${size})`);
  }

  // Generate maskable icon (with padding for safe area)
  const maskableSize = 512;
  const padding = Math.floor(maskableSize * 0.1); // 10% padding
  const innerSize = maskableSize - (padding * 2);
  
  await sharp(sourceLogo)
    .resize(innerSize, innerSize, { fit: 'contain' })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    })
    .png()
    .toFile(join(iconsDir, 'maskable-icon-512x512.png'));
  console.log('  Created: maskable-icon-512x512.png (512x512 with safe area)');

  // Generate Apple touch icon (180x180)
  await sharp(sourceLogo)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    })
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('  Created: apple-touch-icon.png (180x180)');

  // Generate favicon (32x32)
  await sharp(sourceLogo)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    })
    .png()
    .toFile(join(publicDir, 'favicon.png'));
  console.log('  Created: favicon.png (32x32)');

  console.log('\nDone! Update vite.config.ts manifest.icons to use the new paths.');
}

generateIcons().catch(console.error);
