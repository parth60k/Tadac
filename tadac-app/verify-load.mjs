import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const extensionPath = path.resolve(__dirname, '..', 'extension', 'dist');
  console.log('Loading unpacked extension from:', extensionPath);
  
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });
    
    console.log('Browser launched successfully. Unpacked extension load complete!');
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to load extension:', error);
    process.exit(1);
  }
})();
