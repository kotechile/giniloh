import type { ReactNode } from 'react';

/**
 * Shared light-theme primitives for the vertical calculators (Editorial Neutral: white surface,
 * #1A1A1A ink, #5E5E5E body, #E5E5E5 hairlines, steel-blue #5A7A8F accent, brick/ochre for risk).
 * No gradients, no shadows, no dark panels — see design-language.md.
 */

export const ACCENT = 'var(--accent-line)';
export const RISK_HIGH = 'var(--risk-high)';
export const RISK_MID = 'var(--risk-medium)';

export function formatUsd(value: number, opts: { decimals?: number } = {}) {
	if (!Number.isFinite(value)) return '—';
	const decimals = opts.decimals ?? 0;
	return value.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	});
}

export function NumberField({
	label,
	value,
	onChange,
	step = 1,
	min = 0,
	max,
	suffix,
	help,
	alt = false
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
	step?: number;
	min?: number;
	max?: number;
	suffix?: string;
	help?: string;
	alt?: boolean;
}) {
	return (
		<label className="grid gap-2 border-t border-[#E5E5E5] pt-4">
			<span className="flex items-baseline justify-between gap-3">
				<span className="text-sm font-semibold text-[#1A1A1A]">{label}</span>
				{suffix ? (
					<span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#8C8C8C]">{suffix}</span>
				) : null}
			</span>
			<input
				type="number"
				inputMode="decimal"
				value={Number.isFinite(value) ? value : 0}
				step={step}
				min={min}
				max={max}
				onChange={(e) => {
					const next = Number(e.target.value);
					onChange(Number.isFinite(next) ? next : 0);
				}}
				className={`w-full border-b bg-transparent pb-2 font-mono text-base font-bold outline-none transition ${
					alt ? 'border-[#C88D4E] text-[#1A1A1A]' : 'border-[#E5E5E5] text-[#1A1A1A]'
				} focus:border-[#5A7A8F]`}
			/>
			{help ? <span className="text-xs leading-relaxed text-[#8C8C8C]">{help}</span> : null}
		</label>
	);
}

export function Toggle({
	label,
	value,
	onChange,
	help
}: {
	label: string;
	value: boolean;
	onChange: (value: boolean) => void;
	help?: string;
}) {
	return (
		<label className="flex cursor-pointer items-start justify-between gap-4 border-t border-[#E5E5E5] pt-4">
			<span>
				<span className="block text-sm font-semibold text-[#1A1A1A]">{label}</span>
				{help ? <span className="mt-1 block text-xs leading-relaxed text-[#8C8C8C]">{help}</span> : null}
			</span>
			<input
				type="checkbox"
				checked={value}
				onChange={(e) => onChange(e.target.checked)}
				className="mt-1 h-4 w-4 shrink-0 accent-[#5A7A8F]"
			/>
		</label>
	);
}

export function SectionTitle({ index, title }: { index: string; title: string }) {
	return (
		<h3 className="flex items-baseline gap-3 font-mono text-[0.66rem] font-bold uppercase tracking-[0.26em] text-[#8C8C8C]">
			<span className="text-[#5A7A8F]">{index}</span>
			{title}
		</h3>
	);
}

export function Metric({
	label,
	value,
	hint,
	tone = 'ink'
}: {
	label: string;
	value: string;
	hint?: string;
	tone?: 'ink' | 'accent' | 'risk' | 'mid';
}) {
	const color = tone === 'risk' ? RISK_HIGH : tone === 'mid' ? RISK_MID : tone === 'accent' ? ACCENT : 'var(--ink)';
	return (
		<div className="border-t border-[#E5E5E5] pt-3">
			<p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">{label}</p>
			<p className="mt-1 font-mono text-xl font-bold tabular-nums" style={{ color }}>
				{value}
			</p>
			{hint ? <p className="mt-1 text-xs leading-relaxed text-[#8C8C8C]">{hint}</p> : null}
		</div>
	);
}

export function VerdictBlock({
	headline,
	body,
	tone = 'accent'
}: {
	headline: string;
	body: ReactNode;
	tone?: 'accent' | 'risk' | 'mid';
}) {
	const color = tone === 'risk' ? RISK_HIGH : tone === 'mid' ? RISK_MID : ACCENT;
	return (
		<div className="mt-8 border-l-2 pl-5" style={{ borderColor: color }}>
			<p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em]" style={{ color }}>
				Verdict
			</p>
			<p className="mt-1 text-2xl font-extrabold tracking-tight text-[#1A1A1A]">{headline}</p>
			<div className="mt-2 text-sm leading-relaxed text-[#5E5E5E]">{body}</div>
		</div>
	);
}

export function AssumptionNote({ children }: { children: ReactNode }) {
	return (
		<p className="mt-10 border-t border-[#E5E5E5] pt-4 text-xs leading-relaxed text-[#8C8C8C]">{children}</p>
	);
}
