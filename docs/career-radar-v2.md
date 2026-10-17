# AI Career Radar v2 — task-level exposure model

Status: implemented in `scripts/onet/*`, data in `data/onet/*`, output in `public/data/careers/*`.
Supersedes `scripts/process_onet_data.py` (deleted: it pointed at a workspace path that no longer
exists and produced scores that were not traceable to any source column).

## 1. What was wrong with v1

v1 classified each task by counting keyword hits from three hand-written lists
(`classify_task()` in `scripts/process_onet_data.py`):

- `risk_score = (high·100 + medium·50) / task_count`. Buckets only, no weighting: a Core task
  the job is built around counted exactly as much as a Supplemental one nobody does weekly.
- The verb lists collided. `design`, `develop`, `plan`, `direct` were "low risk"; `write code` was
  high risk. "Develop software testing procedures" → low. "Record test results" → high. The score
  moved with vocabulary, not with what the work is.
- `demand` was derived from BLS `TOT_EMP` (how many people hold the job), then rendered as
  "Growth Demand". Employment size is not growth. Pages said "Very High" demand for occupations
  that are shrinking.
- Occupations without a BLS wage match received a salary from a per-major-group table multiplied by
  `random.uniform(0.95, 1.05)` — a fabricated number, seeded so it was stable, not so it was true.
- 18,796 tasks from `tasks.txt` (vintage up to 08/2025). The new O*NET extract has 18,838.

## 2. New inputs

All four O*NET tables now live in `data/onet/` and are joined on `Task ID`:

| File | Rows | What it contributes |
|---|---|---|
| `task_statements.csv` | 18,838 tasks / 923 occupations | task text, Core vs Supplemental, source date |
| `tasks_to_dwas.csv` | 24,087 links / 2,085 DWAs | each task → 1–5 standardized Detailed Work Activities |
| `work_activities.csv` | 74,702 rows / 41 GWAs | Importance (IM 1–5) and Level (LV 0–7) per GWA per occupation |
| `task_ratings.csv` | 165,780 rows / 18,420 tasks | per-task Importance (IM), Relevance (RT), Frequency (FT, 7 buckets) |
| `emerging_tasks.csv` | 338 rows / 245 occupations | tasks added (`New`) or rewritten (`Revision`) up to 08/2026 |
| `work_context.csv` | 305,389 rows / 57 elements | human-rated job context, used **only** to validate the index |
| `gwas_to_iwas_to_dwas.csv` | 2,087 rows | authoritative DWA → IWA → GWA parentage |

`data/onet/occupations.txt` (descriptions) and `data/onet/national.xlsx` (BLS OEWS wages and
employment) are carried over unchanged.

### Join finding that changes the pasted plan

`work_activities.csv` is **not** DWA-level. It holds 41 Generalized Work Activities, uniformly 41 per
occupation. `tasks_to_dwas.csv` holds DWA IDs at depth 7 (`4.A.2.a.4.i.3`); the GWA file holds depth 5
(`4.A.1.a.1`). Exact-match overlap is **0 of 2,085**; truncating the DWA ID to its first five segments
resolves **2,085 of 2,085 (100%)**. So the weighting join is `DWA → parent GWA → IM/LV`, and
importance is measured at GWA grain, not DWA grain. There is no per-DWA importance in this release.

## 3. Scoring

### Layer 1 — DWA automation potential `a(d) ∈ [0,1]`

One score per **DWA** (2,085), not per task (18,838). DWAs are short action phrases
("Analyze impact of legal or regulatory changes."), reused across occupations, so they are both
cheaper to score and more comparable between jobs than verbose task statements.

Produced once by an LLM pass against a fixed rubric with named capability classes and score bands
(`scripts/onet/score_dwas.py`, `RUBRIC_VERSION`). Results are cached and **committed** to
`data/onet/dwa-automation.json`, so builds are offline and deterministic. `--refresh` re-runs the
pass; `--audit N` re-scores a random sample and reports mean absolute deviation.

### Layer 2 — task exposure

For task `t` with DWA set `D(t)`:

