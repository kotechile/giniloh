# n8n workflows for the vibe-marketing pipeline

Two files. Both are **generated** by `scripts/build-n8n.mjs` (in the `giniloh` repo) and copied here
verbatim. The same files live in `giniloh`, `AICHIEVE` and `wellroost` because all three applications
point `PUBLIC_N8N_WEBHOOK_URL` at the **same** endpoint on **one** n8n instance:

```
https://n8n.giniloh.com/webhook/vibe-telemetry
```

Do not hand-edit the JSON. Change the generator, re-run it, copy.

## Live state (2026-10-22, applied through the n8n MCP)

| Workflow | ID | State |
| --- | --- | --- |
| Vibe Telemetry — giniloh / aichieve / wellroost | `8Ku6uNdxeNxMbFzd` | **active**, published: alert names property + pillar + asset title |
| Lead Reports — all properties | `YCOLGsTqaYlGd2Tc` | **active**, published: property→domain map, `send_attempts` filter, explicit 5-minute interval |
| Lead Reports — draft (needs header-auth attached) | `akY6DYzjXGP02jR1` | **inactive**: per-attempt retry branch, no head-of-line blocking |

The draft is the stronger design and it is parked for one reason: the n8n MCP will not attach a
**generic** credential (`httpHeaderAuth`) to an HTTP Request node. `setNodeCredential` and `addNode`
both answer *"node type 'n8n-nodes-base.httpRequest' does not accept credential 'httpHeaderAuth'"*,
and the Workflow SDK drops the credential silently at creation. Its SMTP credentials are attached
per property. To finish it: open the workflow, pick `sbdomainservice` on each of the nine HTTP
Request nodes, save, publish, then archive `YCOLGsTqaYlGd2Tc`.

Until then the retry bound lives in the database (`20261025_retire_stale_lead_sends.sql`): pending
rows older than 30 minutes are retired as `failed` by pg_cron, whatever version of the sender is
running. That is what makes the live workflow safe without the retry branch.

## Import order

1. **`vibe_telemetry_workflow.json`** — receives browser events. Import once (importing the copies
   replaces the same path). It must be **Active**: an inactive workflow answers
   `404 "… is not registered"`, which is exactly what production returned before this file existed.
2. **`lead_reports_workflow.json`** — polls the lead tables every five minutes and mails the
   scenario. Import once, attach credentials, then **Active**.

## Credentials — the reason "missing emails" happened

No JSON can carry a credential, so both need attaching after import. A workflow with an unattached
node fails at that node, and that is what an "email workflow" looks like from the outside.

`lead_reports_workflow.json` needs two:

| Credential | Nodes | Value |
| --- | --- | --- |
| HTTP Header Auth | "Fetch Pending …", "Mark Sent …" | `apikey: <service role key>` and `Authorization: Bearer <service role key>`. **Service role**, because this reads and patches rows — the anon key cannot |
| SMTP | "Send Report …" | Your provider account. `From` is derived per row (`reports@<property domain>`) and must be a verified sender |

The telemetry workflow needs **no credentials** — by design. It sends no email.

## Why email is not in the telemetry workflow

The previous file ended in an `emailSend` node reading `$json.email`. A telemetry payload never
carries an address: the front ends send **field names, never values**, and the event that fires is a
`view` / `input_change` / `complete` — not a form submission. The node therefore had no recipient and
no SMTP credential, and failed the whole execution every time it ran.

Addresses live in Supabase (`vibe_lead_intents`, `aichieve_lead_intents`). Mailing is a poll of those
tables, and a failed send leaves `status = 'pending_n8n_sync'` so the next tick retries it.

## What the telemetry workflow does

```
Webhook (POST /vibe-telemetry, CORS *)
  ├─ type == "lead_intent" → shape alert → has email? → "Notify a Human"  (attach Slack/Telegram)
  └─ anything else         → Ignore        (events are already stored by the browser)
```

It deliberately does **not** write to Supabase: the browser already posts every event to
`vibe_asset_telemetry` / `vibe_telemetry_events`. Mirroring here would double every row.

`Notify a Human` is an empty NoOp on purpose — the earlier version pointed at
`hooks.slack.com/services/REPLACE/...`, so an unconfigured alert reported a failed execution for a
successful event.

## Payload shapes

