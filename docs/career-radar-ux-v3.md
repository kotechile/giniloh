# AI Career Radar — UX refactor (v3)

Status: implemented in the same commit as this document. Scope is the hub page
`/calculators/career-ai-resilience/`: `src/pages/calculators/career-ai-resilience.astro`,
`src/components/calculators/CalculatorShell.astro`, and
`src/components/calculators/react/CareerAiResilienceCalculator.tsx`.
The scoring model is untouched — `docs/career-radar-v2.md` still describes the data.

## 1. What was wrong

Five defects, all ordering or state problems rather than data problems. A visitor arrives asking
"how exposed is my job?" and the page answers three other questions first.

| # | Defect | Why it costs a visitor |
|---|---|---|
| 1 | The plain-language panel (question, "have this in front of you", glossary, "what to do with the answer") renders **above** the tool | Three screens of orientation before the first interactive element. The glossary sat where a tooltip belongs, and the action steps sat where the reader had no answer to act on yet. |
| 2 | Mode switcher reads **My job / Find a job / The career map** | "My job" opens Chief Executives by default, so the label promises the visitor's own role and delivers someone else's. Two of the three labels describe choosing a role. |
| 3 | **Pay by state** sits between the simulator and the task list | It breaks one analysis into two. The exposure ring, the simulator and the tasks are a single argument; pay geography is a different one. |
| 4 | Simulator sliders are abstract percentages | Nobody knows what "26% repetitive" means for their own week, and dragging one slider moves the other two by an unexplained rule. |
| 5 | The embed snippet is a full bordered card directly under the task list | Highest-prominence real estate on the page spent on the ~1% of visitors who will paste an iframe. |

Two more defects found while auditing, both live:

- **Occupation pages printed an embed snippet for a calculator that does not exist.** `CalculatorShell`
  built `data-calculator="<occupation-slug>"` from the URL for all 1,016 pages under
  `/calculators/career-ai-resilience/<occupation>/`, and `/calculators/embed/<occupation-slug>/` is
  not a route. The block is now rendered only when the slug is in the calculator register.
- **The tabs and the state picker disagreed about what "my job" meant.** Selecting a state changed a
  figure in one card and was restated in another card 1,800px below, with a `#state-wages` jump link
  between them.

## 2. Target layout

One screen, three panels, one search field.

```
┌ header ────────────────────────────────────────────────────────────────────────────┐
│ [ Search 1,000+ jobs…                    ]   ( Role | Map )   Browse all roles →   │
│ Popular: Chief Execs · Software Devs · Financial Mgrs · Accountants · Nurses       │
├──────────────────┬──────────────────────────────┬──────────────────────────────────┤
│ 1 ROLE & PAY     │ 2 EXPOSURE & TASKS (?)       │ 3 CHANGE YOUR WEEK (?)           │
│ SOC, title, desc │ ring 46/100 · Mixed          │ 40-hour week, in hours           │
│ median pay       │ AI does it today    26%      │ [house] 10.4h  AI does it        │
│ pay in state     │ AI drafts it        57%      │ [draft] 22.8h  AI drafts it      │
│  rank + range    │ needs a person      17%      │ [human]  6.8h  needs a person    │
│  Compare states ↓│ Inspect 31 tasks ↓           │ Simulated 46 → 38 · 2 tasks off │
├──────────────────┴──────────────────────────────┴──────────────────────────────────┤
│ 01 hand over a task  02 automate one this month  03 move toward judgement          │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Task cards — each carries [ Hand to AI ] → recalculates panel 3                   │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Pay by state (48 estimates) — below the task list, where compensation belongs      │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Decisions

**Search replaces two tab labels.** The role search moves out of tab 1 and becomes a persistent
combobox in the header. The segmented control keeps two states, `Role` and `Map`. The filterable
table is no longer a peer of the role view — it is the index, reached from "Browse all roles" and
from the suggestion dropdown, and it renders inside the Role panel with a "Back to the role" control,
so the tab state stays honest.

**Glossary becomes tooltips.** `src/lib/calculators/careerAiCopy.ts` holds the question, the two
definitions and the three action steps. `plainLanguage.ts` re-exports them for the shared
`PlainLanguageAnchor` (unchanged for every other calculator), the page feeds them to the island, and
the island renders them three ways: definitions behind `(?)` on the panel headers, action steps as
the strip under the panels. No string is duplicated and none is dropped.

**The simulator counts hours, not percentages.** The week is 40 hours. Each bucket shows its hours next to
its share. Handing a task to AI removes that task's hours from the figure, and the score is the same
weighted mean the published index uses, measured against the full week: work you have handed over is no
longer work you do, so it stops counting as exposure. The denominator stays at 40 hours on purpose —
renominating over the hours left would raise the score when someone hands over their least automatable
work. That makes "delegate the budget work" a concrete move instead of an abstract slider.

**One control, one place.** The state picker in panel 1 updates pay, rank and the published range in
that panel and nowhere else. The 48-state table moves below the task list and is reached by an anchor,
not by a second copy of the dropdown.

**The embed snippet collapses into the header.** `CalculatorShell` gains `embedInHeader`, which
renders a `Share / Embed` disclosure in the compact header instead of the bordered block at the foot
of the calculator. Default stays at the foot for the other 15 calculators.

## 3. What the reader can now do in one screen

1. Type a job title and see its pay, its exposure score and its task mix without scrolling.
2. Move one number — hours handed to AI — and watch the score change, with the delta named.
3. Walk into the task list and hand over specific tasks, which feeds the same number.
4. Read what to do about it in three steps immediately below the panels.

## 4. Gates that must stay green

```bash
npm run copy:check      # copy contract, runs as prebuild
npm run check           # astro check (types + a11y diagnostics)
npm run build           # routing + full build
npm run check:calculators
```

Copy gate notes: no marketing adjectives, first sentence ≤ 28 words, later sentences ≤ 32. New copy
in this change is written to the `lexicon.json` contract; the baseline file is not edited.

## 5. Not in scope

- The scoring model, its weights, or the JSON output contract (`docs/career-radar-v2.md`).
- The 1,016 static occupation pages, except that their bogus embed block is now suppressed.
- The W-2/1099 and RSU engines.
