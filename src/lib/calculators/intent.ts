/**
 * Structured data + the shapes the intent-wrapper component renders.
 *
 * An interactive calculator is thin content to a crawler: the value lives behind inputs and
 * JavaScript state, so the served HTML has to carry the method, worked numbers and answers on its
 * own. Before this, 0 of 18 calculator pages on the estate emitted FAQPage markup, and 6 carried
 * under 400 words of static text.
 */

export interface IntentFaq {
	q: string;
	a: string;
}

export interface IntentStep {
	label: string;
	body: string;
}

export interface IntentRow {
	label: string;
	inputs: string;
	result: string;
}

/** FAQPage JSON-LD. Emitted by the page into <head>, next to the calculator's own schema. */
export function faqPageSchema(faqs: IntentFaq[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.q,
			acceptedAnswer: { '@type': 'Answer', text: faq.a }
		}))
	};
}

/** `$1,234` — fixed to whole dollars; scenario tables are illustrative, not invoices. */
export function usd(value: number): string {
	if (!Number.isFinite(value)) return '—';
	return `$${Math.round(value).toLocaleString('en-US')}`;
}

/** `$1.234`-style unit prices keep three decimals where a cent hides the difference. */
export function usdPrecise(value: number, digits = 2): string {
	if (!Number.isFinite(value)) return '—';
	return `$${value.toFixed(digits)}`;
}
