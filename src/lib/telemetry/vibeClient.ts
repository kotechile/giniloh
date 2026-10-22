/**
 * Client-side Telemetry & Webhook Dispatcher for Vibe Marketing Micro-Assets.
 * Connects directly to Supabase REST and/or n8n webhooks.
 * Completely client-safe and degrades silently if unconfigured or offline.
 */
import type { VibeEventName, VibeTelemetryEvent, VibeLeadIntent } from './types';

// Read public environment variables safely in Vite/Astro client
const SUPABASE_URL = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.PUBLIC_SUPABASE_URL || '') : '';
const SUPABASE_ANON_KEY = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '') : '';
const N8N_WEBHOOK_URL = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.PUBLIC_N8N_WEBHOOK_URL || '') : '';

/** Version of the consent wording on screen. Bump when the notice text changes. */
export const CONSENT_TEXT_VERSION = '2026-10-22';

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

/**
 * Dispatches an interaction event to the telemetry pipeline (Supabase / n8n).
 */
export async function trackVibeEvent(
  eventName: VibeEventName,
  assetSlug: string,
  verticalSlug: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  const event: VibeTelemetryEvent = {
    sessionId: getVibeSessionId(),
    assetSlug,
    verticalSlug,
    eventName,
    payload,
    clientTimestamp: new Date().toISOString()
  };

  // If Supabase is configured, push directly via PostgREST with anonymous RLS
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      fetch(`${SUPABASE_URL}/rest/v1/vibe_telemetry_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          session_id: event.sessionId,
          asset_slug: event.assetSlug,
          vertical_slug: event.verticalSlug,
          event_name: event.eventName,
          payload: event.payload
        }),
        keepalive: true
      }).catch(() => {});
    } catch {
      // Non-blocking telemetry
    }
  }

  // Also push to n8n webhook if configured
  if (N8N_WEBHOOK_URL) {
    try {
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'telemetry_event', event }),
        keepalive: true
      }).catch(() => {});
    } catch {
      // Non-blocking telemetry
    }
  }

  // Developer mode telemetry inspection
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.debug('[VibeTelemetry]', event.eventName, { assetSlug, verticalSlug, payload });
  }
}

/**
 * Captures high-intent leads generated during interactive asset sessions.
 * Sends payload to Supabase table and n8n webhook for immediate processing.
 */
export async function captureVibeLead(
  email: string,
  assetSlug: string,
  verticalSlug: string,
  calculatedMetrics: Record<string, unknown> = {},
  intentType: 'model_export' | 'audit_request' | 'benchmark_sync' = 'model_export',
  domainCategory?: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const leadPayload: VibeLeadIntent = {
    sessionId: getVibeSessionId(),
    assetSlug,
    verticalSlug,
    email,
    intentType,
    calculatedMetrics
  };

  let success = false;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vibe_lead_intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          session_id: leadPayload.sessionId,
          asset_slug: leadPayload.assetSlug,
          vertical_slug: leadPayload.verticalSlug,
          // What the asset is about, alongside who it belongs to — the pair aichieve_lead_intents
          // stores, so both lead tables answer the same questions.
          domain_category: domainCategory ?? null,
          email: leadPayload.email,
          intent_type: leadPayload.intentType,
          calculated_metrics: leadPayload.calculatedMetrics,
          // Which consent wording the address was given under; NULL here meant the row could not
          // answer for itself at all.
          consent_text_version: CONSENT_TEXT_VERSION,
          status: 'pending_n8n_sync'
        })
      });
      if (res.ok) success = true;
    } catch (err) {
      console.warn('[VibeTelemetry] Supabase lead capture error:', err);
    }
  }

  if (N8N_WEBHOOK_URL) {
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lead_intent', lead: leadPayload })
      });
      if (res.ok) success = true;
    } catch (err) {
      console.warn('[VibeTelemetry] n8n lead capture error:', err);
    }
  }

  // In local test/demo environment without backend, simulate success
  if (!SUPABASE_URL && !N8N_WEBHOOK_URL) {
    console.info('[VibeTelemetry Mock Capture]', leadPayload);
    success = true;
  }

  // Log lead conversion event
  await trackVibeEvent('lead_engaged', assetSlug, verticalSlug, {
    intentType,
    hasMetrics: Object.keys(calculatedMetrics).length > 0
  });

  return success;
}
