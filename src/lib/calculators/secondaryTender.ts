/**
 * Secondary Tender Offer vs. IPO Horizon.
 *
 * The decision a startup employee actually faces when a secondary buyer or a company tender
 * appears: take a known, discounted cash amount now, or hold an illiquid position for an exit
 * that may not happen. This model prices both sides on the same after-tax, present-value basis.
 *
 * Deliberate simplifications (stated in the UI, never hidden):
 *  - Cashless exercise: the strike is netted out of the proceeds, and the spread is taxed as
 *    ordinary income (NSO treatment). ISO/AMT treatment is out of scope.
 *  - Owned shares are long-term only when `heldOverOneYear` is true; otherwise ordinary rates.
 *  - QSBS (§1202) exclusion is applied only when eligible, held ≥ 5 years, and only up to
 *    min($10M, 10 × aggregate basis) — the statutory §1202(b) limits.
 *  - The downside case is modelled as $0 for the hold path. A secondary offer exists partly
 *    because the company is not public; pretending a failed exit recovers something would
 *    flatter the hold decision.
 */

export const SECONDARY_CONSTANTS_2026 = {
	QSBS_EXCLUSION_CAP: 10_000_000,
	QSBS_BASIS_MULTIPLE: 10,
	QSBS_MIN_HOLD_YEARS: 5
} as const;

export type SecondaryInstrument = 'options' | 'shares';

export interface SecondaryTenderInputs {
	shares: number;
	instrument: SecondaryInstrument;
	/** Strike for options, cost basis per share for owned stock. */
	basisPerShare: number;
	offerPricePerShare: number;
	lastRoundPricePerShare: number;
	expectedIpoPricePerShare: number;
	monthsToIpo: number;
	probabilityOfExitPct: number;
	annualDiscountRatePct: number;
	ordinaryTaxRatePct: number;
	/** Federal LTCG + NIIT + state, as one blended rate. */
	capitalGainsTaxRatePct: number;
	heldOverOneYear: boolean;
	qsbsEligible: boolean;
	qsbsHeldYears: number;
}

