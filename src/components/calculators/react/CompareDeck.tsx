import React, { useState } from 'react';

export interface CompareItem {
	code: string;
	title: string;
	salary: number;
	risk_score: number;
	demand: string;
}

interface Props {
	items: CompareItem[];
	onRemove: (code: string) => void;
	onClear: () => void;
}

export default function CompareDeck({ items, onRemove, onClear }: Props) {
	const [isOpen, setIsOpen] = useState(false);

	if (items.length === 0) return null;

	const formatUSD = (val: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(val);
	};

	return (
		<>
			{/* Floating Compare Tray */}
			<div className="fixed bottom-6 left-1/2 z-40 w-[90%] max-w-2xl -translate-x-1/2 rounded-2xl border border-cyan-500/20 bg-slate-900/90 p-4 shadow-[0_10px_50px_rgba(6,182,212,0.15)] backdrop-blur-lg sm:w-full">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-slate-950">
							{items.length}
						</span>
						<p className="text-sm font-semibold text-white">Compare Deck</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						{items.map((item) => (
							<div
								key={item.code}
								className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
							>
								<span className="truncate max-w-[120px] font-medium">{item.title}</span>
								<button
									onClick={() => onRemove(item.code)}
									className="text-slate-400 hover:text-red-400 font-bold ml-1 cursor-pointer"
								>
									×
								</button>
							</div>
						))}
					</div>

					<div className="flex gap-2">
						<button
							onClick={onClear}
							className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
						>
							Clear
						</button>
						<button
							onClick={() => setIsOpen(true)}
							className="rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/10 hover:bg-cyan-400 transition"
						>
							Compare
						</button>
					</div>
				</div>
			</div>

			{/* Comparison Modal Overlay */}
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
					<div className="w-full max-w-4xl rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl backdrop-blur-xl md:p-8">
						<div className="flex items-center justify-between border-b border-white/5 pb-4">
							<h3 className="text-2xl font-bold tracking-tight text-white">Career AI Comparison Deck</h3>
							<button
								onClick={() => setIsOpen(false)}
								className="rounded-full bg-white/5 p-2 text-slate-400 hover:text-white transition cursor-pointer"
							>
								<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						<div className="mt-8 grid gap-6 md:grid-cols-3">
							{items.map((item) => (
								<div
									key={item.code}
									className="rounded-2xl border border-white/5 bg-slate-950/50 p-6 relative flex flex-col justify-between"
								>
									<button
										onClick={() => onRemove(item.code)}
										className="absolute top-4 right-4 text-slate-500 hover:text-red-400 text-lg cursor-pointer"
									>
										×
									</button>

									<div>
										<h4 className="text-lg font-bold text-white line-clamp-1 pr-6">{item.title}</h4>
										<p className="mt-1 text-xs font-mono text-slate-500">{item.code}</p>

										<div className="mt-6 space-y-4">
											<div>
												<p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">AI Vulnerability</p>
												<p className={`text-2xl font-bold mt-1 ${item.risk_score > 60 ? 'text-red-400' : item.risk_score > 35 ? 'text-yellow-400' : 'text-emerald-400'}`}>
													{item.risk_score}%
												</p>
											</div>

											<div>
												<p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Median Salary</p>
												<p className="text-xl font-bold text-white mt-1">
													{formatUSD(item.salary)}
												</p>
											</div>

											<div>
												<p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Growth Projection</p>
												<span className={`inline-block text-xs font-bold rounded-full mt-1.5 px-2.5 py-0.5 ${item.demand === 'High' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
													{item.demand} Demand
												</span>
											</div>
										</div>
									</div>

									<a
										href={`/calculators/career-ai-resilience/?code=${item.code}`}
										onClick={() => setIsOpen(false)}
										className="mt-6 block w-full text-center rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
									>
										Load in Simulator
									</a>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
}
