/**
 * Which paid tool, if any, genuinely answers the question the page is about.
 *
 * Why this module exists (owner-approved build, 2026-10-10): the reader sites carry ~1,150 indexed
 * pages and not one of them offered anything to buy — the only product link on a page was the nav
 * item pointing at the tool directory. Indexed page → matching tool → checkout is the cheapest
 * money path this factory has, because the traffic is already in Google's index and the checkout
 * already works.
 *
 * The rule this file must not break: **only map a page to a tool that actually answers it.** A
 * fabricated match (a career calculator pointed at an invoice auditor) costs the one visit the page
 * earns and makes the whole corpus untrustworthy, so the map is deliberately partial — 52 of the 86
 * live articles, and no calculator page. A page with no honest match renders nothing.
 *
 * The catalog is validated at module load, which Astro evaluates during `astro build`: an override
 * naming a product that does not exist, or a product URL with a capital letter in the path (Next
 * routes are case-sensitive — the reader sitemap shipped five `404`s that way), fails the build.
 */
export interface ProductCta {
  /** Product slug as it appears in the product host's route. */
  product: string;
  name: string;
  tagline: string;
  url: string;
  /** One line naming why a reader of THIS page wants THIS tool. */
  why: string;
}

const PRODUCTS = {
  ledgerlink: {
    name: 'LedgerLink',
    tagline: 'Stripe payout → GL reconciliation engine',
    url: 'https://apps.giniloh.com/ledgerlink',
  },
  facturgate: {
    name: 'FacturGate',
    tagline: 'EU e-invoice pre-send gate and Factur-X / UBL converter',
    url: 'https://apps.giniloh.com/facturgate',
  },
  parcelproof: {
    name: 'ParcelProof',
    tagline: 'Carrier invoice DIM-weight and surcharge audit',
    url: 'https://apps.giniloh.com/parcelproof',
  },
  caseproof: {
    name: 'CaseProof',
    tagline: 'Buyer-side audit of a warehouse-automation business case',
    url: 'https://apps.giniloh.com/caseproof',
  },
  spendproof: {
    name: 'SpendProof',
    tagline: 'AI provider invoice ↔ tagged-usage reconciliation',
    url: 'https://apps.giniloh.com/spendproof',
  },
} as const;

type ProductSlug = keyof typeof PRODUCTS;

/**
 * Category-level defaults. Only categories whose whole subject is the tool's subject are mapped:
 * carrier and customs money (`supply-chain-operations`), AI bills (`ai-stack-tool-tco`) and the
 * automation business case (`business-automation-operations`).
 */
const BY_CATEGORY: Record<string, { product: ProductSlug; why: string }> = {
  'supply-chain-operations': {
    product: 'parcelproof',
    why: 'This page is about money a carrier bills by rule — ParcelProof recomputes those same rule triggers (DIM divisor, AHS dimensions, fuel peg, the dispute clock) from your own invoice lines and names the ones with no basis.',
  },
  'ai-stack-tool-tco': {
    product: 'spendproof',
    why: 'The bill this page is about, line by line: SpendProof reconciles an AI provider invoice against your own tagged usage and withholds a clean close whenever a bucket does not reconcile.',
  },
  'autonomous-agentic-workflows': {
    product: 'spendproof',
    why: 'Governance stops at the invoice: SpendProof ties each AI provider line to tagged usage, so untagged agent spend becomes a finding instead of a surprise.',
  },
  'business-automation-operations': {
    product: 'caseproof',
    why: 'This is the buying decision CaseProof audits: it re-runs a vendor’s quoted numbers against your own fully loaded costs and lists what to confirm in writing before you sign.',
  },
};

/**
 * Slug-level matches, where the page's subject is a specific product's subject and the category
 * default would be wrong (the four launch notes) or absent.
 */
const BY_SLUG: Record<string, { product: ProductSlug; why: string }> = {
  'parcelproof-stop-bleeding-28-on-carrier-invoices': {
    product: 'parcelproof',
    why: 'This is the launch note for ParcelProof — the audit it describes runs on your own invoice and shipment files.',
  },
  'facturgate-the-deterministic-pre-send-gate-converter-for-european-e': {
    product: 'facturgate',
    why: 'This is the launch note for FacturGate — the EN 16931 pre-send gate it describes runs on your own invoice model or CII/UBL file.',
  },
  'caseproof-stop-signing-3m-warehouse-automation-deals-on-a-vendors': {
    product: 'caseproof',
    why: 'This is the launch note for CaseProof — the buyer-side audit it describes runs on your own quote and cost assumptions.',
  },
  'stripe-accounting-software-solving-the-payout-black-box-with': {
    product: 'ledgerlink',
    why: 'This is the launch note for LedgerLink — the payout decomposition it describes runs on your own Stripe payout export.',
  },
};

export function productCtaFor(input: { slug?: string | null; categorySlug?: string | null }): ProductCta | null {
  const match = (input.slug ? BY_SLUG[input.slug] : undefined) ?? (input.categorySlug ? BY_CATEGORY[input.categorySlug] : undefined);
  if (!match) return null;
  const product = PRODUCTS[match.product];
  return {
    product: match.product,
    name: product.name,
    tagline: product.tagline,
    url: product.url,
    why: match.why,
  };
}

/**
 * Build-time validation. Astro evaluates this module while building, so a broken map fails the
 * build instead of shipping a dead link into ~50 indexed pages.
 */
function assertCatalog(): void {
  const entries: [string, { product: string }][] = [
    ...Object.entries(BY_CATEGORY),
    ...Object.entries(BY_SLUG),
  ];
  for (const [key, entry] of entries) {
    if (!(entry.product in PRODUCTS)) {
      throw new Error(`product-cta: "${key}" maps to unknown product "${entry.product}"`);
    }
  }
  for (const [slug, product] of Object.entries(PRODUCTS)) {
    if (!product.url.startsWith('https://apps.giniloh.com/')) {
      throw new Error(`product-cta: ${slug} must link to the product host (${product.url})`);
    }
    if (product.url !== product.url.toLowerCase()) {
      throw new Error(
        `product-cta: ${slug} has a capital letter in its path (${product.url}) — Next routes are case-sensitive and the product host answers 404 for a capitalized path.`,
      );
    }
  }
}

assertCatalog();
