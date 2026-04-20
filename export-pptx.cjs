const puppeteer = require('/opt/homebrew/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const W = 1280;
const H = 720;
const SLIDES = 4;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H * SLIDES + 40 * (SLIDES - 1), deviceScaleFactor: 2 });

  const file = 'file://' + path.resolve(__dirname, 'slides.html');
  await page.goto(file, { waitUntil: 'networkidle0' });

  // Wait for fonts + remote QR images
  await new Promise(r => setTimeout(r, 2500));

  // Swap video → screenshot fallback
  await page.evaluate(() => {
    document.querySelectorAll('video').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.pdf-fallback').forEach(img => img.style.display = 'block');
  });

  // Get each slide's top position in the page
  const slideOffsets = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.slide')).map(el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, height: r.height };
    })
  );

  const pngPaths = [];

  for (let i = 0; i < SLIDES; i++) {
    const { top, height } = slideOffsets[i];
    const outPath = path.resolve(__dirname, `slide-${i + 1}.png`);

    await page.screenshot({
      path: outPath,
      clip: { x: 0, y: top, width: W, height: height },
    });

    pngPaths.push(outPath);
    console.log(`  captured slide ${i + 1}`);
  }

  await browser.close();

  // Build PPTX
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  for (let i = 0; i < SLIDES; i++) {
    const slide = pptx.addSlide();
    slide.addImage({
      path: pngPaths[i],
      x: 0, y: 0,
      w: '100%', h: '100%',
    });
  }

  const outFile = path.resolve(__dirname, 'slides.pptx');
  await pptx.writeFile({ fileName: outFile });
  console.log('✓  slides.pptx written');

  // Clean up temp PNGs
  pngPaths.forEach(f => fs.unlinkSync(f));
})();
