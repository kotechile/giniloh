#!/usr/bin/env python3
"""
Scores every O*NET Detailed Work Activity (DWA) for how far current AI systems can
perform it. One score per DWA, not per task: 2,085 activities instead of 18,838 task
statements, and they are reused across occupations so the numbers stay comparable.

The output is committed to data/onet/dwa-automation.json. Builds read that file and
never touch the network; re-run this script only when the rubric changes or a newer
O*NET release lands.

    python3 scripts/onet/score_dwas.py            # fill gaps, keep existing scores
    python3 scripts/onet/score_dwas.py --refresh  # re-score everything
    python3 scripts/onet/score_dwas.py --audit 200  # sample re-score, report drift

Requires DEEPSEEK_API_KEY (or PUBLIC_DEEPSEEK_API_KEY) in the environment or in .env.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ONET = ROOT / "data" / "onet"
DWAS_CSV = ONET / "tasks_to_dwas.csv"
CACHE = ONET / "dwa-automation.json"
AUDIT_OUT = ONET / "dwa-automation.audit.json"

# Bump when the rubric, the capability list, or the anchors change: the cache is keyed
# on this string and every occupation file records it, so a stale score is visible.
RUBRIC_VERSION = "v2.1"
MODEL = "deepseek-chat"
BATCH = 40
WORKERS = 4

CAPABILITIES = [
    "text_generation",
    "data_analysis",
    "information_retrieval",
    "visual_inspection",
    "decision_support",
    "interpersonal",
    "physical_manipulation",
    "situated_mobility",
]

SYSTEM = """You score standardized work activities from the U.S. O*NET taxonomy for how far \
current AI systems can perform them.

For each activity you receive: id | activity text | parent Generalized Work Activity.

Return p = the probability that a capable AI system available in 2026 (an LLM with tools and, \
where relevant, vision; robots only where robots are genuinely deployed) can perform this \
activity end-to-end at acceptable professional quality, given the same inputs a human worker \
would have. Score the activity as written, not the job it belongs to.

Bands (interpolate inside a band, do not round to the band edges):
  0.85-1.00  AI does all of it today at professional quality, no human in the loop
             (transcribe a recording, draft routine correspondence, look up a standard
             figure, summarize a document, reformat data between schemas).
  0.60-0.85  AI does most of it; a human reviews, tailors, or owns the risky parts
             (write an analysis memo, produce a standard report, draft code to spec,
             screen records against written criteria).
  0.35-0.60  AI helps substantially but a human must execute or verify in the world
             (run a semi-structured diagnostic, apply a procedure to a patient or a
             machine, negotiate terms inside a mandate).
  0.10-0.35  AI is peripheral; the core act is human
             (hands-on care, high-stakes negotiation, physical repair in an unstructured
             environment, accountability-bearing judgment with legal consequence).
  0.00-0.10  Not automatable now (fine manual dexterity in unpredictable space, live
             emotional presence, physical work with unpredictable bodies and materials).

Rules:
- Physical dexterity, balance, and hands-on work in unstructured environments is low, even
  when the activity is routine in principle. Operating a machine remotely from a console is
  not the same as operating it by hand — score what the activity says.
- Supervision, teaching, and persuasion are not high just because they are word-based: the
  human relationship and the accountability are the work.
- A narrow, well-specified activity scores higher than a broad one. "Enter data into
  databases" is higher than "manage operations".
- cap = the single capability that decides the score (one of: %s).
- why = at most 12 words naming the capability that decides it.

