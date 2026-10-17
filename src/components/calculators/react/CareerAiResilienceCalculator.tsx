import React, { useState, useEffect, useRef, useMemo } from 'react';
import CompareDeck, { type CompareItem } from './CompareDeck';

interface CategoryDistribution {
	high: number;
	medium: number;
	low: number;
}

/**
 * What the index is made of. `automation` is the headline number; the shares are reported
 * dimensions that are never folded into it (see docs/career-radar-v2.md).
 */
interface Exposure {
	automation: number;
	physical_share: number;
	judgment_share: number;
	routine_share: number;
	emerging_revised_share: number | null;
	emerging_added_tasks: number;
	consequence_of_error: number | null;
	dwas_covered: number;
	tasks_scored: number;
	tasks_total: number;
}

interface Dwa {
	id: string;
	name: string;
	gwa: string;
	gwa_name: string;
	importance: number | null;
	level: number | null;
}

interface OccupationIndexItem {
	code: string;
	title: string;
	description: string;
	risk_score: number;
	tasks_count: number;
	salary: number | null;
	/** BLS OEWS employment size band. Was `demand` in v1, which mislabelled employment as growth. */
	employment_band: string;
	employment: number | null;
	/** BLS Employment Projections 2025-2035; null when BLS has no matching code. */
	projection?: { change_percent: number | null; annual_openings: number | null; source: string; code: string } | null;
	salary_source?: string;
	exposure?: Exposure;
	category_distribution: CategoryDistribution;
	/** Share of task weight per bucket — reproduces risk_score at the simulator's starting point. */
	weighted_distribution?: CategoryDistribution;
}

interface Task {
	id: string;
	text: string;
	type: string;
	risk: 'high' | 'medium' | 'low' | null;
	score: number | null;
	weight: number | null;
	rationale: string;
	dwas?: Dwa[];
	emerging?: { task: string; category: string; date: string; domain_source: string } | null;
}

interface OccupationDetail {
	code: string;
	title: string;
	description: string;
	risk_score: number;
	salary: number | null;
	employment_band: string;
	employment: number | null;
	salary_source?: string;
	/** BLS OEWS state medians; null when OEWS has no state detail for this code. */
	state_wages?: { source: string; code: string; states: Record<string, number> } | null;
	/** Release the salary figures came from, e.g. "BLS OEWS, May 2025". */
	salary_vintage?: string;
	exposure?: Exposure;
	weighted_distribution?: CategoryDistribution;
	emerging_tasks?: { task: string; category: string; date: string; domain_source: string; original_task: string | null }[];
	tasks: Task[];
}

/**
 * The bucket split the simulator starts from — and returns to on reset.
 *
 * `weighted_distribution` is the share of task weight per bucket as published by the build.
 * Starting from it makes the gauge at rest equal the occupation's risk score; v1 derived the
 * split from task counts, so the simulator opened on a different number than the card.
 */
function publishedWeights(data: OccupationDetail) {
	const dist = data.weighted_distribution;
	if (dist) return { high: dist.high, medium: dist.medium, low: dist.low };

	const tasks = data.tasks ?? [];
	const total = tasks.length || 1;
	const highCount = tasks.filter((t) => t.risk === 'high').length;
	const mediumCount = tasks.filter((t) => t.risk === 'medium').length;
	const hPct = Math.round((highCount / total) * 100);
	const mPct = Math.round((mediumCount / total) * 100);
	return { high: hPct, medium: mPct, low: 100 - hPct - mPct };
}