```
s(t)  = mean a(d)                              for d in D(t)
IM(t) = task_ratings[t].importance             (O*NET task rating, 1–5)
      | mean IM(gwa(d))                        when the task has no rating
FT(t) = task_ratings[t].frequency              mean of the 7 frequency buckets, 1–7
w(t)  = (0.35 + 0.65 · (IM(t) − 1) / 4)
        · (0.55 + 0.45 · (FT(t) − 1) / 6)
        · (Core ? 1.0 : 0.7)
```

`task_ratings.csv` (new in 31.0) carries the task's own importance, so the GWA proxy is now a
fallback rather than the rule: **18,369 of 18,838 scored tasks** use their own rating. The rest
record `weight_source: "gwa-proxy"` in the task object, and `exposure.tasks_rated` counts the
split per occupation — the gap is visible, not averaged away.

Frequency is published as a distribution over seven buckets (1 = yearly or less … 7 = hourly or
more), one row per bucket with a percentage. The build recombines it into the mean bucket, then
maps it to 0.55–1.0 so a rarely performed task still counts, at just over half the weight of a
daily one.

The 0.35 floor keeps low-importance tasks from vanishing; the 0.65 span is the entire IM range
1→5. Supplemental tasks weigh 70% of Core. All constants are exported into every output file's
`methodology` block and into `_methodology.json`, so a page can state them.

### Layer 3 — occupation index

```
V_job = 100 · Σ w(t)·s(t) / Σ w(t)
```

Buckets for the existing donut/simulator UI: `high ≥ 0.60`, `medium ≥ 0.35`, else `low`.

Reported alongside, **not** folded into `V_job`:

- `physical_share` — weighted share of DWAs under `4.A.3.a.*` (general physical activity, handling and
  moving objects, controlling machines, operating vehicles) plus hands-on repair (`4.A.3.b.4/.5`).
- `judgment_share` — weighted share under `4.A.2.*` (mental processes) and the interpersonal GWAs that
  carry accountability: teaching, directing, coaching, advising, caring (`4.A.4.b.3/.4/.5/.6`, `4.A.4.a.5`).
- `routine_share` — weighted share under `4.A.4.c.1` (administrative activities) and `4.A.3.b.6`
  (documenting/recording).
- `augmentation_share` — weighted share of tasks that appear in `emerging_tasks.csv` as `New` or
  `Revision`, plus the raw rows for the occupation.

### Deliberate departure from the pasted proposal

It asks to fold emerging tasks into the score as an augmentation discount. This does not:

> Emerging tasks are tasks O*NET added because the work is changing — including 55 AI/SME-authored
> tasks that are themselves automation ("Operate drones for aerial survey…"). The direction of the
> effect is not established either way, and a constant like "× (1 − 0.15 · new_task_ratio)" would be
> an invented coefficient in a published number. It is reported as its own dimension instead, so a
> reader can see the churn without the exposure figure silently absorbing a guess.

Same reasoning applies to the physical shield: the rubric already scores hands-on DWAs low. Applying
a second attenuation on top would double-count the same judgment.

## 4. Honest data labels

- `salary_source` is recorded per occupation: `bls-detailed`, `bls-group` (matched a broader SOC level),
  or `heuristic`. The `random.uniform` jitter is gone; heuristic salaries are no longer emitted, the
  occupation gets `salary: null` and the UI omits the figure.
- `demand` is removed. It was `TOT_EMP`. Replaced by `employment` (count) and `employment_band`
  (`Very High ≥ 300k`, `High ≥ 100k`, `Medium ≥ 25k`, else `Low`), labelled "Employment Level" in the UI.

## 4b. Validation — and one result that contradicts the site's old story

`work_context.csv` carries human-rated job properties that are **not** inputs to the index. Correlating
the published index against them across the 911 occupations that have both produces:

| O*NET Work Context element | Spearman ρ | n | Reading |
|---|---|---|---|
| Pace Determined by Speed of Equipment (4.C.3.d.3) | **−0.49** | 910 | Machine-paced work is the least AI-addressable. Expected, and it holds. |
| Degree of Automation (4.C.3.b.2) | −0.15 | 911 | Measures *existing industrial* automation, a different construct. Negative is correct. |
| Importance of Repeating Same Tasks (4.C.3.b.7) | +0.01 | 911 | Flat. Routineness in the O*NET sense does not track this index. |
| Freedom to Make Decisions (4.C.3.a.4) | +0.12 | 911 | **Positive** — decision latitude does not lower the score. |
| Determine Tasks, Priorities and Goals (4.C.3.b.8) | +0.20 | 911 | **Positive**, same direction. |

