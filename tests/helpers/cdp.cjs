/* Utilidades mínimas de Chrome DevTools Protocol (sin dependencias). */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.CHROME_PATH
].filter(Boolean);

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  throw new Error('No se encontró Chrome. Define CHROME_PATH.');
}

function httpJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(new Error('timeout http ' + url)); });
  });
}

async function waitForDevtools(port, timeoutMs) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < (timeoutMs || 20000)) {
    try {
      const version = await httpJson('http://127.0.0.1:' + port + '/json/version');
      if (version && version.webSocketDebuggerUrl) return version;
    } catch (e) { lastErr = e; }
    await sleep(250);
  }
  throw new Error('DevTools no respondió: ' + (lastErr && lastErr.message));
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function launchChrome(opts) {
  const options = opts || {};
  const chrome = findChrome();
  const port = options.port || 9333;
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mouse-aventura-chrome-'));
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--mute-audio',
    '--hide-scrollbars',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + userDir,
    '--window-size=' + (options.width || 1366) + ',' + (options.height || 768),
    '--force-device-scale-factor=1',
    'about:blank'
  ];
  const proc = spawn(chrome, args, { stdio: 'ignore', windowsHide: true });
  const version = await waitForDevtools(port, options.timeout || 25000);
  const pages = await httpJson('http://127.0.0.1:' + port + '/json/list');
  const page = pages.find((p) => p.type === 'page');
  if (!page) throw new Error('No hay pestaña disponible');
  const client = await connect(page.webSocketDebuggerUrl);
  return {
    proc: proc,
    port: port,
    userDir: userDir,
    client: client,
    async close() {
      try { await client.send('Browser.close'); } catch (e) {}
      try { client.ws.close(); } catch (e) {}
      await sleep(300);
      try { proc.kill(); } catch (e) {}
      try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {}
    }
  };
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    const handlers = new Map();
    let id = 0;
    ws.addEventListener('open', () => {
      resolve({
        ws: ws,
        send: send,
        on: on,
        off: off
      });
    });
    ws.addEventListener('error', (ev) => reject(new Error('WebSocket error')));
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString()); } catch (e) { return; }
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message + ' ' + (msg.error.data || '')));
        else p.resolve(msg.result);
      } else if (msg.method) {
        (handlers.get(msg.method) || []).forEach((fn) => {
          try { fn(msg.params, msg.sessionId); } catch (e) { /* ignorar */ }
        });
      }
    });

    function send(method, params, sessionId) {
      return new Promise((res, rej) => {
        const msgId = ++id;
        pending.set(msgId, { resolve: res, reject: rej });
        const payload = { id: msgId, method: method, params: params || {} };
        if (sessionId) payload.sessionId = sessionId;
        ws.send(JSON.stringify(payload));
        setTimeout(() => {
          if (pending.has(msgId)) {
            pending.delete(msgId);
            rej(new Error('CDP timeout: ' + method));
          }
        }, 30000);
      });
    }
    function on(method, fn) {
      if (!handlers.has(method)) handlers.set(method, []);
      handlers.get(method).push(fn);
      return () => off(method, fn);
    }
    function off(method, fn) {
      handlers.set(method, (handlers.get(method) || []).filter((f) => f !== fn));
    }
  });
}

