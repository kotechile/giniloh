/**
 * Client-side telemetry & lead dispatcher for giniloh.com interactive micro-assets.
 *
 * Two sinks, both optional, both configured at BUILD time:
 *   PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY   rows in Supabase (PostgREST, anon RLS)
 *   PUBLIC_N8N_WEBHOOK_URL                            human alert on a lead (n8n)
 *
 * WHY THE ENV NAMES MATTER: Astro inlines `import.meta.env.PUBLIC_*` into the bundle during
 * `astro build`. Setting these only on the running container ships `undefined` baked in and every
 * event is dropped with no error anywhere. That is why the local `.env` used to be dead: it still
 * carried the Next.js spelling (`NEXT_PUBLIC_*`), which Astro never reads.
 *
 * FAILURE POLICY: telemetry never blocks a page, but a *lead* may not be reported as captured
 * unless a sink confirmed the write. The previous version returned success when no sink was
 * configured at all, so the visitor was told "Decision Model Synced" about a row that never
 * existed (docs/vibe-marketing-review.md, F1).
 */
import type { LeadCaptureResult, VibeEventName, VibeTelemetryEvent, VibeLeadIntent } from './types';

const SUPABASE_URL = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.PUBLIC_SUPABASE_URL || '') : '';
const SUPABASE_ANON_KEY = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '') : '';
const N8N_WEBHOOK_URL = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.PUBLIC_N8N_WEBHOOK_URL || '') : '';

/** Version of the consent wording on screen. Bump when the notice text changes. */
export const CONSENT_TEXT_VERSION = '2026-10-22';

/**
 * The property a lead belongs to — the SITE, not the content pillar.
 *
 * giniloh's cards carry a pillar like 'career-capital'; that goes in `domain_category`, which is
 * what it is about. Writing it into `vertical_slug` put a topic in the column that answers "which
 * site did this come from" and made the two lead tables incompatible with aichieve's.
 */
const PROPERTY_SLUG = 'giniloh';
const PROPERTY_ORIGIN = 'giniloh.com';

export function isTelemetryConfigured(): boolean {
  return Boolean((SUPABASE_URL && SUPABASE_ANON_KEY) || N8N_WEBHOOK_URL);
}

let warnedUnconfigured = false;

