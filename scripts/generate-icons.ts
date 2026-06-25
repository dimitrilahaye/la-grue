import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const assetsDir = path.resolve(__dirname, '..', 'assets');
const svgPath = path.join(assetsDir, 'logo.svg');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of [192, 512]) {
    const outPath = path.join(assetsDir, `icon-${size}.png`);
    await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
    console.log(`✓ Generated ${outPath}`);
  }
}

generateIcons().catch(console.error);
