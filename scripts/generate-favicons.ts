import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function generatePngIcons() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const svgPath = path.resolve('public/favicon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // Render 180x180 for Apple Touch Icon
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(`
    <html>
      <body style="margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 180px; height: 180px;">
        <div style="width: 180px; height: 180px;">
          ${svgContent.replace('width="32" height="32"', 'width="180" height="180"')}
        </div>
      </body>
    </html>
  `);
  
  const appleTouchPath = path.resolve('public/apple-touch-icon.png');
  await page.screenshot({ path: appleTouchPath, omitBackground: true });
  console.log(`Generated: ${appleTouchPath}`);

  // Render 32x32 for standard PNG favicon
  await page.setViewportSize({ width: 32, height: 32 });
  await page.setContent(`
    <html>
      <body style="margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <div style="width: 32px; height: 32px;">
          ${svgContent}
        </div>
      </body>
    </html>
  `);
  const favicon32Path = path.resolve('public/favicon-32x32.png');
  await page.screenshot({ path: favicon32Path, omitBackground: true });
  console.log(`Generated: ${favicon32Path}`);

  // Also copy to favicon.png
  fs.copyFileSync(favicon32Path, path.resolve('public/favicon.png'));
  console.log('Generated: public/favicon.png');

  await browser.close();
  console.log('✅ All PNG icons successfully generated!');
}

generatePngIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
