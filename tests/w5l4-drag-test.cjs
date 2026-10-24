const { chromium } = require('@playwright/test');
const path = require('path');

async function testDrag() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Go to the game
  await page.goto('http://127.0.0.1:8124/');
  await page.waitForLoadState('networkidle');

  // Navigate to teacher panel and enter PIN
  await page.click('a[href*="docente"]') || await page.goto('http://127.0.0.1:8124/docente');
  await page.waitForSelector('.gate-input');

  // Enter PIN 9513
  await page.fill('.gate-input', '9513');
  await page.click('.gate-key--go');
  await page.waitForSelector('.td-section');

  // Click on w5l4 button
  await page.click('button:has-text("4")');
  await page.waitForURL('**/jugar/w5l4**');
  await page.waitForLoadState('networkidle');

  // Wait for intro
  await page.waitForSelector('.level-intro');
  await page.click('.level-intro__actions .btn--primary');
  await page.waitForSelector('.level-intro.is-hidden');

  // Wait for drag items to appear
  await page.waitForSelector('.drag-item');

  // Get the items
  const items = await page.$$('.drag-item');
  console.log(`Found ${items.length} drag items`);

  // Try to drag first item
  const firstItem = items[0];
  const box = await firstItem.boundingBox();
  if (!box) {
    console.log('ERROR: Could not get bounding box for first item');
    await browser.close();
    return;
  }

  console.log(`First item position: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);

  // Try dragging using mouse
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 - 100);
  await page.waitForTimeout(500);
  await page.mouse.up();

  // Check if it moved or if we can detect dragging
  const newBox = await firstItem.boundingBox();
  console.log(`After drag attempt: x=${newBox.x}, y=${newBox.y}`);

  // Check for is-dragging class
  const isDragging = await firstItem.evaluate(el => el.classList.contains('is-dragging'));
  console.log(`Is dragging class: ${isDragging}`);

  // Check zones
  const zones = await page.$$('.drag-zone');
  console.log(`Found ${zones.length} zones`);

  for (const zone of zones) {
    const zoneBox = await zone.boundingBox();
    console.log(`Zone at: x=${zoneBox.x}, y=${zoneBox.y}, w=${zoneBox.width}, h=${zoneBox.height}`);
  }

  // Check pointer events
  const pointerEvents = await firstItem.evaluate(el => getComputedStyle(el).pointerEvents);
  console.log(`Drag item pointer-events: ${pointerEvents}`);

  const tray = await page.$('.drag-tray');
  if (tray) {
    const trayPointerEvents = await tray.evaluate(el => getComputedStyle(el).pointerEvents);
    console.log(`Tray pointer-events: ${trayPointerEvents}`);
    const trayZIndex = await tray.evaluate(el => getComputedStyle(el).zIndex);
    console.log(`Tray z-index: ${trayZIndex}`);
  }

  const itemZIndex = await firstItem.evaluate(el => getComputedStyle(el).zIndex);
  console.log(`Drag item z-index: ${itemZIndex}`);

  await browser.close();
}

testDrag().catch(console.error);