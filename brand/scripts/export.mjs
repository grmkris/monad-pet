// Free, local SVG rasterization only. Does not call an image model.
import { readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
const root = new URL('../', import.meta.url);
async function render(source, target, width) {
  const svg = await readFile(new URL(source, root), 'utf8');
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  await writeFile(new URL(target, root), png);
  console.log(`${target}: ${width} px wide, ${png.length} bytes`);
}
await render('logo.svg', 'logo.png', 1024);
await render('mascot.svg', 'mascot-32.png', 32);
await render('mascot-moods.svg', 'mascot-moods.png', 1120);
for (const mood of ['happy', 'peckish', 'starving']) {
  await render(`mascot-${mood}.svg`, `mascot-${mood}-32.png`, 32);
}
