import React, { useState, useEffect, useRef, useMemo } from 'react';
import CompareDeck, { type CompareItem } from './CompareDeck';
import { CAREER_AI_NEXT, CAREER_AI_WORDS, type CareerAiWord } from '../../../lib/calculators/careerAiCopy';

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

/** A full-time week. The simulator counts hours against this number, not against 100. */
const WEEK_HOURS = 40;

/**
 * A definition behind a `(?)` marker.
 *
 * CSS-only disclosure: `group-hover` covers a pointer, `group-focus-within` covers a keyboard and a
 * tap. Hovering the button opens it, so there is no open state to keep in sync across the three
 * panel headers.
 */
function InfoTip({ label, plain, id, align = 'left' }: { label: string; plain: string; id: string; align?: 'left' | 'right' }) {
	if (!plain) return null;
	return (
		// No `relative` here: the box is anchored to the panel header row that wraps it, so a tooltip
		// opened from a label 150px into a 390px screen still fits instead of pushing the page sideways.
		<span className="group/info inline-flex align-middle">
			<button
				type="button"
				aria-label={`What ${label} means`}
				aria-describedby={id}
				className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#D8D8D8] bg-white font-mono text-[10px] font-bold text-[#5F5B52] transition hover:border-[#1A1A1A] hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
			>
				?
			</button>
			<span
				id={id}
				role="tooltip"
				className={`pointer-events-none absolute top-full z-50 mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-lg border border-[#E5E5E5] bg-white p-2.5 text-[11px] font-normal normal-case leading-5 tracking-normal text-[#5E5E5E] opacity-0 shadow-xl transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100 ${
					align === 'right' ? 'right-0' : 'left-0'
				}`}
			>
				{plain}
			</span>
		</span>
	);
}

interface CareerAiProps {
	/** Definitions behind the (?) markers. Defaults to the canonical copy module. */
	words?: CareerAiWord[];
	/** The three action steps below the panels. */
	nextSteps?: string[];
}