export interface SecondaryTenderOutputs {
	today: {
		grossProceeds: number;
		exerciseCost: number;
		taxableGain: number;
		tax: number;
		netCash: number;
		effectiveDiscountPct: number;
	};
	hold: {
		grossAtIpo: number;
		exerciseCost: number;
		taxableGain: number;
		tax: number;
		qsbsExcludedGain: number;
		netAtIpo: number;
		presentValue: number;
		riskAdjustedValue: number;
	};
	verdict: {
		recommendation: 'Take the secondary' | 'Hold for the IPO';
		advantageToday: number;
		breakevenIpoPrice: number;
		breakevenMultipleOfOffer: number;
		impliedProbabilityNeededPct: number;
	};
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const money = (n: number) => Math.round(n * 100) / 100;

function qsbsExcludedGain(gain: number, basisTotal: number, inputs: SecondaryTenderInputs): number {
	if (!inputs.qsbsEligible) return 0;
	if (inputs.instrument === 'options') return 0; // options are not QSBS; the exercised stock must be held
	if (inputs.qsbsHeldYears < SECONDARY_CONSTANTS_2026.QSBS_MIN_HOLD_YEARS) return 0;
	const cap = Math.min(
		SECONDARY_CONSTANTS_2026.QSBS_EXCLUSION_CAP,
		basisTotal * SECONDARY_CONSTANTS_2026.QSBS_BASIS_MULTIPLE
	);
	return Math.min(Math.max(gain, 0), cap);
}

function taxOnGain(gain: number, inputs: SecondaryTenderInputs, basisTotal: number) {
	const excluded = qsbsExcludedGain(gain, basisTotal, inputs);
	const taxable = Math.max(0, gain - excluded);
	const longTerm =
		inputs.instrument === 'shares' && inputs.heldOverOneYear;
	const rate = (longTerm ? inputs.capitalGainsTaxRatePct : inputs.ordinaryTaxRatePct) / 100;
	return { excluded, taxable, tax: taxable * rate };
}

export function calculateSecondaryTender(inputs: SecondaryTenderInputs): SecondaryTenderOutputs {
	const shares = Math.max(0, inputs.shares);
	const basis = Math.max(0, inputs.basisPerShare);
	const basisTotal = shares * basis;
	const exerciseCost = inputs.instrument === 'options' ? basisTotal : 0;

	// ---- Take the secondary now -------------------------------------------------------------
	const grossToday = shares * Math.max(0, inputs.offerPricePerShare);
	const gainToday = Math.max(0, grossToday - basisTotal);
	const taxedToday = taxOnGain(gainToday, inputs, basisTotal);
	const netCash = grossToday - exerciseCost - taxedToday.tax;

	const lastRound = Math.max(0, inputs.lastRoundPricePerShare);
	const effectiveDiscountPct =
		lastRound > 0 ? (1 - inputs.offerPricePerShare / lastRound) * 100 : 0;

	// ---- Hold for the IPO -------------------------------------------------------------------
	const grossAtIpo = shares * Math.max(0, inputs.expectedIpoPricePerShare);
	const gainAtIpo = Math.max(0, grossAtIpo - basisTotal);
	const taxedAtIpo = taxOnGain(gainAtIpo, inputs, basisTotal);
	const netAtIpo = grossAtIpo - exerciseCost - taxedAtIpo.tax;

	const years = Math.max(0, inputs.monthsToIpo) / 12;
	const discount = 1 + Math.max(0, inputs.annualDiscountRatePct) / 100;
	const presentValue = netAtIpo / Math.pow(discount, years);
	const probability = clamp(inputs.probabilityOfExitPct / 100, 0, 1);
	const riskAdjustedValue = presentValue * probability;

	// ---- Break-even IPO price ---------------------------------------------------------------
	// Solved numerically against the same tax function, so the QSBS cap and the ordinary/LTCG
	// switch are priced in instead of being approximated by one blended rate.
	const riskAdjustedAtPrice = (price: number) => {
		const gross = shares * Math.max(0, price);
		const gain = Math.max(0, gross - basisTotal);
		const taxed = taxOnGain(gain, inputs, basisTotal);
		const net = gross - exerciseCost - taxed.tax;
		return (net / Math.pow(discount, years)) * probability;
	};

	let breakevenIpoPrice = Number.POSITIVE_INFINITY;
	if (probability > 0 && shares > 0) {
		let hi = Math.max(inputs.offerPricePerShare * 20, inputs.lastRoundPricePerShare * 5, basis * 5, 1);
		if (riskAdjustedAtPrice(hi) >= netCash) {
			let lo = 0;
			for (let i = 0; i < 80; i++) {
				const mid = (lo + hi) / 2;
				if (riskAdjustedAtPrice(mid) >= netCash) hi = mid;
				else lo = mid;
			}
			breakevenIpoPrice = hi;
		}
	}

	const offer = Math.max(0.01, inputs.offerPricePerShare);
	const breakevenMultipleOfOffer = breakevenIpoPrice / offer;
	const impliedProbabilityNeededPct =
		presentValue > 0 ? clamp((netCash / presentValue) * 100, 0, 100) : 100;

	const holdWins = riskAdjustedValue > netCash;
	return {
		today: {
			grossProceeds: money(grossToday),
			exerciseCost: money(exerciseCost),
			taxableGain: money(gainToday),
			tax: money(taxedToday.tax),
			netCash: money(netCash),
			effectiveDiscountPct: Math.round(effectiveDiscountPct * 10) / 10
		},
		hold: {
			grossAtIpo: money(grossAtIpo),
			exerciseCost: money(exerciseCost),
			taxableGain: money(gainAtIpo),
			tax: money(taxedAtIpo.tax),
			qsbsExcludedGain: money(taxedAtIpo.excluded),
			netAtIpo: money(netAtIpo),
			presentValue: money(presentValue),
			riskAdjustedValue: money(riskAdjustedValue)
		},
		verdict: {
			recommendation: holdWins ? 'Hold for the IPO' : 'Take the secondary',
			advantageToday: money(holdWins ? riskAdjustedValue - netCash : netCash - riskAdjustedValue),
			breakevenIpoPrice: Number.isFinite(breakevenIpoPrice) ? money(breakevenIpoPrice) : Number.POSITIVE_INFINITY,
			breakevenMultipleOfOffer: Number.isFinite(breakevenMultipleOfOffer)
				? Math.round(breakevenMultipleOfOffer * 100) / 100
				: Number.POSITIVE_INFINITY,
			impliedProbabilityNeededPct: Math.round(impliedProbabilityNeededPct * 10) / 10
		}
	};
}
