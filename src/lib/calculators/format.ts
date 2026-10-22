export function formatCurrency(value: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number) {
	return `${Number.isFinite(value) ? value : 0}%`;
}

/**
 * Integer with thousands separators, locale PINNED.
 *
 * `value.toLocaleString()` with no locale uses whatever ICU default the runtime happens to have.
 * These cards are server-rendered *and* hydrated, so that default is the build machine's on the
 * server pass and the visitor's on the client pass — any disagreement (a different grouping
 * separator is enough) is a React hydration mismatch, and it flashes on first paint. One locale,
 * both passes.
 */
export function formatNumber(value: number) {
	return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
		Number.isFinite(value) ? value : 0
	);
}

/** `$/hr` -> `$150/hr`, `hrs/mo` -> `120 hrs/mo`. Keeps the unit the asset declares. */
export function formatWithUnit(value: number, unit: string) {
	if (unit.startsWith('$')) return `${formatCurrency(value)}${unit.slice(1)}`;
	return `${formatNumber(value)}${unit ? ` ${unit}` : ''}`;
}
