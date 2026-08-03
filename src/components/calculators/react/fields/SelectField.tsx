import type { LeasePenaltyMethod } from '../../../../lib/calculators/types';

interface SelectFieldProps {
	id: string;
	label: string;
	eyebrow?: string;
	value: LeasePenaltyMethod;
	helpText: string;
	onChange: (value: LeasePenaltyMethod) => void;
}

const OPTIONS: Array<{ value: LeasePenaltyMethod; label: string }> = [
	{ value: 'months', label: 'Months of rent (e.g. 2 months penalty)' },
	{ value: 'fixed', label: 'Fixed buyout fee (flat rate)' },
	{ value: 'percentage', label: 'Percentage of remaining lease value' },
	{ value: 'remaining', label: 'Pay out remainder of lease (no buyout)' }
];

export function SelectField({ id, label, eyebrow, value, helpText, onChange }: SelectFieldProps) {
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
					Contract type
				</span>
			</div>
			<select
				id={id}
				value={value}
				onChange={(event) => onChange(event.target.value as LeasePenaltyMethod)}
				className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-base text-[#1A1A1A] outline-none transition focus:border-[#5A7A8F]"
			>
				{OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<p className="text-sm leading-6 text-[#5E5E5E]">{helpText}</p>
		</label>
	);
}