/** Warn once per page load, naming the variables that are missing. Never per event. */
function warnUnconfigured(action: string): void {
  if (warnedUnconfigured) return;
  warnedUnconfigured = true;
  console.warn(
    `[VibeTelemetry] no sink configured — ${action} has nowhere to go. Set PUBLIC_SUPABASE_URL + ` +
      'PUBLIC_SUPABASE_ANON_KEY or PUBLIC_N8N_WEBHOOK_URL at BUILD time (Astro inlines PUBLIC_* ' +
      'into the bundle; a container-only variable is too late).'
  );
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `vibe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getVibeSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr_session';
  }

  try {
    const existing = window.sessionStorage.getItem('gini_vibe_session_id');
    if (existing) return existing;

    const newId = generateSessionId();
    window.sessionStorage.setItem('gini_vibe_session_id', newId);
    return newId;
  } catch {
    return generateSessionId();
  }
}

/** PostgREST puts the useful part of a rejection in the body, not the status. */
async function readError(res: Response | undefined): Promise<string> {
  if (!res) return 'no response';
  try {
    const body = (await res.json()) as { message?: string; code?: string; details?: string };
    const reason = body.message || body.details || '';
    return `HTTP ${res.status}${body.code ? ` ${body.code}` : ''}${reason ? ` — ${reason}` : ''}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/**
 * Dispatches an interaction event to Supabase and (optionally) the n8n alert webhook.
 * Non-blocking by design: telemetry must never delay or break the calculator.
 */
export async function trackVibeEvent(
  eventName: VibeEventName,
  assetSlug: string,
  domainCategory: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  if (!isTelemetryConfigured()) {
    warnUnconfigured(`event "${eventName}"`);
    return;
  }

  const event: VibeTelemetryEvent = {
    sessionId: getVibeSessionId(),
    assetSlug,
    property: PROPERTY_SLUG,
    domainCategory,
    eventName,
    payload,
    clientTimestamp: new Date().toISOString()
  };

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    void fetch(`${SUPABASE_URL}/rest/v1/vibe_telemetry_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        session_id: event.sessionId,
        asset_slug: event.assetSlug,
        // The property, so `where vertical_slug = 'giniloh'` counts this site's events.
        vertical_slug: event.property,
        // The pillar, so the event can still be grouped by topic.
        domain_category: event.domainCategory,
        event_name: event.eventName,
        payload: event.payload
      }),
      keepalive: true
    })
      .then(async (res) => {
        if (!res.ok) console.warn('[VibeTelemetry] event rejected:', await readError(res));
      })
      .catch((err) => console.warn('[VibeTelemetry] event dispatch failed:', err));
  }

  if (N8N_WEBHOOK_URL) {
    void fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: PROPERTY_ORIGIN,
        type: 'telemetry_event',
        event: { ...event, verticalSlug: event.property }
      }),
      keepalive: true
    }).catch((err) => console.warn('[VibeTelemetry] webhook dispatch failed:', err));
  }

  if (window.location.hostname === 'localhost') {
    console.debug('[VibeTelemetry]', event.eventName, { assetSlug, domainCategory, payload });
  }
}

/**
 * Captures a high-intent lead. Resolves `{ ok: true }` only when a sink confirmed the write, so the
 * form cannot congratulate the visitor over a row that was never stored.
 */
export async function captureVibeLead(
  email: string,
  assetSlug: string,
  domainCategory: string,
  calculatedMetrics: Record<string, unknown> = {},
  intentType: 'model_export' | 'audit_request' | 'benchmark_sync' = 'model_export'
): Promise<LeadCaptureResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Lead capture needs a browser context.' };
  }

  if (!isTelemetryConfigured()) {
    warnUnconfigured('a captured lead');
    return { ok: false, error: 'Lead capture is not configured for this deployment.' };
  }

  const lead: VibeLeadIntent = {
    sessionId: getVibeSessionId(),
    assetSlug,
    property: PROPERTY_SLUG,
    domainCategory,
    email,
    intentType,
    calculatedMetrics,
    consentTextVersion: CONSENT_TEXT_VERSION
  };

  let stored = false;
  let alerted = false;
  let failure = '';

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vibe_lead_intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          session_id: lead.sessionId,
          asset_slug: lead.assetSlug,
          // The site, always 'giniloh' — NOT the card's pillar. See PROPERTY_SLUG.
          vertical_slug: lead.property,
          // What the asset is about (the card's pillar), the same column aichieve uses for its
          // own taxonomy. Two facts, two columns.
          domain_category: lead.domainCategory,
          email: lead.email,
          intent_type: lead.intentType,
          calculated_metrics: lead.calculatedMetrics,
          // Which consent wording the address was given under, so the row answers for itself.
          consent_text_version: lead.consentTextVersion,
          status: 'pending_n8n_sync'
        })
      });
      if (res.ok) stored = true;
      else failure = await readError(res);
    } catch (err) {
      failure = err instanceof Error ? err.message : String(err);
    }
    if (failure) console.error('[VibeTelemetry] Supabase lead capture rejected:', failure);
  } else {
    // The report is delivered by the scheduled poll of this table. Without a row there is nothing
    // to poll, so a webhook-only deployment cannot promise the visitor a report.
    failure = 'No lead store is configured (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY).';
    console.error('[VibeTelemetry]', failure);
  }

  if (N8N_WEBHOOK_URL) {
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: PROPERTY_ORIGIN,
          type: 'lead_intent',
          lead: {
            sessionId: lead.sessionId,
            assetSlug: lead.assetSlug,
            // Property, not pillar: this is the field the alert uses to say which site a lead
            // came from, and the one that must not be confused with domainCategory.
            verticalSlug: lead.property,
            vertical_slug: lead.property,
            domainCategory: lead.domainCategory,
            email: lead.email,
            intentType: lead.intentType,
            calculatedMetrics: lead.calculatedMetrics,
            consentTextVersion: lead.consentTextVersion
          }
        })
      });
      // The alert is a HUMAN notification, not delivery: it does not put a row in the table the
      // poller reads, so it must never turn a failed capture into a success message.
      if (res.ok) alerted = true;
      else console.error('[VibeTelemetry] n8n lead alert rejected:', await readError(res));
    } catch (err) {
      console.error('[VibeTelemetry] n8n lead alert failed:', err);
    }
  }

  // The conversion event is recorded either way — a failed capture is itself worth knowing about.
  await trackVibeEvent('lead_engaged', assetSlug, domainCategory, {
    intentType,
    captured: stored,
    alerted,
    hasMetrics: Object.keys(calculatedMetrics).length > 0
  });

  if (!stored) {
    return { ok: false, error: failure || 'The capture endpoint did not accept the request.' };
  }
  return { ok: true };
}