export default function CareerAiResilienceCalculator({ words = CAREER_AI_WORDS, nextSteps = CAREER_AI_NEXT }: CareerAiProps = {}) {
	/**
	 * Two views: the role (its pay, exposure and week) and the map. The filterable A–Z table is not a
	 * third peer — it is the index of roles, opened from the search field and rendered inside the role
	 * panel, so the tab state never disagrees with the panel on screen.
	 */
	const [activeView, setActiveView] = useState<'role' | 'map'>('role');
	const [showBrowse, setShowBrowse] = useState(false);

	/** Task ids the reader says AI could take over. Removed from the week, not re-scored. */
	const [delegated, setDelegated] = useState<string[]>([]);

	const definition = (term: string) => words.find((word) => word.term === term)?.plain ?? '';

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
	const [showFullDesc, setShowFullDesc] = useState(false);
	// Eight task cards is about one screen of scanning. The rest is a click away rather than a
	// 5,000px inner scroll area inside an already-scrolling page.
	const [showAllTasks, setShowAllTasks] = useState(false);
	
	// Hover states for donut chart
	const [hoveredDonutSlice, setHoveredDonutSlice] = useState<'high' | 'medium' | 'low' | null>(null);

	// Explorer scatter plot states
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
				setActiveView('role');
				setShowBrowse(false);
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
				setDelegated([]);
				setTaskFilter('all');
				setShowFullDesc(false);
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
		if (activeView === 'map' && scatterContainerRef.current) {
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
		setDelegated([]);
	};

	/**
	 * Hand a task to AI, or take it back.
	 *
	 * This is the concrete half of the simulator: instead of asking someone to guess what "26%
	 * repetitive" means, the task list lets them point at the tasks and the week loses their hours.
	 */
	const toggleDelegation = (task: Task) => {
		if (!task.risk || task.score === null) return;
		setDelegated((current) => (current.includes(task.id) ? current.filter((id) => id !== task.id) : [...current, task.id]));
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

	// Sum of task weight per bucket, so a task can be turned into hours.
	const bucketWeight = useMemo(() => {
		const acc = { high: 0, medium: 0, low: 0 } as Record<'high' | 'medium' | 'low', number>;
		for (const task of careerDetail?.tasks ?? []) {
			if (!task.risk || task.score === null) continue;
			acc[task.risk] += task.weight ?? 1;
		}
		return acc;
	}, [careerDetail]);

	const hoursFromPct = (pct: number) => (pct / 100) * WEEK_HOURS;

	/**
	 * The week, in hours, after the reader's own edits.
	 *
	 * Two inputs: the slider mix (a full week, split), and the tasks handed to AI (removed from that
	 * week). The score is the weighted mean over the hours that remain — the same quantity the
	 * published index reports, applied to a smaller week. Nothing is re-scored, so a task cannot
	 * change how automatable it is by being delegated; it only stops counting.
	 */
	const week = useMemo(() => {
		const hours = { high: hoursFromPct(weights.high), medium: hoursFromPct(weights.medium), low: hoursFromPct(weights.low) };
		const removed = { high: 0, medium: 0, low: 0 } as Record<'high' | 'medium' | 'low', number>;

		for (const task of careerDetail?.tasks ?? []) {
			if (!delegated.includes(task.id) || !task.risk || task.score === null) continue;
			const share = bucketWeight[task.risk] > 0 ? (task.weight ?? 1) / bucketWeight[task.risk] : 0;
			removed[task.risk] += share * hours[task.risk];
		}

		const left = {
			high: Math.max(0, hours.high - removed.high),
			medium: Math.max(0, hours.medium - removed.medium),
			low: Math.max(0, hours.low - removed.low)
		};
		const total = left.high + left.medium + left.low;
		/**
		 * The denominator is the whole week, not the hours that are left.
		 *
		 * That is the question this panel answers: how much of a 40-hour week's work is work AI can
		 * already do. A task handed over stops being part of that figure, so the number can only fall —
		 * renominating over the remaining hours instead would let handing work over *raise* the score,
		 * because the tasks you drop are rarely the most automatable ones.
		 */
		const addressed = left.high * bucketMeans.high + left.medium * bucketMeans.medium + left.low * bucketMeans.low;

		return {
			hours,
			removed,
			left,
			total,
			handedOver: removed.high + removed.medium + removed.low,
			score: Math.round((100 * addressed) / WEEK_HOURS)
		};
	}, [weights, delegated, careerDetail, bucketMeans, bucketWeight]);

	/** Task weight converted to hours inside its bucket, at the current slider mix. */
	const taskHours = (task: Task) => {
		if (!task.risk || task.score === null) return 0;
		const total = bucketWeight[task.risk];
		if (total <= 0) return 0;
		return ((task.weight ?? 1) / total) * hoursFromPct(weights[task.risk]);
	};

	const overallScore = week.score;
	/** True once the reader has moved the week off its published shape, by either control. */
	const isEdited = isCustomized || delegated.length > 0;

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
	// The map reads the same search field as the rest of the page: one input, one filter string.
	const filteredExplorerCareers = useMemo(() => {
		const plottable = indexData.filter((item) => item.risk_score !== null);
		if (!searchQuery.trim()) return plottable;
		const q = searchQuery.toLowerCase();
		return plottable.filter((item) =>
			item.title.toLowerCase().includes(q) || item.code.includes(q)
		);
	}, [searchQuery, indexData]);

	const handleScatterMouseMove = (e: React.MouseEvent<any>, item: OccupationIndexItem) => {
		if (!scatterContainerRef.current) return;
		const rect = scatterContainerRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top - 10;
		const isRightHalf = x > rect.width * 0.6;
		setTooltipPos({ x, y, isRightHalf });
		setHoveredScatterCareer(item);
	};

	// Selection shortcut from the map or the index: open that role and get out of the way.
	const openRole = (code: string) => {
		setSelectedCode(code);
		setSearchQuery('');
		setShowSuggestions(false);
		setActiveView('role');
		setShowBrowse(false);
		window.scrollTo({ top: 180, behavior: 'smooth' });
	};

	/**
	 * Open the index of roles, carrying whatever is typed in the search field.
	 *
	 * The index used to be a peer tab called "Find a job", which read as a second way to choose a
	 * role. It is the same job list — so it opens from the search field, filters on the same text, and
	 * hands the reader back to the role they click.
	 */
	const openBrowse = (query = searchQuery) => {
		setFinderSearchQuery(query);
		setShowBrowse(true);
		setShowSuggestions(false);
		setActiveView('role');
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
	const visibleTasks = showAllTasks ? filteredTasks : filteredTasks.slice(0, 8);

	return (
		<div className="w-full text-[#5E5E5E] font-sans">
			{/* Persistent header: one search field, one view switch, one way into the role index. */}
			<div className="mb-3 rounded-xl border border-gray-200 bg-white p-2.5">
				<div className="flex flex-col gap-2.5 md:flex-row md:items-center">
					<div ref={suggestionsRef} className="relative w-full md:max-w-md">
						<div className="relative">
							<input
								id="career-search"
								type="text"
								role="combobox"
								aria-expanded={showSuggestions && suggestions.length > 0}
								aria-controls="career-suggestions"
								aria-autocomplete="list"
								placeholder="Search 1,000+ job titles (e.g. Registered Nurse, Accountant)..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setShowSuggestions(true);
								}}
								onFocus={() => setShowSuggestions(true)}
								onKeyDown={(e) => {
									if (e.key === 'Escape') setShowSuggestions(false);
									if (e.key === 'Enter' && suggestions.length > 0) openRole(suggestions[0].code);
								}}
								className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-xs sm:text-sm font-medium text-[#1A1A1A] outline-none transition focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]"
							/>
							<svg
								className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							{searchQuery && (
								<button
									onClick={() => {
										setSearchQuery('');
										setShowSuggestions(false);
									}}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-gray-800"
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
								className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl"
							>
								{suggestions.map((item) => (
									<button
										key={item.code}
										role="option"
										aria-selected={selectedCode === item.code}
										onClick={() => openRole(item.code)}
										className="flex w-full flex-col border-b border-gray-100 px-3.5 py-2.5 text-left transition last:border-0 hover:bg-gray-50"
									>
										<span className="text-xs sm:text-sm font-semibold text-[#1A1A1A]">{item.title}</span>
										<span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[#5F5B52]">
											{formatUSD(item.salary)} median · {item.risk_score}/100 exposure
										</span>
									</button>
								))}
								<button
									type="button"
									onClick={() => openBrowse(searchQuery)}
									className="w-full px-3.5 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-[#475F73] transition hover:bg-gray-50 hover:text-[#1A1A1A]"
								>
									Browse every matching role →
								</button>
							</div>
						)}
						{showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
							<div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-center font-mono text-xs text-[#5F5B52] shadow-2xl">
								No match. Try a shorter job title.
							</div>
						)}
					</div>

					<div role="tablist" aria-label="Calculator views" className="flex shrink-0 rounded-lg border border-[#E5E5E5] bg-gray-50 p-0.5">
						{([
							{ id: 'role' as const, label: 'Role', panel: 'panel-role' },
							{ id: 'map' as const, label: 'Map', panel: 'panel-map' }
						]).map((tab) => (
							<button
								key={tab.id}
								role="tab"
								id={`tab-${tab.id}`}
								aria-selected={activeView === tab.id}
								aria-controls={tab.panel}
								onClick={() => setActiveView(tab.id)}
								className={`min-h-[36px] rounded-md px-4 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] ${
									activeView === tab.id ? 'bg-[#1A1A1A] text-white' : 'text-[#5F5B52] hover:text-[#1A1A1A]'
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					<div className="flex items-center gap-1.5 md:ml-auto">
						<button
							type="button"
							onClick={() => openBrowse('')}
							className="inline-flex min-h-[36px] items-center rounded-lg border border-[#E5E5E5] bg-white px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] transition hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
						>
							{indexData.length > 0 ? `All ${indexData.length.toLocaleString('en-US')} roles` : 'All roles'}
						</button>
					</div>
				</div>

				{/* Popular quick selector pills */}
				<div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2">
					<span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5F5B52]">Popular:</span>
					{[
						{ title: 'Chief Execs', code: '11-1011.00' },
						{ title: 'Software Devs', code: '15-1252.00' },
						{ title: 'Financial Mgrs', code: '11-3031.00' },
						{ title: 'Accountants', code: '13-2011.00' },
						{ title: 'Nurses', code: '29-1141.00' }
					].map((trend) => (
						<button
							key={trend.code}
							onClick={() => openRole(trend.code)}
							className={`inline-flex min-h-[32px] items-center rounded-full border px-3 py-1 text-xs font-medium transition duration-150 sm:min-h-0 ${
								selectedCode === trend.code && !showBrowse
									? 'border-[#1A1A1A] bg-[#1A1A1A] font-bold text-white'
									: 'border-gray-300 bg-white text-[#5E5E5E] hover:border-gray-400 hover:text-[#1A1A1A]'
							}`}
						>
							{trend.title}
						</button>
					))}
				</div>
			</div>

			{/* ==================== VIEW 1: THE ROLE ==================== */}
			{activeView === 'role' && !showBrowse && (
				<div role="tabpanel" id="panel-role" aria-labelledby="tab-role" className="space-y-3">
					{/* Loading Detail Overlay */}
					{loadingDetail && (
						<div className="flex h-72 items-center justify-center py-8">
							<div className="flex flex-col items-center gap-3">
								<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-transparent"></div>
								<span className="animate-pulse font-mono text-xs uppercase tracking-widest text-[#5F5B52]">Loading Career Data...</span>
							</div>
						</div>
					)}

					{!loadingDetail && careerDetail && (
						<>
							{/* ==================== TRI-PANEL: ROLE & PAY · EXPOSURE & TASKS · WEEK ==================== */}
							<div className="grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-3 xl:gap-4">

								{/* PANEL 1 — ROLE & PAY. Compensation stays in one card: picking a state changes
								    the figure here, and the full 48-state panel is an anchor away. */}
								<div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
									<div className="mb-2 flex items-center gap-2">
										<span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">Role</span>
										<span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#5F5B52]">
											SOC {careerDetail.code}
										</span>
									</div>
									<h2 className="text-lg font-black leading-tight tracking-tight text-[#1A1A1A] sm:text-xl" title={careerDetail.title}>
										{careerDetail.title}
									</h2>

									<div className="mb-2.5 mt-1.5 text-xs leading-relaxed text-[#5E5E5E]">
										<p className={showFullDesc ? '' : 'line-clamp-3'}>{careerDetail.description}</p>
										{careerDetail.description.length > 150 && (
											<button
												onClick={() => setShowFullDesc(!showFullDesc)}
												className="mt-0.5 inline-flex min-h-[28px] items-center font-mono text-[10px] font-bold text-[#475F73] hover:text-[#1A1A1A] hover:underline"
											>
												{showFullDesc ? 'Show less' : 'Read more'}
											</button>
										)}
									</div>

									<div className="rounded-xl border border-gray-200/70 bg-gray-50/80 p-2.5">
										<div className="flex items-baseline justify-between gap-2">
											<p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#5F5B52]">National median</p>
											<p className="font-mono text-sm font-black text-[#1A1A1A]">{formatUSD(careerDetail.salary)}</p>
										</div>

										{careerDetail.state_wages && stateWageEntries.length >= 5 ? (
											<div className="mt-2 border-t border-gray-200/70 pt-2">
												<label htmlFor="role-state-pick" className="block font-mono text-[9px] font-bold uppercase tracking-wider text-[#5F5B52]">
													Pay in your state
												</label>
												<select
													id="role-state-pick"
													value={statePick}
													onChange={(e) => setStatePick(e.target.value)}
													className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-[#1A1A1A] outline-none transition focus:border-[#1A1A1A]"
												>
													<option value="">Select state...</option>
													{stateWageNames.map((name) => (
														<option key={name} value={name}>{name}</option>
													))}
												</select>

												{pickedStatePay !== null ? (
													<div className="mt-1.5">
														<div className="flex items-baseline justify-between gap-2">
															<span className="font-mono text-base font-black text-[#1A1A1A]">{formatUSD(pickedStatePay)}</span>
															<span className="font-mono text-[10px] font-bold text-[#5F5B52]">
																#{pickedStateRank} of {stateWageEntries.length}
															</span>
														</div>
														<div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
															<div
																className="h-full rounded-full bg-[#5A7A8F]"
																style={{ width: `${Math.max(3, (1 - (pickedStateRank - 1) / Math.max(1, stateWageEntries.length - 1)) * 100)}%` }}
															/>
														</div>
														<p className="mt-1 text-[10px] leading-4 text-[#5F5B52]">
															{formatUSD(stateWageEntries[stateWageEntries.length - 1][1])} – {formatUSD(stateWageEntries[0][1])} across {stateWageEntries.length} states.
														</p>
													</div>
												) : statePick === '' ? (
													<p className="mt-1.5 text-[11px] leading-5 text-[#5E5E5E]">Pick a state for its own survey estimate.</p>
												) : (
													<p className="mt-1.5 text-[11px] leading-5 text-[#5E5E5E]">BLS published no estimate for {statePick} in this occupation.</p>
												)}

												<a href="#state-wages" className="mt-1.5 inline-block font-mono text-[10px] font-bold text-[#475F73] hover:text-[#1A1A1A] hover:underline">
													Compare all {stateWageEntries.length} states ↓
												</a>
											</div>
										) : (
											<div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-200/70 pt-2">
												<div>
													<p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#5F5B52]">Employment band</p>
													<p className="mt-0.5 text-xs font-bold text-[#1A1A1A]">{careerDetail.employment_band || 'National sample'}</p>
												</div>
												{careerDetail.employment && (
													<div className="text-right">
														<p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#5F5B52]">Employed</p>
														<p className="mt-0.5 font-mono text-xs font-bold text-[#1A1A1A]">{careerDetail.employment.toLocaleString()}</p>
													</div>
												)}
											</div>
										)}
									</div>

									<div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-2 font-mono text-[9.5px] uppercase tracking-wider text-[#5F5B52]">
										{careerDetail.employment_band && <span>Employment {careerDetail.employment_band}</span>}
										{careerDetail.salary_vintage && <span>{careerDetail.salary_vintage}</span>}
									</div>
								</div>

								{/* PANEL 2 — EXPOSURE & TASKS. Score, composition and the way into the task list,
								    kept as one argument. */}
								<div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
									<div className="relative mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
										<p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">AI exposure score</p>
										<InfoTip id="tip-exposure" label="AI exposure score" plain={definition('Task exposure')} />
									</div>

									<div className="flex items-center justify-center gap-3">
										{/* The score, as an arc */}
										<div className="relative my-1 flex h-24 w-24 items-center justify-center" role="img" aria-label={`AI exposure ${overallScore} out of 100`}>
											<svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
												<circle cx="60" cy="60" r="48" fill="transparent" stroke="#E5E5E5" strokeWidth="7" />
												<circle
													cx="60"
													cy="60"
													r="48"
													fill="transparent"
													stroke={overallScore > 65 ? '#A55252' : overallScore > 35 ? '#96693A' : '#5A7A8F'}
													strokeWidth="7"
													strokeDasharray="301.59"
													strokeDashoffset={301.59 - (overallScore / 100) * 301.59}
													strokeLinecap="round"
													style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.5s ease-out' }}
												/>
											</svg>
											<div className="absolute inset-0 flex flex-col items-center justify-center">
												<span className="text-2xl font-black tracking-tight text-[#1A1A1A]">{overallScore}</span>
												<span className="font-mono text-[8.5px] font-bold uppercase tracking-widest text-[#5F5B52]">of 100</span>
											</div>
										</div>

										{/* The mix, as a donut. Hover a slice or a row to isolate it. */}
										<div className="relative my-1 flex h-24 w-24 items-center justify-center">
											<svg className="h-full w-full -rotate-90" viewBox="-120 -120 240 240" aria-hidden="true">
												{donutSlices.map((slice) => {
													const isHovered = hoveredDonutSlice === slice.category;
													return (
														<g
															key={slice.category}
															role="button"
															tabIndex={0}
															aria-label={`${bucketLabel[slice.category]}: ${weights[slice.category]}% of the job`}
															onMouseEnter={() => setHoveredDonutSlice(slice.category)}
															onMouseLeave={() => setHoveredDonutSlice(null)}
															onFocus={() => setHoveredDonutSlice(slice.category)}
															onBlur={() => setHoveredDonutSlice(null)}
															onClick={() => setTaskFilter(taskFilter === slice.category ? 'all' : slice.category)}
															className="cursor-pointer transition-all duration-200"
														>
															<path
																d={drawSlicePath(slice.start, slice.end, isHovered ? 104 : 96)}
																fill={slice.color}
																stroke="#FFFFFF"
																strokeWidth="2.5"
																opacity={hoveredDonutSlice ? (isHovered ? 1.0 : 0.45) : 0.95}
																filter={isHovered ? `drop-shadow(0 0 6px ${slice.color})` : undefined}
															/>
														</g>
													);
												})}
												<circle cx="0" cy="0" r="52" fill="#FFFFFF" />
											</svg>
											<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
												{hoveredDonutSlice ? (
													<>
														<span className="text-lg font-black" style={{ color: hoveredDonutSlice === 'high' ? '#A55252' : hoveredDonutSlice === 'medium' ? '#96693A' : '#5A7A8F' }}>
															{weights[hoveredDonutSlice]}%
														</span>
														<span className="max-w-[62px] text-center font-mono text-[7.5px] uppercase leading-tight tracking-wider text-[#5F5B52]">
															{bucketLabel[hoveredDonutSlice]}
														</span>
													</>
												) : (
													<>
														<span className="text-lg font-black text-[#1A1A1A]">{careerDetail.tasks.length}</span>
														<span className="font-mono text-[7.5px] uppercase tracking-wider text-[#5F5B52]">tasks</span>
													</>
												)}
											</div>
										</div>
									</div>

									{/* Verdict for the current week */}
									<div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
										<span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
											overallScore > 65
												? 'bg-[#A55252]/10 text-[#A55252]'
												: overallScore > 35
													? 'bg-[#96693A]/10 text-[#96693A]'
													: 'bg-[#5A7A8F]/10 text-[#475F73]'
										}`}>
											{overallScore > 65 ? 'High exposure' : overallScore > 35 ? 'Mixed exposure' : 'Low exposure'}
										</span>
										{isEdited && scoreDelta !== 0 && (
											<span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
												scoreDelta < 0 ? 'bg-[#2E6F40]/10 text-[#2E6F40]' : 'bg-[#A55252]/10 text-[#A55252]'
											}`}>
												{scoreDelta < 0 ? '−' : '+'}{Math.abs(scoreDelta)} vs today
											</span>
										)}
									</div>

									<p className="mt-2 text-center text-[10.5px] leading-snug text-[#5E5E5E]">
										{(['high', 'medium', 'low'] as const).map((key, idx) => (
											<span key={key}>
												<strong className="font-bold" style={{ color: key === 'high' ? '#A55252' : key === 'medium' ? '#96693A' : '#5A7A8F' }}>
													{weights[key]}%
												</strong>{' '}
												{bucketSentence[key]}{idx < 2 ? ', ' : '.'}
											</span>
										))}
									</p>

									<div className="mt-2.5 border-t border-gray-100 pt-2">
										<div className="relative mb-1 flex items-center gap-1.5">
											<p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">Task composition</p>
											<InfoTip id="tip-composition" label="Task composition" plain={definition('Automation risk')} />
										</div>
										{(['high', 'medium', 'low'] as const).map((key) => (
											<button
												key={key}
												onClick={() => setTaskFilter(taskFilter === key ? 'all' : key)}
												aria-pressed={taskFilter === key}
												className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition duration-150 ${
													taskFilter === key ? 'border-gray-400 bg-gray-100 font-bold' : 'border-transparent bg-gray-50/70 hover:bg-gray-100/70'
												}`}
											>
												<span className="flex min-w-0 items-center gap-2">
													<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: key === 'high' ? '#A55252' : key === 'medium' ? '#96693A' : '#5A7A8F' }} />
													<span className={`truncate text-[12px] ${taskFilter === key ? 'font-bold text-[#1A1A1A]' : 'text-[#5E5E5E]'}`}>{bucketLabel[key]}</span>
												</span>
												<span className="flex shrink-0 items-baseline gap-1.5">
													<span className="font-mono text-[10px] text-[#5F5B52]">{week.hours[key].toFixed(1)} h</span>
													<span className="font-mono text-[12px] font-bold" style={{ color: key === 'high' ? '#A55252' : key === 'medium' ? '#96693A' : '#475F73' }}>
														{weights[key]}%
													</span>
												</span>
											</button>
										))}
									</div>

									<a
										href="#task-breakdown"
										className="mt-auto inline-flex items-center justify-center gap-1 pt-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#475F73] hover:text-[#1A1A1A] hover:underline"
									>
										Inspect {filteredTasks.length} tasks ↓
									</a>
								</div>

								{/* PANEL 3 — CHANGE YOUR WEEK. Hours, not percentages, and the tasks below feed it. */}
								<div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
									<div>
										<div className="relative mb-2 flex items-center justify-between border-b border-gray-100 pb-2.5">
											<div className="flex items-center gap-1.5">
												<p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">Change your week</p>
												<InfoTip id="tip-week" label="Change your week" plain={definition('Simulated week')} align="right" />
											</div>
											{isEdited && (
												<button
													onClick={handleResetWeights}
													className="rounded border border-gray-300 bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#5E5E5E] transition hover:border-gray-400 hover:text-[#1A1A1A]"
												>
													Reset
												</button>
											)}
										</div>
										<p className="mb-3 text-[11px] leading-snug text-[#5E5E5E]">
											A {WEEK_HOURS}-hour week. Move the hours here, or hand tasks over in the list below.
										</p>

										<div className="space-y-3">
											{(['high', 'medium', 'low'] as const).map((key) => (
												<div key={key}>
													<div className="mb-1 flex items-center justify-between gap-2">
														<div className="flex min-w-0 items-center gap-1.5">
															<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: key === 'high' ? '#A55252' : key === 'medium' ? '#96693A' : '#5A7A8F' }} />
															<span className="truncate text-xs font-bold text-[#1A1A1A]">{key === 'high' ? 'Repetitive work AI does' : key === 'medium' ? 'Work AI drafts, you decide' : 'Work that needs a person'}</span>
														</div>
														<span className="flex shrink-0 items-baseline gap-1.5">
															<span className="font-mono text-[10px] text-[#5F5B52]">{week.hours[key].toFixed(1)} h</span>
															<span className="font-mono text-xs font-black" style={{ color: key === 'high' ? '#A55252' : key === 'medium' ? '#96693A' : '#475F73' }}>
																{weights[key]}%
															</span>
														</span>
													</div>
													<input
														type="range"
														min="0"
														max="100"
														value={weights[key]}
														aria-label={`${bucketLabel[key]}, share of the ${WEEK_HOURS}-hour week`}
														onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
														className={`h-1.5 w-full cursor-pointer rounded-lg bg-gray-200 outline-none ${
															key === 'high' ? 'accent-[#A55252]' : key === 'medium' ? 'accent-[#96693A]' : 'accent-[#5A7A8F]'
														}`}
													/>
													<p className="mt-0.5 text-[10px] text-[#5F5B52]">
														{key === 'high' ? 'Scheduling, typing, forms, sorting' : key === 'medium' ? 'Basic analysis, first drafts, monitoring' : 'Judgement, negotiation, leadership, hands-on'}
													</p>
												</div>
											))}
										</div>

										{delegated.length > 0 && (
											<p className="mt-2 rounded-lg bg-[#F4F1E8] p-2 font-mono text-[10px] leading-4 text-[#5F5B52]">
												{delegated.length} task{delegated.length === 1 ? '' : 's'} handed over · {week.handedOver.toFixed(1)} h off the week
											</p>
										)}
									</div>

									<div className={`mt-3 flex items-center justify-between rounded-xl border p-2.5 ${
										isEdited ? 'border-gray-300 bg-gray-50 text-[#1A1A1A]' : 'border-gray-200 bg-white text-[#5E5E5E]'
									}`}>
										<div>
											<p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#5F5B52]">Simulated score</p>
											<p className="mt-0.5 text-xs font-bold text-[#1A1A1A]">
												{!isEdited
													? 'Baseline score'
													: scoreDelta === 0
														? 'No change yet'
														: `${scoreDelta < 0 ? '−' : '+'}${Math.abs(scoreDelta)} pts vs today`}
											</p>
											<p className="mt-0.5 font-mono text-[9.5px] text-[#5F5B52]">
												{week.total < 0.5 ? 'Whole week handed over' : `${week.total.toFixed(1)} of ${WEEK_HOURS} h still yours`}
											</p>
										</div>
										<div className="text-right">
											<span className="font-mono text-2xl font-black text-[#1A1A1A]">{overallScore}</span>
											<span className="font-mono text-xs font-bold text-[#5F5B52]">/100</span>
										</div>
									</div>
								</div>
							</div>

							{/* What to do with the answer: three steps, in the place the reader has an answer. */}
							<div className="rounded-xl border border-gray-200 bg-[#FBFBFB] p-3">
								<p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">What to do with the answer</p>
								<ol className="grid gap-2 sm:grid-cols-3 sm:gap-4">
									{nextSteps.map((step, index) => (
										<li key={step} className="flex gap-2.5">
											<span className="font-mono text-[10px] font-bold tabular-nums text-[#5A7A8F]">{String(index + 1).padStart(2, '0')}</span>
											<span className="text-[11.5px] leading-5 text-[#5E5E5E]">{step}</span>
										</li>
									))}
								</ol>
							</div>
						</>
					)}

					{/* Task Breakdown Section */}
					{!loadingDetail && careerDetail && (
						<div id="task-breakdown" className="mt-6 scroll-mt-6 border-t border-gray-200 py-4">
							<div className="mb-6 flex flex-col items-stretch justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
								<div>
									<h3 className="text-xl font-bold text-[#1A1A1A]">What the job actually involves</h3>
									<p className="mt-1 text-xs text-[#5E5E5E]">
										Every task is scored for how much of it AI can do today. Hand one over and its hours leave the week above.
									</p>
								</div>

								<div className="flex flex-wrap rounded-xl border border-gray-200 bg-gray-100 p-1">
									{(['all', 'high', 'medium', 'low'] as const).map((cat) => (
										<button
											key={cat}
											onClick={() => setTaskFilter(cat)}
											aria-pressed={taskFilter === cat}
											className={`min-h-[32px] rounded-lg px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider transition ${
												taskFilter === cat ? 'bg-[#1A1A1A] font-bold text-white' : 'text-[#5E5E5E] hover:text-[#1A1A1A]'
											}`}
										>
											{cat === 'all' ? 'All work' : cat === 'high' ? 'AI does it' : cat === 'medium' ? 'AI drafts it' : 'Needs a person'}
										</button>
									))}
								</div>
							</div>

							<div className="grid gap-3 md:grid-cols-2">
								{filteredTasks.length === 0 ? (
									<div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center font-mono text-xs text-[#5F5B52] md:col-span-2">
										No tasks found matching this risk level.
									</div>
								) : (
									visibleTasks.map((task) => {
										const isDelegated = delegated.includes(task.id);
										return (
											<div
												key={task.id}
												className={`group relative rounded-xl border p-4 transition-all duration-200 ${
													isDelegated
														? 'border-[#1A1A1A]/40 bg-[#FBFBFB]'
														: task.risk === 'high'
															? 'border-gray-200 bg-white hover:border-[#A55252]/50'
															: task.risk === 'medium'
																? 'border-gray-200 bg-white hover:border-[#96693A]/50'
																: 'border-gray-200 bg-white hover:border-[#5A7A8F]/50'
												}`}
											>
												<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
													<span className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
														task.risk === 'high'
															? 'bg-[#A55252]/10 text-[#A55252]'
															: task.risk === 'medium'
																? 'bg-[#96693A]/10 text-[#96693A]'
																: 'bg-[#5A7A8F]/10 text-[#475F73]'
													}`}>
														{task.risk ? bucketLabel[task.risk] : 'Not scored'}
													</span>
													<div className="flex items-center gap-2">
														{task.score !== null && (
															<span className="font-mono text-[10px] font-bold text-[#5E5E5E]">
																AI could do {Math.round(task.score * 100)}% · {taskHours(task).toFixed(1)} h
															</span>
														)}
														{task.emerging && (
															<span className="rounded-full bg-[#7C6BA8]/10 px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-widest text-[#7C6BA8]">
																{task.emerging.category}
															</span>
														)}
														{task.score !== null && task.risk && (
															<button
																type="button"
																onClick={() => toggleDelegation(task)}
																aria-pressed={isDelegated}
																aria-label={`${isDelegated ? 'Take back' : 'Hand to AI'}: ${task.text}`}
																className={`inline-flex min-h-[26px] items-center gap-1 rounded-full border px-2 font-mono text-[9px] font-bold uppercase tracking-wider transition ${
																	isDelegated
																		? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
																		: 'border-gray-300 bg-white text-[#5E5E5E] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
																}`}
															>
																{isDelegated ? '✓ Handed over' : 'Hand to AI'}
															</button>
														)}
													</div>
												</div>
												<p className={`text-sm font-medium leading-relaxed ${isDelegated ? 'text-[#5E5E5E]' : 'text-[#1A1A1A]'}`}>{task.text}</p>

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

												<div className="mt-3 flex items-start gap-2 border-t border-gray-100 pt-3">
													<svg className={`mt-0.5 h-4 w-4 shrink-0 ${
														task.risk === 'high' ? 'text-[#A55252]' : task.risk === 'medium' ? 'text-[#96693A]' : 'text-[#475F73]'
													}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<p className="text-xs italic leading-relaxed text-[#5E5E5E]">
														<span className="mr-1 font-mono text-[10px] font-bold uppercase not-italic tracking-wider" style={{ color: task.risk === 'high' ? '#A55252' : task.risk === 'medium' ? '#96693A' : '#5A7A8F' }}>
															Why:
														</span>
														{task.rationale}
													</p>
												</div>
											</div>
										);
									})
								)}
								{filteredTasks.length > 8 && (
									<div className="flex justify-center pt-2 md:col-span-2">
										<button
											type="button"
											onClick={() => setShowAllTasks((v) => !v)}
											aria-expanded={showAllTasks}
											className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] transition hover:border-[#1A1A1A]"
										>
											{showAllTasks ? 'Show fewer tasks' : `Show all ${filteredTasks.length} tasks`}
											<span aria-hidden="true">{showAllTasks ? '↑' : '↓'}</span>
										</button>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Pay by state — BLS OEWS state medians, below the task list and out of the AI analysis. */}
					{!loadingDetail && careerDetail?.state_wages && stateWageEntries.length >= 5 && (
						<div id="state-wages" className="mt-6 scroll-mt-6 border-t border-gray-200 py-4">
							<div className="mb-4 flex flex-col gap-2 border-b border-gray-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<h3 className="text-lg font-bold text-[#1A1A1A]">Pay by state</h3>
									<p className="mt-0.5 max-w-2xl text-xs leading-5 text-[#5E5E5E]">
										BLS publishes {stateWageEntries.length} state estimates for this occupation. Each is its own survey estimate — not the national median adjusted for local prices.
									</p>
								</div>
								<div className="sm:text-right">
									<p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5F5B52]">Published range</p>
									<p className="mt-0.5 font-mono text-xs font-bold text-[#1A1A1A]">
										{formatUSD(stateWageEntries[stateWageEntries.length - 1][1])} – {formatUSD(stateWageEntries[0][1])}
									</p>
								</div>
							</div>

							<div className="grid gap-6 sm:grid-cols-3">
								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5F5B52]">Your state</p>
									{pickedStatePay !== null ? (
										<>
											<p className="mt-2 flex flex-wrap items-baseline gap-x-2">
												<span className="font-mono text-xl font-black tracking-tight text-[#1A1A1A]">{formatUSD(pickedStatePay)}</span>
												<span className="text-xs text-[#5E5E5E]">{statePick}</span>
											</p>
											<p className="mt-1 text-[11px] leading-5 text-[#5F5B52]">
												Rank {pickedStateRank} of {stateWageEntries.length} published state medians, highest first.
											</p>
										</>
									) : (
										<p className="mt-2 text-sm leading-6 text-[#5E5E5E]">
											{statePick === ''
												? 'Not picked yet.'
												: `BLS published no estimate for ${statePick} in this occupation.`}
										</p>
									)}
									{/* One control, one place: this jumps back to the picker rather than cloning it. */}
									<button
										type="button"
										onClick={() => {
											const picker = document.getElementById('role-state-pick') as HTMLSelectElement | null;
											picker?.scrollIntoView({ block: 'center' });
											picker?.focus({ preventScroll: true });
										}}
										className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-[#E5E5E5] bg-white px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] transition hover:border-[#1A1A1A]"
									>
										{pickedStatePay !== null ? 'Change state' : 'Pick a state'}
									</button>
								</div>

								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5F5B52]">Highest medians</p>
									<div className="mt-2">
										{stateWageEntries.slice(0, 5).map(([name, value]) => (
											<div key={name} className={`flex items-baseline justify-between gap-3 border-b border-[#F2F2F2] py-1 last:border-0 ${name === statePick ? 'bg-[#F4F1E8] font-bold' : ''}`}>
												<span className="text-[12px] text-[#1A1A1A]">{name}</span>
												<span className="font-mono text-xs text-[#5E5E5E]">{formatUSD(value)}</span>
											</div>
										))}
									</div>
								</div>

								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5F5B52]">Lowest medians</p>
									<div className="mt-2">
										{stateWageEntries.slice(-5).reverse().map(([name, value]) => (
											<div key={name} className={`flex items-baseline justify-between gap-3 border-b border-[#F2F2F2] py-1 last:border-0 ${name === statePick ? 'bg-[#F4F1E8] font-bold' : ''}`}>
												<span className="text-[12px] text-[#1A1A1A]">{name}</span>
												<span className="font-mono text-xs text-[#5E5E5E]">{formatUSD(value)}</span>
											</div>
										))}
									</div>
								</div>
							</div>

							<p className="mt-3 text-[11px] leading-5 text-[#5F5B52]">
								{careerDetail.state_wages.source === 'bls-state-line'
									? `This is the ${careerDetail.state_wages.code} row of the ${careerDetail.salary_vintage ?? 'OEWS'} state panel.`
									: `OEWS has no state row for this exact code, so these figures are the ${careerDetail.state_wages.code} roll-up.`}{' '}
								States where the estimate was suppressed or too small to publish are absent.
							</p>
						</div>
					)}
				</div>
			)}

			{/* ==================== THE ROLE INDEX (opened from the search field) ==================== */}
			{activeView === 'role' && showBrowse && (
				<div role="tabpanel" id="panel-role" aria-labelledby="tab-role" className="grid gap-8">
					{/* Filters Card */}
					<div className="py-6">
						<div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
							<div>
								<button
									type="button"
									onClick={() => {
										setShowBrowse(false);
										setSearchQuery('');
									}}
									className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#475F73] hover:text-[#1A1A1A] hover:underline"
								>
									← Back to {careerDetail ? careerDetail.title : 'the role'}
								</button>
								<h3 className="text-xl font-bold text-[#1A1A1A]">Every role with a task-level score</h3>
								<p className="mt-1 text-xs text-[#5E5E5E]">Filter by AI exposure and pay. Open any row for the full breakdown.</p>
							</div>
							<button
								onClick={() => {
									setFinderSearchQuery('');
									setMinVulnerability(0);
									setMaxVulnerability(100);
									setMinSalaryFilter(0);
									setEmploymentFilter('all');
								}}
								className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-[#5E5E5E] transition hover:bg-gray-50 hover:text-[#1A1A1A]"
							>
								Clear filters
							</button>
						</div>

						{/* Filters Grid */}
						<div className="space-y-6">
							{/* Row 1: Four inputs */}
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
								<div>
									<label htmlFor="finder-search" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#5F5B52] font-bold mb-2">
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
									<label htmlFor="finder-demand" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#5F5B52] font-bold mb-2">
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
									<label htmlFor="finder-salary" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#5F5B52] font-bold mb-2">
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
									<label htmlFor="finder-sort" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#5F5B52] font-bold mb-2">
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
									<span className="font-mono text-xs font-extrabold text-[#475F73]">
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
								
								<div className="flex items-center justify-between text-[10px] font-mono text-[#5F5B52] px-1">
									<span>0 — less exposed</span>
									<span>100 — more exposed</span>
								</div>
							</div>
						</div>
					</div>

					{/* Results List */}
					<div className="overflow-hidden mt-10">
						<div className="flex items-center justify-between mb-6">
							<span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#475F73] font-bold">
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
											<td colSpan={5} className="px-6 py-12 text-center font-mono text-xs text-[#5F5B52] italic">
												No careers match. Try widening the filters.
											</td>
										</tr>
									) : (
										paginatedFinderCareers.map((item) => (
											<tr
												key={item.code}
												className="hover:bg-gray-50 bg-white transition group cursor-pointer"
												onClick={() => openRole(item.code)}
											>
												<td className="pl-0 pr-6 py-6 text-left">
													<div className="font-bold text-[#1A1A1A] group-hover:text-[#475F73] transition line-clamp-1">{item.title}</div>
													<div className="font-mono text-[9px] text-[#5F5B52] uppercase mt-0.5">{item.code}</div>
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
															item.risk_score > 65 ? 'text-[#A55252]' : item.risk_score > 35 ? 'text-[#96693A]' : 'text-[#475F73]'
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
															? 'bg-[#5A7A8F]/10 text-[#475F73] border-transparent'
															: item.employment_band === 'High'
																? 'bg-[#5A7A8F]/10 text-[#475F73] border-transparent'
																: item.employment_band === 'Medium'
																	? 'bg-gray-100 text-[#5E5E5E] border-transparent'
																	: 'bg-gray-100 text-[#5F5B52] border-transparent'
													}`}>
														{item.employment_band}
													</span>
													{item.projection && item.projection.change_percent !== null ? (
														<span className={`mt-1 block font-mono text-[10px] font-bold ${item.projection.change_percent > 0 ? 'text-[#2E6F40]' : item.projection.change_percent < 0 ? 'text-[#A55252]' : 'text-[#5F5B52]'}`}>
															{item.projection.change_percent > 0 ? '+' : ''}{item.projection.change_percent.toFixed(1)}% <span className="font-normal text-[#5F5B52]">by 2035</span>
														</span>
													) : (
														<span className="mt-1 block font-mono text-[10px] text-[#5F5B52]">not projected</span>
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
																openRole(item.code);
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
								<span className="font-mono text-[10px] text-[#5F5B52]">
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

			{/* ==================== VIEW 2: THE CAREER MAP ==================== */}
			{activeView === 'map' && (
				<div role="tabpanel" id="panel-map" aria-labelledby="tab-map" className="grid gap-8">
					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Where careers sit</h3>
						<p className="text-xs text-[#5E5E5E] leading-relaxed max-w-3xl">
							Every job we score, plotted by typical pay and by how much of its work AI can already do. The top-left corner is the sweet spot — well paid, less exposed. Type in the search field above to narrow the map; hover or tap a dot for details, and click it to open the full breakdown.
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
												onClick={() => openRole(item.code)}
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
										<p className="font-mono text-[8px] uppercase tracking-wider text-[#475F73] font-bold mb-1">
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
															: 'text-[#475F73]'
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
										<p className="mt-2 font-mono text-[8px] text-[#5F5B52] italic text-center">Click to open this job</p>
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
