# Editorial Neutral Styleguide (Clay-Inspired Calculator Design System)

This styleguide documents the minimalist, high-contrast, "unboxed" visual identity and Editorial Neutral color palette established for the calculators and interactive tools on Giniloh.com.

---

## 1. Core Principles

- **Unboxed Layouts:** Eliminate unnecessary bounding boxes, outer borders (e.g. `border-slate-800`, panels), and nested card outlines. Rely on negative space to naturally delineate logical sections.
- **Maximum Contrast & Heavy Hierarchy:** Pair pure white backgrounds (`#FFFFFF`) with rich near-black typography (`#1A1A1A`) and heavy font weights (`font-extrabold`, `font-black`).
- **Desaturated Accent Discipline:** Eliminate bright neon/alarm colors. Use desaturated, earthy tones for data metrics and quiet steel blue (`#5A7A8F`) for interactive state indicators.
- **Breathable Controls:** Space interactive components generously so each control feels like a distinct step rather than a cramped dashboard control panel.
- **8-Point Grid System:** Strictly enforce an 8pt grid system for all margins, padding, and flex/grid gaps. Use standard Tailwind spacing (e.g., `gap-4` for 16px, `gap-8` for 32px, `py-12` for 48px). Do not use arbitrary or odd spacing values.

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
- **Secondary Action:** Borderless text link using mid-gray `#5E5E5E`.

### F. Scatter Plots
Keep the SVG background fully transparent or set to `#FFFFFF`. Remove outer bounding cards. Draw simple left/bottom axes in `#E5E5E5`. Render dots with semi-transparent opacity of 40% to 60% (`opacity={0.5}`).

### G. Summary Metrics & KPIs (Naked Data)
Metrics must be "naked". Never place data points inside colored boxes or outlined containers. Use horizontal whitespace and optional 1px vertical divider lines (`border-l border-[#E5E5E5]`) to separate data.

### H. Form Inputs & Controls
Keep inputs flat and minimal. Never use inset shadows. Background must be `bg-white` (never gray). Use a subtle 1px border `border-[#E5E5E5]`. Text values must be `#1A1A1A`.

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
    <span className="text-4xl font-black text-[#1A1A1A]">
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
    <span className="text-4xl font-black text-[#1A1A1A]">
      4.6 Months
    </span>
  </div>
</div>
```

---

## 6. Project-Wide Global Light Mode Policy (ZERO EXCEPTIONS)

To prevent visual inconsistencies ("Frankenstein UI") where dark-mode calculator elements exist inside light-themed pages:
- **No Dark Mode Banners:** Hero sections, analytics summaries, and feature headers MUST use the default `bg-white` surface. Do not create inverted "dark sections" anywhere on the page.
- **Transparent or White Containers:** Replace dark wrappers with pure white (`#FFFFFF`) backgrounds, or leave them transparent so they inherit the page body.
- **Text Legibility:** Because all backgrounds must be white/transparent, never render text in white or light gray. All primary text must be `#1A1A1A` and secondary text `#5E5E5E`.
- **Metric Containers:** Replace all boxed wrappers around summary data with pure white (`#FFFFFF`) backgrounds and rely solely on the 8pt grid gap spacing to separate them.
