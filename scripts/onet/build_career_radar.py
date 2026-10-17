#!/usr/bin/env python3
"""
Builds the AI Career Radar dataset from the O*NET release in data/onet/.

Reads
  data/onet/occupations.txt        occupation titles and descriptions
  data/onet/task_statements.csv    task inventory (Core / Supplemental)
  data/onet/tasks_to_dwas.csv      task -> Detailed Work Activity links
  data/onet/work_activities.csv    Generalized Work Activity Importance / Level per occupation
  data/onet/emerging_tasks.csv     tasks added or revised by O*NET
  data/onet/dwa-automation.json    committed DWA automation scores (scripts/onet/score_dwas.py)
  data/onet/national.xlsx          BLS OEWS wages and employment

Writes
  public/data/careers/index.json     one row per occupation
  public/data/careers/<code>.json    per-occupation detail

The model is documented in docs/career-radar-v2.md. Every emitted file carries the
constants it was scored with, so a reader can recompute it.
"""

from __future__ import annotations

import csv
import json
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ONET = ROOT / "data" / "onet"
OUT = ROOT / "public" / "data" / "careers"

# --- model constants (exported into every file, see methodology block) -----------------
IMPORTANCE_FLOOR = 0.35   # weight of a task whose importance is the minimum (1.0)
IMPORTANCE_SPAN = 0.65    # added across the importance range 1.0 -> 5.0
FREQUENCY_FLOOR = 0.55    # a yearly task still counts, at 55% of a daily one
FREQUENCY_SPAN = 0.45     # added across the frequency range 1 (yearly) -> 7 (hourly+)
SUPPLEMENTAL_WEIGHT = 0.7  # Core tasks weigh 1.0
HIGH_BUCKET = 0.60        # task score >= this is high exposure
MEDIUM_BUCKET = 0.35
DEFAULT_IMPORTANCE = 3.0  # used when neither task nor GWA ratings exist for a task

# Vintages, so a page can state which release each number came from instead of implying "current".
# OEWS is annual: the May 2025 panel was published 15 May 2026, and the May 2026 panel does not
# exist until roughly May 2027.
OEWS_PANEL = "May 2025"
OEWS_RELEASED = "2026-05-15"
PROJECTIONS_RELEASE = "2025-2035"

PHYSICAL_GWAS = (
    "4.A.3.a.1",  # Performing General Physical Activities
    "4.A.3.a.2",  # Handling and Moving Objects
    "4.A.3.a.3",  # Controlling Machines and Processes
    "4.A.3.a.4",  # Operating Vehicles, Mechanized Devices, or Equipment
    "4.A.3.b.4",  # Repairing and Maintaining Mechanical Equipment
    "4.A.3.b.5",  # Repairing and Maintaining Electronic Equipment
)
JUDGMENT_GWAS = (
    "4.A.2.a.1", "4.A.2.a.2", "4.A.2.a.3", "4.A.2.a.4",  # judging, processing, evaluating, analyzing
    "4.A.2.b.1", "4.A.2.b.2", "4.A.2.b.3", "4.A.2.b.4",  # deciding, creative thinking, knowledge, strategy
    "4.A.2.b.5", "4.A.2.b.6",                            # scheduling, organizing
    "4.A.4.a.5",                                          # Assisting and Caring for Others
    "4.A.4.b.3", "4.A.4.b.4", "4.A.4.b.5", "4.A.4.b.6",  # teaching, directing, coaching, advising
)
ROUTINE_GWAS = (
    "4.A.3.b.6",  # Documenting/Recording Information
    "4.A.4.c.1",  # Performing Administrative Activities
)


def num(value: str | None) -> float | None:
    """O*NET uses '' and '*' for missing. Anything unparseable is missing, not zero."""
    if value is None:
        return None
    text = str(value).strip()
    if text in {"", "*", "-", "—", "nan", "NaN"}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def gwa_of(dwa_id: str) -> str:
    return ".".join(dwa_id.split(".")[:5])


