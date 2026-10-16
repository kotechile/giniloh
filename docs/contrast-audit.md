# Contrast, layout and payload audit — October 2026

Measured, not eyeballed. Every number here came out of a browser rendering the real build.

## How to run the gates

```bash
npm run build              # 1080 pages, ~110s
npm run audit:contrast     # WCAG AA for every text element; exits non-zero on any failure
npm run audit:contrast -- --all           # every built page (the real gate)
npm run audit:layout -- 500 /calculators/money-flow/   # horizontal overflow + tap targets
```

Both harnesses are dependency-free: they inject an auditor into a copy of `dist/`, serve it over
localhost, drive headless Chrome with `--dump-dom`, and read base64 JSON back out of a hidden
`<textarea>`. No CDP, no websocket client, no npm install.

**Prove the gate can fail before trusting a green run.** Revert one token in `global.css` (say
`--ink-muted` back to `#8C8C8C`), re-run, and confirm it exits non-zero and names the pages.

## Result

| | Before | After |
|---|---|---|
| Text elements below AA (20 pages sampled) | **544 of 2382** | **0 of 2778** (gate exits 0) |
| Distinct failure signatures | 129 | 0 |
| Of those, caused by one token (`#8C8C8C`) | 98 | 0 |
| Pages with page-level horizontal overflow | 1 (money-flow) | **still 1 — OPEN, see below** |
| CSS shipped to every page | 203KB raw / 40KB gzip | 167KB raw / 25KB gzip |
| Font files / payload / `@font-face` blocks | 50 / 736KB / 54 | **8 / 184KB / 8** |
| `@media (prefers-color-scheme: dark)` blocks | 1 (carrying 11 rules) | 0 |
| Unused dependencies | `framer-motion`, `lucide-react` (0 imports) | removed |

Worst cases found, before the fix — all invisible or near-invisible:

| Element | Measured | Now |
|---|---|---|
| Terminal log line, money-flow | `#E2E8F0` on white — **1.23:1** | 10.4:1 |
| Tab label on the active blue tab | `#8C8C8C` on `#155DFC` — **1.56:1** | 17.4:1 |
| Eyebrow with only a dead `.light` variant | `#B5C2FF` on white — **1.73:1** | 5.33:1 |
| Cost chip on a mid-tone tint | `#8C8C8C` on `#B4C1C7` — **1.82:1** | 9.44:1 |
| Chart axis labels | `#94A3B8` on white — **2.56:1** | 4.76:1 |
| Risk-medium ink | `#C88D4E` on white — **2.85:1** | 4.80:1 |
| White ink on the cyan Send button | **3.62:1** | 17.4:1 |

## Root causes

Nine distinct causes. The list matters more than the diff, because eight of them are *classes* of bug
that would come straight back on the next component anyone writes.

1. **One token caused 98 of 129 signatures.** `#8C8C8C` was the documented metadata ink; it measures
   3.36:1 on white, 3.27:1 on the author card, 3.21:1 on a panel tint and 1.56:1 on the active blue
   tab. Fixing the tier (`#6B6B6B`, 5.33:1 on white / 5.10:1 on the gray-50 hover fill) and sweeping
   265 call sites removed three quarters of the failures. `#8C8C8C` is now documented as
   decoration-only.

2. **An entire rule block was dead and nothing said so.** `global.css` §9 mapped the risk palette, but
   it listed `.text-[#B85C5C]` as a *selector* — an unescaped `#` inside a class selector is invalid
   CSS, and one invalid selector in a comma-separated list makes the parser drop the **whole rule**.
   Verified: `grep -c text-risk-high` on the built stylesheet returned 0. Rewritten as six separate
   rules so one bad selector cannot take its siblings down.

3. **Attribute-substring selectors over-reached.** `[class*="text-white"]` also matches
   `group-hover:text-white`, so those icons were pinned to pure white *at rest* on a light chip.
   `[class*="from-"]`, `[class*="to-"]` and `[class*="via-"]` were bare substrings of the class
   attribute — `to-` matches `grid-auto-rows-*`. All replaced with exact class names or the real
   gradient utilities (`bg-gradient-*`, `bg-linear-*`, explicit `bg-[linear-gradient(`).

