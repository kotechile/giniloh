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
 * How many task cards show before the counter. Three is the number a reader will actually read, and
 * they are the three with the most hours at stake — the rest belong behind a counter, not 2,800px of page.
 */
const TASK_PREVIEW = 3;

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
				className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#D8D8D8] bg-white font-mono text-[12px] font-bold text-[#5F5B52] transition hover:border-[#1A1A1A] hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
			>
				?
			</button>
			<span
				id={id}
				role="tooltip"
				className={`pointer-events-none absolute top-full z-50 mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-lg border border-[#E5E5E5] bg-white p-2.5 text-[13px] font-normal normal-case leading-5 tracking-normal text-[#5E5E5E] opacity-0 shadow-xl transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100 ${
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

	// Auto-resize for scatter plot SVG. Height follows width so the field reads as a square-ish map
	// instead of a 400px letterbox: 1,016 dots in a 1100×400 strip compress into an unreadable blob.
	useEffect(() => {
		if (activeView === 'map' && scatterContainerRef.current) {
			const resize = (width: number) => {
				setScatterDimensions({
					width: Math.max(320, Math.floor(width)),
					height: Math.max(420, Math.min(560, Math.round(width * 0.5)))
				});
			};
			resize(scatterContainerRef.current.getBoundingClientRect().width);
			const observer = new ResizeObserver((entries) => {
				for (const entry of entries) resize(entry.contentRect.width);
			});
			observer.observe(scatterContainerRef.current);
			return () => observer.disconnect();
		}
	}, [activeView]);

	// A new bucket is a new list: start it at the top rather than inheriting "show all" from the last one.
	useEffect(() => {
		setShowAllTasks(false);
	}, [taskFilter, selectedCode]);

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

	/** One source for the three bucket colours — ring, pillars, sliders, week bar and chips. */
	const bucketColor: Record<'high' | 'medium' | 'low', string> = {
		high: '#A55252',
		medium: '#96693A',
		low: '#5A7A8F'
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

	/**
	 * The ring around the score.
	 *
	 * Each bucket is a stroked arc on one circle, so the segments are the composition and the centre
	 * is the number — one object instead of a score ring and a task donut competing at 112px. A 3px
	 * gap comes off each arc so adjacent buckets stay separable at a 26px stroke.
	 */
	const RING_RADIUS = 104;
	const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
	const donutSlices = useMemo(() => {
		const total = weights.high + weights.medium + weights.low || 1;
		let offset = 0;
		const buckets = (['high', 'medium', 'low'] as const).map((category) => {
			const length = (weights[category] / total) * RING_CIRCUMFERENCE;
			const slice = {
				category,
				color: bucketColor[category],
				dashArray: `${Math.max(0, length - 3)} ${RING_CIRCUMFERENCE}`,
				dashOffset: -offset
			};
			offset += length;
			return slice;
		});
		return buckets.filter((slice) => weights[slice.category] > 0);
	}, [weights]);

	/**
	 * Plot geometry. Axes: pay on x (right = better paid), exposure on y (up = more exposed), so the
	 * bottom-right corner is the quiet, well-paid end of the field.
	 */
	const narrowPlot = scatterDimensions.width < 560;
	const scatterMargin = { top: 28, right: narrowPlot ? 16 : 28, bottom: 52, left: narrowPlot ? 44 : 74 };
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

	/**
	 * Quadrant rules. Drawn at the median of every plottable role rather than at a round number, so
	 * "higher pay" and "more exposed" mean what they say about this field. Computed from the whole
	 * index, not the search result: narrowing the map should not move the frame.
	 */
	const medians = useMemo(() => {
		const plottable = indexData.filter((item) => item.risk_score !== null);
		const pays = plottable.map((item) => item.salary).filter((value): value is number => value !== null).sort((a, b) => a - b);
		const risks = plottable.map((item) => item.risk_score).sort((a, b) => a - b);
		const mid = (values: number[]) => (values.length ? values[Math.floor(values.length / 2)] : 0);
		return { pay: Math.round(mid(pays) / 1000) * 1000, risk: Math.round(mid(risks)) };
	}, [indexData]);

	const quadrantPay = medians.pay;
	const quadrantRisk = medians.risk;
	const quadrantX = mapSalaryToX(quadrantPay);
	const quadrantY = mapRiskToY(quadrantRisk);

	/** The open role as an index row, so the map can mark it even before detail has loaded. */
	const selectedIndexItem = useMemo(
		() => indexData.find((item) => item.code === selectedCode && item.risk_score !== null) ?? null,
		[indexData, selectedCode]
	);

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

	/**
	 * Tasks ordered by what is at stake: the hours a task occupies at the current week mix, times how
	 * much of it AI can already do. The first three are therefore the ones worth acting on, and the
	 * remaining ones are a counter rather than another two thousand pixels of scroll.
	 */
	const rankedTasks = useMemo(() => {
		const stake = (task: Task) => (task.score === null ? -1 : taskHours(task) * task.score);
		return [...filteredTasks].sort((a, b) => stake(b) - stake(a));
	}, [filteredTasks, weights]);
	const visibleTasks = showAllTasks ? rankedTasks : rankedTasks.slice(0, TASK_PREVIEW);

	return (
		<div className="w-full text-[#5E5E5E] font-sans">
			{/* Persistent header: one search field, one view switch, one way into the role index. */}
			<div className="mb-4 rounded-xl border border-[#E5E5E5] bg-white p-2.5 sm:p-3">
				<div className="flex flex-col gap-2.5 md:flex-row md:items-center">
					{/* The input is the anchor: it takes the free width, so on a desktop it reads as the
					    one thing to do, not as a field squeezed beside the tab switch. */}
					<div ref={suggestionsRef} className="relative w-full md:max-w-2xl md:flex-1">
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
								className="w-full rounded-lg border border-[#D8D3C4] bg-white py-2.5 pl-10 pr-9 text-base font-medium text-[#1A1A1A] outline-none transition placeholder:text-[#8C8C8C] focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]"
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
										<span className="text-sm sm:text-[15px] font-semibold text-[#1A1A1A]">{item.title}</span>
										<span className="mt-0.5 font-mono text-[12px] uppercase tracking-wider text-[#5F5B52]">
											{formatUSD(item.salary)} median · {item.risk_score}/100 exposure
										</span>
									</button>
								))}
								<button
									type="button"
									onClick={() => openBrowse(searchQuery)}
									className="w-full px-3.5 py-2.5 text-left font-mono text-[12px] font-bold uppercase tracking-wider text-[#475F73] transition hover:bg-gray-50 hover:text-[#1A1A1A]"
								>
									Browse every matching role →
								</button>
							</div>
						)}
						{showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
							<div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-center font-mono text-sm text-[#5F5B52] shadow-2xl">
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
								className={`min-h-[36px] rounded-md px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] ${
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
							className="inline-flex min-h-[36px] items-center rounded-lg border border-[#E5E5E5] bg-white px-3 font-mono text-[12px] font-bold uppercase tracking-wider text-[#5E5E5E] transition hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
						>
							{indexData.length > 0 ? `All ${indexData.length.toLocaleString('en-US')} roles` : 'All roles'}
						</button>
					</div>
				</div>

				{/* Popular quick selector pills */}
				<div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2">
					<span className="font-mono text-[12px] font-bold uppercase tracking-wider text-[#5F5B52]">Popular:</span>
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
							className={`inline-flex min-h-[32px] items-center rounded-full border px-3 py-1 text-sm font-medium transition duration-150 sm:min-h-0 ${
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
								<span className="animate-pulse font-mono text-sm uppercase tracking-widest text-[#5F5B52]">Loading Career Data...</span>
							</div>
						</div>
					)}

					{!loadingDetail && careerDetail && (
						<>
							{/* ==================== ROLE STRIP — identity and pay, one row, no box ==================== */}
							<div className="flex flex-col gap-4 border-b border-[#E5E5E5] pb-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">
										<span>SOC {careerDetail.code}</span>
										{careerDetail.employment !== null && (
											<>
												<span aria-hidden="true" className="text-[#D8D3C4]">/</span>
												<span>{careerDetail.employment.toLocaleString('en-US')} employed</span>
											</>
										)}
									</div>
									<h2 className="mt-1.5 text-2xl font-black leading-tight tracking-tight text-[#1A1A1A] sm:text-[30px]" title={careerDetail.title}>
										{careerDetail.title}
									</h2>
									<p className={`mt-1.5 max-w-2xl text-sm leading-6 text-[#5E5E5E] ${showFullDesc ? '' : 'line-clamp-2'}`}>
										{careerDetail.description}
									</p>
									{careerDetail.description.length > 150 && (
										<button
											onClick={() => setShowFullDesc(!showFullDesc)}
											className="mt-0.5 inline-flex min-h-[28px] items-center font-mono text-[12px] font-bold text-[#475F73] hover:text-[#1A1A1A] hover:underline"
										>
											{showFullDesc ? 'Show less' : 'Read more'}
										</button>
									)}
								</div>

								{/* Pay sits with the role because it is the other half of the same answer. */}
								<div className="flex shrink-0 flex-col gap-1.5 lg:w-[300px]">
									<div className="flex items-baseline justify-between gap-3">
										<span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">National median</span>
										<span className="font-mono text-[28px] font-black leading-none tracking-tight text-[#1A1A1A]">{formatUSD(careerDetail.salary)}</span>
									</div>

									{careerDetail.state_wages && stateWageEntries.length >= 5 ? (
										<div className="mt-1 border-t border-[#EFEFEF] pt-2">
											<label htmlFor="role-state-pick" className="block font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">
												Pay in your state
											</label>
											<div className="mt-1 flex items-baseline gap-2">
												<select
													id="role-state-pick"
													value={statePick}
													onChange={(e) => setStatePick(e.target.value)}
													className="min-w-0 flex-1 rounded border border-[#D8D3C4] bg-white px-2 py-1.5 text-sm font-medium text-[#1A1A1A] outline-none transition focus:border-[#1A1A1A]"
												>
													<option value="">Select state...</option>
													{stateWageNames.map((name) => (
														<option key={name} value={name}>{name}</option>
													))}
												</select>
												{pickedStatePay !== null && (
													<span className="font-mono text-lg font-black text-[#1A1A1A]">{formatUSD(pickedStatePay)}</span>
												)}
											</div>

											{pickedStatePay !== null ? (
												<div className="mt-1.5 flex items-center justify-between gap-2">
													<span className="font-mono text-[11.5px] font-bold text-[#5F5B52]">#{pickedStateRank} of {stateWageEntries.length}</span>
													<a href="#state-wages" className="font-mono text-[11.5px] font-bold text-[#475F73] hover:text-[#1A1A1A] hover:underline">
														Compare all {stateWageEntries.length} states ↓
													</a>
												</div>
											) : statePick === '' ? (
												<p className="mt-1.5 text-[12.5px] leading-5 text-[#5E5E5E]">Pick a state for its own survey estimate.</p>
											) : (
												<p className="mt-1.5 text-[12.5px] leading-5 text-[#5E5E5E]">BLS published no estimate for {statePick} in this occupation.</p>
											)}
										</div>
									) : (
										<div className="mt-1 flex items-center justify-between gap-2 border-t border-[#EFEFEF] pt-2">
											<span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">Employment</span>
											<span className="text-sm font-bold text-[#1A1A1A]">
												{careerDetail.employment_band || 'National sample'}
												{careerDetail.employment ? ` · ${careerDetail.employment.toLocaleString('en-US')}` : ''}
											</span>
										</div>
									)}

									{careerDetail.salary_vintage && (
										<p className="font-mono text-[10.5px] uppercase tracking-wider text-[#5F5B52]">{careerDetail.salary_vintage}</p>
									)}
								</div>
							</div>

							{/* ==================== THE ANSWER · THE WEEK ==================== */}
							<div className="grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] xl:gap-4">

								{/* LEFT — the headline number. Score, ring and pillars are one object: the ring is
								    the composition, its centre is the score, the rows are the legend. */}
								<section aria-labelledby="answer-heading" className="flex flex-col rounded-2xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
									<div className="mb-1 flex items-center gap-1.5">
										<h3 id="answer-heading" className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">The answer</h3>
										<InfoTip id="tip-exposure" label="AI exposure score" plain={definition('Task exposure')} />
									</div>

									<div className="flex flex-col items-center">
										<div
											className="relative flex h-[228px] w-[228px] items-center justify-center sm:h-[252px] sm:w-[252px]"
											role="img"
											aria-label={`AI exposure ${overallScore} out of 100`}
										>
											<svg className="h-full w-full -rotate-90" viewBox="-120 -120 240 240" aria-hidden="true">
												<circle cx="0" cy="0" r="104" fill="none" stroke="#F4F1E8" strokeWidth="26" />
												{donutSlices.map((slice) => {
													const isHovered = hoveredDonutSlice === slice.category;
													return (
														<circle
															key={slice.category}
															cx="0"
															cy="0"
															r="104"
															fill="none"
															stroke={slice.color}
															strokeWidth={isHovered ? 34 : 26}
															strokeDasharray={slice.dashArray}
															strokeDashoffset={slice.dashOffset}
															opacity={hoveredDonutSlice ? (isHovered ? 1 : 0.35) : 0.95}
															style={{ transition: 'stroke-width 0.18s ease-out, opacity 0.18s ease-out' }}
														/>
													);
												})}
											</svg>
											<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
												<span className="font-mono text-[56px] font-black leading-none tracking-tighter tabular-nums text-[#1A1A1A] sm:text-[64px]">
													{overallScore}
												</span>
												<span className="mt-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#5F5B52]">of 100</span>
											</div>
										</div>

										<div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
											<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11.5px] font-bold uppercase tracking-wider ${
												overallScore > 65
													? 'bg-[#A55252]/10 text-[#A55252]'
													: overallScore > 35
														? 'bg-[#96693A]/10 text-[#96693A]'
														: 'bg-[#5A7A8F]/10 text-[#475F73]'
											}`}>
												<span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
												{overallScore > 65 ? 'High exposure' : overallScore > 35 ? 'Mixed exposure' : 'Low exposure'}
											</span>
											{isEdited && scoreDelta !== 0 && (
												<span className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11.5px] font-bold uppercase tracking-wider ${
													scoreDelta < 0 ? 'bg-[#2E6F40]/10 text-[#2E6F40]' : 'bg-[#A55252]/10 text-[#A55252]'
												}`}>
													{scoreDelta < 0 ? '−' : '+'}{Math.abs(scoreDelta)} pts
												</span>
											)}
										</div>

										{/* One line of plain language: the hovered bucket while the pointer is on the
										    ring, the whole composition at rest. Height is reserved so nothing jumps. */}
										<p className="mt-2 min-h-[2.5rem] max-w-[24rem] text-center text-[12.5px] leading-snug text-[#5E5E5E]">
											{hoveredDonutSlice ? (
												<>
													<strong className="font-bold" style={{ color: bucketColor[hoveredDonutSlice] }}>{weights[hoveredDonutSlice]}%</strong>{' '}
													{bucketSentence[hoveredDonutSlice]} — {week.hours[hoveredDonutSlice].toFixed(1)} h a week.
												</>
											) : (
												<>
													<strong className="font-bold" style={{ color: bucketColor.high }}>{weights.high}%</strong> is repetitive work AI already does,{' '}
													<strong className="font-bold" style={{ color: bucketColor.medium }}>{weights.medium}%</strong> is work AI can draft — but a person still checks and decides,{' '}
													<strong className="font-bold" style={{ color: bucketColor.low }}>{weights.low}%</strong> still needs someone in the room.
												</>
											)}
										</p>
									</div>

									<div className="mt-3 space-y-1 border-t border-[#EFEFEF] pt-2">
										{(['high', 'medium', 'low'] as const).map((key) => (
											<button
												key={key}
												type="button"
												onClick={() => setTaskFilter(taskFilter === key ? 'all' : key)}
												onMouseEnter={() => setHoveredDonutSlice(key)}
												onMouseLeave={() => setHoveredDonutSlice(null)}
												onFocus={() => setHoveredDonutSlice(key)}
												onBlur={() => setHoveredDonutSlice(null)}
												aria-pressed={taskFilter === key}
												className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg border px-2 py-1.5 text-left transition duration-150 ${
													taskFilter === key ? 'border-[#D8D3C4] bg-[#F4F1E8]' : 'border-transparent hover:bg-[#FAFAFA]'
												}`}
											>
												<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: bucketColor[key] }} aria-hidden="true" />
												<span className="min-w-0">
													<span className="block truncate text-[13.5px] font-bold text-[#1A1A1A]">{bucketLabel[key]}</span>
													<span className="block font-mono text-[11.5px] text-[#5F5B52]">{week.hours[key].toFixed(1)} h of the week</span>
												</span>
												<span className="font-mono text-[26px] font-black leading-none tabular-nums sm:text-[30px]" style={{ color: bucketColor[key] }}>
													{weights[key]}<span className="text-base">%</span>
												</span>
											</button>
										))}
									</div>

									<div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-3">
										<a
											href="#task-breakdown"
											className="inline-flex min-h-[32px] items-center font-mono text-[12px] font-bold uppercase tracking-wider text-[#475F73] hover:text-[#1A1A1A] hover:underline"
										>
											Inspect {filteredTasks.length} tasks ↓
										</a>
										<button
											type="button"
											onClick={() => {
												setActiveView('map');
												window.scrollTo({ top: 160, behavior: 'smooth' });
											}}
											className="inline-flex min-h-[32px] items-center font-mono text-[12px] font-bold uppercase tracking-wider text-[#475F73] hover:text-[#1A1A1A] hover:underline"
										>
											Where this sits on the map →
										</button>
									</div>
								</section>

								{/* RIGHT — the simulator. It answers "and if I change it?", so it reports the
								    move (46 → 34) rather than restating the score at a second size. */}
								<section aria-labelledby="week-heading" className="flex flex-col rounded-2xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
									<div className="flex items-center justify-between gap-2">
										<div className="relative flex items-center gap-1.5">
											<h3 id="week-heading" className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">Change your week</h3>
											<InfoTip id="tip-week" label="Change your week" plain={definition('Simulated week')} align="right" />
										</div>
										{isEdited && (
											<button
												onClick={handleResetWeights}
												className="rounded border border-[#D8D3C4] bg-white px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider text-[#5E5E5E] transition hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
											>
												Reset
											</button>
										)}
									</div>
									<p className="mt-1.5 text-[13px] leading-snug text-[#5E5E5E]">
										A {WEEK_HOURS}-hour week. Move the hours here, or hand tasks over in the list below.
									</p>

									{/* Where the week actually sits, as one bar. */}
									<div className="mt-3">
										<div className="flex h-2.5 w-full gap-[3px] overflow-hidden rounded-full" aria-hidden="true">
											{(['high', 'medium', 'low'] as const)
												.filter((key) => weights[key] > 0)
												.map((key) => (
													<div
														key={key}
														className="h-full transition-all duration-300 ease-out"
														style={{ width: `${weights[key]}%`, background: bucketColor[key] }}
													/>
												))}
										</div>
										<div className="mt-1 flex items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-wider text-[#5F5B52]">
											<span>{week.total.toFixed(1)} h of {WEEK_HOURS} still yours</span>
											{week.handedOver > 0 && <span className="text-[#2E6F40]">{week.handedOver.toFixed(1)} h handed over</span>}
										</div>
									</div>

									<div className="mt-3.5 space-y-3.5">
										{(['high', 'medium', 'low'] as const).map((key) => (
											<div key={key}>
												<div className="mb-1 flex items-end justify-between gap-2">
													<div className="flex min-w-0 items-center gap-1.5">
														<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: bucketColor[key] }} aria-hidden="true" />
														<span className="truncate text-sm font-bold text-[#1A1A1A]">{bucketLabel[key]}</span>
													</div>
													<span className="flex shrink-0 items-baseline gap-2">
														<span className="font-mono text-[12px] tabular-nums text-[#5F5B52]">{week.hours[key].toFixed(1)} h</span>
														<span className="font-mono text-2xl font-black leading-none tabular-nums" style={{ color: bucketColor[key] }}>
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
													className={`h-1.5 w-full cursor-pointer rounded-lg bg-[#E5E5E5] outline-none ${
														key === 'high' ? 'accent-[#A55252]' : key === 'medium' ? 'accent-[#96693A]' : 'accent-[#5A7A8F]'
													}`}
												/>
												<p className="mt-0.5 text-[12px] text-[#5F5B52]">
													{key === 'high' ? 'Scheduling, typing, forms, sorting' : key === 'medium' ? 'Basic analysis, first drafts, monitoring' : 'Judgement, negotiation, leadership, hands-on'}
												</p>
											</div>
										))}
									</div>

									{delegated.length > 0 && (
										<p className="mt-2.5 rounded-lg bg-[#F4F1E8] px-2.5 py-1.5 font-mono text-[11.5px] leading-5 text-[#5F5B52]">
											{delegated.length} task{delegated.length === 1 ? '' : 's'} handed over · {week.handedOver.toFixed(1)} h off the week
										</p>
									)}

									<div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-[#EFEFEF] pt-3">
										<div className="flex items-baseline gap-2">
											<span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">This week</span>
											{isEdited ? (
												<span className="flex items-baseline gap-1.5 font-mono tabular-nums">
													<span className="text-lg font-bold text-[#8C8C8C] line-through decoration-1">{baselineScore}</span>
													<span aria-hidden="true" className="text-[#8C8C8C]">→</span>
													<span className="text-2xl font-black text-[#1A1A1A]">{overallScore}</span>
												</span>
											) : (
												<span className="font-mono text-2xl font-black tabular-nums text-[#1A1A1A]">{overallScore}</span>
											)}
										</div>
										<span className={`font-mono text-[12px] font-bold ${isEdited && scoreDelta !== 0 ? (scoreDelta < 0 ? 'text-[#2E6F40]' : 'text-[#A55252]') : 'text-[#5F5B52]'}`}>
											{!isEdited ? 'Baseline score' : scoreDelta === 0 ? 'No change yet' : `${scoreDelta < 0 ? '−' : '+'}${Math.abs(scoreDelta)} pts vs today`}
										</span>
									</div>

									{/* What to do next: three steps, in the panel where the reader is already holding
									    the controls. They used to sit in a full-width strip below both panels. */}
									<div className="mt-4 border-t border-[#EFEFEF] pt-3">
										<p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#5F5B52]">What to do with the answer</p>
										<ol className="mt-2 space-y-1.5">
											{nextSteps.map((step, index) => (
												<li key={step} className="flex gap-2.5">
													<span className="font-mono text-[11.5px] font-bold tabular-nums text-[#5A7A8F]">{String(index + 1).padStart(2, '0')}</span>
													<span className="text-[12.5px] leading-5 text-[#5E5E5E]">{step}</span>
												</li>
											))}
										</ol>
									</div>
								</section>
							</div>
						</>
					)}

					{/* Task Breakdown Section */}
					{!loadingDetail && careerDetail && (
						<div id="task-breakdown" className="mt-6 scroll-mt-6 border-t border-gray-200 py-4">
							<div className="mb-6 flex flex-col items-stretch justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
								<div>
									<h3 className="text-2xl font-bold text-[#1A1A1A]">What the job actually involves</h3>
									<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5E5E5E]">
										Every task is scored for how much of it AI can do today. These are the {TASK_PREVIEW} with the most hours at stake; hand one over and its hours leave the week above.
									</p>
								</div>

								<div className="flex flex-wrap rounded-xl border border-gray-200 bg-gray-100 p-1">
									{(['all', 'high', 'medium', 'low'] as const).map((cat) => (
										<button
											key={cat}
											onClick={() => setTaskFilter(cat)}
											aria-pressed={taskFilter === cat}
											className={`min-h-[32px] rounded-lg px-3 py-1.5 font-mono text-[12.5px] uppercase tracking-wider transition ${
												taskFilter === cat ? 'bg-[#1A1A1A] font-bold text-white' : 'text-[#5E5E5E] hover:text-[#1A1A1A]'
											}`}
										>
											{cat === 'all' ? 'All work' : cat === 'high' ? 'AI does it' : cat === 'medium' ? 'AI drafts it' : 'Needs a person'}
										</button>
									))}
								</div>
							</div>

							<div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
								{filteredTasks.length === 0 ? (
									<div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center font-mono text-sm text-[#5F5B52] md:col-span-2 xl:col-span-3">
										No tasks found matching this risk level.
									</div>
								) : (
									visibleTasks.map((task, index) => {
										const isDelegated = delegated.includes(task.id);
										// An odd last card in the two-column band would sit alone in the left column;
										// it spans the row until the three-column breakpoint takes over.
										const orphan = visibleTasks.length % 2 === 1 && index === visibleTasks.length - 1;
										return (
											<div
												key={task.id}
												data-orphan={orphan ? 'true' : undefined}
												className={`group relative rounded-xl border p-4 transition-all duration-200 ${orphan ? 'md:col-span-2 xl:col-span-1' : ''} ${
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
													<span className={`rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-widest ${
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
															<span className="font-mono text-[12px] font-bold text-[#5E5E5E]">
																AI could do {Math.round(task.score * 100)}% · {taskHours(task).toFixed(1)} h
															</span>
														)}
														{task.emerging && (
															<span className="rounded-full bg-[#7C6BA8]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#7C6BA8]">
																{task.emerging.category}
															</span>
														)}
														{task.score !== null && task.risk && (
															<button
																type="button"
																onClick={() => toggleDelegation(task)}
																aria-pressed={isDelegated}
																aria-label={`${isDelegated ? 'Take back' : 'Hand to AI'}: ${task.text}`}
																className={`inline-flex min-h-[26px] items-center gap-1 rounded-full border px-2 font-mono text-[10.5px] font-bold uppercase tracking-wider transition ${
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
												<p className={`text-[15px] font-medium leading-relaxed ${isDelegated ? 'text-[#5E5E5E]' : 'text-[#1A1A1A]'}`}>{task.text}</p>

												{task.dwas && task.dwas.length > 0 && (
													<div className="mt-2.5 flex flex-wrap gap-1.5">
														{task.dwas.map((dwa) => (
															<span
																key={dwa.id}
																title={`${dwa.gwa_name}${dwa.importance !== null ? ` · importance ${dwa.importance}/5 in this occupation` : ''}`}
																className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px] leading-4 text-[#5E5E5E]"
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
													<p className="text-sm italic leading-relaxed text-[#5E5E5E]">
														<span className="mr-1 font-mono text-[12px] font-bold uppercase not-italic tracking-wider" style={{ color: task.risk === 'high' ? '#A55252' : task.risk === 'medium' ? '#96693A' : '#5A7A8F' }}>
															Why:
														</span>
														{task.rationale}
													</p>
												</div>
											</div>
										);
									})
								)}
								{rankedTasks.length > TASK_PREVIEW && (
									<div className="flex justify-center pt-2 md:col-span-2 xl:col-span-3">
										<button
											type="button"
											onClick={() => setShowAllTasks((v) => !v)}
											aria-expanded={showAllTasks}
											className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#D8D3C4] bg-white px-5 font-mono text-[12px] font-bold uppercase tracking-wider text-[#1A1A1A] transition hover:border-[#1A1A1A] hover:bg-[#FAFAFA]"
										>
											{showAllTasks ? 'Show fewer tasks' : `View remaining ${rankedTasks.length - TASK_PREVIEW} tasks`}
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
									<h3 className="text-xl font-bold text-[#1A1A1A]">Pay by state</h3>
									<p className="mt-0.5 max-w-2xl text-sm leading-5 text-[#5E5E5E]">
										BLS publishes {stateWageEntries.length} state estimates for this occupation. Each is its own survey estimate — not the national median adjusted for local prices.
									</p>
								</div>
								<div className="sm:text-right">
									<p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#5F5B52]">Published range</p>
									<p className="mt-0.5 font-mono text-sm font-bold text-[#1A1A1A]">
										{formatUSD(stateWageEntries[stateWageEntries.length - 1][1])} – {formatUSD(stateWageEntries[0][1])}
									</p>
								</div>
							</div>

							<div className="grid gap-6 sm:grid-cols-3">
								<div>
									<p className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#5F5B52]">Your state</p>
									{pickedStatePay !== null ? (
										<>
											<p className="mt-2 flex flex-wrap items-baseline gap-x-2">
												<span className="font-mono text-2xl font-black tracking-tight text-[#1A1A1A]">{formatUSD(pickedStatePay)}</span>
												<span className="text-sm text-[#5E5E5E]">{statePick}</span>
											</p>
											<p className="mt-1 text-[13px] leading-5 text-[#5F5B52]">
												Rank {pickedStateRank} of {stateWageEntries.length} published state medians, highest first.
											</p>
										</>
									) : (
										<p className="mt-2 text-[15px] leading-6 text-[#5E5E5E]">
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
										className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-[#E5E5E5] bg-white px-3 font-mono text-[12px] font-bold uppercase tracking-wider text-[#1A1A1A] transition hover:border-[#1A1A1A]"
									>
										{pickedStatePay !== null ? 'Change state' : 'Pick a state'}
									</button>
								</div>

								<div>
									<p className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#5F5B52]">Highest medians</p>
									<div className="mt-2">
										{stateWageEntries.slice(0, 5).map(([name, value]) => (
											<div key={name} className={`flex items-baseline justify-between gap-3 border-b border-[#F2F2F2] py-1 last:border-0 ${name === statePick ? 'bg-[#F4F1E8] font-bold' : ''}`}>
												<span className="text-[13.5px] text-[#1A1A1A]">{name}</span>
												<span className="font-mono text-sm text-[#5E5E5E]">{formatUSD(value)}</span>
											</div>
										))}
									</div>
								</div>

								<div>
									<p className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#5F5B52]">Lowest medians</p>
									<div className="mt-2">
										{stateWageEntries.slice(-5).reverse().map(([name, value]) => (
											<div key={name} className={`flex items-baseline justify-between gap-3 border-b border-[#F2F2F2] py-1 last:border-0 ${name === statePick ? 'bg-[#F4F1E8] font-bold' : ''}`}>
												<span className="text-[13.5px] text-[#1A1A1A]">{name}</span>
												<span className="font-mono text-sm text-[#5E5E5E]">{formatUSD(value)}</span>
											</div>
										))}
									</div>
								</div>
							</div>

							<p className="mt-3 text-[13px] leading-5 text-[#5F5B52]">
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
									className="mb-1 font-mono text-[12px] font-bold uppercase tracking-wider text-[#475F73] hover:text-[#1A1A1A] hover:underline"
								>
									← Back to {careerDetail ? careerDetail.title : 'the role'}
								</button>
								<h3 className="text-2xl font-bold text-[#1A1A1A]">Every role with a task-level score</h3>
								<p className="mt-1 text-sm text-[#5E5E5E]">Filter by AI exposure and pay. Open any row for the full breakdown.</p>
							</div>
							<button
								onClick={() => {
									setFinderSearchQuery('');
									setMinVulnerability(0);
									setMaxVulnerability(100);
									setMinSalaryFilter(0);
									setEmploymentFilter('all');
								}}
								className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#5E5E5E] transition hover:bg-gray-50 hover:text-[#1A1A1A]"
							>
								Clear filters
							</button>
						</div>

						{/* Filters Grid */}
						<div className="space-y-6">
							{/* Row 1: Four inputs */}
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
								<div>
									<label htmlFor="finder-search" className="block font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#5F5B52] font-bold mb-2">
										Search job title
									</label>
									<input
										id="finder-search"
										type="text"
										placeholder="e.g. designer, analyst…"
										value={finderSearchQuery}
										onChange={(e) => setFinderSearchQuery(e.target.value)}
										className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[15px] text-[#1A1A1A] placeholder-gray-400 outline-none transition focus:border-[#5A7A8F]"
									/>
								</div>
								<div>
									<label htmlFor="finder-demand" className="block font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#5F5B52] font-bold mb-2">
										Employment level
									</label>
									<select
										id="finder-demand"
										value={employmentFilter}
										onChange={(e) => setEmploymentFilter(e.target.value)}
										className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[15px] text-[#1A1A1A] outline-none focus:border-[#5A7A8F]"
									>
										<option value="all">Any size</option>
										<option value="Very High">Very large</option>
										<option value="High">Large</option>
										<option value="Medium">Medium</option>
										<option value="Low">Small</option>
									</select>
								</div>
								<div>
									<label htmlFor="finder-salary" className="block font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#5F5B52] font-bold mb-2">
										Minimum pay
									</label>
									<select
										id="finder-salary"
										value={minSalaryFilter}
										onChange={(e) => setMinSalaryFilter(Number(e.target.value))}
										className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[15px] text-[#1A1A1A] outline-none focus:border-[#5A7A8F]"
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
									<label htmlFor="finder-sort" className="block font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#5F5B52] font-bold mb-2">
										Sort by
									</label>
									<div className="flex gap-2">
										<select
											id="finder-sort"
											value={sortField}
											onChange={(e) => setSortField(e.target.value as any)}
											className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[15px] text-[#1A1A1A] outline-none focus:border-[#5A7A8F]"
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
									<label className="text-sm font-bold text-[#1A1A1A]">
										AI exposure
									</label>
									<span className="font-mono text-sm font-extrabold text-[#475F73]">
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
								
								<div className="flex items-center justify-between text-[12px] font-mono text-[#5F5B52] px-1">
									<span>0 — less exposed</span>
									<span>100 — more exposed</span>
								</div>
							</div>
						</div>
					</div>

					{/* Results List */}
					<div className="overflow-hidden mt-10">
						<div className="flex items-center justify-between mb-6">
							<span className="font-mono text-[12px] uppercase tracking-[0.24em] text-[#475F73] font-bold">
								{filteredFinderCareers.length} careers match
							</span>
						</div>

						{/* Results Table */}
						<div className="overflow-x-auto w-full">
							<table className="min-w-full divide-y divide-gray-200 text-left border-collapse">
								<thead>
									<tr className="border-b border-gray-200 font-mono text-[11px] uppercase tracking-[0.15em] text-[#5E5E5E]">
										<th scope="col" className="pl-0 pr-6 py-4 font-bold text-left">Job</th>
										<th scope="col" className="px-6 py-4 font-bold text-left">AI exposure</th>
										<th scope="col" className="px-6 py-4 font-bold text-left">Median pay</th>
										<th scope="col" className="px-6 py-4 font-bold text-left">Employment</th>
										<th scope="col" className="pl-6 pr-0 py-4 font-bold text-right"><span className="sr-only">Open job</span></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 text-[15px]">
									{paginatedFinderCareers.length === 0 ? (
										<tr>
											<td colSpan={5} className="px-6 py-12 text-center font-mono text-sm text-[#5F5B52] italic">
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
													<div className="font-mono text-[10.5px] text-[#5F5B52] uppercase mt-0.5">{item.code}</div>
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
														<span className={`font-mono text-sm font-bold leading-none ${
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
													<span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold font-mono uppercase border ${
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
														<span className={`mt-1 block font-mono text-[12px] font-bold ${item.projection.change_percent > 0 ? 'text-[#2E6F40]' : item.projection.change_percent < 0 ? 'text-[#A55252]' : 'text-[#5F5B52]'}`}>
															{item.projection.change_percent > 0 ? '+' : ''}{item.projection.change_percent.toFixed(1)}% <span className="font-normal text-[#5F5B52]">by 2035</span>
														</span>
													) : (
														<span className="mt-1 block font-mono text-[12px] text-[#5F5B52]">not projected</span>
													)}
												</td>
												<td className="pl-6 pr-0 py-6 text-right">
													<div className="flex justify-end items-center gap-4">
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleAddToCompare(item);
															}}
															className="font-mono text-[12.5px] uppercase tracking-wider text-[#5E5E5E] hover:text-[#1A1A1A] hover:underline transition font-bold bg-transparent border-none cursor-pointer"
															>
															Compare
															</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																openRole(item.code);
															}}
															className="rounded-lg bg-[#1A1A1A] px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-[#333333] transition shadow-sm font-bold"
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
								<span className="font-mono text-[12px] text-[#5F5B52]">
									Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredFinderCareers.length)} of {filteredFinderCareers.length} careers
								</span>
								<div className="flex items-center gap-2">
									<button
										disabled={currentPage === 1}
										onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
										className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[12px] text-[#5E5E5E] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-[#5E5E5E] transition"
									>
										← Prev
									</button>
									<span className="font-mono text-sm text-[#5E5E5E]">
										Page {currentPage} of {totalPages}
									</span>
									<button
										disabled={currentPage === totalPages}
										onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
										className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-[12px] text-[#5E5E5E] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-[#5E5E5E] transition"
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
				<div role="tabpanel" id="panel-map" aria-labelledby="tab-map">
					<div className="rounded-2xl border border-[#E5E5E5] bg-white p-4 sm:p-6">
						<div className="flex flex-col gap-3 border-b border-[#EFEFEF] pb-3 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<h3 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Where careers sit</h3>
								<p className="mt-1 max-w-2xl text-sm leading-6 text-[#5E5E5E]">
									Every job we score, plotted by typical pay against how much of its work AI can already do.
									The bottom-right corner is the one to aim for. Click a dot to open it.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] uppercase tracking-wider text-[#5F5B52]">
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-full" style={{ background: bucketColor.low }} aria-hidden="true" /> Low exposure
								</span>
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-full" style={{ background: bucketColor.medium }} aria-hidden="true" /> Mixed
								</span>
								<span className="flex items-center gap-1.5">
									<span className="h-2.5 w-2.5 rounded-full" style={{ background: bucketColor.high }} aria-hidden="true" /> High exposure
								</span>
								<span className="flex items-center gap-1.5 text-[#1A1A1A] font-bold">
									<span className="h-3 w-3 rounded-full border-2 border-white bg-[#1A1A1A]" aria-hidden="true" /> Your role
								</span>
							</div>
						</div>

						{loadingIndex ? (
							<div className="flex h-96 items-center justify-center">
								<div className="flex flex-col items-center gap-3">
									<div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-transparent"></div>
									<span className="animate-pulse font-mono text-sm uppercase tracking-widest text-[#5F5B52]">Placing 1,000 careers on the map…</span>
								</div>
							</div>
						) : (
							<>
								<div ref={scatterContainerRef} className="relative mt-4 w-full overflow-hidden">
									<svg width={scatterDimensions.width} height={scatterDimensions.height} className="block">
										{/* Horizontal grid lines for AI exposure */}
										{[0, 25, 50, 75, 100].map((riskVal) => {
											const y = mapRiskToY(riskVal);
											return (
												<g key={riskVal}>
													<line
														x1={scatterMargin.left}
														y1={y}
														x2={scatterDimensions.width - scatterMargin.right}
														y2={y}
														stroke="#EFEFEF"
														strokeWidth="1"
													/>
													<text x={scatterMargin.left - 10} y={y + 4} textAnchor="end" fill="#64748B" className="font-mono text-[11px] font-semibold">
														{riskVal}%
													</text>
												</g>
											);
										})}

										{/* Vertical grid lines for pay */}
										{[20000, 60000, 100000, 140000, 180000, 220000, 260000, 300000].map((salVal) => {
											const x = mapSalaryToX(salVal);
											return (
												<g key={salVal}>
													<line
														x1={x}
														y1={scatterMargin.top}
														x2={x}
														y2={scatterDimensions.height - scatterMargin.bottom}
														stroke="#EFEFEF"
														strokeWidth="1"
													/>
													<text
														x={x}
														y={scatterDimensions.height - scatterMargin.bottom + 18}
														textAnchor="middle"
														fill="#64748B"
														className="font-mono text-[11px] font-semibold"
													>
														${salVal / 1000}k
													</text>
												</g>
											);
										})}

										{/* Quadrant rules at the medians of every plotted role. A dot's position only
										    means something relative to the rest of the field, so the field's midpoint is
										    the line worth drawing. */}
										<line
											x1={quadrantX}
											y1={scatterMargin.top}
											x2={quadrantX}
											y2={scatterDimensions.height - scatterMargin.bottom}
											stroke="#C6C0AE"
											strokeWidth="1"
											strokeDasharray="3 3"
										/>
										<line
											x1={scatterMargin.left}
											y1={quadrantY}
											x2={scatterDimensions.width - scatterMargin.right}
											y2={quadrantY}
											stroke="#C6C0AE"
											strokeWidth="1"
											strokeDasharray="3 3"
										/>

										{/* Corner labels, on the canvas, where the reading rule belongs. A narrow plot gets
										    two lines per corner, so opposite corners cannot run into each other at phone width. */}
										{(narrowPlot
											? [
													// At phone width only the two corners that carry the actionable claim survive:
													// four labels crowd the tick column the axis needs.
													{ anchor: 'end' as const, x: scatterDimensions.width - scatterMargin.right - 10, top: true, pay: 'High pay', exposure: 'high exposure', tone: '#64748B' },
													{ anchor: 'end' as const, x: scatterDimensions.width - scatterMargin.right - 10, top: false, pay: 'High pay', exposure: 'low exposure', tone: '#475F73' }
												]
											: [
													{ anchor: 'start' as const, x: scatterMargin.left + 10, top: true, pay: 'Low pay', exposure: 'high exposure', tone: '#64748B' },
													{ anchor: 'end' as const, x: scatterDimensions.width - scatterMargin.right - 10, top: true, pay: 'High pay', exposure: 'high exposure', tone: '#64748B' },
													{ anchor: 'start' as const, x: scatterMargin.left + 10, top: false, pay: 'Low pay', exposure: 'low exposure', tone: '#64748B' },
													{ anchor: 'end' as const, x: scatterDimensions.width - scatterMargin.right - 10, top: false, pay: 'High pay', exposure: 'low exposure', tone: '#475F73' }
												]
										).map((corner) => {
											const y = corner.top
												? scatterMargin.top + 16
												: scatterDimensions.height - scatterMargin.bottom - (narrowPlot ? 20 : 10);
											const lines = narrowPlot
												? [corner.pay, corner.exposure]
												: [`${corner.pay} · ${corner.exposure}`];
											return (
												<text
													key={`${corner.pay}-${corner.exposure}`}
													x={corner.x}
													y={y}
													textAnchor={corner.anchor}
													fill={corner.tone}
													stroke="#FFFFFF"
													strokeWidth="3"
													paintOrder="stroke"
													className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
												>
													{lines.map((line, index) => (
														<tspan key={line} x={corner.x} dy={index === 0 ? 0 : 12}>
															{line}
														</tspan>
													))}
												</text>
											);
										})}

										{/* Axis frames */}
										<line
											x1={scatterMargin.left}
											y1={scatterMargin.top}
											x2={scatterMargin.left}
											y2={scatterDimensions.height - scatterMargin.bottom}
											stroke="#D8D3C4"
											strokeWidth="1"
										/>
										<line
											x1={scatterMargin.left}
											y1={scatterDimensions.height - scatterMargin.bottom}
											x2={scatterDimensions.width - scatterMargin.right}
											y2={scatterDimensions.height - scatterMargin.bottom}
											stroke="#D8D3C4"
											strokeWidth="1"
										/>

										{/* Axis labels */}
										<text
											x={scatterMargin.left - 44}
											y={scatterDimensions.height / 2}
											fill="#1A1A1A"
											textAnchor="middle"
											className="font-mono text-[10.5px] uppercase font-bold tracking-[0.16em]"
											transform={`rotate(-90, ${scatterMargin.left - 44}, ${scatterDimensions.height / 2})`}
										>
											AI exposure
										</text>
										<text
											x={scatterMargin.left + scatterPlotWidth / 2}
											y={scatterDimensions.height - 8}
											fill="#1A1A1A"
											textAnchor="middle"
											className="font-mono text-[10.5px] uppercase font-bold tracking-[0.16em]"
										>
											Typical annual pay
										</text>

										{/* The field. Neutral enough to read as texture, coloured enough to carry risk. Each
										    dot carries a 9px transparent stroke, so the marker stays small while the thing
										    you can actually hit does not. */}
										{filteredExplorerCareers.map((item) => {
											const isSelected = selectedCode === item.code;
											if (isSelected) return null;
											const isHovered = hoveredScatterCareer?.code === item.code;
											const dotColor = item.risk_score > 65 ? bucketColor.high : item.risk_score > 35 ? bucketColor.medium : bucketColor.low;
											return (
												<circle
													key={item.code}
													cx={mapSalaryToX(item.salary)}
													cy={mapRiskToY(item.risk_score)}
													r={isHovered ? 6.5 : narrowPlot ? 4.5 : 3.5}
													fill={dotColor}
													opacity={hoveredScatterCareer ? (isHovered ? 1 : 0.12) : 0.38}
													stroke="transparent"
													strokeWidth="9"
													pointerEvents="all"
													onMouseMove={(e) => handleScatterMouseMove(e, item)}
													onMouseLeave={() => setHoveredScatterCareer(null)}
													onClick={() => openRole(item.code)}
													className="cursor-pointer"
												/>
											);
										})}

										{/* The reader's role, drawn once and drawn last so nothing sits on top of it. */}
										{selectedIndexItem && (
											<g className="pointer-events-none">
												<circle
													cx={mapSalaryToX(selectedIndexItem.salary)}
													cy={mapRiskToY(selectedIndexItem.risk_score)}
													r="14"
													fill="#1A1A1A"
													opacity="0.1"
												/>
												<circle
													cx={mapSalaryToX(selectedIndexItem.salary)}
													cy={mapRiskToY(selectedIndexItem.risk_score)}
													r="7.5"
													fill="#1A1A1A"
													stroke="#FFFFFF"
													strokeWidth="2"
												/>
											</g>
										)}
									</svg>

									{/* The selected role's label, always on: at 1,016 dots, a highlighted dot without a
									    name is a dot the reader has to hunt for. */}
									{selectedIndexItem && (() => {
										const x = mapSalaryToX(selectedIndexItem.salary);
										const y = mapRiskToY(selectedIndexItem.risk_score);
										const above = y > scatterDimensions.height * 0.45;
										return (
											<div
												className="pointer-events-none absolute z-10 max-w-[15rem] rounded-lg border border-[#1A1A1A] bg-white px-2.5 py-1.5"
												style={{
													left: Math.min(Math.max(x, 110), scatterDimensions.width - 110),
													top: above ? y - 66 : y + 18,
													transform: 'translateX(-50%)'
												}}
											>
												<p className="truncate text-[12.5px] font-bold leading-tight text-[#1A1A1A]">{selectedIndexItem.title}</p>
												<p className="font-mono text-[11px] uppercase tracking-wider text-[#5F5B52]">
													{selectedIndexItem.risk_score}/100 · {formatUSD(selectedIndexItem.salary)}
												</p>
											</div>
										);
									})()}

									{/* Hover tooltip */}
									{hoveredScatterCareer && (
										<div
											className="pointer-events-none absolute z-50 max-w-xs rounded-xl border border-[#D8D3C4] bg-white p-3"
											style={{
												left: `${tooltipPos.x}px`,
												top: `${tooltipPos.y - 45}px`,
												transform: tooltipPos.isRightHalf ? 'translate(calc(-100% - 15px), -50%)' : 'translate(15px, -50%)'
											}}
										>
											<p className="mb-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#475F73]">
												{hoveredScatterCareer.code}
											</p>
											<div className="line-clamp-1 text-sm font-bold text-[#1A1A1A]">{hoveredScatterCareer.title}</div>

											<div className="mt-2.5 flex items-center justify-between gap-4 border-t border-[#EFEFEF] pt-2 font-mono text-[11px]">
												<div>
													<span className="text-[#5E5E5E]">AI exposure:</span>
													<strong
														className={`ml-1 ${
															hoveredScatterCareer.risk_score > 65 ? 'text-[#A55252]' : hoveredScatterCareer.risk_score > 35 ? 'text-[#96693A]' : 'text-[#475F73]'
														}`}
													>
														{hoveredScatterCareer.risk_score}%
													</strong>
												</div>
												<div>
													<span className="text-[#5E5E5E]">Salary:</span>
													<strong className="ml-1 text-[#1A1A1A]">{formatUSD(hoveredScatterCareer.salary)}</strong>
												</div>
											</div>
											<p className="mt-2 text-center font-mono text-[9.5px] italic text-[#5F5B52]">Click to open this job</p>
										</div>
									)}
								</div>

								<p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[#5F5B52]">
									{filteredExplorerCareers.length.toLocaleString('en-US')} roles plotted · median pay {formatUSD(quadrantPay)} · median exposure {quadrantRisk}/100
								</p>
							</>
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
