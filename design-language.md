# Editorial Neutral Styleguide (Clay-Inspired Calculator Design System)

This styleguide documents the minimalist, high-contrast, "unboxed" visual identity and Editorial Neutral color palette established for the calculators, interactive tools, and page layouts on Giniloh.com.

---

## 1. Core Principles

- **Unboxed Layouts:** Eliminate unnecessary bounding boxes, outer borders (e.g. `border-slate-800`, panels), and nested card outlines. Rely on negative space to naturally delineate logical sections.
- **Maximum Contrast & Heavy Hierarchy:** Pair pure white backgrounds (`#FFFFFF`) with rich near-black typography (`#1A1A1A`) and heavy font weights (`font-extrabold`, `font-black`).
- **Desaturated Accent Discipline:** Eliminate bright neon/alarm colors. Use desaturated, earthy tones for data metrics and quiet steel blue (`#5A7A8F`) for interactive state indicators.
- **Breathable Controls:** Space interactive components generously so each control feels like a distinct step rather than a cramped dashboard control panel.
- **8-Point Grid System:** Enforce an 8pt grid system for all margins, padding, and flex/grid gaps. Use standard Tailwind spacing (e.g., `gap-4` for 16px, `gap-8` for 32px, `py-12` for 48px).

### 1.5 STRICT NEGATIVE CONSTRAINTS (CRITICAL)
Under NO circumstances should you use the following Tailwind classes or CSS properties:
- **NO Gradients:** Never use `bg-gradient-*`, `from-*`, `to-*`, or `via-*`.
- **NO Shadows:** Never use `shadow-sm`, `shadow-md`, `shadow-lg`, or `drop-shadow`. UI elements must sit flat on the page.
- **NO Dark Hero Banners:** Never use `bg-slate-900`, `bg-black`, or dark backgrounds for header/hero sections. All sections must share the white page background.
- **NO Gray Metric Cards:** Never wrap KPI numbers or summary metrics in gray background boxes (`bg-gray-100`, `bg-slate-50`).
- **NO Rogue Colors:** If a color hex code is not explicitly listed in Section 2, DO NOT USE IT. (e.g., No bright blues like `text-blue-500`, no bright greens for money).

---

## 2. Color Palette & Tokens

### Typography & Structure
- **Page Background:** `#FFFFFF` (Solid pure white surface; ditch background grid lines)
- **Primary Text / Headings / Values:** `#1A1A1A` (Rich near-black for high contrast without eye strain)
- **Body Paragraphs / Explanatory:** `#5E5E5E` (Mid-tone gray for readable, comfortable measurement)
- **Subtle Accents / Metadata:** `#8C8C8C` (Light-mid gray for eyebrows, IDs, and secondary labels)
- **Structural Borders / Dividers:** `#E5E5E5` / `gray-200` (Soft gray lines for subtle division)
- **Inactive Slider Track:** `#E5E5E5` (Faint background track for range sliders)

### Semantic Risk Palette (Data & Controls)
- **High Risk (Routine Tasks):** `#B85C5C` (Muted Brick)
- **Medium Risk (Analytical Tasks):** `#C88D4E` (Soft Ochre)
- **Low Risk (Resilient Tasks / Active UI):** `#5A7A8F` (Steel Blue)

---

## 3. Typography & Hierarchy Scale

- **Display Title (H1):** `text-5xl sm:text-6xl`, `font-extrabold`, `#1A1A1A`, `leading-tight`
- **Section Heading (H2/H3):** `text-3xl sm:text-4xl`, `font-black`, `#1A1A1A`, `tracking-tight`
- **Sub-headings (H4):** `text-xl`, `font-bold`, `#1A1A1A`
- **Body Copy:** `text-base sm:text-lg`, `font-normal`, `#5E5E5E`, `leading-relaxed`
- **Micro-copy / Labels:** `text-xs`, `font-mono`, `font-bold`, `uppercase`, `tracking-[0.25em]`, `#8C8C8C`

---

## 4. Component Rules

### A. Navigation Tabs
Flat underline design (no pill backgrounds).
- **Active State:** `border-b-2 border-[#1A1A1A] text-[#1A1A1A] font-bold pb-3`
- **Inactive State:** `border-transparent text-[#8C8C8C] hover:text-[#1A1A1A] pb-3`

### B. Donut Charts
Fill outer rings with semantic colors. Insert a 2.5px pure white stroke between slices. Center hole must be pure white.

### C. Interactive Sliders
- **Track:** `h-2 rounded-lg bg-[#E5E5E5]`
- **Thumb/Active:** `accent-[#5A7A8F]` (Flat design, no shadows)

### D. Data Tables
Eliminate outer card wrappers. Left-align table headers and content (Occupation Title, Vulnerability Score bars, Salaries). Render all data values in high-contrast `#1A1A1A`. Never use neon green for salaries.

### E. Button & Action Hierarchy
- **Primary Button:** Near-black `#1A1A1A` background, white text.
- **Secondary Action/Ghost Button:** White `#FFFFFF` background with 1px border `border-[#E5E5E5]`, and near-black text `#1A1A1A`.

### F. Scatter Plots
Keep the SVG background fully transparent or set to `#FFFFFF`. Remove outer bounding cards. Draw simple left/bottom axes in `#E5E5E5`. Render dots with semi-transparent opacity of 40% to 60% (`opacity={0.5}`).