export default function CareerAiResilienceCalculator() {
	// Active View: 'profile' (details/simulator), 'finder' (filter/table), or 'explorer' (scatter plot)
	const [activeView, setActiveView] = useState<'profile' | 'finder' | 'explorer'>('profile');

	// Interactive Finder states
	const [finderSearchQuery, setFinderSearchQuery] = useState('');
	const [minVulnerability, setMinVulnerability] = useState<number>(0);
	const [maxVulnerability, setMaxVulnerability] = useState<number>(100);
	const [minSalaryFilter, setMinSalaryFilter] = useState<number>(0);
	const [employmentFilter, setEmploymentFilter] = useState<string>('all');
	const [sortField, setSortField] = useState<'title' | 'risk_score' | 'salary' | 'employment_band'>('risk_score');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const itemsPerPage = 15;

	// Database index & search states
	const [indexData, setIndexData] = useState<OccupationIndexItem[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [loadingIndex, setLoadingIndex] = useState(true);

	// Selected occupation states
	const [selectedCode, setSelectedCode] = useState('11-1011.00'); // Default: Chief Executives
	const [careerDetail, setCareerDetail] = useState<OccupationDetail | null>(null);
	const [loadingDetail, setLoadingDetail] = useState(false);

	// Simulator weighting states
	const [weights, setWeights] = useState({ high: 33, medium: 33, low: 34 });
	const [isCustomized, setIsCustomized] = useState(false);

	// Active task category filter in profile view ('all' | 'high' | 'medium' | 'low')
	const [taskFilter, setTaskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

	// The reader's own state, kept across occupations — it is a fact about them, not about the job.
	const [statePick, setStatePick] = useState('');
	
	// Hover states for donut chart
	const [hoveredDonutSlice, setHoveredDonutSlice] = useState<'high' | 'medium' | 'low' | null>(null);

	// Explorer scatter plot states
	const [searchQueryExplorer, setSearchQueryExplorer] = useState('');
	const [hoveredScatterCareer, setHoveredScatterCareer] = useState<OccupationIndexItem | null>(null);
	const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, isRightHalf: false });
	const scatterContainerRef = useRef<HTMLDivElement>(null);
	const [scatterDimensions, setScatterDimensions] = useState({ width: 800, height: 400 });

	const suggestionsRef = useRef<HTMLDivElement>(null);

	// Fetch index database on load
	useEffect(() => {
		async function fetchIndex() {
			try {
				const res = await fetch('/data/careers/index.json');
				const data = await res.json();
				setIndexData(data);
			} catch (e) {
				console.error('Failed to load careers database index:', e);
			} finally {
				setLoadingIndex(false);
			}
		}
		fetchIndex();
	}, []);

	// Fetch selected career detail dynamically
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const codeParam = params.get('code');
			if (codeParam) {
				setSelectedCode(codeParam);
				setActiveView('profile');
			}
		}
	}, []);

	// Compare Deck states
	const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

	const handleAddToCompare = (item: OccupationIndexItem) => {
		if (compareItems.some((c) => c.code === item.code)) return;
		if (compareItems.length >= 3) {
			alert("You can compare up to 3 occupations at a time.");
			return;
		}
		setCompareItems([...compareItems, item]);
	};

	const handleRemoveFromCompare = (code: string) => {
		setCompareItems(compareItems.filter((item) => item.code !== code));
	};

	const handleClearCompare = () => {
		setCompareItems([]);
	};

	// Fetch selected career detail dynamically
	useEffect(() => {
		if (!selectedCode) return;

		async function fetchDetail() {
			setLoadingDetail(true);
			try {
				const res = await fetch(`/data/careers/${selectedCode}.json`);
				const data: OccupationDetail = await res.json();
				setCareerDetail(data);

				// Start from the published weighted split, so the gauge at rest equals risk_score.
				setWeights(publishedWeights(data));
				setIsCustomized(false);
				setTaskFilter('all');
			} catch (e) {
				console.error(`Failed to load details for ${selectedCode}:`, e);
			} finally {
				setLoadingDetail(false);
			}
		}
		fetchDetail();
	}, [selectedCode]);

	// Auto-resize for scatter plot SVG
	useEffect(() => {
		if (activeView === 'explorer' && scatterContainerRef.current) {
			const observer = new ResizeObserver((entries) => {
				for (let entry of entries) {
					const { width } = entry.contentRect;
					setScatterDimensions((prev) => ({
						...prev,
						width: Math.max(320, Math.floor(width * 0.95))
					}));
				}
			});
			observer.observe(scatterContainerRef.current);
			return () => observer.disconnect();
		}
	}, [activeView]);

	// Close suggestions dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
				setShowSuggestions(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Search suggestions filter
	const suggestions = useMemo(() => {
		if (!searchQuery.trim()) return [];
		const q = searchQuery.toLowerCase();
		return indexData
			.filter((item) => item.title.toLowerCase().includes(q) || item.code.includes(q))
			.slice(0, 8);
	}, [searchQuery, indexData]);

	// Handle slider adjustment
	const handleSliderChange = (category: 'high' | 'medium' | 'low', val: number) => {
		setIsCustomized(true);
		const oldValue = weights[category];
		const diff = val - oldValue;

		const otherCategories = (['high', 'medium', 'low'] as const).filter((c) => c !== category);
		const sumOthers = otherCategories.reduce((sum, c) => sum + weights[c], 0);

		let newWeights = { ...weights };
		newWeights[category] = val;

		if (sumOthers > 0) {
			otherCategories.forEach((c) => {
				newWeights[c] = Math.max(0, weights[c] - diff * (weights[c] / sumOthers));
			});
		} else {
			const remaining = 100 - val;
			otherCategories.forEach((c) => {
				newWeights[c] = remaining / 2;
			});
		}

		// Re-normalize to ensure they sum to exactly 100
		const total = newWeights.high + newWeights.medium + newWeights.low;
		if (total > 0) {
			newWeights.high = Math.round((newWeights.high / total) * 100);
			newWeights.medium = Math.round((newWeights.medium / total) * 100);
			newWeights.low = 100 - newWeights.high - newWeights.medium;
		}

		setWeights(newWeights);
	};

	// Reset weight adjustments
	const handleResetWeights = () => {
		if (!careerDetail) return;
		setWeights(publishedWeights(careerDetail));
		setIsCustomized(false);
	};

	// Mean task score inside each bucket, weighted the way the build weighted it. The simulator
	// then reports the same quantity the published index does: a weighted mean, not "high + half
	// of medium", which understated every high-exposure task between 0.60 and 1.00.
	const bucketMeans = useMemo(() => {
		const acc = { high: [0, 0], medium: [0, 0], low: [0, 0] } as Record<'high' | 'medium' | 'low', [number, number]>;
		for (const task of careerDetail?.tasks ?? []) {
			if (task.score === null || !task.risk) continue;
			const weight = task.weight ?? 1;
			acc[task.risk][0] += weight * task.score;
			acc[task.risk][1] += weight;
		}
		const mean = (pair: [number, number]) => (pair[1] > 0 ? pair[0] / pair[1] : 0);
		return { high: mean(acc.high), medium: mean(acc.medium), low: mean(acc.low) };
	}, [careerDetail]);

	const overallScore = useMemo(() => {
		const total = weights.high + weights.medium + weights.low || 100;
		const blended = (weights.high * bucketMeans.high + weights.medium * bucketMeans.medium + weights.low * bucketMeans.low) / total;
		return Math.round(blended * 100);
	}, [weights, bucketMeans]);

	/**
	 * Plain-language names for the three buckets. Every surface that used to say "high / medium /
	 * low risk" now says what the work actually is — the label is the only thing a first-time
	 * visitor has to go on, and "high exposure (≥60% of the task is automatable)" is not a label.
	 */
	const bucketLabel: Record<'high' | 'medium' | 'low', string> = {
		high: 'AI does it today',
		medium: 'AI drafts it, you decide',
		low: 'Needs a person'
	};

	const bucketSentence: Record<'high' | 'medium' | 'low', string> = {
		high: 'is repetitive work AI already does',
		medium: 'is work AI can draft — but a person still checks and decides',
		low: 'still needs someone in the room'
	};

	/** The published score for the job as it stands today; the sliders move away from it. */
	const baselineScore = Math.round(careerDetail?.risk_score ?? overallScore);
	const scoreDelta = overallScore - baselineScore;

	// Filtered tasks in detailed view
	const filteredTasks = useMemo(() => {
		if (!careerDetail) return [];
		if (taskFilter === 'all') return careerDetail.tasks;
		return careerDetail.tasks.filter((t) => t.risk === taskFilter);
	}, [careerDetail, taskFilter]);

	// Format currency utility. A null salary means BLS published no wage for the occupation;
	// it is stated, not replaced with a number.
	const formatUSD = (val: number | null) => {
		if (val === null) return 'Not reported';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(val);
	};

	// Donut slicing helper
	const drawSlicePath = (startPercent: number, endPercent: number, radius: number) => {
		if (endPercent - startPercent >= 0.9999) {
			return `M 0 -${radius} A ${radius} ${radius} 0 1 1 -0.01 -${radius} Z`;
		}
		const [startX, startY] = [
			radius * Math.sin(2 * Math.PI * startPercent),
			-radius * Math.cos(2 * Math.PI * startPercent)
		];
		const [endX, endY] = [
			radius * Math.sin(2 * Math.PI * endPercent),
			-radius * Math.cos(2 * Math.PI * endPercent)
		];
		const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
		return `M 0 0 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
	};

	const donutSlices = useMemo(() => {
		const total = weights.high + weights.medium + weights.low || 1;
		const highPct = weights.high / total;
		const medPct = weights.medium / total;

		let accum = 0;
		const slices = [
			{ category: 'high' as const, start: accum, end: accum + highPct, color: '#A55252', glowColor: 'rgba(184,92,92,0.4)' },
			{ category: 'medium' as const, start: accum + highPct, end: accum + highPct + medPct, color: '#96693A', glowColor: 'rgba(200,141,78,0.4)' },
			{ category: 'low' as const, start: accum + highPct + medPct, end: 1.0, color: '#5A7A8F', glowColor: 'rgba(90,122,143,0.4)' }
		];
		return slices.filter(s => s.end > s.start);
	}, [weights]);

	// Scatter Plot dimensions and mapping parameters
	const scatterMargin = { top: 20, right: 30, bottom: 50, left: 85 };
	const scatterPlotWidth = scatterDimensions.width - scatterMargin.left - scatterMargin.right;
	const scatterPlotHeight = scatterDimensions.height - scatterMargin.top - scatterMargin.bottom;

	// Scale bounds.
	// The x axis used to stop at $160k, so every occupation above that was clamped onto the
	// right-hand edge — a stack of dots that looked like one bucket of identical jobs instead of
	// the high earners they are. $300k covers the top of the OEWS distribution.
	const salaryMin = 20000;
	const salaryMax = 300000;
	const riskMin = 0;
	const riskMax = 100;

	const mapSalaryToX = (salary: number | null) => {
		const clamped = Math.max(salaryMin, Math.min(salaryMax, salary ?? salaryMin));
		return scatterMargin.left + ((clamped - salaryMin) / (salaryMax - salaryMin)) * scatterPlotWidth;
	};

	const mapRiskToY = (risk: number | null) => {
		const clamped = Math.max(riskMin, Math.min(riskMax, risk ?? riskMin));
		// Invert Y so that 100 is at top, 0 at bottom
		return scatterMargin.top + (1 - (clamped - riskMin) / (riskMax - riskMin)) * scatterPlotHeight;
	};

	// Filtered careers inside Explorer scatter plot. Occupations with no O*NET task inventory
	// have a null score and cannot be placed on the axis — they are not plotted as zero risk.
	const filteredExplorerCareers = useMemo(() => {
		const plottable = indexData.filter((item) => item.risk_score !== null);
		if (!searchQueryExplorer.trim()) return plottable;
		const q = searchQueryExplorer.toLowerCase();
		return plottable.filter((item) =>
			item.title.toLowerCase().includes(q) || item.code.includes(q)
		);
	}, [searchQueryExplorer, indexData]);

	const handleScatterMouseMove = (e: React.MouseEvent<any>, item: OccupationIndexItem) => {
		if (!scatterContainerRef.current) return;
		const rect = scatterContainerRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top - 10;
		const isRightHalf = x > rect.width * 0.6;
		setTooltipPos({ x, y, isRightHalf });
		setHoveredScatterCareer(item);
	};

	// Selection shortcut from scatter plot
	const handleSelectFromExplorer = (code: string) => {
		setSelectedCode(code);
		const selected = indexData.find(item => item.code === code);
		if (selected) {
			setSearchQuery(selected.title);
		}
		setActiveView('profile');
		window.scrollTo({ top: 180, behavior: 'smooth' });
	};

	// Filtered list of occupations for the Career Finder tab
	const filteredFinderCareers = useMemo(() => {
		let list = [...indexData];

		if (finderSearchQuery.trim()) {
			const q = finderSearchQuery.toLowerCase();
			list = list.filter(item => item.title.toLowerCase().includes(q) || item.code.includes(q));
		}

		list = list.filter(item => item.risk_score !== null);
		list = list.filter(item => item.risk_score >= minVulnerability && item.risk_score <= maxVulnerability);

		if (minSalaryFilter > 0) {
			list = list.filter(item => item.salary !== null && item.salary >= minSalaryFilter);
		}

		if (employmentFilter !== 'all') {
			list = list.filter(item => item.employment_band === employmentFilter);
		}

		// Sorting
		list.sort((a, b) => {
			let valA = a[sortField];
			let valB = b[sortField];

			if (typeof valA === 'string' && typeof valB === 'string') {
				const cmp = valA.localeCompare(valB);
				return sortDirection === 'asc' ? cmp : -cmp;
			}

			// Numbers
			const numA = Number(valA);
			const numB = Number(valB);
			if (numA < numB) return sortDirection === 'asc' ? -1 : 1;
			if (numA > numB) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});

		return list;
	}, [indexData, finderSearchQuery, minVulnerability, maxVulnerability, minSalaryFilter, employmentFilter, sortField, sortDirection]);

	const totalPages = Math.ceil(filteredFinderCareers.length / itemsPerPage) || 1;
	const paginatedFinderCareers = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredFinderCareers.slice(start, start + itemsPerPage);
	}, [filteredFinderCareers, currentPage]);

	// Reset page on filter adjustment
	useEffect(() => {
		setCurrentPage(1);
	}, [finderSearchQuery, minVulnerability, maxVulnerability, minSalaryFilter, employmentFilter, sortField, sortDirection]);

	// BLS OEWS state medians for the open occupation, highest first. Same rule as the static
	// occupation pages: below five published states there is no block to show.
	const stateWageEntries = careerDetail?.state_wages
		? Object.entries(careerDetail.state_wages.states).sort((a, b) => b[1] - a[1])
		: [];
	const stateWageNames = careerDetail?.state_wages
		? Object.keys(careerDetail.state_wages.states).sort((a, b) => a.localeCompare(b))
		: [];
	const pickedStatePay = stateWageEntries.find(([name]) => name === statePick)?.[1] ?? null;
	const pickedStateRank = stateWageEntries.findIndex(([name]) => name === statePick) + 1;

	return (
		<div className="w-full text-[#5E5E5E] font-sans">
			{/* Mode Select Header */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
				<div role="tablist" aria-label="Calculator views" className="flex gap-6 border-b border-gray-200 mb-4 sm:mb-0 overflow-x-auto">
					{([
						{ id: 'profile' as const, label: 'My job' },
						{ id: 'finder' as const, label: 'Find a job' },
						{ id: 'explorer' as const, label: 'The career map' }
					]).map((tab) => (
						<button
							key={tab.id}
							role="tab"
							id={`tab-${tab.id}`}
							aria-selected={activeView === tab.id}
							aria-controls={`panel-${tab.id}`}
							onClick={() => setActiveView(tab.id)}
							className={`min-h-[44px] whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2 ${
								activeView === tab.id
									? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
									: 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Search bar inside header when in Explorer Mode */}
				{activeView === 'explorer' && (
					<div className="relative flex-1 max-w-md">
						<div className="relative">
							<input
								type="text"
								placeholder="Search careers in cluster map..."
								value={searchQueryExplorer}
								onChange={(e) => setSearchQueryExplorer(e.target.value)}
								className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-[#1A1A1A] placeholder-[#6B6B6B] outline-none transition focus:border-[#1A1A1A]"
							/>
							<svg
								className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
					</div>
				)}
			</div>

			{/* ==================== VIEW 1: CAREER PROFILE & SIMULATOR ==================== */}
			{activeView === 'profile' && (
				<div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" className="grid gap-12">
					{/* Search & Selector */}
					<div className="relative py-2">
						<label htmlFor="career-search" className="block font-mono text-xs uppercase tracking-[0.25em] text-[#6B6B6B] font-bold mb-3">
							Your job title
						</label>
						<div ref={suggestionsRef} className="relative">
							<div className="relative">
								<input
									id="career-search"
									type="text"
									role="combobox"
									aria-expanded={showSuggestions && suggestions.length > 0}
									aria-controls="career-suggestions"
									aria-autocomplete="list"
									placeholder="Type a job title — registered nurse, accountant, truck driver"
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setShowSuggestions(true);
									}}
									onFocus={() => setShowSuggestions(true)}
									className="w-full rounded-xl border border-gray-300 bg-white py-4 pl-12 pr-10 text-base font-medium text-[#1A1A1A] outline-none transition focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]"
								/>
								<svg
									className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
								{searchQuery && (
									<button
										onClick={() => {
											setSearchQuery('');
											setShowSuggestions(false);
										}}
										className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-gray-600"
										aria-label="Clear search"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								)}
							</div>

							{showSuggestions && suggestions.length > 0 && (
								<div
									id="career-suggestions"
									role="listbox"
									aria-label="Matching job titles"
									className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl"
								>
									{suggestions.map((item) => (
										<button
											key={item.code}
											role="option"
											aria-selected={selectedCode === item.code}
											onClick={() => {
												setSelectedCode(item.code);
												setSearchQuery(item.title);
												setShowSuggestions(false);
											}}
											className="flex w-full flex-col px-4 py-3 text-left transition hover:bg-gray-50 border-b border-gray-100 last:border-0"
										>
											<span className="text-sm font-semibold text-[#1A1A1A]">{item.title}</span>
											<span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[#6B6B6B]">
												{formatUSD(item.salary)} median · {item.risk_score}/100 exposure
											</span>
										</button>
									))}
								</div>
							)}
							{showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
								<div className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center text-xs font-mono text-[#6B6B6B] shadow-2xl">
									No match. Try a shorter phrase — job titles only.
								</div>
							)}
						</div>

						{/* Popular quick selectors */}
						<div className="mt-4 flex flex-wrap items-center gap-3">
							<span className="font-mono text-xs uppercase tracking-[0.2em] text-[#6B6B6B] font-bold">Popular:</span>
							{[
								{ title: 'Chief Executives', code: '11-1011.00' },
								{ title: 'Software Developers', code: '15-1252.00' },
								{ title: 'Financial Managers', code: '11-3031.00' },
								{ title: 'Accountants & Auditors', code: '13-2011.00' },
								{ title: 'Registered Nurses', code: '29-1141.00' }
							].map((trend) => (
								<button
									key={trend.code}
									onClick={() => {
										setSelectedCode(trend.code);
										setSearchQuery(trend.title);
										setShowSuggestions(false);
									}}
									className={`rounded-full border px-3 py-1 text-xs font-medium transition duration-200 ${
										selectedCode === trend.code
											? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
											: 'border-gray-300 bg-white text-[#5E5E5E] hover:border-gray-400 hover:text-[#1A1A1A]'
									}`}
								>
									{trend.title}
								</button>
							))}
						</div>
					</div>

					{/* Loading Detail Overlay */}
					{loadingDetail && (
						<div className="flex h-96 items-center justify-center py-12">
							<div className="flex flex-col items-center gap-3">
								<div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-transparent"></div>
								<span className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest animate-pulse">Assembling Career Profile...</span>
							</div>
						</div>
					)}

					{/* Main Detail Dashboard Grid */}
					{!loadingDetail && careerDetail && (
						<div className="grid gap-12 lg:grid-cols-12 items-start">
							
							{/* LEFT SIDE: General overview, Risk gauge & Donut mix (7 columns) */}
							<div className="lg:col-span-7 grid gap-10">
								
								{/* Core Overview Section */}
								<div className="py-2">
									<div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 border-b border-gray-200 pb-6 mb-6">
										<div>
											<span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#6B6B6B]">
												Job profile
											</span>
											<h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1A1A1A] mt-2">{careerDetail.title}</h2>
										</div>
										<div className="flex flex-row md:flex-col items-baseline md:items-end justify-between gap-1">
											<p className="font-mono text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">Median pay</p>
											<p className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A]">{formatUSD(careerDetail.salary)}</p>
										</div>
									</div>
									<p className="text-base sm:text-lg leading-relaxed text-[#5E5E5E] font-normal">{careerDetail.description}</p>

									{/* The answer, in one sentence. Everything else on the page explains this. */}
									{careerDetail.tasks.length > 0 && (
										<div className="mt-6 rounded-2xl border border-gray-200 bg-[#FBFBFB] p-5">
											<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6B6B6B]">
												As the job stands today
											</p>
											<p className="mt-2.5 text-base sm:text-lg leading-relaxed text-[#1A1A1A]">
												{(['high', 'medium', 'low'] as const).map((key) => (
													<span key={key}>
														<strong
															className="font-bold"
															style={{ color: key === 'high' ? '#A55252' : key === 'medium' ? '#96693A' : '#5A7A8F' }}
														>
															{weights[key]}%
														</strong>{' '}
														{bucketSentence[key]}.{' '}
													</span>
												))}
											</p>
										</div>
									)}
								</div>

								{/* The Dashboard Charts Section */}
								<div className="grid gap-8 md:grid-cols-2">
									
									{/* Score Gauge */}
									<div className="flex flex-col items-center justify-between py-2 text-center">
										<div>
											<p className="font-mono text-xs uppercase tracking-[0.24em] text-[#6B6B6B] font-bold">How exposed this job is to AI</p>
											<p className="mt-1.5 text-sm text-[#5E5E5E] leading-relaxed max-w-[240px] mx-auto">
												Out of 100. Higher means more of the work is something software can already attempt.
											</p>
										</div>

										{/* Radial Gauge SVG */}
										<div
											className="relative h-48 w-48 my-6 flex items-center justify-center"
											role="img"
											aria-label={`AI exposure ${overallScore} out of 100`}
										>
											<svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
												{/* Background track circle */}
												<circle
													cx="60"
													cy="60"
													r="50"
													fill="transparent"
													stroke="#E5E5E5"
													strokeWidth="6"
												/>
												{/* Foreground gauge circle */}
												<circle
													cx="60"
													cy="60"
													r="50"
													fill="transparent"
													stroke={overallScore > 65 ? '#A55252' : overallScore > 35 ? '#96693A' : '#5A7A8F'}
													strokeWidth="7"
													strokeDasharray="314.159"
													strokeDashoffset={314.159 - (overallScore / 100) * 314.159}
													strokeLinecap="round"
													style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.5s ease-out' }}
												/>
											</svg>
											{/* Center Text overlay */}
											<div className="absolute inset-0 flex flex-col items-center justify-center">
												<span className="text-5xl font-black text-[#1A1A1A] tracking-tight">{overallScore}</span>
												<span className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] font-bold mt-1">out of 100</span>
											</div>
											</div>

											<div className="flex flex-wrap items-center justify-center gap-2">
											<div className={`rounded-full px-5 py-1.5 font-mono text-xs uppercase tracking-wider font-bold ${
												overallScore > 65
													? 'text-[#A55252] bg-[#A55252]/10'
													: overallScore > 35
														? 'text-[#96693A] bg-[#96693A]/10'
														: 'text-[#4B6478] bg-[#5A7A8F]/10'
											}`}>
												{overallScore > 65 ? 'High exposure' : overallScore > 35 ? 'Mixed exposure' : 'Low exposure'}
											</div>
											{isCustomized && scoreDelta !== 0 && (
												<span className={`rounded-full px-3 py-1.5 font-mono text-xs font-bold ${
													scoreDelta < 0 ? 'bg-[#2E6F40]/10 text-[#2E6F40]' : 'bg-[#A55252]/10 text-[#A55252]'
												}`}>
													{scoreDelta < 0 ? '−' : '+'}{Math.abs(scoreDelta)} vs. today
												</span>
											)}
											</div>
											</div>

									{/* Donut Task Mix */}
									<div className="flex flex-col items-center justify-between py-2 text-center">
										<div>
											<p className="font-mono text-xs uppercase tracking-[0.24em] text-[#6B6B6B] font-bold">What the job is made of</p>
											<p className="mt-1.5 text-sm text-[#5E5E5E] leading-relaxed max-w-[240px] mx-auto">
												Tap a slice to see just those tasks.
											</p>
										</div>

										{/* Donut Chart SVG */}
										<div className="relative h-48 w-48 my-6 flex items-center justify-center">
											<svg className="w-full h-full transform -rotate-90" viewBox="-120 -120 240 240">
												{donutSlices.map((slice) => {
													const isHovered = hoveredDonutSlice === slice.category;
													return (
														<g
															key={slice.category}
															role="button"
															tabIndex={0}
															aria-label={`${bucketLabel[slice.category]}: ${weights[slice.category]}% of the job. Show those tasks.`}
															onMouseEnter={() => setHoveredDonutSlice(slice.category)}
															onMouseLeave={() => setHoveredDonutSlice(null)}
															onFocus={() => setHoveredDonutSlice(slice.category)}
															onBlur={() => setHoveredDonutSlice(null)}
															onClick={() => setTaskFilter(slice.category)}
															onKeyDown={(e) => {
																if (e.key === 'Enter' || e.key === ' ') {
																	e.preventDefault();
																	setTaskFilter(slice.category);
																}
															}}
															className="cursor-pointer transition-all duration-300 focus-visible:outline-none"
														>
															<path
																d={drawSlicePath(slice.start, slice.end, isHovered ? 108 : 98)}
																fill={slice.color}
																stroke="#FFFFFF"
																strokeWidth="2.5"
																opacity={hoveredDonutSlice ? (isHovered ? 1.0 : 0.4) : 0.95}
																style={{ transition: 'all 0.3s ease-out' }}
																filter={isHovered ? `drop-shadow(0 0 6px ${slice.color})` : undefined}
															/>
														</g>
													);
												})}
												{/* Central inner hole circle */}
												<circle cx="0" cy="0" r="58" fill="#FFFFFF" />
											</svg>
											<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
												{hoveredDonutSlice ? (
													<>
														<span className="text-3xl font-extrabold" style={{ color: hoveredDonutSlice === 'high' ? '#A55252' : hoveredDonutSlice === 'medium' ? '#96693A' : '#5A7A8F' }}>
															{weights[hoveredDonutSlice]}%
														</span>
														<span className="mt-1 max-w-[76px] font-mono text-[9px] uppercase leading-4 tracking-wider" style={{ color: '#6B6B6B' }}>{bucketLabel[hoveredDonutSlice]}</span>
													</>
												) : (
													<>
														<span className="text-3xl font-extrabold" style={{ color: '#1A1A1A' }}>
															{careerDetail.tasks.length}
														</span>
														<span className="mt-1 font-mono text-[9px] uppercase tracking-wider" style={{ color: '#6B6B6B' }}>tasks</span>
													</>
												)}
											</div>
										</div>

										{/* Donut Legend */}
										<div className="mt-1 grid w-full gap-1 text-left">
											{(['high', 'medium', 'low'] as const).map((key) => (
												<button
													key={key}
													onClick={() => setTaskFilter(taskFilter === key ? 'all' : key)}
													aria-pressed={taskFilter === key}
													className={`flex min-h-[36px] items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition ${
														taskFilter === key ? 'bg-gray-50' : 'hover:bg-gray-50'
													}`}
												>
													<span className="flex items-center gap-2">
														<span
															className="h-2.5 w-2.5 shrink-0 rounded-full"
															style={{ background: key === 'high' ? '#A55252' : key === 'medium' ? '#96693A' : '#5A7A8F' }}
														></span>
														<span className={`text-[13px] ${taskFilter === key ? 'font-bold text-[#1A1A1A]' : 'text-[#5E5E5E]'}`}>
															{bucketLabel[key]}
														</span>
													</span>
													<span
														className="font-mono text-[13px] font-bold"
														style={{ color: key === 'high' ? '#A55252' : key === 'medium' ? '#96693A' : '#4B6478' }}
													>
														{weights[key]}%
													</span>
												</button>
											))}
										</div>
									</div>

								</div>

							</div>

							{/* RIGHT SIDE: Upskilling Simulator Sliders (5 columns) */}
							<div className="lg:col-span-5 grid gap-10">
								
								<div className="py-2">
									
									<div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-6">
										<div>
											<p className="font-mono text-xs uppercase tracking-[0.25em] text-[#6B6B6B] font-bold">What if</p>
											<h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1A1A1A]">Change your week</h3>
										</div>
										{isCustomized && (
										<button
											onClick={handleResetWeights}
											className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#5E5E5E] hover:text-[#1A1A1A] hover:border-gray-400 transition"
										>
											Reset to today
										</button>
										)}
									</div>

									<p className="text-base leading-relaxed text-[#5E5E5E] mb-8 font-normal">
									Each slider is how much of your week goes to that kind of work. They always add up to 100% — move one and the other two adjust. Drag a bar to see what shifting hours would do to the score.
									</p>

									{/* Sliders Container with generous vertical spacing */}
									<div className="space-y-8">
										
										{/* Slider 1: AI already does it */}
										<div className="py-1">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2.5">
													<span className="h-3 w-3 rounded-full bg-[#A55252]"></span>
													<span className="text-base font-bold text-[#1A1A1A]">Repetitive work AI already does</span>
												</div>
												<span className="font-mono text-base font-black text-[#A55252]">{weights.high}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="100"
												value={weights.high}
												data-tone="high"
												aria-label="Repetitive work AI already does, percent of the week"
												onChange={(e) => handleSliderChange('high', parseInt(e.target.value))}
												className="w-full accent-[#A55252] h-2 rounded-lg bg-[#E5E5E5] outline-none cursor-pointer"
											/>
											<p className="text-xs leading-relaxed text-[#5E5E5E] mt-2">
												Scheduling, typing, transcription, sorting, filling in forms.
											</p>
										</div>

										{/* Slider 2: AI drafts, you decide */}
										<div className="py-1">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2.5">
													<span className="h-3 w-3 rounded-full bg-[#96693A]"></span>
													<span className="text-base font-bold text-[#1A1A1A]">Work AI drafts, you decide</span>
												</div>
												<span className="font-mono text-base font-black text-[#96693A]">{weights.medium}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="100"
												value={weights.medium}
												data-tone="medium"
												aria-label="Work AI drafts and you decide, percent of the week"
												onChange={(e) => handleSliderChange('medium', parseInt(e.target.value))}
												className="w-full accent-[#96693A] h-2 rounded-lg bg-[#E5E5E5] outline-none cursor-pointer"
											/>
											<p className="text-xs leading-relaxed text-[#5E5E5E] mt-2">
												Basic analysis, first drafts, monitoring, routine checks.
											</p>
										</div>

										{/* Slider 3: Needs a person */}
										<div className="py-1">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2.5">
													<span className="h-3 w-3 rounded-full bg-[#5A7A8F]"></span>
													<span className="text-base font-bold text-[#1A1A1A]">Work that still needs a person</span>
												</div>
												<span className="font-mono text-base font-black text-[#4B6478]">{weights.low}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="100"
												value={weights.low}
												data-tone="low"
												aria-label="Work that still needs a person, percent of the week"
												onChange={(e) => handleSliderChange('low', parseInt(e.target.value))}
												className="w-full accent-[#5A7A8F] h-2 rounded-lg bg-[#E5E5E5] outline-none cursor-pointer"
											/>
											<p className="text-xs leading-relaxed text-[#5E5E5E] mt-2">
												Judgement calls, negotiation, leading people, hands-on work.
											</p>
										</div>

									</div>

									{/* Output Result Simulator Verdict Banner */}
									<div className={`mt-8 rounded-xl border p-5 flex items-center justify-between ${
										isCustomized 
											? 'border-gray-300 bg-gray-50 text-[#1A1A1A]'
											: 'border-gray-200 bg-white text-[#5E5E5E]'
									}`}>
										<div>
											<p className="font-mono text-xs uppercase tracking-wider text-[#6B6B6B] font-bold">Your score</p>
											<p className="text-sm font-bold text-[#1A1A1A] mt-1">
												{!isCustomized
													? 'Starting point — the job as it is today'
													: scoreDelta === 0
														? 'Same score — this mix adds up to the same thing'
														: `You moved it ${scoreDelta < 0 ? 'down' : 'up'} ${Math.abs(scoreDelta)} point${Math.abs(scoreDelta) === 1 ? '' : 's'}`}
											</p>
										</div>
										<span className="font-mono text-2xl font-black text-[#1A1A1A]">
											{overallScore}
											<span className="ml-1 text-xs font-bold text-[#6B6B6B]">/100</span>
										</span>
									</div>

								</div>

							</div>

						</div>
					)}

					{/* Pay by state — BLS OEWS state medians, presented as their own estimates */}
					{!loadingDetail && careerDetail?.state_wages && stateWageEntries.length >= 5 && (
						<div className="py-4">
							<div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<h3 className="text-xl font-bold text-[#1A1A1A]">Pay by state</h3>
									<p className="mt-1 max-w-2xl text-xs leading-6 text-[#5E5E5E]">
										BLS publishes {stateWageEntries.length} state estimates for this occupation. Each is its own survey estimate — not the national median adjusted for local prices.
									</p>
								</div>
								<div className="sm:text-right">
									<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">Published range</p>
									<p className="mt-1 font-mono text-xs font-bold text-[#1A1A1A]">
										{formatUSD(stateWageEntries[stateWageEntries.length - 1][1])} – {formatUSD(stateWageEntries[0][1])}
									</p>
								</div>
							</div>

							<div className="grid gap-8 sm:grid-cols-3">
								<div>
									<label htmlFor="state-wage-pick" className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
										Your state
									</label>
									<select
										id="state-wage-pick"
										value={statePick}
										onChange={(e) => setStatePick(e.target.value)}
										className="mt-3 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-medium text-[#1A1A1A]"
									>
										<option value="">Select a state</option>
										{stateWageNames.map((name) => (
											<option key={name} value={name}>{name}</option>
										))}
									</select>
									<p className="mt-3 font-mono text-2xl font-black tracking-tight text-[#1A1A1A]">
										{pickedStatePay !== null ? formatUSD(pickedStatePay) : '—'}
									</p>
									<p className="mt-1 text-[11px] leading-5 text-[#6B6B6B]">
										{statePick === ''
											? 'Pick your state to see its median and where it ranks.'
											: pickedStatePay !== null
												? `Rank ${pickedStateRank} of ${stateWageEntries.length} published state medians, highest first.`
												: `BLS published no estimate for ${statePick} in this occupation.`}
									</p>
								</div>

								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">Highest medians</p>
									<div className="mt-3">
										{stateWageEntries.slice(0, 5).map(([name, value]) => (
											<div key={name} className="flex items-baseline justify-between gap-3 border-b border-[#F2F2F2] py-1.5 last:border-0">
												<span className="text-[13px] text-[#1A1A1A]">{name}</span>
												<span className="font-mono text-xs text-[#5E5E5E]">{formatUSD(value)}</span>
											</div>
										))}
									</div>
								</div>

								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">Lowest medians</p>
									<div className="mt-3">
										{stateWageEntries.slice(-5).reverse().map(([name, value]) => (
											<div key={name} className="flex items-baseline justify-between gap-3 border-b border-[#F2F2F2] py-1.5 last:border-0">
												<span className="text-[13px] text-[#1A1A1A]">{name}</span>
												<span className="font-mono text-xs text-[#5E5E5E]">{formatUSD(value)}</span>
											</div>
										))}
									</div>
								</div>
							</div>

							<p className="mt-5 text-[11px] leading-5 text-[#6B6B6B]">
								{careerDetail.state_wages.source === 'bls-state-line'
									? `This is the ${careerDetail.state_wages.code} row of the ${careerDetail.salary_vintage ?? 'OEWS'} state panel.`
									: `OEWS has no state row for this exact code, so these figures are the ${careerDetail.state_wages.code} roll-up.`}{' '}
								States where the estimate was suppressed or too small to publish are absent.
							</p>
						</div>
					)}

					{/* Task Breakdown Section */}
					{!loadingDetail && careerDetail && (
						<div className="py-4">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
								<div>
									<h3 className="text-xl font-bold text-[#1A1A1A]">What the job actually involves</h3>
									<p className="text-xs text-[#5E5E5E] mt-1">Every task is scored for how much of it AI can do today. Filter to the ones that matter.</p>
								</div>
							
								{/* Filtering Segment Tabs */}
								<div className="flex flex-wrap rounded-xl bg-gray-100 p-1 border border-gray-200">
									{(['all', 'high', 'medium', 'low'] as const).map((cat) => (
										<button
											key={cat}
											onClick={() => setTaskFilter(cat)}
											aria-pressed={taskFilter === cat}
											className={`min-h-[32px] rounded-lg px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider transition ${
												taskFilter === cat
													? 'bg-[#1A1A1A] text-white font-bold'
													: 'text-[#5E5E5E] hover:text-[#1A1A1A]'
											}`}
										>
											{cat === 'all' ? 'All work' : cat === 'high' ? 'AI does it' : cat === 'medium' ? 'AI drafts it' : 'Needs a person'}
										</button>
									))}
								</div>
							</div>

							{/* Dynamic Tasks list */}
							<div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2">
								{filteredTasks.length === 0 ? (
									<div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-xs font-mono text-[#6B6B6B]">
										No tasks found matching this risk level.
									</div>
								) : (
									filteredTasks.map((task) => (
										<div
											key={task.id}
											className={`group relative rounded-xl border p-4 transition-all duration-200 bg-white ${
												task.risk === 'high'
													? 'border-gray-200 hover:border-[#A55252]/50'
													: task.risk === 'medium'
														? 'border-gray-200 hover:border-[#96693A]/50'
														: 'border-gray-200 hover:border-[#5A7A8F]/50'
											}`}
										>
											<div className="flex flex-wrap items-center justify-between gap-2 mb-2">
												<span className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest font-bold ${
													task.risk === 'high'
														? 'bg-[#A55252]/10 text-[#A55252]'
														: task.risk === 'medium'
															? 'bg-[#96693A]/10 text-[#96693A]'
															: 'bg-[#5A7A8F]/10 text-[#4B6478]'
												}`}>
													{task.risk ? bucketLabel[task.risk] : 'Not scored'}
												</span>
												<div className="flex items-center gap-2">
													{task.score !== null && (
														<span className="font-mono text-[10px] font-bold text-[#5E5E5E]">
															AI could do {Math.round(task.score * 100)}%
														</span>
													)}
													{task.emerging && (
														<span className="rounded-full bg-[#7C6BA8]/10 px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-widest font-bold text-[#7C6BA8]">
															{task.emerging.category}
														</span>
													)}
												</div>
											</div>
											<p className="text-sm leading-relaxed text-[#1A1A1A] font-medium">{task.text}</p>

												{task.dwas && task.dwas.length > 0 && (
												<div className="mt-2.5 flex flex-wrap gap-1.5">
													{task.dwas.map((dwa) => (
														<span
															key={dwa.id}
															title={`${dwa.gwa_name}${dwa.importance !== null ? ` · importance ${dwa.importance}/5 in this occupation` : ''}`}
															className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[9.5px] leading-4 text-[#5E5E5E]"
														>
															{dwa.name}
														</span>
													))}
												</div>
												)}

											<div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2">
												<svg className={`h-4 w-4 shrink-0 mt-0.5 ${
													task.risk === 'high' ? 'text-[#A55252]' : task.risk === 'medium' ? 'text-[#96693A]' : 'text-[#4B6478]'
												}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<p className="text-xs text-[#5E5E5E] italic leading-relaxed">
													<span className="font-mono not-italic text-[10px] uppercase font-bold tracking-wider mr-1" style={{ color: task.risk === 'high' ? '#A55252' : task.risk === 'medium' ? '#96693A' : '#5A7A8F' }}>
														Why:
													</span>
													{task.rationale}
												</p>
											</div>
										</div>
									))
								)}
							</div>

						</div>
					)}
				</div>
			)}

			{/* ==================== VIEW 2: INTERACTIVE CAREER FINDER ==================== */}
			{activeView === 'finder' && (
				<div role="tabpanel" id="panel-finder" aria-labelledby="tab-finder" className="grid gap-8">
					{/* Filters Card */}
					<div className="py-6">
						<div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
							<div>
								<h3 className="text-xl font-bold text-[#1A1A1A]">Find a job that holds up</h3>
								<p className="text-xs text-[#5E5E5E] mt-1">Filter by AI exposure and pay. Click any row to open the full breakdown.</p>
							</div>
							<button
								onClick={() => {
									setFinderSearchQuery('');
									setMinVulnerability(0);
									setMaxVulnerability(100);
									setMinSalaryFilter(0);
									setEmploymentFilter('all');
								}}
								className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-[#5E5E5E] hover:text-[#1A1A1A] hover:bg-gray-50 transition"
							>
								Clear filters
							</button>
						</div>

						{/* Filters Grid */}
						<div className="space-y-6">
							{/* Row 1: Four inputs */}
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
								<div>
									<label htmlFor="finder-search" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] font-bold mb-2">
										Search job title
									</label>
									<input
										id="finder-search"
										type="text"
										placeholder="e.g. designer, analyst…"
										value={finderSearchQuery}
										onChange={(e) => setFinderSearchQuery(e.target.value)}
										className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-gray-400 outline-none transition focus:border-[#5A7A8F]"
									/>
								</div>
								<div>
									<label htmlFor="finder-demand" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] font-bold mb-2">
										Employment level
									</label>
									<select
										id="finder-demand"
										value={employmentFilter}
										onChange={(e) => setEmploymentFilter(e.target.value)}
										className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#5A7A8F]"
									>
										<option value="all">Any size</option>
										<option value="Very High">Very large</option>
										<option value="High">Large</option>
										<option value="Medium">Medium</option>
										<option value="Low">Small</option>
									</select>
								</div>
								<div>
									<label htmlFor="finder-salary" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] font-bold mb-2">
										Minimum pay
									</label>
									<select
										id="finder-salary"
										value={minSalaryFilter}
										onChange={(e) => setMinSalaryFilter(Number(e.target.value))}
										className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#5A7A8F]"
									>
										<option value={0}>Any pay</option>
										<option value={40000}>$40,000+</option>
										<option value={60000}>$60,000+</option>
										<option value={80000}>$80,000+</option>
										<option value={100000}>$100,000+</option>
										<option value={120000}>$120,000+</option>
										<option value={140000}>$140,000+</option>
									</select>
								</div>
								<div>
									<label htmlFor="finder-sort" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] font-bold mb-2">
										Sort by
									</label>
									<div className="flex gap-2">
										<select
											id="finder-sort"
											value={sortField}
											onChange={(e) => setSortField(e.target.value as any)}
											className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#5A7A8F]"
										>
											<option value="risk_score">AI exposure</option>
											<option value="title">Job title</option>
											<option value="salary">Median pay</option>
											<option value="employment_band">Employment level</option>
										</select>
										<button
											onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
											className="px-3 rounded-xl border border-gray-200 bg-white text-[#5E5E5E] hover:text-[#1A1A1A] hover:bg-gray-50 transition"
											aria-label="Toggle sort direction"
										>
											{sortDirection === 'asc' ? '↑' : '↓'}
										</button>
									</div>
								</div>
							</div>

							{/* Row 2: Vulnerability Range Sliders (Full width) */}
							<div className="pt-4 border-t border-gray-100">
								<div className="flex flex-wrap items-center justify-between gap-2 mb-4">
									<label className="text-xs font-bold text-[#1A1A1A]">
										AI exposure
									</label>
									<span className="font-mono text-xs font-extrabold text-[#4B6478]">
										{minVulnerability} – {maxVulnerability} out of 100
									</span>
								</div>

								{/* Dual-thumb Range Slider wrapper */}
								<div className="dual-slider-container relative w-full h-8 flex items-center mb-1">
									{/* Track background */}
									<div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-lg"></div>
									
									{/* Colored active range track */}
									<div 
										className="absolute h-1.5 bg-[#5A7A8F] rounded-lg"
										style={{
											left: `${minVulnerability}%`,
											width: `${maxVulnerability - minVulnerability}%`
										}}
									></div>
									
									{/* Min range input */}
									<input
										type="range"
										min="0"
										max="100"
										value={minVulnerability}
										aria-label="Minimum AI exposure"
										onChange={(e) => {
											const val = Math.min(Number(e.target.value), maxVulnerability - 1);
											setMinVulnerability(val);
										}}
										className="absolute w-full h-1.5 pointer-events-none appearance-none bg-transparent outline-none cursor-pointer"
										style={{
											zIndex: minVulnerability > 50 ? 5 : 4
										}}
									/>

									{/* Max range input */}
									<input
										type="range"
										min="0"
										max="100"
										value={maxVulnerability}
										aria-label="Maximum AI exposure"
										onChange={(e) => {
											const val = Math.max(Number(e.target.value), minVulnerability + 1);
											setMaxVulnerability(val);
										}}
										className="absolute w-full h-1.5 pointer-events-none appearance-none bg-transparent outline-none cursor-pointer"
										style={{
											zIndex: minVulnerability > 50 ? 4 : 5
										}}
									/>
								</div>
								
								<div className="flex items-center justify-between text-[10px] font-mono text-[#6B6B6B] px-1">
									<span>0 — less exposed</span>
									<span>100 — more exposed</span>
								</div>
							</div>
						</div>
					</div>

					{/* Results List */}
					<div className="overflow-hidden mt-10">
						<div className="flex items-center justify-between mb-6">
							<span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#4B6478] font-bold">
								{filteredFinderCareers.length} careers match
							</span>
						</div>

						{/* Results Table */}
						<div className="overflow-x-auto w-full">
							<table className="min-w-full divide-y divide-gray-200 text-left border-collapse">
								<thead>
									<tr className="border-b border-gray-200 font-mono text-[9.5px] uppercase tracking-[0.15em] text-[#5E5E5E]">
										<th scope="col" className="pl-0 pr-6 py-4 font-bold text-left">Job</th>
										<th scope="col" className="px-6 py-4 font-bold text-left">AI exposure</th>
										<th scope="col" className="px-6 py-4 font-bold text-left">Median pay</th>
										<th scope="col" className="px-6 py-4 font-bold text-left">Employment</th>
										<th scope="col" className="pl-6 pr-0 py-4 font-bold text-right"><span className="sr-only">Open job</span></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 text-sm">
									{paginatedFinderCareers.length === 0 ? (
										<tr>
											<td colSpan={5} className="px-6 py-12 text-center font-mono text-xs text-[#6B6B6B] italic">
												No careers match. Try widening the filters.
											</td>
										</tr>
									) : (
										paginatedFinderCareers.map((item) => (
											<tr
												key={item.code}
												className="hover:bg-gray-50 bg-white transition group cursor-pointer"
												onClick={() => handleSelectFromExplorer(item.code)}
											>
												<td className="pl-0 pr-6 py-6 text-left">
													<div className="font-bold text-[#1A1A1A] group-hover:text-[#4B6478] transition line-clamp-1">{item.title}</div>
													<div className="font-mono text-[9px] text-[#6B6B6B] uppercase mt-0.5">{item.code}</div>
												</td>
												<td className="px-6 py-6 text-left">
													<div className="flex items-center justify-start gap-2">
														{/* Mini color bar */}
														<div className="w-12 bg-gray-100 h-2 rounded-full overflow-hidden hidden sm:block">
															<div
																className="h-full rounded-full"
																style={{
																	width: `${item.risk_score}%`,
																	backgroundColor: item.risk_score > 65 ? '#A55252' : item.risk_score > 35 ? '#96693A' : '#5A7A8F'
																}}
															></div>
														</div>
														<span className={`font-mono text-xs font-bold leading-none ${
															item.risk_score > 65 ? 'text-[#A55252]' : item.risk_score > 35 ? 'text-[#96693A]' : 'text-[#4B6478]'
														}`}>
															{item.risk_score}%
														</span>
													</div>
												</td>
												<td className="px-6 py-6 font-bold text-[#1A1A1A] font-mono text-left">
													{formatUSD(item.salary)}
												</td>
												<td className="px-6 py-6 text-left">
													<span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9.5px] font-bold font-mono uppercase border ${
														item.employment_band === 'Very High'
															? 'bg-[#5A7A8F]/10 text-[#4B6478] border-transparent'
															: item.employment_band === 'High'
																? 'bg-[#5A7A8F]/10 text-[#4B6478] border-transparent'
																: item.employment_band === 'Medium'
																	? 'bg-gray-100 text-[#5E5E5E] border-transparent'
																	: 'bg-gray-100 text-[#6B6B6B] border-transparent'
													}`}>
														{item.employment_band}
													</span>
													{item.projection && item.projection.change_percent !== null ? (
														<span className={`mt-1 block font-mono text-[10px] font-bold ${item.projection.change_percent > 0 ? 'text-[#2E6F40]' : item.projection.change_percent < 0 ? 'text-[#A55252]' : 'text-[#6B6B6B]'}`}>
															{item.projection.change_percent > 0 ? '+' : ''}{item.projection.change_percent.toFixed(1)}% <span className="font-normal text-[#6B6B6B]">by 2035</span>
														</span>
													) : (
														<span className="mt-1 block font-mono text-[10px] text-[#6B6B6B]">not projected</span>
													)}
												</td>
												<td className="pl-6 pr-0 py-6 text-right">
													<div className="flex justify-end items-center gap-4">
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleAddToCompare(item);
															}}
															className="font-mono text-[10.5px] uppercase tracking-wider text-[#5E5E5E] hover:text-[#1A1A1A] hover:underline transition font-bold bg-transparent border-none cursor-pointer"
															>
															Compare
															</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleSelectFromExplorer(item.code);
															}}
															className="rounded-lg bg-[#1A1A1A] px-4 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-white hover:bg-[#333333] transition shadow-sm font-bold"
															aria-label={`Open ${item.title}`}
															>
															Open
															</button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination Controls */}
						{totalPages > 1 && (
							<div className="flex items-center justify-between mt-6 border-t border-gray-200 pt-4">
								<span className="font-mono text-[10px] text-[#6B6B6B]">
									Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredFinderCareers.length)} of {filteredFinderCareers.length} careers
								</span>
								<div className="flex items-center gap-2">
									<button
										disabled={currentPage === 1}
										onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
										className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[10px] text-[#5E5E5E] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-[#5E5E5E] transition"
									>
										← Prev
									</button>
									<span className="font-mono text-xs text-[#5E5E5E]">
										Page {currentPage} of {totalPages}
									</span>
									<button
										disabled={currentPage === totalPages}
										onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
										className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[10px] text-[#5E5E5E] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-[#5E5E5E] transition"
									>
										Next →
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ==================== VIEW 3: CAREER MAP ==================== */}
			{activeView === 'explorer' && (
				<div role="tabpanel" id="panel-explorer" aria-labelledby="tab-explorer" className="grid gap-8">
					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Where careers sit</h3>
						<p className="text-xs text-[#5E5E5E] leading-relaxed max-w-3xl">
							Every job we score, plotted by typical pay and by how much of its work AI can already do. The top-left corner is the sweet spot — well paid, less exposed. Hover or tap a dot for details; click it to open the full breakdown.
						</p>
						<div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-[#5E5E5E]">
							<span className="flex items-center gap-1.5">
								<span className="h-2.5 w-2.5 rounded-full" style={{ background: '#5A7A8F' }}></span> Low exposure
							</span>
							<span className="flex items-center gap-1.5">
								<span className="h-2.5 w-2.5 rounded-full" style={{ background: '#96693A' }}></span> Mixed
							</span>
							<span className="flex items-center gap-1.5">
								<span className="h-2.5 w-2.5 rounded-full" style={{ background: '#A55252' }}></span> High exposure
							</span>
						</div>
						
						{loadingIndex ? (
							<div className="flex h-96 items-center justify-center">
								<div className="flex flex-col items-center gap-3">
									<div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
									<span className="font-mono text-xs text-[#64748B] uppercase tracking-widest animate-pulse">Placing 1,000 careers on the map…</span>
								</div>
							</div>
						) : (
							<div ref={scatterContainerRef} className="relative mt-8 w-full flex justify-center overflow-hidden">
								{/* Custom SVG Scatter Plot */}
								<svg
									width={scatterDimensions.width}
									height={scatterDimensions.height}
									className="overflow-visible"
								>
									{/* Horizontal Grid Lines for Risk Score */}
									{[0, 25, 50, 75, 100].map((riskVal) => {
										const y = mapRiskToY(riskVal);
										return (
											<g key={riskVal}>
												<line
													x1={scatterMargin.left}
													y1={y}
													x2={scatterDimensions.width - scatterMargin.right}
													y2={y}
													stroke="#E5E5E5"
													strokeWidth="0.5"
													strokeDasharray="4 4"
												/>
												<text
													x={scatterMargin.left - 12}
													y={y + 4}
													textAnchor="end"
													fill="#5E5E5E"
													className="font-mono text-[10px] font-semibold"
												>
													{riskVal}%
												</text>
											</g>
										);
									})}

									{/* Vertical Grid Lines for Salaries */}
									{[20000, 60000, 100000, 140000, 180000, 220000, 260000, 300000].map((salVal) => {
										const x = mapSalaryToX(salVal);
										return (
											<g key={salVal}>
												<line
													x1={x}
													y1={scatterMargin.top}
													x2={x}
													y2={scatterDimensions.height - scatterMargin.bottom}
													stroke="#E5E5E5"
													strokeWidth="0.5"
													strokeDasharray="4 4"
												/>
												<text
													x={x}
													y={scatterDimensions.height - scatterMargin.bottom + 20}
													textAnchor="middle"
													fill="#5E5E5E"
													className="font-mono text-[10px] font-semibold"
												>
													{salVal >= 100000 ? `$${salVal/1000}k` : `$${salVal/1000}k`}
												</text>
											</g>
										);
									})}

									{/* The Axis Boundary Lines */}
									<line
										x1={scatterMargin.left}
										y1={scatterMargin.top}
										x2={scatterMargin.left}
										y2={scatterDimensions.height - scatterMargin.bottom}
										stroke="#E5E5E5"
										strokeWidth="1"
									/>
									<line
										x1={scatterMargin.left}
										y1={scatterDimensions.height - scatterMargin.bottom}
										x2={scatterDimensions.width - scatterMargin.right}
										y2={scatterDimensions.height - scatterMargin.bottom}
										stroke="#E5E5E5"
										strokeWidth="1"
									/>

									{/* Axis Labels */}
									<text
										x={scatterMargin.left - 55}
										y={scatterDimensions.height / 2 - 20}
										fill="#1A1A1A"
										textAnchor="middle"
										className="font-mono text-[10px] uppercase font-bold tracking-widest"
										transform={`rotate(-90, ${scatterMargin.left - 55}, ${scatterDimensions.height / 2 - 20})`}
									>
										AI exposure
									</text>
									<text
										x={scatterMargin.left + scatterPlotWidth / 2}
										y={scatterDimensions.height - 10}
										fill="#1A1A1A"
										textAnchor="middle"
										className="font-mono text-[10px] uppercase font-bold tracking-widest"
									>
										Typical annual pay
									</text>

									{/* Scatter dots */}
									{filteredExplorerCareers.map((item) => {
										const cx = mapSalaryToX(item.salary);
										const cy = mapRiskToY(item.risk_score);
										
										const isSelected = selectedCode === item.code;
										const isHovered = hoveredScatterCareer?.code === item.code;

										// Determine Dot Accent Neutral Colors
										const dotColor =
											item.risk_score > 65
												? '#A55252' // Muted Brick
												: item.risk_score > 35
													? '#96693A' // Soft Ochre
													: '#5A7A8F'; // Steel Blue

										return (
											<circle
												key={item.code}
												cx={cx}
												cy={cy}
												r={isSelected ? 6.5 : isHovered ? 5.5 : 4.5}
												fill={dotColor}
												opacity={hoveredScatterCareer ? (isHovered || isSelected ? 1.0 : 0.2) : 0.5}
												stroke={isSelected ? '#1A1A1A' : isHovered ? '#1A1A1A' : 'transparent'}
												strokeWidth={isSelected || isHovered ? 1.5 : 0}
												onMouseMove={(e) => handleScatterMouseMove(e, item)}
												onMouseLeave={() => setHoveredScatterCareer(null)}
												onClick={() => handleSelectFromExplorer(item.code)}
												className={`cursor-pointer ${isHovered || isSelected ? 'transition-all duration-75' : ''}`}
												style={{ transformOrigin: `${cx}px ${cy}px` }}
											/>
										);
									})}
								</svg>

								{/* Dynamic Hover Tooltip inside SVG Container */}
								{hoveredScatterCareer && (
									<div
										className="absolute pointer-events-none z-50 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xl max-w-xs"
										style={{
											left: `${tooltipPos.x}px`,
											top: `${tooltipPos.y - 45}px`,
											transform: tooltipPos.isRightHalf 
												? 'translate(calc(-100% - 15px), -50%)' 
												: 'translate(15px, -50%)'
										}}
									>
										<p className="font-mono text-[8px] uppercase tracking-wider text-[#4B6478] font-bold mb-1">
											{hoveredScatterCareer.code}
										</p>
										<div className="text-xs font-bold line-clamp-1 text-[#1A1A1A]">
											{hoveredScatterCareer.title}
										</div>
										
										<div className="mt-2.5 flex items-center justify-between gap-4 border-t border-gray-150 pt-2 font-mono text-[9.5px]">
											<div>
												<span className="text-[#5E5E5E]">AI exposure:</span>
												<strong className={`ml-1 ${
													hoveredScatterCareer.risk_score > 65
														? 'text-[#A55252]'
														: hoveredScatterCareer.risk_score > 35
															? 'text-[#96693A]'
															: 'text-[#4B6478]'
												}`}>
													{hoveredScatterCareer.risk_score}%
												</strong>
											</div>
											<div>
												<span className="text-[#5E5E5E]">Salary:</span>
												<strong className="ml-1 text-[#1A1A1A]">
													{formatUSD(hoveredScatterCareer.salary)}
												</strong>
											</div>
										</div>
										<p className="mt-2 font-mono text-[8px] text-[#6B6B6B] italic text-center">Click to open this job</p>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}
			<CompareDeck
				items={compareItems}
				onRemove={handleRemoveFromCompare}
				onClear={handleClearCompare}
			/>
		</div>
	);
}
