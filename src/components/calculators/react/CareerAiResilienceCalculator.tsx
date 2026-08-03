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
			{ category: 'high' as const, start: accum, end: accum + highPct, color: '#B85C5C', glowColor: 'rgba(184,92,92,0.4)' },
			{ category: 'medium' as const, start: accum + highPct, end: accum + highPct + medPct, color: '#C88D4E', glowColor: 'rgba(200,141,78,0.4)' },
			{ category: 'low' as const, start: accum + highPct + medPct, end: 1.0, color: '#5A7A8F', glowColor: 'rgba(90,122,143,0.4)' }
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
				<div className="flex border-b border-gray-200 max-w-xl w-full gap-8">
					<button
						onClick={() => setActiveView('profile')}
						className={`pb-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
							activeView === 'profile'
								? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
								: 'border-transparent text-[#8C8C8C] hover:text-[#1A1A1A]'
						}`}
					>
						Career Profile
					</button>
					<button
						onClick={() => setActiveView('finder')}
						className={`pb-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
							activeView === 'finder'
								? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
								: 'border-transparent text-[#8C8C8C] hover:text-[#1A1A1A]'
						}`}
					>
						Career Finder
					</button>
					<button
						onClick={() => setActiveView('explorer')}
						className={`pb-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
							activeView === 'explorer'
								? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
								: 'border-transparent text-[#8C8C8C] hover:text-[#1A1A1A]'
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
								className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-[#1A1A1A] placeholder-[#8C8C8C] outline-none transition focus:border-[#1A1A1A]"
							/>
							<svg
								className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
				<div className="grid gap-12">
					{/* Search & Selector */}
					<div className="relative py-2">
						<label htmlFor="career-search" className="block font-mono text-xs uppercase tracking-[0.25em] text-[#8C8C8C] font-bold mb-3">
							Select Occupation
						</label>
						<div ref={suggestionsRef} className="relative">
							<div className="relative">
								<input
									id="career-search"
									type="text"
									placeholder="Search by job title (e.g. Chief Executives, Software Developers)..."
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setShowSuggestions(true);
									}}
									onFocus={() => setShowSuggestions(true)}
									className="w-full rounded-xl border border-gray-300 bg-white py-4 pl-12 pr-10 text-base font-medium text-[#1A1A1A] outline-none transition focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]"
								/>
								<svg
									className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
										className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
										aria-label="Clear search"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								)}
							</div>

							{showSuggestions && suggestions.length > 0 && (
								<div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
									{suggestions.map((item) => (
										<button
											key={item.code}
											onClick={() => {
												setSelectedCode(item.code);
												setSearchQuery(item.title);
												setShowSuggestions(false);
											}}
											className="flex w-full flex-col px-4 py-3 text-left transition hover:bg-gray-50 border-b border-gray-100 last:border-0"
										>
											<span className="text-sm font-semibold text-[#1A1A1A]">{item.title}</span>
											<span className="font-mono text-[9.5px] text-[#8C8C8C] uppercase tracking-wider mt-0.5">{item.code}</span>
										</button>
									))}
								</div>
							)}
							{showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
								<div className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center text-xs font-mono text-[#8C8C8C] shadow-2xl">
									No matching career profiles found.
								</div>
							)}
						</div>

						{/* Trending Careers Quick selectors */}
						<div className="mt-4 flex flex-wrap items-center gap-3">
							<span className="font-mono text-xs uppercase tracking-[0.2em] text-[#8C8C8C] font-bold">Trending:</span>
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
								<span className="font-mono text-xs text-[#8C8C8C] uppercase tracking-widest animate-pulse">Assembling Career Profile...</span>
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
											<span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#8C8C8C]">
												{careerDetail.code}
											</span>
											<h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1A1A1A] mt-2">{careerDetail.title}</h2>
										</div>
										<div className="flex flex-row md:flex-col items-baseline md:items-end justify-between gap-1">
											<p className="font-mono text-xs font-bold uppercase tracking-wider text-[#8C8C8C]">SALARY</p>
											<p className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A]">{formatUSD(careerDetail.salary)}</p>
										</div>
									</div>
									<p className="text-base sm:text-lg leading-relaxed text-[#5E5E5E] font-normal">{careerDetail.description}</p>
								</div>

								{/* The Dashboard Charts Section */}
								<div className="grid gap-8 md:grid-cols-2">
									
									{/* Score Gauge */}
									<div className="flex flex-col items-center justify-between py-2 text-center">
										<div>
											<p className="font-mono text-xs uppercase tracking-[0.24em] text-[#8C8C8C] font-bold">Vulnerability Index</p>
											<p className="mt-1.5 text-sm text-[#5E5E5E] leading-relaxed max-w-[220px] mx-auto">
												Weighted risk of tasks matching standard automation benchmarks
											</p>
										</div>

										{/* Radial Gauge SVG */}
										<div className="relative h-48 w-48 my-6 flex items-center justify-center">
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
													stroke={overallScore > 65 ? '#B85C5C' : overallScore > 35 ? '#C88D4E' : '#5A7A8F'}
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
												<span className="font-mono text-[10px] uppercase tracking-widest text-[#8C8C8C] font-bold mt-1">Index Score</span>
											</div>
										</div>

										<div className={`rounded-full px-5 py-1.5 font-mono text-xs uppercase tracking-wider font-bold ${
											overallScore > 65
												? 'text-[#B85C5C] bg-[#B85C5C]/10'
												: overallScore > 35
													? 'text-[#C88D4E] bg-[#C88D4E]/10'
													: 'text-[#5A7A8F] bg-[#5A7A8F]/10'
										}`}>
											{overallScore > 65 ? 'High Risk Career' : overallScore > 35 ? 'Medium Risk Career' : 'Low Risk / High Resilience'}
										</div>
									</div>

									{/* Donut Task Mix */}
									<div className="flex flex-col items-center justify-between py-2 text-center">
										<div>
											<p className="font-mono text-xs uppercase tracking-[0.24em] text-[#8C8C8C] font-bold">Task Risk Composition</p>
											<p className="mt-1.5 text-sm text-[#5E5E5E] leading-relaxed max-w-[220px] mx-auto">
												Hover segments to isolate corresponding tasks below
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
															onMouseEnter={() => setHoveredDonutSlice(slice.category)}
															onMouseLeave={() => setHoveredDonutSlice(null)}
															onClick={() => setTaskFilter(slice.category)}
															className="cursor-pointer transition-all duration-300"
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
														<span className="text-3xl font-extrabold capitalize" style={{ color: hoveredDonutSlice === 'high' ? '#B85C5C' : hoveredDonutSlice === 'medium' ? '#C88D4E' : '#5A7A8F' }}>
															{weights[hoveredDonutSlice]}%
														</span>
														<span className="font-mono text-xs uppercase tracking-wider mt-0.5" style={{ color: '#8C8C8C' }}>{hoveredDonutSlice} Risk</span>
													</>
												) : (
													<>
														<span className="text-3xl font-extrabold" style={{ color: '#1A1A1A' }}>
															{careerDetail.tasks.length}
														</span>
														<span className="font-mono text-xs uppercase tracking-wider mt-0.5" style={{ color: '#8C8C8C' }}>Total Tasks</span>
													</>
												)}
											</div>
										</div>

										{/* Donut Legend */}
										<div className="flex gap-4 justify-center text-xs font-mono w-full px-2 text-[#5E5E5E]">
											<button
												onClick={() => setTaskFilter(taskFilter === 'high' ? 'all' : 'high')}
												className={`flex items-center gap-1.5 transition ${taskFilter === 'high' ? 'opacity-100 font-bold scale-105 text-[#1A1A1A]' : 'opacity-70 hover:opacity-100'}`}
											>
												<span className="h-2.5 w-2.5 rounded-full bg-[#B85C5C]"></span>
												<span>H: {weights.high}%</span>
											</button>
											<button
												onClick={() => setTaskFilter(taskFilter === 'medium' ? 'all' : 'medium')}
												className={`flex items-center gap-1.5 transition ${taskFilter === 'medium' ? 'opacity-100 font-bold scale-105 text-[#1A1A1A]' : 'opacity-70 hover:opacity-100'}`}
											>
												<span className="h-2.5 w-2.5 rounded-full bg-[#C88D4E]"></span>
												<span>M: {weights.medium}%</span>
											</button>
											<button
												onClick={() => setTaskFilter(taskFilter === 'low' ? 'all' : 'low')}
												className={`flex items-center gap-1.5 transition ${taskFilter === 'low' ? 'opacity-100 font-bold scale-105 text-[#1A1A1A]' : 'opacity-70 hover:opacity-100'}`}
											>
												<span className="h-2.5 w-2.5 rounded-full bg-[#5A7A8F]"></span>
												<span>L: {weights.low}%</span>
											</button>
										</div>
									</div>

								</div>

							</div>

							{/* RIGHT SIDE: Upskilling Simulator Sliders (5 columns) */}
							<div className="lg:col-span-5 grid gap-10">
								
								<div className="py-2">
									
									<div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-6">
										<div>
											<p className="font-mono text-xs uppercase tracking-[0.25em] text-[#8C8C8C] font-bold">Simulator</p>
											<h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1A1A1A]">Upskilling Simulator</h3>
										</div>
										{isCustomized && (
											<button
												onClick={handleResetWeights}
												className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#5E5E5E] hover:text-[#1A1A1A] hover:border-gray-400 transition"
											>
												Reset
											</button>
										)}
									</div>

									<p className="text-base leading-relaxed text-[#5E5E5E] mb-8 font-normal">
										Adjust sliders to simulate career upskilling: delegate routine workloads and increase focus on complex strategy, management, or design to calculate your updated vulnerability score.
									</p>

									{/* Sliders Container with generous vertical spacing */}
									<div className="space-y-8">
										
										{/* Slider 1: High Risk */}
										<div className="py-1">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2.5">
													<span className="h-3 w-3 rounded-full bg-[#B85C5C]"></span>
													<span className="text-base font-bold text-[#1A1A1A]">Routine Tasks (High Risk)</span>
												</div>
												<span className="font-mono text-base font-black text-[#B85C5C]">{weights.high}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="100"
												value={weights.high}
												onChange={(e) => handleSliderChange('high', parseInt(e.target.value))}
												className="w-full accent-[#5A7A8F] h-2 rounded-lg bg-[#E5E5E5] outline-none cursor-pointer"
											/>
											<p className="text-xs leading-relaxed text-[#5E5E5E] mt-2">
												Repetitive work like scheduling, typing, transcription, sorting, data formatting.
											</p>
										</div>

										{/* Slider 2: Medium Risk */}
										<div className="py-1">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2.5">
													<span className="h-3 w-3 rounded-full bg-[#C88D4E]"></span>
													<span className="text-base font-bold text-[#1A1A1A]">Analytical Tasks (Medium Risk)</span>
												</div>
												<span className="font-mono text-base font-black text-[#C88D4E]">{weights.medium}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="100"
												value={weights.medium}
												onChange={(e) => handleSliderChange('medium', parseInt(e.target.value))}
												className="w-full accent-[#5A7A8F] h-2 rounded-lg bg-[#E5E5E5] outline-none cursor-pointer"
											/>
											<p className="text-xs leading-relaxed text-[#5E5E5E] mt-2">
												Basic analysis, template drafting, inspection, monitoring, routine audits.
											</p>
										</div>

										{/* Slider 3: Low Risk */}
										<div className="py-1">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2.5">
													<span className="h-3 w-3 rounded-full bg-[#5A7A8F]"></span>
													<span className="text-base font-bold text-[#1A1A1A]">Resilient Tasks (Low Risk)</span>
												</div>
												<span className="font-mono text-base font-black text-[#5A7A8F]">{weights.low}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="100"
												value={weights.low}
												onChange={(e) => handleSliderChange('low', parseInt(e.target.value))}
												className="w-full accent-[#5A7A8F] h-2 rounded-lg bg-[#E5E5E5] outline-none cursor-pointer"
											/>
											<p className="text-xs leading-relaxed text-[#5E5E5E] mt-2">
												Complex strategy, negotiation, creative innovation, leadership, deep empathy.
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
											<p className="font-mono text-xs uppercase tracking-wider text-[#8C8C8C] font-bold">Simulator Verdict</p>
											<p className="text-sm font-bold text-[#1A1A1A] mt-1">
												{isCustomized ? 'Simulating customized upskilled state' : 'Reflecting standard O*NET benchmark'}
											</p>
										</div>
										<span className="text-2xl font-black text-[#1A1A1A] font-mono">{overallScore}</span>
									</div>

								</div>

							</div>

						</div>
					)}

					{/* Task Breakdown Section */}
					{!loadingDetail && careerDetail && (
						<div className="py-4">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
								<div>
									<h3 className="text-xl font-bold text-[#1A1A1A]">O*NET Task Deconstruction</h3>
									<p className="text-xs text-[#5E5E5E] mt-1">Click segmented categories below to filter and view the exact task strings and classification justifications.</p>
								</div>
								
								{/* Filtering Segment Tabs */}
								<div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200">
									{(['all', 'high', 'medium', 'low'] as const).map((cat) => (
										<button
											key={cat}
											onClick={() => setTaskFilter(cat)}
											className={`rounded-lg px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider transition ${
												taskFilter === cat
													? 'bg-[#1A1A1A] text-white font-bold'
													: 'text-[#5E5E5E] hover:text-[#1A1A1A]'
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
									<div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-xs font-mono text-[#8C8C8C]">
										No tasks found matching this risk level.
									</div>
								) : (
									filteredTasks.map((task) => (
										<div
											key={task.id}
											className={`group relative rounded-xl border p-4 transition-all duration-200 bg-white ${
												task.risk === 'high'
													? 'border-gray-200 hover:border-[#B85C5C]/50'
													: task.risk === 'medium'
														? 'border-gray-200 hover:border-[#C88D4E]/50'
														: 'border-gray-200 hover:border-[#5A7A8F]/50'
											}`}
										>
											<div className="flex items-start justify-between gap-4 mb-2.5">
												<span className="font-mono text-[9px] uppercase tracking-wider text-[#8C8C8C] font-bold">
													TASK ID #{task.id} • <span className="text-[#5E5E5E] font-semibold">{task.type}</span>
												</span>
												<span className={`rounded-full px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-widest font-bold ${
													task.risk === 'high'
														? 'bg-[#B85C5C]/10 text-[#B85C5C]'
														: task.risk === 'medium'
															? 'bg-[#C88D4E]/10 text-[#C88D4E]'
															: 'bg-[#5A7A8F]/10 text-[#5A7A8F]'
												}`}>
													{task.risk} Risk
												</span>
											</div>
											<p className="text-sm leading-relaxed text-[#1A1A1A] font-medium">{task.text}</p>
											
											<div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2">
												<svg className={`h-4 w-4 shrink-0 mt-0.5 ${
													task.risk === 'high' ? 'text-[#B85C5C]' : task.risk === 'medium' ? 'text-[#C88D4E]' : 'text-[#5A7A8F]'
												}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<p className="text-xs text-[#5E5E5E] italic leading-relaxed">
													<span className="font-mono not-italic text-[10px] uppercase font-bold tracking-wider mr-1" style={{ color: task.risk === 'high' ? '#B85C5C' : task.risk === 'medium' ? '#C88D4E' : '#5A7A8F' }}>
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
					<div className="py-6">
						<div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
							<div>
								<h3 className="text-xl font-bold text-[#1A1A1A]">Interactive Career Finder</h3>
								<p className="text-xs text-[#5E5E5E] mt-1">Filter, sort, and discover jobs matching your AI risk tolerance and salary targets.</p>
							</div>
							<button
								onClick={() => {
									setFinderSearchQuery('');
									setMinVulnerability(0);
									setMaxVulnerability(100);
									setMinSalaryFilter(0);
									setDemandFilter('all');
								}}
								className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-[#5E5E5E] hover:text-[#1A1A1A] hover:bg-gray-50 transition"
							>
								Clear Filters
							</button>
						</div>

						{/* Filters Grid */}
						<div className="grid gap-6 md:grid-cols-12 items-end">
							{/* Column 1: Search & Demand */}
							<div className="md:col-span-4 space-y-4">
								<div>
									<label htmlFor="finder-search" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#8C8C8C] font-bold mb-2">
										Search Job Title
									</label>
									<input
										id="finder-search"
										type="text"
										placeholder="e.g. Designer, Analyst..."
										value={finderSearchQuery}
										onChange={(e) => setFinderSearchQuery(e.target.value)}
										className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-gray-400 outline-none transition focus:border-[#5A7A8F]"
									/>
								</div>
								<div>
									<label htmlFor="finder-demand" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#8C8C8C] font-bold mb-2">
										Market Demand
									</label>
									<select
										id="finder-demand"
										value={demandFilter}
										onChange={(e) => setDemandFilter(e.target.value)}
										className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#5A7A8F]"
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
									<label htmlFor="finder-salary" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#8C8C8C] font-bold mb-2">
										Minimum Annual Salary
									</label>
									<select
										id="finder-salary"
										value={minSalaryFilter}
										onChange={(e) => setMinSalaryFilter(Number(e.target.value))}
										className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#5A7A8F]"
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
									<label htmlFor="finder-sort" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#8C8C8C] font-bold mb-2">
										Sort Results
									</label>
									<div className="flex gap-2">
										<select
											id="finder-sort"
											value={sortField}
											onChange={(e) => setSortField(e.target.value as any)}
											className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#5A7A8F]"
										>
											<option value="risk_score">AI Vulnerability</option>
											<option value="title">Occupation Name</option>
											<option value="salary">Median Salary</option>
											<option value="demand">Demand Level</option>
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

							{/* Column 3: The Vulnerability Sliders (Min and Max range) */}
							<div className="md:col-span-4 p-4 space-y-4">
								<div className="flex items-center justify-between">
									<label className="text-xs font-bold text-[#1A1A1A]">
										Vulnerability Range
									</label>
									<span className="font-mono text-xs font-extrabold text-[#5A7A8F]">
										{minVulnerability}% – {maxVulnerability}%
									</span>
								</div>

								<div className="space-y-3">
									{/* Min Slider */}
									<div>
										<div className="flex items-center justify-between mb-1.5">
											<span className="font-mono text-[9px] uppercase tracking-wider text-[#8C8C8C] font-bold">Min Vulnerability</span>
											<span className="font-mono text-[10px] text-[#5E5E5E] font-semibold">{minVulnerability}%</span>
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
											className="w-full accent-[#5A7A8F] h-1.5 rounded-lg bg-gray-200 outline-none cursor-pointer"
										/>
									</div>

									{/* Max Slider */}
									<div>
										<div className="flex items-center justify-between mb-1.5">
											<span className="font-mono text-[9px] uppercase tracking-wider text-[#8C8C8C] font-bold">Max Vulnerability</span>
											<span className="font-mono text-[10px] text-[#5E5E5E] font-semibold">{maxVulnerability}%</span>
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
											className="w-full accent-[#5A7A8F] h-1.5 rounded-lg bg-gray-200 outline-none cursor-pointer"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Results Card */}
					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm overflow-hidden">
						<div className="flex items-center justify-between mb-6">
							<span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#5A7A8F] font-bold">
								Found {filteredFinderCareers.length} Matching Careers
							</span>
						</div>

						{/* Results Table */}
						<div className="overflow-x-auto w-full rounded-2xl border border-gray-200 bg-white">
							<table className="min-w-full divide-y divide-gray-200 text-left border-collapse">
								<thead>
									<tr className="bg-white border-b border-gray-200 font-mono text-[9.5px] uppercase tracking-[0.15em] text-[#5E5E5E]">
										<th scope="col" className="px-6 py-4 font-bold">Occupation Title</th>
										<th scope="col" className="px-6 py-4 font-bold text-center">Vulnerability Score</th>
										<th scope="col" className="px-6 py-4 font-bold">Est. Salary</th>
										<th scope="col" className="px-6 py-4 font-bold">Market Demand</th>
										<th scope="col" className="px-6 py-4 font-bold text-right">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 text-sm">
									{paginatedFinderCareers.length === 0 ? (
										<tr>
											<td colSpan={5} className="px-6 py-12 text-center font-mono text-xs text-[#8C8C8C] italic">
												No careers found matching current criteria. Try widening your filters.
											</td>
										</tr>
									) : (
										paginatedFinderCareers.map((item) => (
											<tr
												key={item.code}
												className="hover:bg-gray-50 bg-white transition group cursor-pointer"
												onClick={() => handleSelectFromExplorer(item.code)}
											>
												<td className="px-6 py-4">
													<div className="font-bold text-[#1A1A1A] group-hover:text-[#5A7A8F] transition line-clamp-1">{item.title}</div>
													<div className="font-mono text-[9px] text-[#8C8C8C] uppercase mt-0.5">{item.code}</div>
												</td>
												<td className="px-6 py-4 text-center">
													<div className="flex items-center justify-center gap-2">
														{/* Mini color bar */}
														<div className="w-12 bg-gray-100 h-2 rounded-full overflow-hidden hidden sm:block">
															<div
																className="h-full rounded-full"
																style={{
																	width: `${item.risk_score}%`,
																	backgroundColor: item.risk_score > 65 ? '#B85C5C' : item.risk_score > 35 ? '#C88D4E' : '#5A7A8F'
																}}
															></div>
														</div>
														<span className={`font-mono text-xs font-bold leading-none ${
															item.risk_score > 65 ? 'text-[#B85C5C]' : item.risk_score > 35 ? 'text-[#C88D4E]' : 'text-[#5A7A8F]'
														}`}>
															{item.risk_score}%
														</span>
													</div>
												</td>
												<td className="px-6 py-4 font-bold text-[#1A1A1A] font-mono">
													{formatUSD(item.salary)}
												</td>
												<td className="px-6 py-4">
													<span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9.5px] font-bold font-mono uppercase border ${
														item.demand === 'Very High'
															? 'bg-[#5A7A8F]/10 text-[#5A7A8F] border-transparent'
															: item.demand === 'High'
																? 'bg-[#5A7A8F]/10 text-[#5A7A8F] border-transparent'
																: item.demand === 'Medium'
																	? 'bg-gray-100 text-[#5E5E5E] border-transparent'
																	: 'bg-gray-100 text-[#8C8C8C] border-transparent'
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
															className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm"
														>
															+ Compare
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleSelectFromExplorer(item.code);
															}}
															className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm"
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
							<div className="flex items-center justify-between mt-6 border-t border-gray-200 pt-4">
								<span className="font-mono text-[10px] text-[#8C8C8C]">
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

			{/* ==================== VIEW 3: MACRO CLUSTER EXPLORER ==================== */}
			{activeView === 'explorer' && (
				<div className="grid gap-8">
					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Macro Career Clusters</h3>
						<p className="text-xs text-[#5E5E5E] leading-relaxed max-w-3xl">
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
