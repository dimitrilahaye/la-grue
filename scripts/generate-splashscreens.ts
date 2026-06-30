import sharp from 'sharp';
import path from 'path';

const assetsDir = path.resolve(__dirname, '..', 'assets');

const CRANE_BODY = `
  <rect x="88" y="30" width="12" height="130" fill="#4A4A4A" rx="3"/>
  <rect x="30" y="30" width="130" height="12" fill="#FFFFFF" rx="3"/>
  <rect x="30" y="42" width="30" height="18" fill="#4A4A4A" rx="3"/>
  <line x1="140" y1="42" x2="140" y2="100" stroke="#4A4A4A" stroke-width="3"/>
  <line x1="156" y1="36" x2="94" y2="36" stroke="#4A4A4A" stroke-width="2"/>
  <path d="M136 100 Q136 114 143 114 Q150 114 150 108 Q150 102 143 102"
        fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  <polygon points="88,160 60,185 116,185" fill="#4A4A4A"/>
  <rect x="152" y="80" width="6" height="70" fill="#9B9B9B" rx="2"/>
  <rect x="140" y="80" width="50" height="6" fill="#9B9B9B" rx="2"/>
  <line x1="178" y1="86" x2="178" y2="126" stroke="#9B9B9B" stroke-width="2"/>
  <path d="M175 126 Q175 134 179 134 Q183 134 183 130 Q183 126 179 126"
        fill="none" stroke="#9B9B9B" stroke-width="2.5" stroke-linecap="round"/>
  <polygon points="152,150 142,163 162,163" fill="#9B9B9B"/>
`;

function splashSvg(w: number, h: number): Buffer {
  const logoSize = Math.round(Math.min(w, h) * 0.28);
  const cx = w / 2;
  const cy = h / 2;
  const scale = logoSize / 200;
  const ox = cx - logoSize / 2;
  const oy = cy - logoSize / 2 - logoSize * 0.1;
  const textY = oy + logoSize + Math.round(logoSize * 0.22);
  const fontSize = Math.round(logoSize * 0.22);

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="${w}" height="${h}" fill="#F5C518"/>
      <g transform="translate(${ox}, ${oy}) scale(${scale})">
        ${CRANE_BODY}
      </g>
      <text x="${cx}" y="${textY}"
            font-family="system-ui,-apple-system,sans-serif"
            font-size="${fontSize}" font-weight="700"
            fill="#4A4A4A" text-anchor="middle" letter-spacing="-1">La Grue</text>
    </svg>`,
  );
}

const SPLASHES: Array<{ w: number; h: number; label: string }> = [
  { w: 640,  h: 1136, label: 'iPhone SE 1st gen' },
  { w: 750,  h: 1334, label: 'iPhone SE 2/3, 6/7/8' },
  { w: 1242, h: 2208, label: 'iPhone 6+/7+/8+' },
  { w: 1125, h: 2436, label: 'iPhone X/XS/11 Pro/12 mini/13 mini' },
  { w: 828,  h: 1792, label: 'iPhone XR/11' },
  { w: 1242, h: 2688, label: 'iPhone XS Max/11 Pro Max' },
  { w: 1170, h: 2532, label: 'iPhone 12/12 Pro/13/13 Pro/14' },
  { w: 1284, h: 2778, label: 'iPhone 12 Pro Max/13 Pro Max' },
  { w: 1179, h: 2556, label: 'iPhone 14 Pro/15/15 Pro' },
  { w: 1290, h: 2796, label: 'iPhone 14 Pro Max/15 Plus/15 Pro Max' },
];

async function run() {
  for (const { w, h, label } of SPLASHES) {
    const out = path.join(assetsDir, `splash-${w}x${h}.png`);
    await sharp(splashSvg(w, h)).png().toFile(out);
    console.log(`✓ splash-${w}x${h}.png  (${label})`);
  }
}

run().catch(console.error);
