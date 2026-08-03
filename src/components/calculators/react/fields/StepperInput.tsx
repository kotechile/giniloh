interface StepperInputProps {
	id: string;
	label: string;
	value: number;
	eyebrow?: string;
	min?: number;
	max?: number;
	step?: number;
	helpText: string;
	suffix?: string;
	onChange: (value: number) => void;
}

function clampValue(value: number, min: number, max?: number) {
	if (!Number.isFinite(value)) {
		return min;
	}

	if (typeof max === 'number') {
		return Math.min(Math.max(value, min), max);
	}

	return Math.max(value, min);
}

export function StepperInput({
	id,
	label,
	value,
	eyebrow,
	min = 0,
	max,
	step = 1,
	helpText,
	suffix,
	onChange
}: StepperInputProps) {
	const updateValue = (nextValue: number) => onChange(clampValue(nextValue, min, max));

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
				{suffix ? (
					<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-[0.64rem] uppercase tracking-[0.22em] #8C8C8C">
						{suffix}
					</span>
				) : null}
			</div>
			<div className="flex items-center rounded-xl border border-gray-200 bg-white">
				<button
					type="button"
					onClick={() => updateValue(value - step)}
					className="inline-flex h-14 w-14 items-center justify-center rounded-l-[1.1rem] border-r border-gray-200 text-xl text-[#1A1A1A] transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5A7A8F]/30"
					aria-label={`Decrease ${label}`}
				>
					−
				</button>
				<input
					id={id}
					type="number"
					inputMode="numeric"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={(event) => updateValue(Number(event.target.value))}
					className="h-14 w-full bg-transparent px-4 text-center text-base font-semibold text-[#1A1A1A] outline-none"
				/>
				<button
					type="button"
					onClick={() => updateValue(value + step)}
					className="inline-flex h-14 w-14 items-center justify-center rounded-r-[1.1rem] border-l border-gray-200 text-xl text-[#1A1A1A] transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5A7A8F]/30"
					aria-label={`Increase ${label}`}
				>
					+
				</button>
			</div>
			<p className="text-sm leading-6 text-[#5E5E5E]">{helpText}</p>
		</label>
	);
}
