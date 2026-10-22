-- ==============================================================================
-- Retire lead rows whose delivery never completed.
--
-- Applied 2026-10-22 against ixfdkninqeqmwuxncpvh (idempotent).
--
-- WHY: a lead row leaves `pending_n8n_sync` only when a send succeeds. Anything else — a hard
-- bounce, an SMTP credential that stops working, a workflow that never reaches the row — leaves it
-- pending, and the poller picks it up again on every tick. The previous design retried forever: 288
-- deliveries a day to an address that has already refused one, with nothing recording how many
-- times it had been tried. The n8n sender now counts attempts, but attempts are only counted by the
-- version of the workflow that is actually running, so the guarantee belongs here instead: the
-- database is the one component every sender version must agree with.
--
-- 30 minutes is the window. The poller runs every 5 minutes, so a row gets six attempts before it
-- is retired — enough for a transient SMTP or DNS failure (one such failure is visible in the
-- execution history: `getaddrinfo EAI_AGAIN`, self-healed on the next tick), and short enough that
-- a dead address cannot block the rows queued behind it for long.
-- ==============================================================================

create extension if not exists pg_cron;

create or replace function public.retire_stale_lead_sends(p_max_age interval default '30 minutes')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	retired integer;
begin
	with stale as (
		update public.vibe_lead_intents
		set status = 'failed',
			send_attempts = send_attempts + 1,
			last_attempt_at = now()
		where status = 'pending_n8n_sync'
		  and send_attempts < 5
		  and coalesce(last_attempt_at, created_at) < now() - p_max_age
		returning 1
	)
	select count(*) into retired from stale;

	with stale as (
		update public.aichieve_lead_intents
		set status = 'failed',
			send_attempts = send_attempts + 1,
			last_attempt_at = now()
		where status = 'pending_n8n_sync'
		  and send_attempts < 5
		  and coalesce(last_attempt_at, created_at) < now() - p_max_age
		returning 1
	)
	select retired + count(*) into retired from stale;

	return retired;
end;
$$;

comment on function public.retire_stale_lead_sends(interval) is
	'Retires lead rows pending longer than p_max_age as failed, so no workflow version can retry a dead address forever.';

-- Every 10 minutes: cheap, and never races the 5-minute poller by more than one tick.
select cron.schedule(
	'retire-stale-lead-sends',
	'*/10 * * * *',
	$$select public.retire_stale_lead_sends('30 minutes')$$
);