4. **Unlayered rules beat every utility, regardless of specificity.** `p, .text-base, .text-sm
   { color: #5E5E5E !important }` silently outranked `text-[#1A1A1A]` written on the element itself.
   Moved into `@layer base`, where Tailwind orders it before utilities. The `.text-sm` / `.text-base`
   legs were then dropped entirely: they are *font-size* utilities, not body-copy markers, so the rule
   was reaching into any element that merely set a size — a flag emoji inside a green selected-country
   button measured 1.5:1 for no reason other than carrying `.text-base`.

5. **`!important` on inputs meant components could not style their own fields.** Padding, border-radius
   and font-family were all forced, so every input in the site ignored the padding its own component
   asked for and every `font-sans` field rendered mono. Now a `@layer base` default, overridable.

6. **55 class tokens that matched nothing.** Seven calculator pages contained
   `class="font-mono text-xs uppercase tracking-[0.28em] #8C8C8C"` — a hex written as if it were a
   Tailwind class. The intended colour never applied; the elements looked right *only* because the
   override layer painted them. Repaired into `text-[#6B6B6B]`.

7. **`dark:` followed the OS, not the design.** 18 `dark:` classes compiled into 11 rules inside a
   real `@media (prefers-color-scheme: dark)`, so a dark-OS reader got `.dark:bg-slate-700` and
   `.dark:bg-white/10` on a page whose policy is light-only. Closed from one place:
   `@custom-variant dark (&:where(.dark, .dark *))` — the variants now need a `.dark` ancestor, which
   nothing sets, and a real dark theme stays possible later.

8. **The 1000-page occupation template was authored for a dark console.** Its aside cards and metric
   panels were dark gradient / `bg-white/5` / `bg-slate-950/40`; the light shim repainted most of those
   surfaces but not `/40`, so `text-white` sat at 2.9:1 and `#64748B` at 2.2:1 on a mid-tone — and one
   heading sat directly on the page background at **1.0:1**. The sampled audit never saw any of this:
   it had measured the calculator *index* page, not an occupation page. Now on white + ink tokens.

9. **SVG text paints with `fill`, not `color`.** A `fill-slate-400` utility therefore picked up none of
   the text remap and the axis labels stayed at 2.63:1 through an otherwise complete pass.

## Layout — one page still overflows, and it is not the canvas

`/calculators/money-flow/` is the only page in the build with page-level horizontal overflow. **This is
not fixed.** Every other page measured (including the 1000-page occupation template) is clean at 500px.

The suspected culprit — the 1725px fixed design canvas in `MoneyFlowCanvas.tsx` — turned out to be a red
herring: the canvas *is* fitted, its scroll container does clip, and it is not what widens the document.
The document is widened by the **mode-toggle row** above it, which measures ~1104px inside a grid track
only ~886px wide. As a grid item its automatic minimum size (`min-width: auto`) is its min-content, so it
cannot shrink to the track.

What was tried, with the measured effect (post-hydration, via the sampling harness):

| State | Hydrated document width @1000px viewport |
|---|---|
| original (`flex`, no wrap) | **1230px** |
| + `flex-wrap` and `min-w-0` on the inner button group — **shipped** | **1196px** |
| + `min-w-0` on the row itself — **tried and reverted** | 1368px *(worse)* |

At the narrowest honest viewport (500px, see the harness caveat below) the shipped state measures
**1042px** — 542px of overflow. And the *server-rendered frame* is 1766–1782px wide at every viewport
below ~1725px, so a visitor on a slow connection sees a horizontal jump before hydration lands. Both
numbers are open work.

`min-w-0` on the row was **reverted**: it made a measured number worse, and the reason is the real
finding. `MoneyFlowCanvas` derives its fit zoom from `containerRef.current.clientWidth` — a container
whose own width the scaled canvas influences — so the layout has more than one equilibrium and a
one-line constraint change moves it between them. On top of that, `transform: scale()` does not shrink
the layout box, so the outer canvas element occupies `1725 × zoom` regardless of what it looks like.

The fix belongs in that fit math (measure a stable ancestor, or make the scaled canvas absolutely
positioned inside a `w-full` box so only the scaled size contributes layout), not in the row's classes.
The shipped `flex-wrap` + inner `min-w-0` is kept because it is the best of the three measured states
and it improves narrow-screen behaviour.

**How to finish it:**

```bash
npm run audit:layout -- 500 /calculators/money-flow/     # target: OVERFLOW=0px
# and confirm post-hydration, not the SSR frame:
W=500 npm run audit:timeline -- calculators/money-flow
W=1000 npm run audit:probe -- calculators/money-flow      # ancestor chain of the widest element
```

