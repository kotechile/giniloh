import type { ChangeEvent } from 'react';

interface CurrencyInputProps {
	id: string;
	label: string;
	value: number;
	eyebrow?: string;
	min?: number;
	step?: number;
	helpText: string;
	onChange: (value: number) => void;
}

function parseNumberInput(event: ChangeEvent<HTMLInputElement>) {
	const nextValue = Number(event.target.value);
	return Number.isFinite(nextValue) ? nextValue : 0;
}

export function CurrencyInput({
	id,
	label,
	value,
	eyebrow,
	min = 0,
	step = 50,
	helpText,
	onChange
}: CurrencyInputProps) {
	return (
		<label
			className="grid gap-3 rounded-[1.5rem] border border-gray-200 bg-white p-4 transition hover:border-slate-700/90"
			htmlFor={id}
		>
			<div className="flex items-center justify-between gap-4">
				<div>
					{eyebrow ? (
						<p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[#8C8C8C]">
							{eyebrow}
						</p>
					) : null}
					<span className="mt-1 block text-sm font-semibold tracking-wide text-[#1A1A1A]">{label}</span>
				</div>
				<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-[0.64rem] uppercase tracking-[0.22em] #8C8C8C">
					USD
				</span>
			</div>
			<div className="relative">
				<span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#8C8C8C]">
					$
				</span>
				<input
					id={id}
					type="number"
					inputMode="decimal"
					min={min}
					step={step}
					value={value}
					onChange={(event) => onChange(parseNumberInput(event))}
					className="w-full rounded-xl border border-gray-200 bg-white px-10 py-3.5 text-base font-bold text-[#1A1A1A] outline-none transition focus:border-[#5A7A8F]"
				/>
			</div>
			<p className="text-sm leading-6 text-[#5E5E5E]">{helpText}</p>
		</label>
	);
}
