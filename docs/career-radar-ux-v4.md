# AI Career Radar — hierarchy and navigation (v4)

Status: implemented in the same commit as this document. Scope is the hub page
`/calculators/career-ai-resilience/`: `src/components/calculators/react/CareerAiResilienceCalculator.tsx`
and its `.astro` wrapper. The scoring model and the JSON contract are untouched
(`docs/career-radar-v2.md`), and the ordering decisions from v3 (`docs/career-radar-ux-v3.md`)
still hold: search first, glossary as tooltips, pay geography below the task list.

## 1. What is still wrong

v3 fixed *order*. This pass fixes *weight*: every block on the role view is the same size, so the
answer the visitor came for is one of nine equally loud things on the first screen.

| # | Defect | Why it costs a visitor |
|---|---|---|
| 1 | The score is a 30px number inside a 112px ring, sitting in the middle of a three-column band between a role description and three sliders | Nothing is the focal point. The eye lands on whichever panel is nearest the top, not on the answer. |
| 2 | The score ring and the task-mix donut sit side by side at the same size | Two charts, both small, neither readable. The donut's centre says "31 tasks", so the chart's middle holds the least useful fact on the panel. |
| 3 | Three columns of equal weight (`lg:grid-cols-3`) on a 1200px page | Each panel is ~380px, which is too narrow for a 240px chart and too wide for a single number. |
| 4 | The week simulator's headline readout repeats the score at 30px, 400px from the score itself | Two numbers claiming to be the answer; the reader has to work out that they are the same one. |
| 5 | Eight task cards render before the reader has decided they care | ~2,800px of page for a list that is reference, not the verdict. |
| 6 | The map is 400px tall, draws every dot at 4.5px/0.5 opacity, and has no quadrants | 1,016 pale dots with no reading rule. The selected role is a 6.5px dot with a 1.5px outline — invisible. |
| 7 | Nothing on the role view says the map exists | The spatial question ("where does my job sit?") has no route from the answer. |

## 2. Target layout (role view)

```
┌ toolbar ───────────────────────────────────────────────────────────────────┐
│ [ Search 1,000+ job titles…              ]   (Role | Map)     All 1,016 →  │
│ Popular: Chief Execs · Software Devs · …                                   │
├────────────────────────────────────────────────────────────────────────────┤
│ SOC 11-1011.00 / 217,130 employed                     NATIONAL MEDIAN       │
│ Chief Executives                                            $213,990 (32px)│
│ Determine and formulate policies…            Pay in your state: [select]   │
├───────────────────────────────┬────────────────────────────────────────────┤
│ THE ANSWER  (?)               │ CHANGE YOUR WEEK  (?)              [Reset] │
│                               │ A 40-hour week. Move the hours, or hand a  │
│        ╭───────────╮          │ task over below.                           │
│       │    46     │  64px     │ ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░  40 h           │
│       │   / 100   │           │                                            │
│        ╰───────────╯          │ AI does it today         10.4 h    26%     │
│      [ Mixed exposure ]       │ [────────●──────────────]                  │
│                               │ Scheduling, typing, forms, sorting         │
│ ● AI does it today      26%   │ AI drafts it, you decide 22.8 h    57%     │
│   10.4 h of the week          │ [──────────────●────────]                  │
│ ● AI drafts it…         57%   │ Basic analysis, first drafts, monitoring   │
│ ● Needs a person        17%   │ Needs a person            6.8 h    17%     │
│                               │ [───────●───────────────]                  │
│ Where this sits on the map →  │ 46 → 34  −12 pts · 32 h of 40 still yours  │
├───────────────────────────────┴────────────────────────────────────────────┤
│ 01 hand over a task  02 automate one…  03 move toward judgement            │
├────────────────────────────────────────────────────────────────────────────┤
│ Tasks — top 3 by hours at stake, then [ View remaining 28 tasks ↓ ]        │
├────────────────────────────────────────────────────────────────────────────┤
│ Pay by state (48 estimates)                                                │
└────────────────────────────────────────────────────────────────────────────┘
```

### Decisions

**Role identity becomes an unboxed strip, not a card.** SOC, employment, title, description and the
two pay figures share one row. Two cards of equal width were saying "role" and "pay" were different
answers; they are one. The strip carries no border, per the design language's unboxed rule.

**One chart, not two, and the score lives inside it.** The score ring is deleted; its job moves into
the centre of the task-mix ring, so the number and the composition it explains are the same object.
The ring grows to 260px with a 26px stroke, the score to 64px, and the centre hole holds nothing else.

**The three pillars sit beside the ring as rows with 30px percentages.** They are the legend the ring
never had, and they keep the click-to-filter behaviour.

**The week simulator stops restating the score.** Its readout becomes a transition — `46 → 34`,
`−12 pts`, hours still yours — so the big number stays the only big number. A stacked 40-hour bar
above the sliders shows where the week actually sits, and moves as the sliders do.

**Three task cards, then a counter.** The list is ordered by hours at stake (task hours × how much of
the task AI can do) so the first three are the ones worth acting on, and `View remaining 28 tasks`
opens the rest. Cards, filters and delegation behaviour are unchanged.

**The map earns its own container.** Height follows width (min 420px, capped 560px), dots shrink to
3.5px at 0.32 opacity, quadrant rules are drawn at the median pay and median exposure of the plotted
set with corner labels, and the selected role is a 9px ink marker with a permanent label carrying
title, score and pay. A link from the answer card opens it.

## 3. Copy

New strings: quadrant labels, the map caption, the task counter, and the strip's field labels. All
are written to `scripts/vibe/lexicon.json` (no banned terms, first sentence ≤ 28 words). The gate is
not bypassed and the baseline is not edited.

## 4. Gates

```bash
npm run copy:check
npm run check
npm run build
```

## 5. Not in scope

- The scoring model, the JSON files, and the 1,016 static occupation pages.
- The comparison deck and the A–Z index, except that the index still opens from the search field.