/** Recoge errores de la página. */
function trackErrors(client) {
  const errors = [];
  client.on('Runtime.exceptionThrown', (params) => {
    const d = params.exceptionDetails || {};
    errors.push((d.text || 'Error') + (d.exception && d.exception.description ? ': ' + d.exception.description : ''));
  });
  client.on('Runtime.consoleAPICalled', (params) => {
    if (params.type !== 'error') return;
    const text = (params.args || []).map((a) => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ');
    errors.push('console.error: ' + text);
  });
  client.on('Log.entryAdded', (params) => {
    if (params.entry && params.entry.level === 'error') errors.push('log: ' + params.entry.text);
  });
  return errors;
}

async function preparePage(host, opts) {
  const options = opts || {};
  const browser = await launchChrome({ width: options.width, height: options.height, port: options.port });
  const client = browser.client;
  const errors = trackErrors(client);
  await client.send('Page.enable');
  await client.send('Emulation.setDeviceMetricsOverride', { width: options.width || 1366, height: options.height || 768, deviceScaleFactor: 1, mobile: false });
  await client.send('Runtime.enable');
  await client.send('Log.enable');
  let loaded = false;
  client.on('Page.loadEventFired', () => { loaded = true; });
  const url = host.replace(/\/$/, '') + (options.path || '/index.html');
  await client.send('Page.navigate', { url: url });
  const start = Date.now();
  while (!loaded && Date.now() - start < 15000) await sleep(100);
  await sleep(options.settle || 700);

  async function evaluate(expression) {
    const res = await client.send('Runtime.evaluate', {
      expression: expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (res.exceptionDetails) {
      const d = res.exceptionDetails;
      throw new Error('Error al evaluar: ' + (d.exception && d.exception.description ? d.exception.description : d.text));
    }
    return res.result ? res.result.value : undefined;
  }

  async function screenshot(file) {
    const res = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
    return file;
  }

  async function mouse(type, x, y, button) {
    await client.send('Input.dispatchMouseEvent', {
      type: type,
      x: Math.round(x),
      y: Math.round(y),
      button: button === 2 ? 'right' : button === 1 ? 'middle' : 'left',
      buttons: type === 'mousePressed' ? (button === 2 ? 2 : 1) : 0,
      clickCount: type === 'mouseMoved' ? 0 : 1,
      pointerType: 'mouse'
    });
  }

  async function rectOf(selector) {
    return evaluate(`(async () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      let r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight || r.left < 0 || r.right > window.innerWidth) {
        el.scrollIntoView({ block: 'center', inline: 'center' });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        r = el.getBoundingClientRect();
      }
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    })()`);
  }

  /* Arrastre con el botón izquierdo mantenido: los eventos intermedios llevan
     buttons: 1 igual que un mouse real (necesario para probar el arrastre). */
  async function dragTo(from, to, opts) {
    const o = opts || {};
    const steps = o.steps || 12;
    const delay = o.stepDelay === undefined ? 18 : o.stepDelay;
    await mouse('mouseMoved', from.x, from.y, 0);
    await client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: Math.round(from.x), y: Math.round(from.y),
      button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse'
    });
    for (let i = 1; i <= steps; i++) {
      const x = from.x + (to.x - from.x) * i / steps;
      const y = from.y + (to.y - from.y) * i / steps;
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved', x: Math.round(x), y: Math.round(y),
        button: 'left', buttons: 1, clickCount: 0, pointerType: 'mouse'
      });
      await sleep(delay);
    }
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: Math.round(to.x), y: Math.round(to.y),
      button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse'
    });
    await sleep(o.settle || 260);
  }

  async function clickSelector(selector, button) {
    const rect = await rectOf(selector);
    if (!rect) throw new Error('No se encontró ' + selector);
    await mouse('mouseMoved', rect.x, rect.y, 0);
    await mouse('mousePressed', rect.x, rect.y, button || 0);
    await mouse('mouseReleased', rect.x, rect.y, button || 0);
    await sleep(80);
  }

  async function clickText(text) {
    const rect = await evaluate(`(async () => {
      const els = Array.from(document.querySelectorAll('button'));
      const el = els.find(b => (b.textContent||'').includes(${JSON.stringify(text)}));
      if (!el) return null;
      let r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight || r.left < 0 || r.right > window.innerWidth) {
        el.scrollIntoView({ block: 'center', inline: 'center' });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        r = el.getBoundingClientRect();
      }
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    if (!rect) throw new Error('No se encontró botón con texto ' + text);
    await mouse('mouseMoved', rect.x, rect.y, 0);
    await mouse('mousePressed', rect.x, rect.y, 0);
    await mouse('mouseReleased', rect.x, rect.y, 0);
    await sleep(100);
  }

  return { browser, client, errors, evaluate, screenshot, clickSelector, clickText, mouse, dragTo, rectOf };
}

module.exports = { launchChrome, preparePage, findChrome, sleep };
