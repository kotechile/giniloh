import React, { useState, useEffect, useRef, useMemo } from 'react';
import CompareDeck, { type CompareItem } from './CompareDeck';

interface CategoryDistribution {
	high: number;
	medium: number;
	low: number;
}

interface OccupationIndexItem {
	code: string;
	title: string;
	description: string;
	risk_score: number;
	tasks_count: number;
	salary: number;
	demand: string;
	category_distribution: CategoryDistribution;
}

interface Task {
	id: string;
	text: string;
	type: string;
	risk: 'high' | 'medium' | 'low';
	rationale: string;
}

interface OccupationDetail {
	code: string;
	title: string;
	description: string;
	risk_score: number;
	salary: number;
	demand: string;
	tasks: Task[];
}

export default function CareerAiResilienceCalculator() {
	// Active View: 'profile' (details/simulator), 'finder' (filter/table), or 'explorer' (scatter plot)
	const [activeView, setActiveView] = useState<'profile' | 'finder' | 'explorer'>('profile');

	// Interactive Finder states
	const [finderSearchQuery, setFinderSearchQuery] = useState('');
	const [minVulnerability, setMinVulnerability] = useState<number>(0);
	const [maxVulnerability, setMaxVulnerability] = useState<number>(100);
	const [minSalaryFilter, setMinSalaryFilter] = useState<number>(0);
	const [demandFilter, setDemandFilter] = useState<string>('all');
	const [sortField, setSortField] = useState<'title' | 'risk_score' | 'salary' | 'demand'>('risk_score');
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

				// Initialize simulator weights based on actual task distribution
				const tasks = data.tasks || [];
				const total = tasks.length || 1;
				const highCount = tasks.filter((t) => t.risk === 'high').length;
				const mediumCount = tasks.filter((t) => t.risk === 'medium').length;

				const hPct = Math.round((highCount / total) * 100);
				const mPct = Math.round((mediumCount / total) * 100);
				const lPct = 100 - hPct - mPct;

				setWeights({ high: hPct, medium: mPct, low: lPct });
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
		const tasks = careerDetail.tasks || [];
		const total = tasks.length || 1;
		const highCount = tasks.filter((t) => t.risk === 'high').length;
		const mediumCount = tasks.filter((t) => t.risk === 'medium').length;

		const hPct = Math.round((highCount / total) * 100);
		const mPct = Math.round((mediumCount / total) * 100);
		const lPct = 100 - hPct - mPct;

		setWeights({ high: hPct, medium: mPct, low: lPct });
		setIsCustomized(false);
	};

	// Calculated overall score based on current weights
	// High risk contributes 100%, Medium 50%, Low 0%
	const overallScore = useMemo(() => {
		return Math.round(weights.high + weights.medium * 0.5);
	}, [weights]);

	// Filtered tasks in detailed view
	const filteredTasks = useMemo(() => {
		if (!careerDetail) return [];
		if (taskFilter === 'all') return careerDetail.tasks;
		return careerDetail.tasks.filter((t) => t.risk === taskFilter);
	}, [careerDetail, taskFilter]);

	// Format currency utility
	const formatUSD = (val: number) => {
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
			{ category: 'high' as const, start: accum, end: accum + highPct, color: '#f43f5e', glowColor: 'rgba(244,63,94,0.4)' },
			{ category: 'medium' as const, start: accum + highPct, end: accum + highPct + medPct, color: '#f59e0b', glowColor: 'rgba(245,158,11,0.4)' },
			{ category: 'low' as const, start: accum + highPct + medPct, end: 1.0, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.4)' }
		];
		return slices.filter(s => s.end > s.start);
	}, [weights]);

	// Scatter Plot dimensions and mapping parameters
	const scatterMargin = { top: 20, right: 30, bottom: 50, left: 60 };
	const scatterPlotWidth = scatterDimensions.width - scatterMargin.left - scatterMargin.right;
	const scatterPlotHeight = scatterDimensions.height - scatterMargin.top - scatterMargin.bottom;

	// Scale bounds
	const salaryMin = 20000;
	const salaryMax = 160000;
	const riskMin = 0;
	const riskMax = 100;

	const mapSalaryToX = (salary: number) => {
		const clamped = Math.max(salaryMin, Math.min(salaryMax, salary));
		return scatterMargin.left + ((clamped - salaryMin) / (salaryMax - salaryMin)) * scatterPlotWidth;
	};

	const mapRiskToY = (risk: number) => {
		const clamped = Math.max(riskMin, Math.min(riskMax, risk));
		// Invert Y so that 100 is at top, 0 at bottom
		return scatterMargin.top + (1 - (clamped - riskMin) / (riskMax - riskMin)) * scatterPlotHeight;
	};

	// Filtered careers inside Explorer scatter plot
	const filteredExplorerCareers = useMemo(() => {
		if (!searchQueryExplorer.trim()) return indexData;
		const q = searchQueryExplorer.toLowerCase();
		return indexData.filter((item) =>
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

		list = list.filter(item => item.risk_score >= minVulnerability && item.risk_score <= maxVulnerability);

		if (minSalaryFilter > 0) {
			list = list.filter(item => item.salary >= minSalaryFilter);
		}

		if (demandFilter !== 'all') {
			list = list.filter(item => item.demand === demandFilter);
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
	}, [indexData, finderSearchQuery, minVulnerability, maxVulnerability, minSalaryFilter, demandFilter, sortField, sortDirection]);

	const totalPages = Math.ceil(filteredFinderCareers.length / itemsPerPage) || 1;
	const paginatedFinderCareers = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredFinderCareers.slice(start, start + itemsPerPage);
	}, [filteredFinderCareers, currentPage]);

	// Reset page on filter adjustment
	useEffect(() => {
		setCurrentPage(1);
	}, [finderSearchQuery, minVulnerability, maxVulnerability, minSalaryFilter, demandFilter, sortField, sortDirection]);

	return (
		<div className="w-full text-slate-100 font-sans">
			{/* Mode Select Header */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
				<div className="flex rounded-2xl bg-slate-950/70 p-1.5 border border-slate-800/80 max-w-lg w-full">
					<button
						onClick={() => setActiveView('profile')}
						className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-mono tracking-wider uppercase transition-all duration-300 ${
							activeView === 'profile'
								? 'bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] font-bold'
								: 'text-slate-400 hover:text-white border border-transparent'
						}`}
					>
						Career Profile
					</button>
					<button
						onClick={() => setActiveView('finder')}
						className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-mono tracking-wider uppercase transition-all duration-300 ${
							activeView === 'finder'
								? 'bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] font-bold'
								: 'text-slate-400 hover:text-white border border-transparent'
						}`}
					>
						Career Finder
					</button>
					<button
						onClick={() => setActiveView('explorer')}
						className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-mono tracking-wider uppercase transition-all duration-300 ${
							activeView === 'explorer'
								? 'bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] font-bold'
								: 'text-slate-400 hover:text-white border border-transparent'
						}`}
					>
						Macro Explorer
					</button>
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
								className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 backdrop-blur-md outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_25px_rgba(6,182,212,0.08)]"
							/>
							<svg
								className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
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
				<div className="grid gap-8">
					{/* Search & Selector Card */}
					<div className="relative panel-soft rounded-[1.8rem] border border-slate-800/90 bg-slate-900/35 p-6 backdrop-blur-md">
						<label htmlFor="career-search" className="block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-3">
							Select Occupation
						</label>
						<div ref={suggestionsRef} className="relative">
							<div className="relative">
								<input
									id="career-search"
									type="text"
									placeholder="Search by job title (e.g. Accountant, Software Engineer, Nurse)..."
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setShowSuggestions(true);
									}}
									onFocus={() => setShowSuggestions(true)}
									className="w-full rounded-2xl border border-slate-850 bg-slate-950/80 py-4 pl-12 pr-10 text-sm font-medium text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
								/>
								<svg
									className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
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
										className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
										aria-label="Clear search"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								)}
							</div>

							{showSuggestions && suggestions.length > 0 && (
								<div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
									{suggestions.map((item) => (
										<button
											key={item.code}
											onClick={() => {
												setSelectedCode(item.code);
												setSearchQuery(item.title);
												setShowSuggestions(false);
											}}
											className="flex w-full flex-col px-4 py-3 text-left transition hover:bg-cyan-900/10 hover:text-cyan-300 border-b border-slate-900 last:border-0"
										>
											<span className="text-sm font-semibold text-white group-hover:text-cyan-300">{item.title}</span>
											<span className="font-mono text-[9.5px] text-slate-500 uppercase tracking-wider mt-0.5">{item.code}</span>
										</button>
									))}
								</div>
							)}
							{showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
								<div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-center text-xs font-mono text-slate-500 shadow-2xl">
									No matching career profiles found.
								</div>
							)}
						</div>

						{/* Trending Careers Quick selectors */}
						<div className="mt-4 flex flex-wrap items-center gap-3">
							<span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">Trending:</span>
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
											? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
											: 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
									}`}
								>
									{trend.title}
								</button>
							))}
						</div>
					</div>

					{/* Loading Detail Overlay */}
					{loadingDetail && (
						<div className="flex h-96 items-center justify-center rounded-[2rem] border border-slate-800 bg-slate-950/40 backdrop-blur-md">
							<div className="flex flex-col items-center gap-3">
								<div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
								<span className="font-mono text-xs text-slate-400 uppercase tracking-widest animate-pulse">Assembling Career Profile...</span>
							</div>
						</div>
					)}

					{/* Main Detail Dashboard Grid */}
					{!loadingDetail && careerDetail && (
						<div className="grid gap-8 lg:grid-cols-12 items-start">
							
							{/* LEFT SIDE: General overview, Risk gauge & Donut mix (8 columns) */}
							<div className="lg:col-span-7 grid gap-8">
								
								{/* Core Overview Card */}
								<div className="panel-soft rounded-[1.8rem] border border-slate-800/90 bg-slate-900/35 p-6 backdrop-blur-md">
									<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
										<div>
											<span className="rounded-full border border-cyan-500/25 bg-cyan-950/30 px-3 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-400">
												{careerDetail.code}
											</span>
											<h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">{careerDetail.title}</h2>
										</div>
										<div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-850 pt-3 md:pt-0">
											<p className="font-mono text-[9.5px] uppercase tracking-wider text-slate-500">US National Estimated Salary</p>
											<p className="text-xl md:text-2xl font-bold text-emerald-400 mt-0.5">{formatUSD(careerDetail.salary)}</p>
											<span className="md:mt-1 font-mono text-[9.5px] uppercase tracking-wider text-slate-400">Demand: <strong className="text-slate-200 font-bold">{careerDetail.demand}</strong></span>
										</div>
									</div>
									<p className="text-sm leading-7 text-slate-350">{careerDetail.description}</p>
								</div>

								{/* The Dashboard Charts Panel */}
								<div className="grid gap-6 md:grid-cols-2">
									
									{/* Score Gauge Card */}
									<div className="panel-soft flex flex-col items-center justify-between rounded-[1.8rem] border border-slate-800/90 bg-slate-900/35 p-6 backdrop-blur-md text-center">
										<div>
											<p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400 font-bold">Vulnerability Index</p>
											<p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
												Weighted risk of tasks matching standard automation benchmarks
											</p>
										</div>

										{/* Radial Gauge SVG */}
										<div className="relative h-44 w-44 my-4 flex items-center justify-center">
											<svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
												{/* Background track circle */}
												<circle
													cx="60"
													cy="60"
													r="50"
													fill="transparent"
													stroke="#1e293b"
													strokeWidth="8"
													className="opacity-70"
												/>
												{/* Foreground gauge circle */}
												<circle
													cx="60"
													cy="60"
													r="50"
													fill="transparent"
													stroke={overallScore > 65 ? '#f43f5e' : overallScore > 35 ? '#f59e0b' : '#06b6d4'}
													strokeWidth="8.5"
													strokeDasharray="314.159"
													strokeDashoffset={314.159 - (overallScore / 100) * 314.159}
													strokeLinecap="round"
													style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.5s ease-out' }}
												/>
											</svg>
											{/* Center Text overlay */}
											<div className="absolute inset-0 flex flex-col items-center justify-center">
												<span className="text-4xl font-extrabold text-white tracking-tight">{overallScore}</span>
												<span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Index Score</span>
											</div>
										</div>

										<div className={`rounded-xl px-4 py-1.5 border font-mono text-[11px] uppercase tracking-wider ${
											overallScore > 65
												? 'border-rose-500/20 bg-rose-950/15 text-rose-400'
												: overallScore > 35
													? 'border-amber-500/20 bg-amber-950/15 text-amber-400'
													: 'border-cyan-500/20 bg-cyan-950/15 text-cyan-400'
										}`}>
											{overallScore > 65 ? 'High Risk Career' : overallScore > 35 ? 'Medium Risk Career' : 'Low Risk / High Resilience'}
										</div>
									</div>

									{/* Donut Task Mix Card */}
									<div className="panel-soft flex flex-col items-center justify-between rounded-[1.8rem] border border-slate-800/90 bg-slate-900/35 p-6 backdrop-blur-md text-center">
										<div>
											<p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400 font-bold">Task Risk Composition</p>
											<p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
												Hover segments to isolate corresponding tasks below
											</p>
										</div>

										{/* Donut Chart SVG */}
										<div className="relative h-44 w-44 my-4 flex items-center justify-center">
											<svg className="w-full h-full transform -rotate-90" viewBox="-120 -120 240 240">
												{donutSlices.map((slice) => {
													const isHovered = hoveredDonutSlice === slice.category;
													return (
														<g
															key={slice.category}
															onMouseEnter={() => setHoveredDonutSlice(slice.category)}
															onMouseLeave={() => setHoveredDonutSlice(null)}
															onClick={() => setTaskFilter(slice.category)}
															className="cursor-pointer transition-all duration-300"
														>
															<path
																d={drawSlicePath(slice.start, slice.end, isHovered ? 108 : 98)}
																fill={slice.color}
																opacity={hoveredDonutSlice ? (isHovered ? 1.0 : 0.4) : 0.85}
																style={{ transition: 'all 0.3s ease-out' }}
																filter={isHovered ? `drop-shadow(0 0 8px ${slice.color})` : undefined}
															/>
														</g>
													);
												})}
												{/* Central inner hole circle */}
												<circle cx="0" cy="0" r="58" fill="#090d16" />
											</svg>
											<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
												{hoveredDonutSlice ? (
													<>
														<span className="text-2xl font-bold capitalize" style={{ color: hoveredDonutSlice === 'high' ? '#f43f5e' : hoveredDonutSlice === 'medium' ? '#f59e0b' : '#06b6d4' }}>
															{weights[hoveredDonutSlice]}%
														</span>
														<span className="font-mono text-[9px] uppercase tracking-wider mt-0.5" style={{ color: '#94a3b8' }}>{hoveredDonutSlice} Risk</span>
													</>
												) : (
													<>
														<span className="text-2xl font-extrabold" style={{ color: '#ffffff' }}>
															{careerDetail.tasks.length}
														</span>
														<span className="font-mono text-[9px] uppercase tracking-wider mt-0.5" style={{ color: '#94a3b8' }}>Total Tasks</span>
													</>
												)}
											</div>
										</div>

										{/* Donut Legend */}
										<div className="flex gap-3 justify-center text-[10.5px] font-mono w-full px-2">
											<button
												onClick={() => setTaskFilter(taskFilter === 'high' ? 'all' : 'high')}
												className={`flex items-center gap-1.5 transition ${taskFilter === 'high' ? 'opacity-100 font-bold scale-105' : 'opacity-70 hover:opacity-100'}`}
											>
												<span className="h-2 w-2 rounded-full bg-rose-500"></span>
												<span>H: {weights.high}%</span>
											</button>
											<button
												onClick={() => setTaskFilter(taskFilter === 'medium' ? 'all' : 'medium')}
												className={`flex items-center gap-1.5 transition ${taskFilter === 'medium' ? 'opacity-100 font-bold scale-105' : 'opacity-70 hover:opacity-100'}`}
											>
												<span className="h-2 w-2 rounded-full bg-amber-500"></span>
												<span>M: {weights.medium}%</span>
											</button>
											<button
												onClick={() => setTaskFilter(taskFilter === 'low' ? 'all' : 'low')}
												className={`flex items-center gap-1.5 transition ${taskFilter === 'low' ? 'opacity-100 font-bold scale-105' : 'opacity-70 hover:opacity-100'}`}
											>
												<span className="h-2 w-2 rounded-full bg-cyan-500"></span>
												<span>L: {weights.low}%</span>
											</button>
										</div>
									</div>

								</div>

							</div>

							{/* RIGHT SIDE: Future-proofing Simulator Sliders (5 columns) */}
							<div className="lg:col-span-5 grid gap-8">
								
								<div className="panel-soft rounded-[1.8rem] border border-cyan-500/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.35),rgba(2,6,23,0.85))] [.light_&]:bg-[linear-gradient(135deg,rgba(240,253,250,0.85),rgba(224,242,254,0.45))] [.light_&]:border-cyan-200/50 p-6 shadow-[0_0_40px_rgba(6,182,212,0.06)] [.light_&]:shadow-[0_15px_30px_rgba(34,211,238,0.04)] backdrop-blur-md">
									
									<div className="flex items-center justify-between gap-4 border-b border-slate-800/80 [.light_&]:border-slate-200/60 pb-4 mb-5">
										<div>
											<p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-400 [.light_&]:text-cyan-700 font-bold">Resilience Simulator</p>
											<h3 className="mt-1.5 text-xl font-bold tracking-tight text-white [.light_&]:text-slate-900">Upskilling Simulator</h3>
										</div>
										{isCustomized && (
											<button
												onClick={handleResetWeights}
												className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-slate-400 hover:text-white hover:border-slate-700 transition [.light_&]:bg-slate-100 [.light_&]:border-slate-200 [.light_&]:text-slate-600 hover:[.light_&]:bg-slate-200 hover:[.light_&]:text-slate-900"
											>
												Reset
											</button>
										)}
									</div>

									<p className="text-xs leading-6 text-slate-400 [.light_&]:text-slate-600 mb-6">
										Adjust sliders to simulate career upskilling: delegate or reduce routine workloads (High Risk) and increase focus on complex strategy, management, or design (Low Risk) to calculate your personalized vulnerability index.
									</p>

									{/* Sliders Container */}
									<div className="space-y-6">
										
										{/* Slider 1: High Risk */}
										<div className="rounded-2xl border border-slate-800/80 [.light_&]:border-slate-200/70 bg-slate-950/50 [.light_&]:bg-white/80 p-4">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
													<span className="text-xs font-semibold text-white [.light_&]:text-slate-800">Routine Tasks (High Risk)</span>
												</div>
												<span className="font-mono text-sm font-extrabold text-rose-400">{weights.high}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="100"
												value={weights.high}
												onChange={(e) => handleSliderChange('high', parseInt(e.target.value))}
												className="w-full accent-rose-500 h-1.5 rounded-lg bg-slate-800 [.light_&]:bg-slate-200 outline-none cursor-pointer"
											/>
											<p className="text-[10px] leading-relaxed text-slate-500 mt-2">
												Repetitive work like scheduling, typing, transcription, sorting, data formatting.
											</p>
										</div>

										{/* Slider 2: Medium Risk */}
										<div className="rounded-2xl border border-slate-800/80 [.light_&]:border-slate-200/70 bg-slate-950/50 [.light_&]:bg-white/80 p-4">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
													<span className="text-xs font-semibold text-white [.light_&]:text-slate-800">Analytical Tasks (Medium Risk)</span>
												</div>
												<span className="font-mono text-sm font-extrabold text-amber-400">{weights.medium}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="100"
												value={weights.medium}
												onChange={(e) => handleSliderChange('medium', parseInt(e.target.value))}
												className="w-full accent-amber-500 h-1.5 rounded-lg bg-slate-800 [.light_&]:bg-slate-200 outline-none cursor-pointer"
											/>
											<p className="text-[10px] leading-relaxed text-slate-500 mt-2">
												Basic analysis, template drafting, inspection, monitoring, routine audits.
											</p>
										</div>

										{/* Slider 3: Low Risk */}
										<div className="rounded-2xl border border-slate-800/80 [.light_&]:border-slate-200/70 bg-slate-950/50 [.light_&]:bg-white/80 p-4">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<span className="h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
													<span className="text-xs font-semibold text-white [.light_&]:text-slate-800">Resilient Tasks (Low Risk)</span>
												</div>
												<span className="font-mono text-sm font-extrabold text-cyan-400">{weights.low}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="100"
												value={weights.low}
												onChange={(e) => handleSliderChange('low', parseInt(e.target.value))}
												className="w-full accent-cyan-500 h-1.5 rounded-lg bg-slate-800 [.light_&]:bg-slate-200 outline-none cursor-pointer"
											/>
											<p className="text-[10px] leading-relaxed text-slate-500 mt-2">
												Complex strategy, negotiation, creative innovation, leadership, deep empathy.
											</p>
										</div>

									</div>

									{/* Output Result Simulator Banner */}
									<div className={`mt-6 rounded-2xl border p-4 flex items-center justify-between ${
										isCustomized 
											? 'border-cyan-500/35 bg-cyan-950/20 text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.1)] [.light_&]:border-cyan-200/80 [.light_&]:bg-cyan-50/50 [.light_&]:text-cyan-800'
											: 'border-slate-850 bg-slate-950/70 text-slate-400 [.light_&]:border-slate-200/80 [.light_&]:bg-slate-50/60 [.light_&]:text-slate-600'
									}`}>
										<div>
											<p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Simulator Verdict</p>
											<p className="text-xs font-semibold text-white [.light_&]:text-slate-800 mt-1">
												{isCustomized ? 'Simulating customized upskilled state' : 'Reflecting standard O*NET benchmark'}
											</p>
										</div>
										<div className="text-right">
											<p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">New Score</p>
											<p className={`text-2xl font-extrabold mt-0.5 ${
												overallScore > 65 
													? 'text-rose-400 [.light_&]:text-rose-600' 
													: overallScore > 35 
														? 'text-amber-400 [.light_&]:text-amber-600' 
														: 'text-cyan-400 [.light_&]:text-cyan-600'
											}`}>
												{overallScore}
											</p>
										</div>
									</div>

								</div>

							</div>

						</div>
					)}

					{/* Task Breakdown Section */}
					{!loadingDetail && careerDetail && (
						<div className="panel-soft rounded-[1.8rem] border border-slate-800/90 bg-slate-900/35 p-6 backdrop-blur-md">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-6">
								<div>
									<h3 className="text-xl font-bold text-white">O*NET Task Deconstruction</h3>
									<p className="text-xs text-slate-450 mt-1">Click segmented categories below to filter and view the exact task strings and classification justifications.</p>
								</div>
								
								{/* Filtering Segment Tabs */}
								<div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
									{(['all', 'high', 'medium', 'low'] as const).map((cat) => (
										<button
											key={cat}
											onClick={() => setTaskFilter(cat)}
											className={`rounded-lg px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider transition ${
												taskFilter === cat
													? 'bg-slate-800 text-white font-bold'
													: 'text-slate-400 hover:text-slate-200'
											}`}
										>
											{cat === 'all' ? 'All Tasks' : `${cat} risk`}
										</button>
									))}
								</div>
							</div>

							{/* Dynamic Tasks list */}
							<div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2">
								{filteredTasks.length === 0 ? (
									<div className="rounded-2xl border border-dashed border-slate-850 bg-slate-950/20 py-8 text-center text-xs font-mono text-slate-500">
										No tasks found matching this risk level.
									</div>
								) : (
									filteredTasks.map((task) => (
										<div
											key={task.id}
											className={`group relative rounded-2xl border p-4 transition-all duration-300 bg-slate-950/50 hover:bg-slate-950/80 ${
												task.risk === 'high'
													? 'border-rose-500/10 hover:border-rose-500/30 hover:shadow-[0_0_25px_rgba(244,63,94,0.06)]'
													: task.risk === 'medium'
														? 'border-amber-500/10 hover:border-amber-500/30 hover:shadow-[0_0_25px_rgba(245,158,11,0.06)]'
														: 'border-cyan-500/10 hover:border-cyan-500/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.06)]'
											}`}
										>
											<div className="flex items-start justify-between gap-4 mb-2.5">
												<span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">
													TASK ID #{task.id} • <span className="text-slate-400 font-semibold">{task.type}</span>
												</span>
												<span className={`rounded-full px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-widest ${
													task.risk === 'high'
														? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
														: task.risk === 'medium'
															? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
															: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
												}`}>
													{task.risk} Risk
												</span>
											</div>
											<p className="text-sm leading-relaxed text-slate-200 font-medium">{task.text}</p>
											
											<div className="mt-3 pt-3 border-t border-slate-900 flex items-start gap-2">
												<svg className={`h-4 w-4 shrink-0 mt-0.5 ${
													task.risk === 'high' ? 'text-rose-500/50' : task.risk === 'medium' ? 'text-amber-500/50' : 'text-cyan-500/50'
												}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<p className="text-xs text-slate-400 italic leading-relaxed">
													<span className="font-mono not-italic text-[10px] uppercase font-bold tracking-wider mr-1" style={{ color: task.risk === 'high' ? '#f43f5e' : task.risk === 'medium' ? '#f59e0b' : '#06b6d4' }}>
														Verdict Rationale:
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
				<div className="grid gap-8">
					{/* Filters Card */}
					<div className="panel-soft rounded-[1.8rem] border border-slate-800/90 bg-slate-900/35 p-6 backdrop-blur-md">
						<div className="flex items-center justify-between border-b border-slate-800/85 pb-4 mb-6">
							<div>
								<h3 className="text-xl font-bold text-white">Interactive Career Finder</h3>
								<p className="text-xs text-slate-400 mt-1">Filter, sort, and discover jobs matching your AI risk tolerance and salary targets.</p>
							</div>
							<button
								onClick={() => {
									setFinderSearchQuery('');
									setMinVulnerability(0);
									setMaxVulnerability(100);
									setMinSalaryFilter(0);
									setDemandFilter('all');
								}}
								className="rounded-lg border border-slate-850 bg-slate-950 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-slate-400 hover:text-white hover:border-slate-700 transition"
							>
								Clear Filters
							</button>
						</div>

						{/* Filters Grid */}
						<div className="grid gap-6 md:grid-cols-12 items-end">
							{/* Column 1: Search & Demand */}
							<div className="md:col-span-4 space-y-4">
								<div>
									<label htmlFor="finder-search" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
										Search Job Title
									</label>
									<input
										id="finder-search"
										type="text"
										placeholder="e.g. Designer, Analyst..."
										value={finderSearchQuery}
										onChange={(e) => setFinderSearchQuery(e.target.value)}
										className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50"
									/>
								</div>
								<div>
									<label htmlFor="finder-demand" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
										Market Demand
									</label>
									<select
										id="finder-demand"
										value={demandFilter}
										onChange={(e) => setDemandFilter(e.target.value)}
										className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-350 outline-none focus:border-cyan-500/50"
									>
										<option value="all">All Demands</option>
										<option value="Very High">Very High</option>
										<option value="High">High</option>
										<option value="Medium">Medium</option>
										<option value="Low">Low</option>
									</select>
								</div>
							</div>

							{/* Column 2: Salary & Sorting */}
							<div className="md:col-span-4 space-y-4">
								<div>
									<label htmlFor="finder-salary" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
										Minimum Annual Salary
									</label>
									<select
										id="finder-salary"
										value={minSalaryFilter}
										onChange={(e) => setMinSalaryFilter(Number(e.target.value))}
										className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-350 outline-none focus:border-cyan-500/50"
									>
										<option value={0}>All Salaries</option>
										<option value={40000}>$40,000+</option>
										<option value={60000}>$60,000+</option>
										<option value={80000}>$80,000+</option>
										<option value={100000}>$100,000+</option>
										<option value={120000}>$120,000+</option>
										<option value={140000}>$140,000+</option>
									</select>
								</div>
								<div>
									<label htmlFor="finder-sort" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
										Sort Results
									</label>
									<div className="flex gap-2">
										<select
											id="finder-sort"
											value={sortField}
											onChange={(e) => setSortField(e.target.value as any)}
											className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-350 outline-none focus:border-cyan-500/50"
										>
											<option value="risk_score">AI Vulnerability</option>
											<option value="title">Occupation Name</option>
											<option value="salary">Median Salary</option>
											<option value="demand">Demand Level</option>
										</select>
										<button
											onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
											className="px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition"
											aria-label="Toggle sort direction"
										>
											{sortDirection === 'asc' ? '↑' : '↓'}
										</button>
									</div>
								</div>
							</div>

							{/* Column 3: The Vulnerability Sliders (Min and Max range) */}
							<div className="md:col-span-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-4">
								<div className="flex items-center justify-between">
									<label className="text-xs font-semibold text-white">
										Vulnerability Range
									</label>
									<span className="font-mono text-xs font-extrabold text-cyan-400">
										{minVulnerability}% – {maxVulnerability}%
									</span>
								</div>

								<div className="space-y-3">
									{/* Min Slider */}
									<div>
										<div className="flex items-center justify-between mb-1.5">
											<span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Min Vulnerability</span>
											<span className="font-mono text-[10px] text-slate-300 font-semibold">{minVulnerability}%</span>
										</div>
										<input
											type="range"
											min="0"
											max="100"
											value={minVulnerability}
											onChange={(e) => {
												const val = Math.min(Number(e.target.value), maxVulnerability);
												setMinVulnerability(val);
											}}
											className="w-full accent-cyan-500 h-1.5 rounded-lg bg-slate-800 outline-none cursor-pointer"
										/>
									</div>

									{/* Max Slider */}
									<div>
										<div className="flex items-center justify-between mb-1.5">
											<span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Max Vulnerability</span>
											<span className="font-mono text-[10px] text-slate-300 font-semibold">{maxVulnerability}%</span>
										</div>
										<input
											type="range"
											min="0"
											max="100"
											value={maxVulnerability}
											onChange={(e) => {
												const val = Math.max(Number(e.target.value), minVulnerability);
												setMaxVulnerability(val);
											}}
											className="w-full accent-cyan-500 h-1.5 rounded-lg bg-slate-800 outline-none cursor-pointer"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Results Card */}
					<div className="panel-soft rounded-[1.8rem] border border-slate-800/90 bg-slate-900/35 p-6 backdrop-blur-md overflow-hidden">
						<div className="flex items-center justify-between mb-6">
							<span className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300/80 font-bold">
								Found {filteredFinderCareers.length} Matching Careers
							</span>
						</div>

						{/* Results Table */}
						<div className="overflow-x-auto w-full rounded-2xl border border-slate-850 bg-slate-950/40">
							<table className="min-w-full divide-y divide-slate-850 text-left border-collapse">
								<thead>
									<tr className="bg-slate-950 font-mono text-[9.5px] uppercase tracking-[0.15em] text-slate-500">
										<th scope="col" className="px-6 py-4 font-bold">Occupation Title</th>
										<th scope="col" className="px-6 py-4 font-bold text-center">Vulnerability Score</th>
										<th scope="col" className="px-6 py-4 font-bold">Est. Salary</th>
										<th scope="col" className="px-6 py-4 font-bold">Market Demand</th>
										<th scope="col" className="px-6 py-4 font-bold text-right">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-900 text-sm">
									{paginatedFinderCareers.length === 0 ? (
										<tr>
											<td colSpan={5} className="px-6 py-12 text-center font-mono text-xs text-slate-500 italic">
												No careers found matching current criteria. Try widening your filters.
											</td>
										</tr>
									) : (
										paginatedFinderCareers.map((item) => (
											<tr
												key={item.code}
												className="hover:bg-slate-900/30 transition group cursor-pointer"
												onClick={() => handleSelectFromExplorer(item.code)}
											>
												<td className="px-6 py-4 font-semibold text-white">
													<div className="font-medium text-slate-200 group-hover:text-cyan-300 transition line-clamp-1">{item.title}</div>
													<div className="font-mono text-[9px] text-slate-500 uppercase mt-0.5">{item.code}</div>
												</td>
												<td className="px-6 py-4 text-center">
													<div className="flex items-center justify-center gap-2">
														{/* Mini color bar */}
														<div className="w-12 bg-slate-850 h-2 rounded-full overflow-hidden hidden sm:block">
															<div
																className="h-full rounded-full"
																style={{
																	width: `${item.risk_score}%`,
																	backgroundColor: item.risk_score > 65 ? '#f43f5e' : item.risk_score > 35 ? '#f59e0b' : '#06b6d4'
																}}
															></div>
														</div>
														<span className={`font-mono text-xs font-bold leading-none ${
															item.risk_score > 65 ? 'text-rose-400' : item.risk_score > 35 ? 'text-amber-400' : 'text-cyan-400'
														}`}>
															{item.risk_score}%
														</span>
													</div>
												</td>
												<td className="px-6 py-4 font-bold text-emerald-400 font-mono">
													{formatUSD(item.salary)}
												</td>
												<td className="px-6 py-4">
													<span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9.5px] font-medium font-mono uppercase border ${
														item.demand === 'Very High'
															? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
															: item.demand === 'High'
																? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
																: item.demand === 'Medium'
																	? 'bg-slate-800 text-slate-300 border-slate-700/50'
																	: 'bg-rose-500/5 text-slate-455 border-rose-500/10'
													}`}>
														{item.demand}
													</span>
												</td>
												<td className="px-6 py-4 text-right">
													<div className="flex justify-end gap-2">
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleAddToCompare(item);
															}}
															className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition shadow-sm"
														>
															+ Compare
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleSelectFromExplorer(item.code);
															}}
															className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-500/30 transition shadow-sm"
														>
															Analyze
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
							<div className="flex items-center justify-between mt-6 border-t border-slate-900 pt-4">
								<span className="font-mono text-[10px] text-slate-500">
									Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredFinderCareers.length)} of {filteredFinderCareers.length} careers
								</span>
								<div className="flex items-center gap-2">
									<button
										disabled={currentPage === 1}
										onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
										className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-[10px] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
									>
										← Prev
									</button>
									<span className="font-mono text-xs text-slate-400">
										Page {currentPage} of {totalPages}
									</span>
									<button
										disabled={currentPage === totalPages}
										onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
										className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-[10px] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
									>
										Next →
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ==================== VIEW 3: MACRO CLUSTER EXPLORER ==================== */}
			{activeView === 'explorer' && (
				<div className="grid gap-8">
					<div className="panel-soft rounded-[1.8rem] border border-slate-800/90 bg-slate-900/35 p-6 backdrop-blur-md">
						<h3 className="text-xl font-bold text-white mb-2">Macro Career Clusters</h3>
						<p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
							Visualize all 1,000+ standard occupations. The X-axis details the estimated Salary Group proxy (based on major O*NET groups), and the Y-axis details the aggregate AI Vulnerability Score. Green/cyan dots indicate highly resilient, high-paying targets. Hover dots to inspect and click to select that profile.
						</p>
						
						{loadingIndex ? (
							<div className="flex h-96 items-center justify-center">
								<div className="flex flex-col items-center gap-3">
									<div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
									<span className="font-mono text-xs text-slate-400 uppercase tracking-widest animate-pulse">Mapping Career Coordinates...</span>
								</div>
							</div>
						) : (
							<div ref={scatterContainerRef} className="relative mt-8 w-full flex justify-center overflow-hidden">
								{/* Custom SVG Scatter Plot */}
								<svg
									width={scatterDimensions.width}
									height={scatterDimensions.height}
									className="bg-slate-950/70 border border-slate-850 rounded-2xl overflow-visible shadow-inner"
								>
									{/* Horizontal Grid Lines for Risk Score */}
									{[0, 25, 50, 75, 100].map((riskVal) => {
										const y = mapRiskToY(riskVal);
										return (
											<g key={riskVal} className="opacity-30">
												<line
													x1={scatterMargin.left}
													y1={y}
													x2={scatterDimensions.width - scatterMargin.right}
													y2={y}
													stroke="#334155"
													strokeWidth="0.5"
													strokeDasharray="4 4"
												/>
												<text
													x={scatterMargin.left - 10}
													y={y + 4}
													textAnchor="end"
													fill="#94a3b8"
													className="font-mono text-[9px] font-bold"
												>
													{riskVal}
												</text>
											</g>
										);
									})}

									{/* Vertical Grid Lines for Salaries */}
									{[20000, 50000, 80000, 110000, 140000, 160000].map((salVal) => {
										const x = mapSalaryToX(salVal);
										return (
											<g key={salVal} className="opacity-30">
												<line
													x1={x}
													y1={scatterMargin.top}
													x2={x}
													y2={scatterDimensions.height - scatterMargin.bottom}
													stroke="#334155"
													strokeWidth="0.5"
													strokeDasharray="4 4"
												/>
												<text
													x={x}
													y={scatterDimensions.height - scatterMargin.bottom + 18}
													textAnchor="middle"
													fill="#94a3b8"
													className="font-mono text-[9px] font-bold"
												>
													{salVal >= 100000 ? `$${salVal/1000}k` : `$${salVal/1000}k`}
												</text>
											</g>
										);
									})}

									{/* Axis Labels */}
									<text
										x={scatterMargin.left - 45}
										y={scatterDimensions.height / 2 - 20}
										fill="#64748b"
										textAnchor="middle"
										className="font-mono text-[10px] uppercase font-bold tracking-widest"
										transform={`rotate(-90, ${scatterMargin.left - 45}, ${scatterDimensions.height / 2 - 20})`}
									>
										AI Vulnerability Index (Y)
									</text>
									<text
										x={scatterMargin.left + scatterPlotWidth / 2}
										y={scatterDimensions.height - 10}
										fill="#64748b"
										textAnchor="middle"
										className="font-mono text-[10px] uppercase font-bold tracking-widest"
									>
										Estimated Salary - USA Nat (X)
									</text>

									{/* Scatter dots */}
									{filteredExplorerCareers.map((item) => {
										const cx = mapSalaryToX(item.salary);
										const cy = mapRiskToY(item.risk_score);
										
										const isSelected = selectedCode === item.code;
										const isHovered = hoveredScatterCareer?.code === item.code;

										// Determine Dot Accent Neon Colors
										const dotColor =
											item.risk_score > 65
												? '#f43f5e' // Hot rose
												: item.risk_score > 35
													? '#f59e0b' // Amber/orange
													: '#06b6d4'; // Electric Cyan

										return (
											<circle
												key={item.code}
												cx={cx}
												cy={cy}
												r={isSelected ? 6.5 : isHovered ? 5.5 : 4.5}
												fill={dotColor}
												opacity={hoveredScatterCareer ? (isHovered || isSelected ? 1.0 : 0.45) : 0.65}
												stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : 'transparent'}
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
										className="absolute pointer-events-none z-50 rounded-xl border border-slate-800 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md max-w-xs"
										style={{
											left: `${tooltipPos.x}px`,
											top: `${tooltipPos.y - 45}px`,
											transform: tooltipPos.isRightHalf 
												? 'translate(calc(-100% - 15px), -50%)' 
												: 'translate(15px, -50%)'
										}}
									>
										<p className="font-mono text-[8px] uppercase tracking-wider text-cyan-400 font-bold mb-1">
											{hoveredScatterCareer.code}
										</p>
										<div className="text-xs font-bold line-clamp-1" style={{ color: '#ffffff' }}>
											{hoveredScatterCareer.title}
										</div>
										
										<div className="mt-2.5 flex items-center justify-between gap-4 border-t border-slate-900 pt-2 font-mono text-[9.5px]">
											<div>
												<span className="text-slate-500">Risk Score:</span>
												<strong className={`ml-1 ${
													hoveredScatterCareer.risk_score > 65
														? 'text-rose-400'
														: hoveredScatterCareer.risk_score > 35
															? 'text-amber-400'
															: 'text-cyan-400'
												}`}>
													{hoveredScatterCareer.risk_score}
												</strong>
											</div>
											<div>
												<span className="text-slate-500">Salary:</span>
												<strong className="ml-1 text-emerald-400">
													{formatUSD(hoveredScatterCareer.salary)}
												</strong>
											</div>
										</div>
										<p className="mt-2 font-mono text-[8px] text-slate-500 italic text-center">Click dot to select profile</p>
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
