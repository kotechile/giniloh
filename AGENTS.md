# AGENTS.md

## Project mission

Build a polished, high-energy headless front end for a WordPress-managed blog.

WordPress remains the content system for posts, categories, featured images, and search. The public website front end should be built with Astro, Tailwind CSS, and minimal interactive islands. The goal is a fast, beautiful editorial site with a premium visual identity: glassmorphism, bento-grid composition, neon accents, and clean responsive navigation.

## Source-of-truth project files

Before writing or changing code, inspect these files if they exist in the repository:

* `Documents/_giniloh_front_end/wordpress_categories.csv`
* `Documents/_giniloh_front_end/giniloh_overview.md`

Use `wordpress_categories.csv` as the source of truth for the category menu, category pages, category labels, and category slugs. Do not invent category names if the CSV is present.

Use `giniloh_overview.md` as the source of truth for the site concept, audience, tone, positioning, homepage copy direction, and any content hierarchy.

If either file is missing, search the repository for similar names before proceeding:

* `wordpress_categories.csv`
* `wordpress _categories.csv`
* `categories.csv`
* `giniloh_overview.md`
* `giniloh overview.md`
* `overview.md`

If the files cannot be found, continue with a safe placeholder implementation and add a clear TODO near the data-loading code explaining what file is expected.

## Technology choices

Use:

* Astro as the site skeleton and routing layer.
* Tailwind CSS for styling.
* shadcn/ui only where it adds value, especially for interactive React islands such as the search overlay, dialog, sheet, or command-style search UI.
* Astro static/server rendering for public pages.
* React islands only for client-side interactivity.

Do not turn the site into a full single-page React app. Astro should own routing, page composition, and static/server-rendered content.

## Core pages to build

Create or update these routes:

* `/` — high-energy landing page.
* `/categories` — category index using the CSV-backed category list.
* `/categories/[slug]` — category detail page showing posts from that WordPress category.
* `/about` — about page using the overview file as directional copy.

Optional if the architecture already supports it:

* `/search` — server-rendered or client-assisted search results page.

## Landing page requirements

The homepage must include:

1. A sticky floating island navigation bar at the top.
2. A glassmorphism hero section.
3. A clear brand headline and subheadline based on `giniloh_overview.md`.
4. Primary CTA and secondary CTA.
5. A responsive bento-style section introducing the main site themes or categories.
6. A `Latest Posts` grid powered by the WordPress REST API.
7. Category links based on `wordpress_categories.csv`.
8. A search icon that opens a full-screen overlay.

Visual direction:

* Premium editorial SaaS energy.
* Glass panels with `backdrop-blur`.
* Gradient mesh or neon orb background accents.
* Bento-grid modules with asymmetry on desktop and clean stacking on mobile.
* Avoid generic stock-template layouts.
* Keep readability high. Do not sacrifice contrast for style.

use file design-language.md to get more directional details about the web design

## Navigation requirements

Build a responsive navigation bar with links:

* Home → `/`
* Categories → `/categories`
* About → `/about`

The nav must:

* Stay sticky/fixed near the top.
* Look like a floating rounded island.
* Blur the page content behind it while scrolling.
* Have a mobile-friendly menu.
* Include a search icon button.
* Use accessible labels and keyboard support.

Suggested Tailwind direction:

* `fixed top-4 left-1/2 z-50 -translate-x-1/2`
* `rounded-full border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl`
* dark text/light text chosen according to the page background.

## Search overlay requirements

The search icon should open a full-screen overlay.

The overlay must:

* Cover the viewport.
* Use a blurred/glass background.
* Include a large search input.
* Close via Escape, close button, and outside/backdrop interaction where appropriate.
* Trap or manage focus accessibly.
* Search WordPress posts through the REST API when the user submits or types.
* Show result title, excerpt if available, and link.
* Handle loading, empty, and error states.

Keep this as a React island if needed. Do not ship unnecessary JavaScript to the rest of the page.

## Latest Posts grid requirements

Build a `Latest Posts` section that pulls from the WordPress REST API.

Use an endpoint like:

```txt
${WORDPRESS_API_BASE}/wp-json/wp/v2/posts?_embed=1&per_page=6
```

For each post, display:

* Featured image from `_embedded['wp:featuredmedia'][0].source_url` when available.
* Post title from `title.rendered` converted to safe display text.
* Optional category label if available.
* Link to the post detail URL or WordPress canonical link until local post pages are implemented.

Card behavior:

* Hover scales the card up by 5%.
* Hover adds a soft neon glow.
* Use smooth transitions.
* Preserve layout stability.

Suggested Tailwind direction:

* `transition duration-300 ease-out hover:scale-105`
* `hover:shadow-[0_0_40px_rgba(56,189,248,0.35)]`
* `focus-visible:ring-2 focus-visible:ring-cyan-300`

## WordPress REST API integration

Create a small API utility module, for example:

* `src/lib/wordpress.ts`

Responsibilities:

* Read `WORDPRESS_API_BASE` or `PUBLIC_WORDPRESS_API_BASE` from environment variables.
* Fetch latest posts.
* Fetch posts by category.
* Fetch categories if needed.
* Normalize WordPress responses into front-end-friendly objects.
* Handle missing featured images gracefully.
* Handle API failures gracefully.

