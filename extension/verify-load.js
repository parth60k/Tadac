const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const extensionPath = path.join(__dirname, 'dist');
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