### Harness caveat for exactly this page

`scripts/layout-audit.mjs` waits for `astro-island[ssr]` to clear, but it does so under a 9s virtual-time
budget and falls through to measuring if that expires — and on a fit-to-width island the SSR frame is
~1000px wider than the hydrated layout, so a fall-through reports a confident, wrong overflow. The
sampling harness used for the numbers above (which records width over time from t=0 to 12s) is the
reliable instrument for this class of page. Treat any single-shot overflow number for money-flow as
suspect until it agrees with the timeline.

## Payload

- **Fonts:** the bare `@fontsource/<family>/<weight>.css` entry points pull every subset the family
  ships — latin, latin-ext, cyrillic, cyrillic-ext, greek, vietnamese. Naming `latin-*` kept the 7
  weights the design uses: 54 `@font-face` blocks → 8, 50 woff2 / 736KB → 8 / 184KB.
- **CSS:** the override cleanup removed 36KB raw / 15KB gzip.
- **Hydration:** `CommunityPoll` on the ~1000 occupation pages was `client:load` while sitting in an
  aside below the fold; now `client:visible`. (An earlier note in this work claimed 12 files wrote
  `client: load` with a stray space — that was an artifact of a `sed` in my own grep, not a real
  inconsistency. The directives were always fine.)
- **Dependencies:** `framer-motion` and `lucide-react` had zero imports in `src/`.

## Remaining work (not done here)

- **18 `astro check` errors, all pre-existing.** Every one is `ts(2339)` — `Property 'x' does not
  exist on type 'never'` — from `item.*` in `src/pages/calculators/career-ai-resilience/[slug].astro`.
  Ten are on lines this work never touched, including the frontmatter (lines 41, 52); the three that
  overlap edited lines reference the same `item.*` expressions, which are present in the committed
  version (`git show HEAD:… | grep -c 'item\.(salary|demand|tasks_count|code|title)'` → 11). The root
  cause is that the template's data access is untyped: `getStaticPaths` yields `never`. Worth fixing
  by typing the item, which would also make the page's data contract explicit.
- **109 dead `.light …` selectors ship in the CSS.** The React components authored a complete light
  theme via `[.light_&]` variants (335 call sites) and nothing ever sets a `.light` ancestor, so none
  of it activates — the `!important` layer does that job by force instead. Activating the variant
  (`<html class="light">`) is the change that would let the override layer shrink much further, but it
  shifts colours the layer currently leaves alone, so it deserves its own verified pass.
- **The repaint shim is still a shim.** 289 `!important` declarations and 57 `[class*=…]` selectors
  remain. They are the compatibility layer for components authored dark; the durable fix is porting
  those components onto the light tokens, which is a component-by-component job.
- **Heading colour/weight is still forced** by `h1,h2,h3 { color: … !important }`. Every value passes
  AA, so it is cosmetic debt rather than a contrast bug.

## Reverting the one visible design change

Text that used the brand steel blue is now one step deeper (`#5A7A8F` → `#4B6478`) because the
original fails on the surfaces interactive text actually lands on (4.35:1 on the gray-50 hover fill,
2.47:1 on the slate chips). `#5A7A8F` still draws every line, rule, bullet and slider thumb. To put
the lighter blue back on text:

```bash
grep -rl 'text-\[#4B6478\]' src | xargs sed -i '' 's/text-\[#4B6478\]/text-[#5A7A8F]/g'
```

That reintroduces the failures on hover fills and chips, which the audit will report.

## Two ways this harness lies to you

Both cost real time here; both produce confident, wrong findings:

1. **Chrome on macOS clamps the headless window to ~500px.** `--window-size=390` renders at 500, so a
   "390px screenshot" shows content clipped at the right edge — an artifact, not a site bug. Always
   print the *measured* `document.documentElement.clientWidth` next to the number, and treat 500px as
   the narrowest honest viewport. `--force-device-scale-factor` does not divide the layout viewport.
2. **A measurement taken at parse time is the pre-hydration DOM.** Astro renders an island's initial
   state into the SSR HTML, so the first paint has `zoom: 1` on a fit-to-width canvas and looks 1000px
   too wide. Wait for `astro-island[ssr]` to clear before measuring, or you will "find" an overflow
   that the hydrated page does not have.
