import React, { useState, useEffect } from 'react';
import { trackVibeEvent, captureVibeLead } from '../../../lib/telemetry/vibeClient';

export interface VibeAssetProps {
  title: string;
  category: string;
  description: string;
  assetSlug: string;
  verticalSlug: string;
  calculatorUrl?: string;
  quickParamLabel?: string;
  defaultParamValue?: number;
  paramUnit?: string;
  paramMin?: number;
  paramMax?: number;
  paramStep?: number;
  computeYield?: (value: number) => { headline: string; delta: string; subtext: string };
  onDeploy?: () => void;
}

export const VibeAssetCard: React.FC<VibeAssetProps> = ({
  title,
  category,
  description,
  assetSlug,
  verticalSlug,
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
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track initial impression
  useEffect(() => {
    trackVibeEvent('card_impression', assetSlug, verticalSlug);
  }, [assetSlug, verticalSlug]);

  // Default ROI engine calculation if not explicitly provided
  const calculateResult = computeYield || ((val: number) => {
    const netSavings = Math.round(val * 0.142);
    return {
      headline: `+$${netSavings.toLocaleString()}/yr`,
      delta: 'Estimated Net Yield Delta',
      subtext: 'Optimized after self-employment tax, QBI deduction, and compliance overhead.'
    };
  });

  const currentYield = calculateResult(paramValue);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setParamValue(val);
    if (!engaged) {
      setEngaged(true);
      trackVibeEvent('session_start', assetSlug, verticalSlug, { initialValue: val });
    }
    trackVibeEvent('input_adjusted', assetSlug, verticalSlug, { paramValue: val });
  };

  const handleDeploy = () => {
    setEngaged(true);
    trackVibeEvent('session_start', assetSlug, verticalSlug, { paramValue });
    if (onDeploy) onDeploy();
  };

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) return;

    setIsSubmitting(true);
    const success = await captureVibeLead(
      emailInput,
      assetSlug,
      verticalSlug,
      {
        paramValue,
        calculatedDelta: currentYield.headline,
        timestamp: new Date().toISOString()
      },
      'model_export'
    );

    setIsSubmitting(false);
    if (success) {
      setLeadCaptured(true);
    }
  };

  return (
    <article
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
              <span className="font-mono text-xl sm:text-2xl font-black text-[#047857]">
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
          <div className="p-3 bg-[#F4F1E8] border border-[#047857] text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#047857]">
              Decision Model Synced
            </p>
            <p className="text-xs text-[#4E4A42] mt-1">
              Telemetry recorded. Full telemetry dispatch dispatched via n8n pipeline.
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
                placeholder="Work email for scenario report"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-[#D8D3C4] bg-white text-[#191610] focus:outline-none focus:border-[#5A7A8F]"
                aria-label="Work email"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-4 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? 'Syncing...' : 'Export Model'}
              </button>
            </form>

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