def bucket(score: float) -> str:
    if score >= HIGH_BUCKET:
        return "high"
    if score >= MEDIUM_BUCKET:
        return "medium"
    return "low"


def load_occupations() -> dict[str, dict]:
    out: dict[str, dict] = {}
    path = ONET / "occupations.txt"
    with path.open(encoding="utf-8", errors="replace") as fh:
        next(fh)  # header
        for line in fh:
            parts = line.rstrip("\r\n").split("\t")
            if len(parts) < 2:
                continue
            code = parts[0].strip()
            out[code] = {
                "code": code,
                "title": parts[1].strip(),
                "description": parts[2].strip() if len(parts) > 2 else "",
            }
    return out


def load_tasks() -> tuple[dict[str, list[dict]], Counter]:
    """Tasks per occupation, plus the vintage distribution."""
    by_soc: dict[str, list[dict]] = defaultdict(list)
    vintages: Counter = Counter()
    with (ONET / "task_statements.csv").open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            soc = (row.get("O*NET-SOC Code") or "").strip()
            if not soc:
                continue
            date = (row.get("Date") or "").strip()
            if date:
                vintages[date] += 1
            by_soc[soc].append(
                {
                    "id": (row.get("Task ID") or "").strip(),
                    "text": (row.get("Task") or "").strip(),
                    "type": (row.get("Task Type") or "Core").strip() or "Core",
                    "date": date,
                }
            )
    return by_soc, vintages


def load_task_dwas() -> dict[str, list[dict]]:
    """Task ID -> list of Detailed Work Activities. Task IDs are unique across occupations."""
    links: dict[str, list[dict]] = defaultdict(list)
    seen: set[tuple[str, str]] = set()
    with (ONET / "tasks_to_dwas.csv").open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            task_id = (row.get("Task ID") or "").strip()
            dwa_id = (row.get("DWA Element ID") or "").strip()
            if not task_id or not dwa_id or (task_id, dwa_id) in seen:
                continue
            seen.add((task_id, dwa_id))
            links[task_id].append(
                {"id": dwa_id, "name": (row.get("DWA Element Name") or "").strip()}
            )
    return links


def load_work_activities() -> tuple[dict[tuple[str, str], dict], dict[str, str]]:
    """(SOC, GWA) -> {im, lv}; plus GWA id -> name."""
    values: dict[tuple[str, str], dict] = defaultdict(dict)
    names: dict[str, str] = {}
    with (ONET / "work_activities.csv").open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            soc = (row.get("O*NET-SOC Code") or "").strip()
            element = (row.get("Element ID") or "").strip()
            scale = (row.get("Scale ID") or "").strip().upper()
            if not soc or not element or scale not in {"IM", "LV"}:
                continue
            names.setdefault(element, (row.get("Element Name") or "").strip())
            if (row.get("Recommend Suppress") or "").strip().upper() == "Y":
                continue
            if (row.get("Not Relevant") or "").strip().upper() == "Y":
                continue
            value = num(row.get("Data Value"))
            if value is None:
                continue
            values[(soc, element)][scale.lower()] = value
    return values, names