### G. Summary Metrics & KPIs (Naked Data)
Metrics must be "naked". Never place data points inside colored boxes or outlined containers. Make the numbers massive (`text-6xl` or `text-7xl font-black text-[#1A1A1A]`). Rely on horizontal whitespace and optional 1px vertical divider lines (`border-l border-[#E5E5E5]`) to separate data.

### H. Form Inputs & Controls
Keep inputs flat and minimal. Never use inset shadows. Background must be `bg-white` (never gray). Use a subtle 1px border `border-[#E5E5E5]`. Text values must be `#1A1A1A`.

### I. Iconography Rule
- **No Solid Fills:** Never use solid or filled icons. Use line-art icons exclusively.
- **Light Stroke Width:** Set the stroke width to `1.5px` (or use the "Light" weight variant).
- **Enlarged Scale:** Render icons at a large, legible scale (`w-10 h-10` or `w-12 h-12`).
- **Color Discipline:** Color icons strictly using the Steel Blue (`#5A7A8F`) or Near-Black (`#1A1A1A`) tokens.

### J. Ghost Cards & Micro-interactions
- **Ghost Card:** Change card backgrounds to pure white (`#FFFFFF`) with a `1px` structural gray border (`border-[#E5E5E5]`).
- **Lifting Translation:** On hover, translate cards upward along the Y-axis (`hover:-translate-y-1`) rather than scaling them, and transition the border color to near-black `#1A1A1A` or Steel Blue `#5A7A8F`.
- **Sliding Indicators:** Group hover triggers should trigger micro-interactions inside text links, such as translating inline arrows slightly to the right (`group-hover:translate-x-1`).

---

## 5. Usage Example (JSX / Astro)

### Flat Navigation Tab
```html
<div className="flex border-b border-[#E5E5E5] gap-8">
  <button className="pb-3 text-sm font-semibold border-b-2 border-[#1A1A1A] text-[#1A1A1A]">
    Career Profile
  </button>
  <button className="pb-3 text-sm font-semibold border-transparent text-[#8C8C8C] hover:text-[#1A1A1A]">
    Career Finder
  </button>
</div>
```

### Naked Summary Metrics & KPIs (Unboxed)
*Notice the complete absence of wrapping cards, background colors (`bg-gray-100`), or shadows. Spacing and delicate borders do all the structural work.*
```html
<div className="flex flex-col md:flex-row gap-12 py-8 bg-white border-y border-[#E5E5E5]">
  {/* Metric 1: Cost */}
  <div className="flex flex-col">
    <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#8C8C8C] mb-2">
      Net Upfront Cost
    </span>
    <span className="text-6xl font-black text-[#1A1A1A] tracking-tight leading-none">
      $6,595
    </span>
  </div>

  {/* Elegant Vertical Divider (Visible on Desktop) */}
  <div className="hidden md:block w-px bg-[#E5E5E5]"></div>

  {/* Metric 2: Break-Even */}
  <div className="flex flex-col">
    <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#8C8C8C] mb-2">
      Break-Even Period
    </span>
    <span className="text-6xl font-black text-[#1A1A1A] tracking-tight leading-none">
      4.6 Months
    </span>
  </div>
</div>
```

### Ghost Card with Iconography & Micro-interactions
```html
<a
  href="/pillar/"
  className="group flex flex-col rounded-2xl border border-[#E5E5E5] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#1A1A1A] hover:shadow-none"
>
  <div>
    <svg className="w-10 h-10 text-[#5A7A8F] transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
    <h2 className="mt-6 text-2xl font-black text-[#1A1A1A] tracking-tight group-hover:text-[#5A7A8F] transition">
      Buying Decisions
    </h2>
    <p className="mt-4 text-sm leading-relaxed text-[#5E5E5E]">
      Total Cost of Ownership models and frameworks.
    </p>
  </div>
  <div className="mt-8 flex items-center justify-between">
    <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#8C8C8C]">
      6 Articles
    </span>
    <span className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#5A7A8F] flex items-center gap-1">
      Open Pillar <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
    </span>
  </div>
</a>
```

---

## 6. Project-Wide Global Light Mode Policy (ZERO EXCEPTIONS)

To prevent visual inconsistencies ("Frankenstein UI") where dark-mode calculator elements exist inside light-themed pages:
- **No Dark Mode Banners:** Hero sections, analytics summaries, and feature headers MUST use the default `bg-white` surface. Do not create inverted "dark sections" anywhere on the page.
- **Transparent or White Containers:** Replace dark wrappers with pure white (`#FFFFFF`) backgrounds, or leave them transparent so they inherit the page body.
- **Text Legibility:** Because all backgrounds must be white/transparent, never render text in white or light gray. All primary text must be `#1A1A1A` and secondary text `#5E5E5E`.
- **Metric Containers:** Replace all boxed wrappers around summary data with pure white (`#FFFFFF`) backgrounds and rely solely on the 8pt grid gap spacing to separate them.
- **Forced Class Contrast Rule:** The global style system forces class names like `.text-white` or `[class*="text-white"]` to always override generic body/container rules to ensure high-contrast white labels on active/dark buttons remain fully white.
- **Tailwind v4 Gradients & Color Overrides:** Global overrides explicitly target arbitrary linear/radial gradients inside the compiled React components to convert them flat white and map low-contrast active text variables to the desaturated Steel Blue `#5A7A8F` accent.