Reply with a JSON object only, keyed by id:
{"4.A.3.b.6.a.2": {"p": 0.78, "cap": "text_generation", "why": "Standard financial statements from a fixed template"}}""" % ", ".join(
    CAPABILITIES
)


def load_env() -> str:
    key = os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("PUBLIC_DEEPSEEK_API_KEY")
    if key:
        return key
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("DEEPSEEK_API_KEY=") or line.startswith("PUBLIC_DEEPSEEK_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("No DEEPSEEK_API_KEY / PUBLIC_DEEPSEEK_API_KEY in the environment or .env")


def gwa_name_of(dwa_id: str) -> str:
    # Only the 41 GWA labels are needed for context; the build resolves names properly.
    return ""


def load_dwas() -> list[dict]:
    import csv

    seen: dict[str, str] = {}
    with DWAS_CSV.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            seen.setdefault(row["DWA Element ID"].strip(), row["DWA Element Name"].strip())

    # Parent GWA names come from work_activities.csv (depth-5 elements).
    import csv as _csv

    gwa: dict[str, str] = {}
    with (ONET / "work_activities.csv").open(newline="", encoding="utf-8") as fh:
        for row in _csv.DictReader(fh):
            gwa.setdefault(row["Element ID"].strip(), row["Element Name"].strip())

    out = []
    for dwa_id, name in sorted(seen.items()):
        parent = ".".join(dwa_id.split(".")[:5])
        out.append({"id": dwa_id, "text": name, "gwa": gwa.get(parent, parent)})
    return out


def call(payload_batch: list[dict], key: str, attempt: int = 0) -> dict:
    lines = "\n".join(f'{d["id"]} | {d["text"]} | {d["gwa"]}' for d in payload_batch)
    body = json.dumps(
        {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": lines},
            ],
            "temperature": 0,
            "max_tokens": 4000,
            "response_format": {"type": "json_object"},
        }
    ).encode()
    req = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read()[:400].decode(errors="replace")
        if attempt < 3:
            time.sleep(2 ** attempt)
            return call(payload_batch, key, attempt + 1)
        raise SystemExit(f"HTTP {exc.code} from DeepSeek: {detail}")
    except Exception:
        if attempt < 3:
            time.sleep(2 ** attempt)
            return call(payload_batch, key, attempt + 1)
        raise

    raw = data["choices"][0]["message"]["content"]
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        if attempt < 3:
            time.sleep(2 ** attempt)
            return call(payload_batch, key, attempt + 1)
        raise SystemExit(f"Unparseable JSON for batch starting {payload_batch[0]['id']}: {raw[:200]}")
    return parsed


def clean(raw: dict, wanted: list[dict]) -> tuple[dict, list[str]]:
    good, bad = {}, []
    by_id = {d["id"]: d for d in wanted}
    for key, val in raw.items():
        key = str(key).strip()
        if key not in by_id or not isinstance(val, dict):
            continue
        try:
            raw_p = val.get("p")
            if raw_p is None:
                raise TypeError("missing p")
            p = float(str(raw_p))
        except (TypeError, ValueError):
            bad.append(key)
            continue
        if not 0.0 <= p <= 1.0:
            bad.append(key)
            continue
        cap = str(val.get("cap", "")).strip()
        if cap not in CAPABILITIES:
            bad.append(key)
            continue
        why = " ".join(str(val.get("why", "")).split())[:120]
        good[key] = {"p": round(p, 3), "cap": cap, "why": why}
    missing = [d["id"] for d in wanted if d["id"] not in good]
    return good, sorted(set(bad) | set(missing))


def score_batch(batch: list[dict], key: str) -> dict:
    got: dict = {}
    pending = batch
    for _ in range(3):
        if not pending:
            break
        raw = call(pending, key)
        good, missing = clean(raw, pending)
        got.update(good)
        # Reassign, never `break` on the original list: pending is what the guard reads.
        pending = [d for d in pending if d["id"] in missing]
    if pending:
        sys.exit(
            "Refusing to write a partial cache. Unscored DWAs after 3 attempts: "
            + ", ".join(d["id"] for d in pending)
        )
    return got


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true", help="re-score every DWA")
    ap.add_argument("--audit", type=int, metavar="N", help="re-score a random sample of N DWAs")
    ap.add_argument("--limit", type=int, help="score only the first N DWAs (smoke test)")
    args = ap.parse_args()

    dwas = load_dwas()
    key = load_env()

    cache = {"meta": {}, "scores": {}}
    if CACHE.exists():
        cache = json.loads(CACHE.read_text())
        if cache.get("meta", {}).get("rubric_version") != RUBRIC_VERSION:
            print(f"Cache rubric {cache.get('meta', {}).get('rubric_version')} != {RUBRIC_VERSION}, re-scoring all")
            cache = {"meta": {}, "scores": {}}
    scores = {} if args.refresh else dict(cache.get("scores", {}))

    todo = [d for d in dwas if d["id"] not in scores]
    if args.limit:
        todo = todo[: args.limit]

    if args.audit:
        sample = random.Random(7).sample(dwas, min(args.audit, len(dwas)))
        print(f"Audit: re-scoring {len(sample)} DWAs")
        batches = [sample[i : i + BATCH] for i in range(0, len(sample), BATCH)]
        fresh: dict = {}
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            for part in pool.map(lambda b: score_batch(b, key), batches):
                fresh.update(part)
        drift = [abs(fresh[d["id"]]["p"] - scores[d["id"]]["p"]) for d in sample if d["id"] in scores]
        disagree = [d["id"] for d in sample if d["id"] in scores and abs(fresh[d["id"]]["p"] - scores[d["id"]]["p"]) >= 0.25]
        report = {
            "rubric_version": RUBRIC_VERSION,
            "model": MODEL,
            "sampled": len(sample),
            "compared": len(drift),
            "mean_absolute_deviation": round(sum(drift) / len(drift), 4) if drift else None,
            "max_deviation": round(max(drift), 4) if drift else None,
            "disagreements_ge_0.25": len(disagree),
            "disagreement_ids": disagree[:25],
            "sample": {
                d["id"]: {"cached": scores[d["id"]]["p"], "fresh": fresh[d["id"]]["p"]}
                for d in sample
                if d["id"] in scores
            },
        }
        AUDIT_OUT.write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps({k: v for k, v in report.items() if k != "sample"}, indent=2))
        print(f"Wrote {AUDIT_OUT.relative_to(ROOT)}")
        return

    if not todo:
        print(f"All {len(dwas)} DWAs already scored at {RUBRIC_VERSION}. Nothing to do.")
        return

    print(f"Scoring {len(todo)} DWAs in {(len(todo) + BATCH - 1) // BATCH} batches ({MODEL}, rubric {RUBRIC_VERSION})")
    batches = [todo[i : i + BATCH] for i in range(0, len(todo), BATCH)]
    done = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for part in pool.map(lambda b: score_batch(b, key), batches):
            scores.update(part)
            done += len(part)
            print(f"  {done}/{len(todo)}", flush=True)

    payload = {
        "meta": {
            "rubric_version": RUBRIC_VERSION,
            "model": MODEL,
            "source": "data/onet/tasks_to_dwas.csv",
            "scored": len(scores),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
        "scores": dict(sorted(scores.items())),
    }
    CACHE.write_text(json.dumps(payload, indent=1) + "\n")
    print(f"Wrote {CACHE.relative_to(ROOT)} — {len(scores)} scores")


if __name__ == "__main__":
    main()
