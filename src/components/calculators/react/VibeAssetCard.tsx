import React, { useState, useEffect, useRef } from 'react';
import { trackVibeEvent, captureVibeLead } from '../../../lib/telemetry/vibeClient';

export interface VibeAssetProps {
  title: string;
  category: string;
  description: string;
  assetSlug: string;
  /** The pillar this asset belongs to ('career-capital'). The property is always giniloh. */
  domainCategory: string;
  calculatorUrl?: string;
  quickParamLabel?: string;
  defaultParamValue?: number;
  paramUnit?: string;
  paramMin?: number;
  paramMax?: number;
  paramStep?: number;
  /**
   * Deterministic yield for the current parameter. Required on purpose: the previous optional
   * default invented 14.2% of the input, so an asset that forgot to pass one shipped fabricated
   * arithmetic under a real-looking headline.
   */
  computeYield: (value: number) => { headline: string; delta: string; subtext: string };
  onDeploy?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/** Trailing debounce for the slider: one event per pause, not one per pixel. */
const ADJUST_DEBOUNCE_MS = 600;

export const VibeAssetCard: React.FC<VibeAssetProps> = ({
  title,
  category,
  description,
  assetSlug,
  domainCategory,
  calculatorUrl,
  quickParamLabel = 'Estimated Annual Value',
  defaultParamValue = 200000,
  paramUnit = '$',
  paramMin = 50000,
  paramMax = 500000,
  paramStep = 10000,
  computeYield,
  onDeploy
}) => {
  const [engaged, setEngaged] = useState(false);
  const [paramValue, setParamValue] = useState(defaultParamValue);
  const [emailInput, setEmailInput] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const cardRef = useRef<HTMLElement | null>(null);
  const impressionSent = useRef(false);
  const adjustTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValue = useRef(defaultParamValue);

  // An impression is a card someone saw. Firing on hydration counted all four cards on load,
  // including the two below the fold (docs/vibe-marketing-review.md, F8).
  useEffect(() => {
    const element = cardRef.current;
    if (!element || impressionSent.current) return;

    const fire = () => {
      if (impressionSent.current) return;
      impressionSent.current = true;
      trackVibeEvent('card_impression', assetSlug, domainCategory);
    };

    if (typeof IntersectionObserver === 'undefined') {
      fire();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            fire();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [assetSlug, domainCategory]);

  // Flush a pending slider event when the island unmounts (navigation mid-drag).
  useEffect(() => {
    return () => {
      if (adjustTimer.current) {
        clearTimeout(adjustTimer.current);
        adjustTimer.current = null;
        trackVibeEvent('input_adjusted', assetSlug, domainCategory, { paramValue: pendingValue.current });
      }
    };
  }, [assetSlug, domainCategory]);

  const currentYield = computeYield(paramValue);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setParamValue(val);
    pendingValue.current = val;

    if (!engaged) {
      setEngaged(true);
      trackVibeEvent('session_start', assetSlug, domainCategory, { initialValue: val });
    }

    if (adjustTimer.current) clearTimeout(adjustTimer.current);
    adjustTimer.current = setTimeout(() => {
      adjustTimer.current = null;
      trackVibeEvent('input_adjusted', assetSlug, domainCategory, { paramValue: pendingValue.current });
    }, ADJUST_DEBOUNCE_MS);
  };

  const handleDeploy = () => {
    setEngaged(true);
    trackVibeEvent('session_start', assetSlug, domainCategory, { paramValue });
    if (onDeploy) onDeploy();
  };

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCaptureError(null);

    const address = emailInput.trim();
    if (!EMAIL_PATTERN.test(address)) {
      setCaptureError('That address does not look complete — check it and send again.');
      return;
    }

    setIsSubmitting(true);
    const result = await captureVibeLead(address, assetSlug, domainCategory, {
      assetTitle: title,
      paramValue,
      calculatedDelta: currentYield.headline
    });

    setIsSubmitting(false);

    if (result.ok) {
      setSubmittedEmail(address);
      setLeadCaptured(true);
    } else {
      // No silent revert: the visitor is told, and the reason is in the console for us.
      setCaptureError('We could not queue that report just now. Try again in a moment.');
    }
  };

  return (
    <article
      ref={cardRef}
      className="border border-[#D8D3C4] bg-white p-6 sm:p-8 flex flex-col justify-between transition-colors duration-150 hover:border-[#C6C0AE]"
      aria-labelledby={`vibe-title-${assetSlug}`}
    >
      <div>
        {/* Monospace Metadata Eyebrows */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] bg-[#F4F1E8] text-[#191610] px-2.5 py-1 border border-[#D8D3C4]">
            {category}
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#5F5B52]">
            Interactive Asset v1.0
          </span>
        </div>

        {/* Title & Core Smart-Brevity Problem */}
        <h3
          id={`vibe-title-${assetSlug}`}
          className="text-xl sm:text-2xl font-black tracking-tight text-[#191610] mb-3 leading-snug"
        >
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-[#4E4A42] mb-6">
          {description}
        </p>

        {/* Inline Interactive Micro-Simulator */}
        <div className="bg-[#F4F1E8] border border-[#D8D3C4] p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label
              htmlFor={`slider-${assetSlug}`}
              className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#5F5B52]"
            >
              {quickParamLabel}
            </label>
            <span className="font-mono text-sm font-bold text-[#191610]">
              {paramUnit === '$' ? `$${paramValue.toLocaleString()}` : `${paramValue} ${paramUnit}`}
            </span>
          </div>

          <input
            id={`slider-${assetSlug}`}
            type="range"
            min={paramMin}
            max={paramMax}
            step={paramStep}
            value={paramValue}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-[#D8D3C4] appearance-none cursor-pointer accent-[#5A7A8F]"
            aria-label={quickParamLabel}
            aria-valuetext={paramUnit === '$' ? `$${paramValue.toLocaleString()}` : `${paramValue} ${paramUnit}`}
          />

          {/* Real-time Net Yield Output */}
          <div className="mt-4 pt-3 border-t border-[#D8D3C4] flex items-baseline justify-between gap-2">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#5F5B52]">
                {currentYield.delta}
              </p>
              <p className="text-xs text-[#4E4A42] mt-0.5">
                {currentYield.subtext}
              </p>
            </div>
            <div className="text-right">
              <span
                className="font-mono text-xl sm:text-2xl font-black text-[#047857]"
                aria-live="polite"
                aria-atomic="true"
              >
                {currentYield.headline}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action & High-Intent Conversion Area */}
      <div>
        {!engaged ? (
          <button
            type="button"
            onClick={handleDeploy}
            className="w-full py-3 px-4 bg-[#191610] hover:bg-[#2E2A22] text-[#EAE7DE] font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>Run Decision Model</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        ) : leadCaptured ? (
          <div className="p-3 bg-[#F4F1E8] border border-[#047857]">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#047857]">
              Scenario queued
            </p>
            <p className="text-xs text-[#4E4A42] mt-1">
              We are sending the model you configured to {submittedEmail}.
            </p>
            {calculatorUrl && (
              <a
                href={calculatorUrl}
                className="mt-3 inline-block font-mono text-xs font-bold text-[#475F73] hover:underline"
              >
                Open Full Multivariable Engine &rarr;
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                name="email"
                autoComplete="email"
                placeholder="Work email for scenario report"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (captureError) setCaptureError(null);
                }}
                className="flex-1 px-3 py-2 text-xs border border-[#D8D3C4] bg-white text-[#191610] focus:outline-none focus:border-[#5A7A8F]"
                aria-label="Work email"
                aria-describedby={`consent-${assetSlug}`}
                aria-invalid={captureError ? true : undefined}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-4 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? 'Syncing...' : 'Export Model'}
              </button>
            </form>

            {captureError && (
              <p role="alert" className="text-[11px] leading-relaxed text-[#8A1C1C]">
                {captureError}
              </p>
            )}

            {/* One stated purpose, at the point of capture. The address is not a subscription. */}
            <p id={`consent-${assetSlug}`} className="text-[11px] leading-relaxed text-[#5F5B52]">
              We use this address only to send the scenario you just configured. No newsletter, no resale.
            </p>

            <div className="flex items-center justify-between text-xs text-[#5F5B52]">
              <span className="font-mono text-[10px] uppercase tracking-wider">
                Session Active · Real-time Telemetry
              </span>
              {calculatorUrl && (
                <a
                  href={calculatorUrl}
                  className="font-mono text-[11px] font-semibold text-[#475F73] hover:underline"
                >
                  Full Engine &rarr;
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
