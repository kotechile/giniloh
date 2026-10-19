/**
 * Type definitions for Vibe Marketing telemetry, session tracking,
 * and high-intent interactive acquisition events.
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
  verticalSlug: string;
  eventName: VibeEventName;
  payload?: Record<string, unknown>;
  clientTimestamp?: string;
}

export interface VibeLeadIntent {
  sessionId: string;
  assetSlug: string;
  verticalSlug: string;
  email: string;
  intentType: 'model_export' | 'audit_request' | 'benchmark_sync';
  calculatedMetrics?: Record<string, unknown>;
}

export interface TelemetryApiResponse {
  success: boolean;
  message?: string;
}