def load_task_ratings() -> dict[str, dict]:
    """
    Per-task ratings added in O*NET 31.0: importance (IM), relevance (RT), frequency (FT).

    Frequency is published as a distribution over seven buckets (1 = yearly or less …
    7 = hourly or more), one row per bucket carrying a percentage in Data Value. The usable
    number is the mean bucket, so the percentages are recombined here.

    Coverage is partial — 18,420 of 18,838 tasks across 911 occupations — so the caller must
    report which tasks fell back to the GWA proxy rather than hiding the gap.
    """
    im: dict[str, float] = {}
    freq_num: dict[str, float] = defaultdict(float)
    freq_den: dict[str, float] = defaultdict(float)
    skipped = 0

    with (ONET / "task_ratings.csv").open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            task_id = (row.get("Task ID") or "").strip()
            scale = (row.get("Scale ID") or "").strip().upper()
            if not task_id:
                continue
            if (row.get("Recommend Suppress") or "").strip().upper() == "Y":
                skipped += 1
                continue
            value = num(row.get("Data Value"))
            if value is None:
                continue
            if scale == "IM":
                im[task_id] = value
            elif scale == "FT":
                category = num(row.get("Category"))
                if category is None or category <= 0:
                    continue
                freq_num[task_id] += category * value
                freq_den[task_id] += value

    out: dict[str, dict] = {}
    for task_id, importance in im.items():
        frequency = freq_num[task_id] / freq_den[task_id] if freq_den[task_id] else None
        out[task_id] = {"importance": importance, "frequency": frequency}
    return out


def load_work_context_signals(elements: dict[str, str]) -> dict[str, dict[str, float]]:
    """
    Pull the Work Context elements named in `elements` (id -> label), per occupation.

    These are human ratings and are used only to check the index, never to build it.
    """
    out: dict[str, dict[str, float]] = {eid: {} for eid in elements}
    path = ONET / "work_context.csv"
    if not path.exists():
        return out
    with path.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            element = (row.get("Element ID") or "").strip()
            if element not in out:
                continue
            if (row.get("Recommend Suppress") or "").strip().upper() == "Y":
                continue
            soc = (row.get("O*NET-SOC Code") or "").strip()
            value = num(row.get("Data Value"))
            if soc and value is not None:
                out[element][soc] = value
    return out


VALIDATION_ELEMENTS = {
    "4.C.3.d.3": "Pace Determined by Speed of Equipment",
    "4.C.3.b.2": "Degree of Automation",
    "4.C.3.b.7": "Importance of Repeating Same Tasks",
    "4.C.3.a.4": "Freedom to Make Decisions",
    "4.C.3.b.8": "Determine Tasks, Priorities and Goals",
    "4.C.3.a.1": "Consequence of Error",
}


def load_emerging() -> dict[str, list[dict]]:
    by_soc: dict[str, list[dict]] = defaultdict(list)
    with (ONET / "emerging_tasks.csv").open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            soc = (row.get("O*NET-SOC Code") or "").strip()
            if not soc:
                continue
            by_soc[soc].append(
                {
                    "task": (row.get("Task") or "").strip(),
                    "category": (row.get("Category") or "").strip(),
                    "date": (row.get("Date") or "").strip(),
                    "domain_source": (row.get("Domain Source") or "").strip(),
                    "original_task": (row.get("Original Task") or "").strip() or None,
                }
            )
    return by_soc


def load_projections() -> dict[str, dict]:
    """
    BLS Employment Projections, 2025-2035 occupation matrix (Table 1.2).

    The sheet reports thousands of workers; values are converted to counts here so no page has
    to remember that 291.6 means 291,600. Rows come in two kinds — "Line item" (a detailed
    occupation) and "Summary" (a BLS roll-up) — and both are kept, because O*NET splits some
    occupations that BLS reports only as a roll-up.
    """
    import pandas as pd

    path = ONET / "bls_occupation_projections.xlsx"
    if not path.exists():
        return {}
    frame = pd.read_excel(path, sheet_name="Table 1.2", header=1).iloc[:, :12]
    frame.columns = [
        "title", "code", "type", "emp_2025", "emp_2035", "dist_2025", "dist_2035",
        "change_numeric", "change_percent", "self_employed_percent", "annual_openings", "wage",
    ]

    def thousands(value: float | None) -> int | None:
        return int(round(value * 1000)) if value is not None else None

    out: dict[str, dict] = {}
    for _, row in frame.iterrows():
        code = str(row["code"]).strip()
        if not code or code.lower() == "nan":
            continue
        kind = str(row["type"]).strip().lower()
        if code in out and kind != "line item":
            continue  # a line item already claimed this code; the roll-up is a worse match
        out[code] = {
            "code": code,
            "kind": "line" if kind == "line item" else "summary",
            "title": str(row["title"]).strip(),
            "base_year": 2025,
            "end_year": 2035,
            "employment_2025": thousands(num(row["emp_2025"])),
            "employment_2035": thousands(num(row["emp_2035"])),
            "change_numeric": thousands(num(row["change_numeric"])),
            "change_percent": num(row["change_percent"]),
            "annual_openings": thousands(num(row["annual_openings"])),
            "self_employed_percent": num(row["self_employed_percent"]),
        }
    return out


