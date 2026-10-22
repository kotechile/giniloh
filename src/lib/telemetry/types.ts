/**
 * Type definitions for Vibe Marketing telemetry, session tracking,
 * and high-intent interactive acquisition events.
 *
 * TWO FACTS, TWO NAMES — the same contract every property keeps:
 *   property        which site owns the row          ('giniloh')
 *   domainCategory  what the asset is about          ('career-capital')
 * They used to share the name `verticalSlug`, and the events table ended up holding the pillar
 * while the lead table held the property. See docs/vibe-marketing-review.md (F3).
 */

export type VibeEventName =
  | 'card_impression'
  | 'session_start'
  | 'input_adjusted'
  | 'calc_run'
  | 'scenario_selected'
  | 'lead_engaged'
  | 'model_exported';

export interface VibeTelemetryEvent {
  sessionId: string;
  assetSlug: string;
  /** The site that emitted the event. Always 'giniloh' here. */
  property: string;
  /** The pillar/topic the asset belongs to. */
  domainCategory: string;
  eventName: VibeEventName;
  payload?: Record<string, unknown>;
  clientTimestamp?: string;
}

export interface VibeLeadIntent {
  sessionId: string;
  assetSlug: string;
  property: string;
  domainCategory: string;
  email: string;
  intentType: 'model_export' | 'audit_request' | 'benchmark_sync';
  calculatedMetrics?: Record<string, unknown>;
  consentTextVersion: string;
}

export interface TelemetryApiResponse {
  success: boolean;
  message?: string;
}

/** What the capture form is allowed to tell the visitor. */
export interface LeadCaptureResult {
  ok: boolean;
  /** Present when `ok` is false: a sentence for the visitor, the real reason for the console. */
  error?: string;
}
