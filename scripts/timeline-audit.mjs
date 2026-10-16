import { createServer } from 'node:http';
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

const exec = promisify(execFile);
const DIST = process.env.DIST_DIR || 'dist';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };

// Records a timeline: does the fixed-width canvas ever get re-fitted after hydration?
const PROBE = `(function () {
  var samples = [];
  var errs = [];
  window.addEventListener('error', function (e) { errs.push(String(e.message).slice(0, 200)); });
  window.addEventListener('unhandledrejection', function (e) { errs.push('rej: ' + String(e.reason).slice(0, 200)); });
  function sample(t) {
    var wide = null, maxW = 0;
    var all = document.querySelectorAll('div[style*="width"]');
    for (var i = 0; i < all.length; i++) {
      var w = parseFloat(all[i].style.width) || 0;
      if (w > maxW) { maxW = w; wide = all[i]; }
    }
    samples.push({
      t: t,
      docScrollWidth: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
      widestInlineWidth: maxW,
      widestClasses: wide ? (wide.getAttribute('class') || '').slice(0, 90) : null,
      islands: document.querySelectorAll('astro-island').length,
      // React hydration removes the island's "ssr" attribute once it takes over
      unhydrated: document.querySelectorAll('astro-island[ssr]').length
    });
  }
  sample(0);
  var n = 0;
  var iv = setInterval(function () { n++; sample(n * 500); if (n >= 16) clearInterval(iv); }, 500);
  setTimeout(function () {
    var ta = document.createElement('textarea');
    ta.id = '__probe__';
    ta.style.display = 'none';
    ta.textContent = btoa(unescape(encodeURIComponent(JSON.stringify({ samples: samples, errs: errs }))));
    document.body.appendChild(ta);
  }, 12000);
})();`;

const tmp = await mkdtemp(join(tmpdir(), 'probe-'));
await cp(DIST, tmp, { recursive: true });
const page = process.argv[2] || 'calculators/money-flow';
const file = join(tmp, page, 'index.html');
const html = await readFile(file, 'utf8');
await writeFile(file, html.replace('</body>', `<script>${PROBE}</script></body>`));

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let f = join(tmp, urlPath);
  if (urlPath.endsWith('/')) f = join(f, 'index.html');
  try { const b = await readFile(f); res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const W = process.env.W || '1440';
const { stdout } = await exec(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--virtual-time-budget=14000', `--window-size=${W},900`, '--dump-dom', `http://127.0.0.1:${port}/${page}/`], { maxBuffer: 200 * 1024 * 1024 });
const m = stdout.match(/<textarea[^>]*id="__probe__"[^>]*>([A-Za-z0-9+/=]*)<\/textarea>/);
if (!m) { console.log('probe did not report'); process.exit(1); }
const data = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
console.log(`${page} @window ${W}`);
for (const s of data.samples) console.log(`  t=${String(s.t).padStart(5)}ms doc=${s.docScrollWidth} vw=${s.viewport} widestInlineW=${s.widestInlineWidth} unhydratedIslands=${s.unhydrated}/${s.islands}`);
if (data.errs.length) console.log('  page errors:', data.errs.slice(0, 5));
console.log('  widest classes:', data.samples[0].widestClasses);
server.close();
await rm(tmp, { recursive: true, force: true });