`verticalSlug` is the **property** that collected the lead (`giniloh`, `wellroost`, `aichieve`);
`domainCategory` is **what the asset is about** (`career-capital`, `agentic-ai`, …). They are two
different facts and the pipeline breaks when they share a column — see
`docs/vibe-marketing-review.md` in the giniloh repo.

```jsonc
// giniloh.com and aichieve.net front ends
{ "origin": "giniloh.com", "type": "telemetry_event", "event": { "sessionId": "…", "assetSlug": "…", "verticalSlug": "giniloh", "domainCategory": "career-capital", "eventName": "card_impression", "payload": {} } }
{ "origin": "giniloh.com", "type": "lead_intent", "lead": { "sessionId": "…", "assetSlug": "…", "verticalSlug": "giniloh", "domainCategory": "career-capital", "email": "…", "intentType": "model_export", "consentTextVersion": "2026-10-22", "calculatedMetrics": { "assetTitle": "…", "paramValue": 150, "calculatedDelta": "+$8,721/yr" } } }

// wellroost.com front end (flat)
{ "asset_id": "…", "asset_slug": "…", "event_type": "view", "category": "…", "title": "…", "domain": "wellroost.com", "metadata": { "fields": ["engine"] } }
```

The workflow branches only on `type == "lead_intent"`; wellroost's flat events fall through to
`Ignore`, which is correct — they are already in Supabase.

## Which property a row is mailed as

The scheduled workflow decides the sending domain from the row, never from the repo whose copy of
this file you imported:

```
vertical_slug == 'giniloh'    -> reports@giniloh.com     (links to giniloh.com)
vertical_slug == 'wellroost'  -> reports@wellroost.com   (links to wellroost.com)
vertical_slug == 'aichieve'   -> reports@aichieve.net    (links to aichieve.net)
anything else                 -> the table's default property
```

`calculated_metrics.domain` is a client-supplied hint and is used **only** when it names a domain
already allowed on that branch — a row cannot choose its own `From` address. The resolution runs
over every fetched row (`$input.all()`), not just the first, so a tick with 20 pending leads sends
20 reports.

## Retry budget

The poll selects `status=eq.pending_n8n_sync&send_attempts=lt.5`. Each send node is wired with
`onError: continueErrorOutput`, so output 0 (sent) goes to **Mark Sent** and output 1 (failed) goes
to **Record Attempt**:

```
Mark Sent        PATCH { status: 'sent', delivered_at: now }
Record Attempt   PATCH { send_attempts: +1, last_attempt_at: now,
                         status: attempts+1 >= 5 ? 'failed' : 'pending_n8n_sync' }
```

Five failures retire the row. Before this, a hard-bounced address stayed `pending_n8n_sync` and
came back every five minutes forever — 288 sends a day to an address that will never accept one,
with no record of how many times it had been tried. A failed send also no longer aborts the tick:
one bad address used to stop the other 19 rows from being attempted.

## What the database refuses (so the workflow cannot be used as an open relay)

The lead tables are written directly by the browser with a publishable key, so the limits live in
`20261024_vibe_ingest_limits.sql` as `BEFORE INSERT` triggers, not in this workflow — that way they
also apply to the clients already deployed on the three sites:

| Limit | Value |
| --- | --- |
| Repeat submit | same address + asset inside 10 min is **skipped** (the visitor still sees success: their report is already queued) |
| Per address | 5 reports / hour (one per asset, plus one retry) |
| Per session | 5 captured addresses |
| Metrics payload | 8 KB |
| Event payload | 4 KB, 400 events per session |

Without the per-address cap, one script could queue thousands of scenario emails for a stranger and
`reports@giniloh.com` would send every one of them — a mail-bomb from our domain, paid for by our
own SMTP quota.


## Verifying without clicking around

```bash
# 1. Is the path registered? 200/204 = yes; "not registered" = no active workflow owns it.
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://n8n.giniloh.com/webhook/vibe-telemetry -H 'Content-Type: application/json' -d '{}'

# 2. Does the browser preflight pass? Want 204 + Access-Control-Allow-Origin.
curl -s -D - -o /dev/null -X OPTIONS https://n8n.giniloh.com/webhook/vibe-telemetry \
  -H 'Origin: https://wellroost.com' -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' | grep -i access-control

# 3. Anything waiting to be mailed?
#    select count(*) from vibe_lead_intents where status = 'pending_n8n_sync';
```
