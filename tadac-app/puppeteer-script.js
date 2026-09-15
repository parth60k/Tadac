const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  let logs = '';
  const log = (msg) => {
    logs += msg + '\n';
    console.log(msg);
  };
  
  // Log all console output
  page.on('console', msg => log('BROWSER_CONSOLE: ' + msg.text()));
  page.on('pageerror', err => log('BROWSER_ERROR: ' + err.message));
  
  await page.goto('http://localhost:3000/focus', { waitUntil: 'networkidle0' });
  
  log('--- TEST A: BEFORE UPLOAD ---');
  let getPlayBtn = async () => {
     const btns = await page.$$('button');
     return btns[2]; // Rough estimation, let's just find the play button by looking at SVG or try to click manualTogglePlay
  }
  
  // Let's use evaluate to click it
  await page.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button.btn-primary'));
     if (btns.length > 0) btns[0].click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Upload input
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
      log('--- TEST B: AFTER UPLOAD ---');
      await fileInputs[0].uploadFile('d:/tadac/dummy.mp3');
      await new Promise(r => setTimeout(r, 1000));
      
      log("Playing AFTER UPLOAD");
      await page.evaluate(() => {
         const btns = Array.from(document.querySelectorAll('button.btn-primary'));
         if (btns.length > 0) btns[0].click();
      });
      await new Promise(r => setTimeout(r, 1000));
      
      // Also get audio state
      const audioState = await page.evaluate(() => {
         const a = document.querySelector('audio');
         return a ? { src: a.src, paused: a.paused, readyState: a.readyState, error: a.error ? a.error.message : null } : null;
      });
      log('Audio State: ' + JSON.stringify(audioState));
      
      log('--- TEST C: SAME FILE ---');
      await fileInputs[0].uploadFile('d:/tadac/dummy.mp3');
      await new Promise(r => setTimeout(r, 1000));
      log("Uploaded same file again.");
  }
  
  fs.writeFileSync('d:/tadac/tadac-app/debug.log', logs, 'utf8');
  await browser.close();
  process.exit(0);
})();
