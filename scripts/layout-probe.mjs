import { createServer } from 'node:http';
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

const exec = promisify(execFile);
const DIST = process.env.DIST_DIR || 'dist';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };

// Measures AFTER hydration, then walks the ancestor chain of the widest element so the
// constraint that is missing (usually a min-width:auto in a flex/grid) is visible.
const PROBE = `(function () {
  function desc(el) {
    var c = (el.getAttribute('class') || '');
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c.split(/\\s+/).slice(0, 5).join('.') : '');
  }
  function measure() {
    var vw = document.documentElement.clientWidth;
    var out = { vw: vw, docSW: document.documentElement.scrollWidth, widest: [], chain: [] };
    var all = document.querySelectorAll('body *');
    var max = 0, winner = null;
    for (var i = 0; i < all.length; i++) {
      var el = all[i], r = el.getBoundingClientRect();
      if (r.width <= vw + 1) continue;
      if (r.width > max) { max = r.width; winner = el; }
    }
    if (winner) {
      out.maxWidth = Math.round(max);
      var n = winner, depth = 0;
      while (n && n.tagName && depth < 14) {
        var cs = getComputedStyle(n);
        var rr = n.getBoundingClientRect();
        out.chain.push({
          el: desc(n),
          w: Math.round(rr.width),
          clientW: n.clientWidth,
          scrollW: n.scrollWidth,
          overflowX: cs.overflowX,
          display: cs.display,
          minWidth: cs.minWidth,
          flex: cs.flex,
          gridTemplateColumns: cs.gridTemplateColumns.slice(0, 60),
          position: cs.position,
          parentW: n.parentElement ? Math.round(n.parentElement.getBoundingClientRect().width) : null
        });
        n = n.parentElement; depth++;
      }
      // The inline width/transform that the component sets, if any
      out.inline = {};
      var styled = winner.querySelectorAll('[style*="width"]');
      for (var k = 0; k < Math.min(styled.length, 8); k++) {
        out.inline[desc(styled[k])] = styled[k].getAttribute('style');
      }
    }
    var ta = document.createElement('textarea');
    ta.id = '__probe__'; ta.style.display = 'none';
    ta.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(out))));
    document.body.appendChild(ta);
  }
  function ready(t) {
    if (document.querySelectorAll('astro-island[ssr]').length === 0 || t > 9000) measure();
    else setTimeout(function () { ready(t + 250); }, 250);
  }
  setTimeout(function () { ready(0); }, 400);
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
const W = process.env.W || '500';
const { stdout } = await exec(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--virtual-time-budget=14000', `--window-size=${W},1000`, '--dump-dom', `http://127.0.0.1:${port}/${page}/`], { maxBuffer: 200 * 1024 * 1024 });
const m = stdout.match(/<textarea[^>]*id="__probe__"[^>]*>([A-Za-z0-9+/=]*)<\/textarea>/);
if (!m) { console.log('probe did not report'); process.exit(1); }
const d = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
console.log(`${page} @${d.vw}px viewport  documentScrollWidth=${d.docSW}  widestElement=${d.maxWidth || 'none exceeds viewport'}`);
if (d.chain.length) {
  console.log('\nANCESTOR CHAIN of the widest element (inner -> outer):');
  for (const c of d.chain) {
    console.log(`  w=${String(c.w).padStart(5)} client=${String(c.clientW).padStart(5)} scroll=${String(c.scrollW).padStart(5)} overflowX=${c.overflowX.padEnd(8)} display=${c.display.padEnd(7)} minW=${c.minWidth.padEnd(7)} pos=${c.position.padEnd(9)} parentW=${c.parentW}`);
    console.log(`      ${c.el}`);
    if (c.flex && c.flex !== '0 1 auto') console.log(`      flex: ${c.flex}   gridTemplateColumns: ${c.gridTemplateColumns}`);
  }
  console.log('\nINLINE WIDTHS inside that element:');
  for (const [k, v] of Object.entries(d.inline)) console.log(`  ${k}\n      style="${v}"`);
}
server.close();
await rm(tmp, { recursive: true, force: true });