Do not hardcode the WordPress production URL in multiple components. Centralize it in the API utility and `.env.example`.

Add or update `.env.example`:

```txt
PUBLIC_WORDPRESS_API_BASE=https://your-wordpress-site.com
```

## Category CSV handling

Create a data-loading utility, for example:

* `src/lib/categories.ts`

Responsibilities:

* Read `Documents/_giniloh_front_end/wordpress_categories.csv` at build time if available.
* Normalize category names, slugs, and optional descriptions.
* Use CSV categories for nav/menu and category pages.
* Do not manually duplicate category data across components.

If the CSV structure is unknown, inspect headers first and adapt. Common expected fields may include:

* `name`
* `slug`
* `description`
* `parent`
* `count`
* `id`

If the CSV includes WordPress category IDs, use those IDs to fetch category posts from the REST API.

## Design system

Use Tailwind tokens and reusable classes rather than scattered one-off styles.

Preferred visual system:

* Background: deep editorial gradient, not flat black.
* Accent colors: cyan, electric blue, violet, lime, or soft neon green.
* Surfaces: translucent glass panels with border highlights.
* Cards: rounded `2xl` or `3xl`, soft shadows, subtle neon on hover.
* Typography: strong headline, short subheadline, readable body copy.
* Layout: generous spacing, no cramped sections.

Avoid:

* Plain WordPress theme look.
* Generic three-card template feel.
* Overusing animations.
* Low-contrast glass panels.
* Excessive client-side JavaScript.

## Suggested component structure

Prefer small reusable components:

```txt
src/components/SiteNav.astro
src/components/SearchOverlay.tsx
src/components/HeroGlass.astro
src/components/LatestPostsGrid.astro
src/components/PostCard.astro
src/components/CategoryBento.astro
src/components/Footer.astro
src/lib/wordpress.ts
src/lib/categories.ts
src/pages/index.astro
src/pages/categories/index.astro
src/pages/categories/[slug].astro
src/pages/about.astro
```

Adjust paths to match the existing repository structure.

## Accessibility requirements

* Every interactive control must be keyboard accessible.
* Search button must have an `aria-label`.
* Mobile menu button must have an `aria-label` and visible focus state.
* Search overlay must support Escape to close.
* Images must have useful `alt` text or empty alt text if decorative.
* Use semantic headings in order.
* Maintain strong color contrast.
* Respect `prefers-reduced-motion` for nonessential animation.

## Performance requirements

* Keep Astro pages mostly static/server-rendered.
* Ship JavaScript only for search overlay and mobile nav if needed.
* Use lazy-loaded images below the fold.
* Use responsive image dimensions when available.
* Avoid large animation libraries unless already installed and justified.
* Avoid adding dependencies unless they materially simplify the build.

## Implementation workflow for Codex

Before editing:

1. Inspect the current repo structure.
2. Inspect `package.json`, `astro.config.*`, `tailwind.config.*`, and existing layout/components.
3. Read `Documents/_giniloh_front_end/wordpress_categories.csv`.
4. Read `Documents/_giniloh_front_end/giniloh_overview.md`.
5. Identify the safest minimal file changes.
6. Briefly summarize the plan before coding.

While editing:

1. Implement data utilities first.
2. Build shared layout/navigation next.
3. Build the homepage sections.
4. Build category and about pages.
5. Add search overlay as the only required client island.
6. Keep components small and reusable.
7. Avoid hardcoded content that should come from the CSV or overview file.

After editing:

1. Run formatting if configured.
2. Run linting if configured.
3. Run type checks if configured.
4. Run the Astro build.
5. Fix errors before reporting completion.

## Commands

Use the commands available in `package.json`. Common commands may be:

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm run check
```

Do not invent scripts. Inspect `package.json` first and use the actual scripts.

## Acceptance criteria

The work is complete when:

* The homepage renders with a premium glassmorphism hero.
* The floating sticky nav includes Home, Categories, About, and search.
* The nav is responsive.
* Search opens a full-screen overlay and queries WordPress posts.
* Latest Posts pulls featured images and titles from WordPress REST API.
* Latest Posts cards scale to `1.05` on hover and show a soft neon glow.
* Categories are sourced from the CSV when available.
* Category pages are generated from the CSV-backed category list.
* The About page reflects `giniloh_overview.md`.
* The site builds successfully.
* Missing WordPress API data does not break the page.

## Safety and quality rules

* Do not commit secrets or API keys.
* Do not modify WordPress itself.
* Do not use Elementor/Astra/WordPress theme code for this front end.
* Do not hardcode categories if the CSV is present.
* Do not rewrite the entire project unnecessarily.
* Do not replace Astro with Next.js, Angular, or a full React SPA.
* Do not add heavy dependencies without a clear reason.
* Do not leave broken imports, unused components, or failing builds.

## Preferred final response from Codex

When finished, report:

* Files changed.
* What was implemented.
* What data source was used for categories.
* What WordPress API base URL is expected.
* Commands run and whether they passed.
* Any remaining TODOs or assumptions.
