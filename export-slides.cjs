const puppeteer = require('/opt/homebrew/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
const path = require('path');

const W = 1280;
const H = 720;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });

  const file = 'file://' + path.resolve(__dirname, 'slides.html');
  await page.goto(file, { waitUntil: 'networkidle0' });

  // Wait for fonts + QR code images
  await new Promise(r => setTimeout(r, 2000));

  // Swap video slide → static screenshot for PDF
  await page.evaluate(() => {
    document.querySelectorAll('video').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.pdf-fallback').forEach(img => img.style.display = 'block');
  });

  await page.pdf({
    path: path.resolve(__dirname, 'slides.pdf'),
    width:  W + 'px',
    height: H + 'px',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  await browser.close();
  console.log('✓  slides.pdf written');
})();
