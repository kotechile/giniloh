#!/usr/bin/env bash
# Downloads the O*NET 31.0 tables this pipeline reads.
#
# Everything here is public-domain-ish (Creative Commons Attribution 4.0) from
# https://www.onetcenter.org/database.html. Files already present are skipped, so this is safe
# to re-run after a partial download.
#
#   ./scripts/onet/fetch_onet.sh            # fetch what is missing
#   ./scripts/onet/fetch_onet.sh --force    # re-download everything
#
# work_context.csv is not committed (51 MB) because it is used only to validate the index,
# not to build it. Run this script if you want the validation numbers to regenerate.
set -euo pipefail

BASE="https://www.onetcenter.org/dl_files/database/db_31_0_csv"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/data/onet"
FORCE="${1:-}"
mkdir -p "$DIR"

FILES=(
  task_statements.csv
  task_ratings.csv
  tasks_to_dwas.csv
  work_activities.csv
  work_context.csv
  emerging_tasks.csv
  gwas_to_iwas_to_dwas.csv
)

for f in "${FILES[@]}"; do
  if [ -s "$DIR/$f" ] && [ "$FORCE" != "--force" ]; then
    echo "skip  $f ($(wc -l < "$DIR/$f" | tr -d ' ') rows)"
    continue
  fi
  echo "fetch $f"
  curl -sSL --fail --max-time 300 -A "Mozilla/5.0 (compatible; giniloh-onet-fetch)" -o "$DIR/$f.tmp" "$BASE/$f"
  mv "$DIR/$f.tmp" "$DIR/$f"
  echo "      $(wc -l < "$DIR/$f" | tr -d ' ') rows, $(du -h "$DIR/$f" | cut -f1)"
done

echo "Done. Next: npm run data:careers && npm run data:careers:score"
