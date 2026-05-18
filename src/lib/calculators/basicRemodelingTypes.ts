export type BasicProjectType =
	| 'kitchen'
	| 'bathroom'
	| 'windows-insulation'
	| 'hvac'
	| 'solar'
	| 'deck-patio'
	| 'curb-appeal'
	| 'flooring-paint'
	| 'other';

export type EnjoymentLevel = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';

export interface BasicRemodelingInputs {
	projectType: BasicProjectType;
	projectCost: number;
	estimatedResaleLift: number;
	yearsStaying: number;
	enjoymentLevel: EnjoymentLevel;
	maintenanceSavingsAnnual: number;
}

export type BasicRecommendation = 'worth-it' | 'maybe' | 'skip';

export interface BasicRemodelingBreakdown {
	resaleRecovery: number;
	staySavings: number;
	effectiveEnjoymentValue: number;
	totalRealizedValue: number;
	netValue: number;
	paybackYears: number | null;
	decisionScore: number;
	recommendation: BasicRecommendation;
	decisionNotes: string[];
}