The last two rows matter, and they are the reason the site copy changed. The FAQ previously claimed
low risk was "assigned to … complex strategic planning, and high-empathy interpersonal leadership".
The data does not support that: occupations with more decision latitude score *higher*, because
information work carries more automatable text and data handling than physical work does. Chief
Executives land at 46%; Payroll Clerks at 75%.

So the index measures **how much of the task content current AI can address**, which correlates with
information intensity — not with "my judgment protects me". The pages now say that, the FAQ says that,
and the task breakdown is presented as the evidence rather than a verdict on the job.

Known unmodelled dimension: the rubric scores a task's content, not the accountability attached to it.
"Direct financial operations" and "draft a status report" are different in consequence, not in text
handling. A consequence-of-error term (Work Context 4.C.3.a.1) is the obvious next input.

## 5. Output contract

`public/data/careers/index.json` — one row per occupation:

```jsonc
{
  "code": "11-1011.00", "title": "Chief Executives", "description": "…",
  "risk_score": 18,                              // V_job, rounded — unchanged key name
  "tasks_count": 31,
  "salary": 213990, "salary_source": "bls-detailed",
  "employment": 2310000, "employment_band": "Very High",
  "exposure": { "automation": 0.18, "physical_share": 0.02, "judgment_share": 0.61,
                "routine_share": 0.09, "augmentation_share": 0.06, "dwas_covered": 31 },
  "category_distribution": { "high": 0, "medium": 10, "low": 21 },   // counts, kept for compat
  "weighted_distribution": { "high": 0, "medium": 22, "low": 78 }    // % of weight
}
```

`public/data/careers/<code>.json` — detail: the same fields plus

```jsonc
"tasks": [{
  "id": "8823", "text": "…", "type": "Core",
  "risk": "low", "score": 0.12, "rationale": "…",     // rationale now from the DWA rubric
  "dwas": [{ "id": "4.A.4.b.4.h.2", "name": "Direct financial operations.",
             "gwa": "4.A.4.b.4", "gwa_name": "Guiding, Directing, and Motivating Subordinates",
             "importance": 4.1, "level": 5.2 }],
  "emerging": null
}],
"emerging_tasks": [{ "task": "…", "category": "New", "date": "08/2025",
                     "domain_source": "AI/SME", "original_task": null }],
"methodology": { "rubric_version": "v2.1", "onet_task_vintage": "08/2026",
                 "generated_at": "…", "weights": { … } }
```

## 6. Re-running

```bash
npm run data:careers          # rebuild JSON from data/onet (offline, uses committed scores)
npm run data:careers:score    # LLM pass over DWAs (writes data/onet/dwa-automation.json)
npm run data:careers:audit    # re-score 200 DWAs, print mean absolute deviation
npm run check && npm run build
```

## 7. Known limits

- Importance is GWA-level. A task mapped to "Documenting/Recording Information" gets that GWA's
  importance, which is the same weight every other documenting task in the occupation receives.
- 41 GWAs are rated for every occupation, so the IM signal does not distinguish occupations —
  it distinguishes which activities a task draws on.
- DWA scores are one LLM pass. `--audit` measures self-consistency, not correctness. The rubric is
  the model; changing it invalidates the cache and the version string.
- Measured self-consistency (rubric v2.1, 200 sampled activities re-scored cold, 2026-10-17):
  mean absolute deviation **0.073** on the 0–1 scale, max 0.37, and **10 of 200 (5%)** moved by
  0.25 or more. The audit report is committed at `data/onet/dwa-automation.audit.json`. Treat a
  5-point band around any single activity's score as noise; occupation-level averages absorb most
  of it, single-task claims do not.
- Vintage is mixed by design: O*NET refreshes occupations on a rolling schedule, so `Date` spans
  06/2008–08/2026. `methodology.onet_task_vintage` reports the maximum, `methodology.vintages`
  reports the distribution.
