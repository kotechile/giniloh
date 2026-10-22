-- ==============================================================================
-- Align giniloh's telemetry tables with what the client, the n8n poller and the
-- aichieve tables already do.
--
-- Applied 2026-10-23 against ixfdkninqeqmwuxncpvh (idempotent: safe to re-run).
--
-- THE MODEL, stated once (same as aichieve's 20261022_correct_vertical_slug.sql):
--
--   vertical_slug    = the PROPERTY that owns the row     'giniloh' | 'wellroost' | 'aichieve'
--   domain_category  = what the asset is ABOUT            'career-capital' | 'Career Capital'
--
-- Two different facts. Before this migration `vibe_telemetry_events.vertical_slug` received the
-- PILLAR while `vibe_lead_intents.vertical_slug` received the PROPERTY, so a cross-property query
-- (`where vertical_slug = 'giniloh'`) silently matched zero events while the leads matched. One
-- column name meant two things, which is the exact failure the aichieve correction was written for.
--
-- It also creates the three columns the giniloh client and the "Mark Sent" n8n node already write
-- but no migration ever declared (`consent_text_version`, `delivered_at`, `domain_category`). They
-- existed only because they were added to the live project by hand. A rebuild from this folder
-- would have produced a table that rejected the lead INSERT (PGRST204, unknown column) and the
-- mark-sent PATCH (42703) — leaving every lead `pending_n8n_sync` and re-mailing it every five
-- minutes, forever.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Events: the property in `vertical_slug`, the pillar in `domain_category`
-- ------------------------------------------------------------------------------
alter table public.vibe_telemetry_events add column if not exists domain_category text;

comment on column public.vibe_telemetry_events.vertical_slug is
	'Property that emitted the event (giniloh). NOT the content pillar — that is domain_category.';
comment on column public.vibe_telemetry_events.domain_category is
	'Content pillar / topic of the asset (career-capital, compute-capital, ...).';

-- One-time backfill of rows written before the split: they carry the pillar in vertical_slug.
-- Safe because this table belongs to giniloh alone (aichieve and wellroost have their own tables);
-- the guard makes a re-run a no-op.
update public.vibe_telemetry_events
set domain_category = vertical_slug,
    vertical_slug = 'giniloh'
where domain_category is null
  and vertical_slug <> 'giniloh';

create index if not exists idx_vibe_events_pillar
	on public.vibe_telemetry_events(vertical_slug, domain_category, event_name);

-- ------------------------------------------------------------------------------
-- 2. Leads: the columns the client and the sender already use
-- ------------------------------------------------------------------------------
alter table public.vibe_lead_intents add column if not exists domain_category text;
alter table public.vibe_lead_intents add column if not exists consent_text_version text;
alter table public.vibe_lead_intents add column if not exists delivered_at timestamptz;

comment on column public.vibe_lead_intents.vertical_slug is
	'Property that owns the lead (giniloh). The n8n lead branch routes the sending domain on this.';
comment on column public.vibe_lead_intents.domain_category is
	'Content pillar / topic the asset belongs to. Not the property.';
comment on column public.vibe_lead_intents.consent_text_version is
	'Version of the consent wording shown when the address was captured. NULL = captured before consent was recorded.';
comment on column public.vibe_lead_intents.delivered_at is
	'Set by the n8n "Mark Sent" node after the scenario email succeeds. A row without it is retried.';
comment on column public.vibe_lead_intents.status is
	'pending_n8n_sync -> sent. Only `sent` is terminal; anything else is retried every five minutes.';

-- ------------------------------------------------------------------------------
-- 3. Sessions: `vibe_asset_sessions` was never written by any code path
-- ------------------------------------------------------------------------------
-- The table had zero writers and zero rows on the live project, and every field it modelled
-- (first/last seen, duration, conversion) is derivable from `vibe_telemetry_events`, which is the
-- stream the client actually sends. Keeping a second, empty "session" table invites a report that
-- reads it and finds nothing. It is replaced by a view over the events so the reporting name
-- survives and cannot drift.
--
-- Destructive step, deliberately narrow: the table is only dropped when it is EMPTY. If it ever
-- holds rows, it is renamed instead, so nothing is deleted to make a migration tidy.
do $$
declare
	existing_rows bigint;
begin
	if to_regclass('public.vibe_asset_sessions') is not null
		and (select relkind from pg_class where oid = to_regclass('public.vibe_asset_sessions')) = 'r'
	then
		select count(*) into existing_rows from public.vibe_asset_sessions;
		if existing_rows = 0 then
			drop table public.vibe_asset_sessions;
		else
			alter table public.vibe_asset_sessions rename to vibe_asset_sessions_legacy;
			raise notice 'vibe_asset_sessions held % rows: renamed to vibe_asset_sessions_legacy instead of dropped', existing_rows;
		end if;
	end if;
end
$$;

-- A session means one tab (sessionStorage id) touching one asset.
create or replace view public.vibe_asset_sessions
with (security_invoker = true) as
select
	session_id,
	asset_slug,
	vertical_slug,
	domain_category,
	min(created_at) as created_at,
	max(created_at) as updated_at,
	greatest(0, extract(epoch from (max(created_at) - min(created_at)))::int) as duration_seconds,
	count(*) as event_count,
	bool_or(event_name = 'lead_engaged') as is_converted
from public.vibe_telemetry_events
group by session_id, asset_slug, vertical_slug, domain_category;

comment on view public.vibe_asset_sessions is
	'Derived per-session-per-asset rollup of vibe_telemetry_events. Replaced the empty table of the same name, which no code ever wrote to.';

-- Views do not inherit their base table's grants. Reads are a service-role reporting concern.
revoke all on public.vibe_asset_sessions from anon, authenticated;
grant select on public.vibe_asset_sessions to service_role;