def resolve_projection(soc: str, projections: dict[str, dict]) -> dict | None:
    """
    Exact BLS code, then the BLS roll-up row, then the parent stem (11-1011 -> 11-1010).

    The tier is recorded so the page can say which row the figure actually came from; an
    occupation BLS does not project gets null, not a national average.
    """
    prefix = soc.split(".")[0]
    for candidate, source in ((prefix, None), (prefix[:-1] + "0", "parent")):
        row = projections.get(candidate)
        if row is None:
            continue
        tier = source or ("bls-line" if row["kind"] == "line" else "bls-summary")
        if source:
            tier = "bls-parent"
        return {**row, "source": tier}
    return None


def load_bls() -> dict[str, dict]:
    """OEWS rows keyed by OCC_CODE. Wage fields carry the string '#' when unavailable."""
    try:
        import pandas as pd
    except ImportError:
        sys.exit(
            "pandas is required to read data/onet/national.xlsx.\n"
            "On this machine /opt/homebrew/bin/python3 has pandas + openpyxl; the system\n"
            "python3.9 does not. Run:  /opt/homebrew/bin/python3 scripts/onet/build_career_radar.py\n"
            "or:  python3 -m pip install --user pandas openpyxl"
        )

    frame = pd.read_excel(ONET / "national.xlsx")
    out: dict[str, dict] = {}
    for _, row in frame.iterrows():
        code = str(row.get("OCC_CODE", "")).strip()
        if not code:
            continue
        median = num(row.get("A_MEDIAN"))
        mean = num(row.get("A_MEAN"))
        wage = median if median is not None else mean
        out[code] = {
            "wage": int(wage) if wage is not None else None,
            "wage_field": "A_MEDIAN" if median is not None else ("A_MEAN" if mean is not None else None),
            "employment": num(row.get("TOT_EMP")),
            "group": str(row.get("O_GROUP", "")).strip().lower(),
            "title": str(row.get("OCC_TITLE", "")).strip(),
        }
    return out


def employment_band(level: float | None) -> str:
    """Band by employment size — NOT by projected growth. The label says so."""
    if level is None:
        return "Not reported"
    if level >= 300_000:
        return "Very High"
    if level >= 100_000:
        return "High"
    if level >= 25_000:
        return "Medium"
    return "Low"


def resolve_wage(soc: str, bls: dict[str, dict]) -> tuple[int | None, float | None, str | None, str]:
    """Exact detailed code, then the OEWS group rows above it. Returns (wage, employment, code, source)."""
    prefix = soc.split(".")[0]  # 11-1011.00 -> 11-1011
    if prefix in bls and bls[prefix]["wage"] is not None:
        row = bls[prefix]
        return row["wage"], row["employment"], prefix, f"bls-{row['group'] or 'detailed'}"
    for candidate in (prefix[:-1] + "0", prefix[:4] + "00", prefix[:3] + "0000"):
        if candidate in bls and bls[candidate]["wage"] is not None:
            row = bls[candidate]
            return row["wage"], row["employment"], candidate, f"bls-{row['group'] or 'group'}"
    return None, None, None, "unavailable"


def normalise(text: str) -> str:
    return " ".join(text.lower().split()).rstrip(".")


