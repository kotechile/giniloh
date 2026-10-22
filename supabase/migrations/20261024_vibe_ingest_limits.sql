-- ==============================================================================
-- Ingest limits for the anonymous write surface, and a retry budget for the sender.
--
-- Applied 2026-10-24 against ixfdkninqeqmwuxncpvh (idempotent).
--
-- WHY: `vibe_lead_intents` accepts anonymous INSERTs from a publishable key, and every accepted
-- row makes the n8n poller send an email to whatever address that row carries. The RLS policy
-- validates the *shape* of the address, never the *volume* — so one script could put 10,000 rows
-- for a victim's address in the table, and reports@giniloh.com would mail that victim 10,000
-- scenario reports. That is a mail-bomb sent from our domain, with our DMARC reputation behind it,
-- paid for by our own pipeline. Volume has to be bounded in the database, because the client is
-- the untrusted party.
--
-- A trigger, not a policy: policies cannot count rows (they see one row at a time), and this has
-- to hold for the OLD clients too — the ones already deployed at giniloh.com, aichieve.net and
-- wellroost.com — which know nothing about the limits and cannot be updated in the same instant.
--
-- The second half adds a retry budget. Previously a row whose email failed stayed
-- `pending_n8n_sync` forever and was retried every five minutes indefinitely: a hard-bounced
-- address was a permanent 288 sends/day loop with no record of how many times it had been tried.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Retry budget columns
-- ------------------------------------------------------------------------------
alter table public.vibe_lead_intents add column if not exists send_attempts integer not null default 0;
alter table public.vibe_lead_intents add column if not exists last_attempt_at timestamptz;

-- aichieve's lead table is polled by the same workflow and filtered on the same column, so it needs
-- the same pair. Without this the aichieve branch of the sender fails on 42703 (unknown column) and
-- no enterprise dossier is ever mailed. Mirrors into the aichieve repo's own migrations.
alter table public.aichieve_lead_intents add column if not exists send_attempts integer not null default 0;
alter table public.aichieve_lead_intents add column if not exists last_attempt_at   timestamptz;

comment on column public.vibe_lead_intents.send_attempts is
	'Number of failed send attempts. The n8n fetch skips rows at 5 and the attempt branch marks them failed.';
comment on column public.vibe_lead_intents.last_attempt_at is
	'Time of the most recent send attempt, successful or not. For spotting a row that is looping.';

-- The poller's own query: pending rows, oldest first.
create index if not exists idx_vibe_leads_pending
	on public.vibe_lead_intents(created_at)
	where status = 'pending_n8n_sync';

create index if not exists idx_aichieve_leads_pending
	on public.aichieve_lead_intents(created_at)
	where status = 'pending_n8n_sync';

-- ------------------------------------------------------------------------------
-- 2. Lead guard: dedupe, per-address and per-session caps, payload cap
-- ------------------------------------------------------------------------------
create or replace function public.vibe_guard_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	recent_same_request integer;
	same_address_last_hour integer;
	session_captures integer;
	metrics_bytes integer;
	-- Table-agnostic on purpose: `vibe_lead_intents` and `aichieve_lead_intents` are mailed by the
	-- same poller and carry the same abuse risk, so they share one guard instead of drifting apart.
	tbl text := format('%I.%I', tg_table_schema, tg_table_name);
begin
	-- One spelling of an address, so the caps below cannot be sidestepped by case or whitespace.
	new.email := lower(btrim(new.email));

	-- 1 row per (address, asset) per 10 minutes is enough: a repeat submit is a refresh, not a
	-- second report. RETURN NULL skips the INSERT and the visitor still sees success, because their
	-- report is already queued from the first row.
	execute format(
		'select count(*) from %s where email = $1 and asset_slug = $2 and created_at > now() - interval ''10 minutes''',
		tbl
	) into recent_same_request using new.email, new.asset_slug;
	if recent_same_request > 0 then
		return null;
	end if;

	-- The mail-bomb cap. Three reports an hour to one address is generous for a human comparing
	-- scenarios, and useless to anyone trying to flood a stranger's inbox.
	execute format(
		'select count(*) from %s where email = $1 and created_at > now() - interval ''1 hour''',
		tbl
	) into same_address_last_hour using new.email;
	if same_address_last_hour >= 3 then
		raise exception 'lead rejected: this address has already requested % reports in the last hour', same_address_last_hour
			using errcode = 'P0001';
	end if;

	-- Caps a single automated session from fanning out to many addresses.
	execute format('select count(*) from %s where session_id = $1', tbl)
		into session_captures using new.session_id;
	if session_captures >= 5 then
		raise exception 'lead rejected: session has already captured % addresses', session_captures
			using errcode = 'P0001';
	end if;

	metrics_bytes := coalesce(pg_column_size(new.calculated_metrics), 0);
	if metrics_bytes > 8192 then
		raise exception 'lead rejected: calculated_metrics is % bytes (limit 8192)', metrics_bytes
			using errcode = 'P0001';
	end if;

	if new.intent_type is null
		or new.intent_type not in ('model_export', 'audit_request', 'benchmark_sync', 'enterprise_dossier') then
		raise exception 'lead rejected: unknown intent_type %', coalesce(new.intent_type, '(null)')
			using errcode = 'P0001';
	end if;

	return new;
end;
$$;

comment on function public.vibe_guard_lead() is
	'Bounds the anonymous lead INSERT on any lead table: normalises the address, collapses repeat submits, caps 3/hour per address and 5 per session, caps the metrics payload, allowlists intent_type.';

drop trigger if exists vibe_guard_lead on public.vibe_lead_intents;
create trigger vibe_guard_lead
	before insert on public.vibe_lead_intents
	for each row execute function public.vibe_guard_lead();

-- The sibling property's table, same guard. Guarded so this migration still applies to a database
-- that has no aichieve tables.
do $$
begin
	if to_regclass('public.aichieve_lead_intents') is not null then
		drop trigger if exists vibe_guard_lead on public.aichieve_lead_intents;
		create trigger vibe_guard_lead
			before insert on public.aichieve_lead_intents
			for each row execute function public.vibe_guard_lead();
	end if;
end
$$;

-- ------------------------------------------------------------------------------
-- 3. Event guard: a broken loop cannot fill the table
-- ------------------------------------------------------------------------------
-- The slider emits one event per drag now, but nothing stops a modified client from posting in a
-- loop. Events are cheaper than leads (they mail nobody) — the cap is about storage and about a
-- runaway session distorting the funnel, so it is set well above any human interaction.
create or replace function public.vibe_guard_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	session_events integer;
begin
	if length(new.session_id) > 80 or length(new.asset_slug) > 120 or length(new.event_name) > 60 then
		raise exception 'event rejected: identifier too long'
			using errcode = 'P0001';
	end if;

	if coalesce(pg_column_size(new.payload), 0) > 4096 then
		raise exception 'event rejected: payload is % bytes (limit 4096)', pg_column_size(new.payload)
			using errcode = 'P0001';
	end if;

	select count(*) into session_events
	from public.vibe_telemetry_events
	where session_id = new.session_id;
	if session_events >= 400 then
		raise exception 'event rejected: session has % events', session_events
			using errcode = 'P0001';
	end if;

	return new;
end;
$$;

comment on function public.vibe_guard_event() is
	'Bounds the anonymous event INSERT: identifier lengths, 4KB payload, 400 events per session.';

drop trigger if exists vibe_guard_event on public.vibe_telemetry_events;
create trigger vibe_guard_event
	before insert on public.vibe_telemetry_events
	for each row execute function public.vibe_guard_event();