def vintage_key(label: str) -> tuple[int, int]:
    """O*NET dates are 'MM/YYYY'. Sorting them as strings puts 12/2025 after 08/2026."""
    month, _, year = label.partition("/")
    try:
        return (int(year), int(month))
    except ValueError:
        return (0, 0)


def spearman(xs: list[float], ys: list[float]) -> float:
    """Spearman's rho without scipy: rank both series with ties averaged, then Pearson."""
    def ranks(values: list[float]) -> list[float]:
        order = sorted(range(len(values)), key=lambda i: values[i])
        out = [0.0] * len(values)
        i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
                j += 1
            average = (i + j) / 2 + 1
            for k in range(i, j + 1):
                out[order[k]] = average
            i = j + 1
        return out

    rx, ry = ranks(xs), ranks(ys)
    n = len(rx)
    mx, my = sum(rx) / n, sum(ry) / n
    cov = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    vx = sum((a - mx) ** 2 for a in rx) ** 0.5
    vy = sum((b - my) ** 2 for b in ry) ** 0.5
    return round(cov / (vx * vy), 4) if vx and vy else 0.0


def main() -> None:
    generated_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    occupations = load_occupations()
    tasks_by_soc, vintages = load_tasks()
    task_dwas = load_task_dwas()
    activity, gwa_names = load_work_activities()
    task_ratings = load_task_ratings()
    work_context = load_work_context_signals(VALIDATION_ELEMENTS)
    projections = load_projections()
    automation_ratings = work_context.get("4.C.3.b.2", {})
    emerging_by_soc = load_emerging()
    bls = load_bls()
    scoring = json.loads((ONET / "dwa-automation.json").read_text())
    dwa_scores: dict[str, dict] = scoring["scores"]
    rubric_version = scoring["meta"]["rubric_version"]
    scoring_model = scoring["meta"]["model"]

    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob("*.json"):
        stale.unlink()

    index: list[dict] = []
    totals = Counter()
    missing_dwa_scores: set[str] = set()

    for soc, occ in sorted(occupations.items()):
        tasks = tasks_by_soc.get(soc, [])
        soc_emerging = emerging_by_soc.get(soc, [])
        # Revision rows describe a rewritten task: they belong to the task they replaced.
        revised = {normalise(r["original_task"]): r for r in soc_emerging if r.get("original_task")}
        added = {normalise(r["task"]): r for r in soc_emerging if not r.get("original_task")}

        weighted_sum = 0.0
        weight_total = 0.0
        bucket_weight = {"high": 0.0, "medium": 0.0, "low": 0.0}
        bucket_count = {"high": 0, "medium": 0, "low": 0}
        share_weight = {"physical": 0.0, "judgment": 0.0, "routine": 0.0, "revised": 0.0}
        tasks_out: list[dict] = []
        dwas_covered = 0
        tasks_scored = 0
        tasks_rated = 0
        missing_dwa_scores: set[str] = set()

        for task in tasks:
            dwas = task_dwas.get(task["id"], [])
            scored_dwas = []
            for dwa in dwas:
                score = dwa_scores.get(dwa["id"])
                if score is None:
                    missing_dwa_scores.add(dwa["id"])
                    continue
                gwa = gwa_of(dwa["id"])
                im = activity.get((soc, gwa), {}).get("im")
                scored_dwas.append(
                    {
                        "id": dwa["id"],
                        "name": dwa["name"],
                        "gwa": gwa,
                        "gwa_name": gwa_names.get(gwa, ""),
                        "importance": round(im, 2) if im is not None else None,
                        "level": round(activity.get((soc, gwa), {}).get("lv", 0.0), 2)
                        if activity.get((soc, gwa), {}).get("lv") is not None
                        else None,
                        "score": score["p"],
                        "capability": score["cap"],
                        "rationale": score["why"],
                    }
                )

            if not dwas:
                totals["tasks_without_dwa"] += 1
            elif scored_dwas:
                dwas_covered += 1

            if not scored_dwas:
                # No DWA score to stand on: the task is reported, not silently scored.
                tasks_out.append(
                    {
                        "id": task["id"],
                        "text": task["text"],
                        "type": task["type"],
                        "risk": None,
                        "score": None,
                        "rationale": "No work-activity mapping in this O*NET release.",
                        "dwas": [],
                        "emerging": None,
                    }
                )
                totals["tasks_unscored"] += 1
                continue

            task_score = sum(d["score"] for d in scored_dwas) / len(scored_dwas)
            type_weight = 1.0 if task["type"].lower() == "core" else SUPPLEMENTAL_WEIGHT

            # Weight comes from the task's own O*NET ratings where they exist. Only 18,420 of
            # 18,838 tasks carry them; the rest inherit their work activities' importance, and
            # every task records which path it took.
            rating = task_ratings.get(task["id"])
            if rating:
                task_importance = rating["importance"]
                task_frequency = rating["frequency"]
                weight = (IMPORTANCE_FLOOR + IMPORTANCE_SPAN * (task_importance - 1.0) / 4.0) * type_weight
                if task_frequency is not None:
                    bounded = min(max(task_frequency, 1.0), 7.0)
                    weight *= FREQUENCY_FLOOR + FREQUENCY_SPAN * (bounded - 1.0) / 6.0
                weight_source = "task-rating"
                tasks_rated += 1
            else:
                importances = [d["importance"] for d in scored_dwas if d["importance"] is not None]
                task_importance = sum(importances) / len(importances) if importances else DEFAULT_IMPORTANCE
                task_frequency = None
                weight = (IMPORTANCE_FLOOR + IMPORTANCE_SPAN * (task_importance - 1.0) / 4.0) * type_weight
                weight_source = "gwa-proxy"

            weighted_sum += weight * task_score
            weight_total += weight
            label = bucket(task_score)
            bucket_weight[label] += weight
            bucket_count[label] += 1
            tasks_scored += 1

            gwa_set = {d["gwa"] for d in scored_dwas}
            if gwa_set & set(PHYSICAL_GWAS):
                share_weight["physical"] += weight
            if gwa_set & set(JUDGMENT_GWAS):
                share_weight["judgment"] += weight
            if gwa_set & set(ROUTINE_GWAS):
                share_weight["routine"] += weight

            emerging = revised.get(normalise(task["text"])) or added.get(normalise(task["text"]))
            if emerging:
                share_weight["revised"] += weight

            lead = max(scored_dwas, key=lambda d: d["score"])
            tasks_out.append(
                {
                    "id": task["id"],
                    "text": task["text"],
                    "type": task["type"],
                    "risk": label,
                    "score": round(task_score, 3),
                    "weight": round(weight, 3),
                    "weight_source": weight_source,
                    "importance": round(task_importance, 2),
                    "frequency": round(task_frequency, 2) if task_frequency is not None else None,
                    "rationale": f"{lead['capability'].replace('_', ' ')} — {lead['rationale']}",
                    "dwas": [
                        {k: d[k] for k in ("id", "name", "gwa", "gwa_name", "importance", "level")}
                        for d in scored_dwas
                    ],
                    "emerging": emerging,
                }
            )

        wage, employment, wage_code, salary_source = resolve_wage(soc, bls)
        projection = resolve_projection(soc, projections)

        if weight_total == 0:
            # O*NET publishes no task inventory for residual "All Other" codes and for the
            # military branches. Those occupations keep their page (salary, employment, title)
            # and an explicit null score — never a made-up one.
            totals["occupations_without_inventory"] += 1
            scored = False
            risk_score = None
            exposure = {
                "automation": None,
                "physical_share": None,
                "judgment_share": None,
                "routine_share": None,
                "emerging_revised_share": None,
                "emerging_added_tasks": sum(1 for r in soc_emerging if r["category"] == "New"),
                "consequence_of_error": round(work_context["4.C.3.a.1"][soc], 2)
                if soc in work_context.get("4.C.3.a.1", {})
                else None,
                "dwas_covered": 0,
                "tasks_scored": 0,
                "tasks_rated": 0,
                "tasks_total": 0,
            }
            weighted_distribution = None
        else:
            scored = True
            automation = weighted_sum / weight_total
            risk_score = round(automation * 100)
            exposure = {
                "automation": round(automation, 4),
                "physical_share": round(share_weight["physical"] / weight_total, 4),
                "judgment_share": round(share_weight["judgment"] / weight_total, 4),
                "routine_share": round(share_weight["routine"] / weight_total, 4),
                # O*NET's New tasks are additions that are NOT in task_statements, so they
                # cannot be scored or weighted. Only Revision rows replace a task we can score,
                # and only those move the weighted share. The count of additions is reported
                # beside it so a reader can see how much of the churn the index cannot see.
                "emerging_revised_share": round(share_weight["revised"] / weight_total, 4),
                "emerging_added_tasks": sum(1 for r in soc_emerging if r["category"] == "New"),
                "consequence_of_error": round(work_context["4.C.3.a.1"][soc], 2)
                if soc in work_context.get("4.C.3.a.1", {})
                else None,
                "dwas_covered": dwas_covered,
                "tasks_scored": tasks_scored,
                "tasks_rated": tasks_rated,
                "tasks_total": len(tasks),
            }
            weighted_distribution = {
                key: round(100 * bucket_weight[key] / weight_total) for key in ("high", "medium", "low")
            }

        detail = {
            "code": soc,
            "title": occ["title"],
            "description": occ["description"],
            "scored": scored,
            "risk_score": risk_score,
            "salary": wage,
            "salary_source": salary_source,
            "salary_reference": wage_code,
            "salary_vintage": f"BLS OEWS, {OEWS_PANEL}",
            "employment": int(employment) if employment is not None else None,
            "employment_band": employment_band(employment),
            "projection": projection,
            "exposure": exposure,
            "category_distribution": bucket_count,
            "weighted_distribution": weighted_distribution,
            "tasks": tasks_out,
            "emerging_tasks": soc_emerging,
            "methodology": {
                "rubric_version": rubric_version,
                "scoring_model": scoring_model,
                "onet_task_vintage": max(vintages, key=vintage_key) if vintages else None,
                "vintages": dict(sorted(vintages.items())),
                "generated_at": generated_at,
                "importance_floor": IMPORTANCE_FLOOR,
                "importance_span": IMPORTANCE_SPAN,
                "supplemental_weight": SUPPLEMENTAL_WEIGHT,
                "buckets": {"high": HIGH_BUCKET, "medium": MEDIUM_BUCKET},
                "default_importance": DEFAULT_IMPORTANCE,
                "physical_gwas": list(PHYSICAL_GWAS),
                "judgment_gwas": list(JUDGMENT_GWAS),
                "routine_gwas": list(ROUTINE_GWAS),
            },
        }

        (OUT / f"{soc}.json").write_text(json.dumps(detail, separators=(",", ":")))

        index.append(
            {
                "code": soc,
                "title": occ["title"],
                "description": occ["description"],
                "scored": scored,
                "risk_score": risk_score,
                "tasks_count": len(tasks),
                "salary": wage,
                "salary_source": salary_source,
                "salary_vintage": f"BLS OEWS, {OEWS_PANEL}",
                "employment": int(employment) if employment is not None else None,
                "employment_band": employment_band(employment),
                "projection": projection,
                "exposure": exposure,
                "category_distribution": bucket_count,
                "weighted_distribution": weighted_distribution,
            }
        )

    (OUT / "index.json").write_text(json.dumps(index, separators=(",", ":")))

    # Model-wide report, written beside the data so a page can quote the validation figure
    # without every occupation file carrying a copy of it.
    paired = [
        (o["risk_score"], automation_ratings[o["code"]])
        for o in index
        if o["scored"] and o["risk_score"] is not None and o["code"] in automation_ratings
    ]
    rho = spearman([p[0] for p in paired], [p[1] for p in paired]) if len(paired) > 2 else None
    checks = {}
    for element, label in VALIDATION_ELEMENTS.items():
        series = work_context.get(element, {})
        pairs = [
            (o["risk_score"], series[o["code"]])
            for o in index
            if o["scored"] and o["risk_score"] is not None and o["code"] in series
        ]
        checks[element] = {
            "element": label,
            "spearman": spearman([p[0] for p in pairs], [p[1] for p in pairs]) if len(pairs) > 2 else None,
            "n": len(pairs),
        }
    tasks_total = sum(o["exposure"]["tasks_scored"] for o in index)
    tasks_rated = sum(o["exposure"]["tasks_rated"] for o in index)

    report = {
        "generated_at": generated_at,
        "onet_release": "31.0",
        "onet_task_vintage": max(vintages, key=vintage_key) if vintages else None,
        "vintages": {
            "onet_database": "31.0",
            "onet_task_newest_record": max(vintages, key=vintage_key) if vintages else None,
            "oews_panel": OEWS_PANEL,
            "oews_released": OEWS_RELEASED,
            "bls_projections": PROJECTIONS_RELEASE,
        },
        "rubric_version": rubric_version,
        "scoring_model": scoring_model,
        "counts": {
            "occupations": len(index),
            "occupations_scored": sum(1 for o in index if o["scored"]),
            "occupations_without_inventory": totals["occupations_without_inventory"],
            "tasks_scored": tasks_total,
            "tasks_with_task_ratings": tasks_rated,
            "tasks_without_dwa_mapping": totals["tasks_without_dwa"],
            "dwas_scored": len(dwa_scores),
            "dwas_missing_score": len(missing_dwa_scores),
        },
        "weights": {
            "importance_floor": IMPORTANCE_FLOOR,
            "importance_span": IMPORTANCE_SPAN,
            "frequency_floor": FREQUENCY_FLOOR,
            "frequency_span": FREQUENCY_SPAN,
            "supplemental_weight": SUPPLEMENTAL_WEIGHT,
            "default_importance": DEFAULT_IMPORTANCE,
            "buckets": {"high": HIGH_BUCKET, "medium": MEDIUM_BUCKET},
        },
        "validation": {
            "degree_of_automation": {
                "source": "O*NET Work Context 4.C.3.b.2, human-rated, not an input to the index",
                "spearman_vs_index": rho,
                "n": len(paired),
            },
            "work_context_checks": checks,
            "reading": (
                "A negative correlation with machine-paced work is expected and correct: the index "
                "measures how much of the task content current AI can address, not how industrialised "
                "the job already is. Note that decision latitude does not lower the index — information "
                "work carries more automatable text and data handling than physical work does."
            ),
        },
    }
    (OUT / "_methodology.json").write_text(json.dumps(report, indent=2) + "\n")

    if missing_dwa_scores:
        # Loud on purpose: a missing score means the cache and the CSV disagree.
        print(f"WARNING: {len(missing_dwa_scores)} DWAs had no automation score, e.g. "
              f"{sorted(missing_dwa_scores)[:5]}. Re-run scripts/onet/score_dwas.py.")

    print(f"Wrote {len(index)} occupations to {OUT.relative_to(ROOT)}")
    print(
        "Coverage: "
        f"{sum(o['exposure']['tasks_scored'] for o in index)} tasks scored, "
        f"{totals['tasks_unscored']} unscored, "
        f"{totals['tasks_without_dwa']} without a DWA mapping, "
        f"{totals['occupations_without_inventory']} occupations with no O*NET task inventory "
        "(kept, scored null)"
    )
    salaries = Counter(o["salary_source"] for o in index)
    print(f"Salary sources: {dict(salaries)}")


if __name__ == "__main__":
    main()
