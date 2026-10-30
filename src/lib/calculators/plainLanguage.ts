/**
 * The plain-language half of every calculator page.
 *
 * WHY THIS EXISTS
 * The engines were written by and for people who already speak the dialect: net yield, amortisation,
 * bps, QSBS, loaded cost. A visitor with the actual problem — a lease, an offer letter, a vesting
 * schedule — bounces on the vocabulary before they reach the arithmetic. This module holds the one
 * block that fixes the order of the conversation: the decision in their words, the paperwork they
 * need, the words on the page translated once, and what to do with the answer.
 *
 * Rendered by components/calculators/PlainLanguageAnchor.astro through CalculatorShell, so every
 * calculator gets the same treatment and a new one cannot ship without it: the record below is keyed
 * by CalculatorSlug, and a missing entry fails type-check.
 *
 * HOUSE RULES FOR THIS FILE
 * - Question form, second person, no acronym in the question itself.
 * - `haveReady` names a document or a portal, not a concept ("the vesting table in your equity
 *   portal", not "your vesting parameters").
 * - `words` only carries what this page actually prints. No glossary for the sake of a glossary.
 * - `next` is an action someone can take this week without hiring anyone.
 */
import type { CalculatorTool } from './metadata';
import { CAREER_AI_NEXT, CAREER_AI_QUESTION, CAREER_AI_WORDS } from './careerAiCopy';


export type CalculatorSlug = CalculatorTool['slug'];

export interface PlainWord {
	/** The term as the page or the paperwork prints it. */
	term: string;
	/** One sentence. What it means here, not the textbook definition. */
	plain: string;
}

export interface PlainLanguageEntry {
	/** The decision, in the reader's words. */
	question: string;
	/** 2-3 things to have in front of you, each naming where the number lives. */
	haveReady: string[];
	/** Acronyms and dialect actually used on this page. */
	words?: PlainWord[];
	/** What to do once the verdict is on screen. */
	next?: string[];
}

export const PLAIN_LANGUAGE: Record<CalculatorSlug, PlainLanguageEntry> = {
	'rsu-hold-vs-sell': {
		question: 'Should you sell the company stock as it vests, or keep it and bet more of your savings on your employer?',
		haveReady: [
			'Your equity portal: the next vest date and how many shares land.',
			'Last year\u2019s tax return, for the bracket the shares are taxed in.',
			'The grant price and today\u2019s price, both shown on the same statement.'
		],
		words: [
			{
				term: 'RSU',
				plain: 'Restricted stock unit. Shares your employer gives you as part of pay, taxed as income the day they vest.'
			},
			{
				term: 'Concentration risk',
				plain: 'How much of your savings depends on one company. Your paycheck already depends on it too.'
			},
			{
				term: 'Mega Backdoor Roth',
				plain: 'Extra after-tax 401(k) money that can be converted to Roth, if your plan allows it.'
			}
		],
		next: [
			'Ask payroll whether your 401(k) allows after-tax contributions and in-plan conversion. Most people assume it does not.',
			'Pick the share of your savings one company may hold, then sell down to it on a schedule instead of on a hunch.',
			'If you would not buy the stock with new cash today, selling on vest is the same decision.'
		]
	},

	'w2-vs-1099-scorp-calculator': {
		question: 'The same work, offered as a job, a contract, or through your own company: which one leaves you with more money?',
		haveReady: [
			'The offer letter: salary, bonus, and what the employer puts toward health cover and retirement.',
			'The contract rate, and the hours a week you can honestly bill after admin and bench time.',
			'Quotes for running a company: filing, payroll, bookkeeping, and what health cover costs you alone.'
		],
		words: [
			{
				term: 'SE tax',
				plain: 'Self-employment tax, 15.3%. An employer normally pays half of your Social Security and Medicare; a contractor pays both halves.'
			},
			{
				term: 'S-Corp',
				plain: 'A company structure where you pay yourself a salary and take the rest as a distribution, which skips payroll tax.'
			},
			{
				term: 'QBI deduction',
				plain: 'A deduction for business income, worth up to 20% of it, that can swing the answer toward contracting.'
			}
		],
		next: [
			'Before choosing the S-Corp, ask an accountant what a defensible salary is for your role. An aggressive split invites the payroll-tax bill later.',
			'Add the unpaid hours to the contractor side: bench weeks, invoicing, and the time you spend chasing clients.',
			'Compare the three on take-home per hour worked, not on headline revenue.'
		]
	},

	'secondary-tender-calculator': {
		question: 'Your private company shares can be sold now at a discount. Is that cash worth more than waiting for an exit that may not come?',
		haveReady: [
			'The offer: price per share, how many shares it covers, and the deadline to accept.',
			'Your grant documents: strike price, vested shares, and the date you acquired them.',
			'The last headline valuation, so you can see the discount being asked of you.'
		],
		words: [
			{
				term: 'Tender offer',
				plain: 'A private buyer offering to purchase shares before any IPO, usually below the last announced valuation.'
			},
			{
				term: 'QSBS',
				plain: 'Qualified small business stock. A rule that can make the gain tax-free if you held the shares long enough and the company qualified.'
			},
			{
				term: 'Present value',
				plain: 'What a future payout is worth today, after discounting for the wait and for the chance it never arrives.'
			}
		],
		next: [
			'Check the acquisition date against the five-year QSBS clock before accepting anything. A sale can reset it.',
			'Ask the company for the current 409A price. The tender discount only means something against that number.',
			'Size the position against your total savings. A 20% discount is not compensation for a stake you cannot sell.'
		]
	},

	'build-vs-buy': {
		question: 'Should your team build this internal tool, or pay a vendor for it?',
		haveReady: [
			'The vendor contract: annual price, seats, and the last two renewal increases.',
			'Engineer-months to a working version, including review, testing and migration.',
			'What an engineer-month costs your company once salary, benefits and overhead are loaded in.'
		],
		words: [
			{
				term: 'Loaded cost',
				plain: 'Salary plus benefits, equipment and overhead. The real monthly cost of an engineer, not the number on the offer.'
			},
			{
				term: 'Parity',
				plain: 'The month your build matches what the vendor already does. Everything before it is spend with nothing to show.'
			},
			{
				term: 'Maintenance fraction',
				plain: 'The permanent slice of an engineer a tool consumes after launch. Vendors quote it; internal business cases usually do not.'
			}
		],
		next: [
			'Ask who is on call for the build in month 18, when the person who wrote it has moved teams.',
			'Price the vendor at its renewal rate, not the introductory one, over the same horizon.',
			'If the build only wins by excluding maintenance, it does not win.'
		]
	},

	'gpu-breakeven': {
		question: 'Is a workstation you own cheaper than renting cloud GPUs, at the hours you will actually run it?',
		haveReady: [
			'The all-in hardware price: card, host, tax and shipping.',
			'Monthly hours of real GPU use, taken from your logs rather than the busy week.',
			'The cloud rate you would otherwise pay, per GPU-hour, at your commitment level.'
		],
		words: [
			{
				term: 'GPU-hour',
				plain: 'One GPU running for one hour. The unit both the cloud bill and the owned machine are priced in.'
			},
			{
				term: 'Utilisation',
				plain: 'The share of the month the hardware is actually computing. Idle hours are free on cloud and billed locally.'
			},
			{
				term: 'Residual value',
				plain: 'What the card is worth used when you sell it. Counting it as zero makes owning look worse than it is.'
			}
		],
		next: [
			'Count a realistic 24-month life. A card that is obsolete in 18 months changes the answer more than the purchase price does.',
			'Add the hours you spend maintaining drivers and cooling. They are not free, they are just unpaid.',
			'If utilisation is under about a third of the month, rent. Above that, the hardware tends to win.'
		]
	},

	'rent-vs-buy': {
		question: 'Over the years you plan to stay, does buying leave you richer than renting and investing the difference?',
		haveReady: [
			'Two real numbers for the same home: the purchase price and the monthly rent.',
			'Your mortgage rate, and what you would put down.',
			'The property tax rate and insurance quote for that address, not the county average.'
		],
		words: [
			{
				term: 'Price-to-rent',
				plain: 'The home price divided by a year of rent. Near 15 or below, owning usually wins on cost; above 20, it needs rising prices.'
			},
			{
				term: 'Opportunity cost',
				plain: 'What the down payment would have earned if you had invested it instead of putting it into the house.'
			},
			{
				term: 'Net proceeds',
				plain: 'What you keep from a sale after the agent\u2019s commission and the remaining loan are paid.'
			}
		],
		next: [
			'Set the horizon to how long you will really stay. Under five years, closing and selling costs usually decide the answer.',
			'If the renter wins here, the case for buying is stability and control. Decide whether that is worth the gap.',
			'Re-run it at 0% appreciation. If buying still wins, the decision is not resting on a forecast.'
		]
	},

	'lease-break': {
		question: 'What does it actually cost to walk out of your lease early?',
		haveReady: [
			'Your signed lease: the early-termination clause and the notice period it demands.',
			'The monthly rent and how many months are left on the term.',
			'The deposit you paid, and the conditions under which it is returned.'
		],
		words: [
			{
				term: 'Reletting fee',
				plain: 'What the landlord charges to find a replacement tenant. Commonly one month of rent, sometimes more.'
			},
			{
				term: 'Offset',
				plain: 'Rent the landlord recovers from the next tenant, which in most states reduces what you still owe.'
			},
			{
				term: 'Accelerated rent',
				plain: 'The remaining rent for the whole term, billed at once. Some leases say this; many states limit it.'
			}
		],
		next: [
			'Find the mitigation clause. Where the landlord must re-let, your exposure is the vacancy, not the whole lease.',
			'Ask in writing what they will accept to sign a release. A number in writing beats a clause you are reading alone.',
			'Price the move against the penalty. Sometimes paying the penalty is the cheaper exit.'
		]
	},

	'raise-velocity': {
		question: 'You can stay and take the annual raise, or move for a bigger number. Which leaves you with more after ten years?',
		haveReady: [
			'Your current salary, and the raise percentages of the last three years.',
			'What a move would realistically pay, from a recruiter conversation rather than a headline.',
			'How many years you intend to keep working. The compounding needs runway.'
		],
		words: [
			{
				term: 'Velocity',
				plain: 'How fast your pay rises per year. A 3% raise and a 15% move are the same decision repeated annually.'
			},
			{
				term: 'Cliff',
				plain: 'Unvested equity you forfeit by leaving. It is a real cost of the move and belongs on the leaving side.'
			}
		],
		next: [
			'Add the unvested equity you would forfeit. A move that pays 15% more can still lose in year one.',
			'Check whether the new employer matches the retirement contribution you are giving up.',
			'Decide on a review cadence: switching every 18 months has its own cost in trust and depth.'
		]
	},

	'total-comp': {
		question: 'Two offers, both described as $200k. Which one actually pays more?',
		haveReady: [
			'The written offer: base, target bonus, signing, and the equity grant.',
			'The vesting schedule and the current share price, or the strike price for options.',
			'What the health plan costs you monthly, and the 401(k) match.'
		],
		words: [
			{
				term: 'RSU',
				plain: 'Restricted stock unit. Shares that become yours on a schedule, taxed as income when they do.'
			},
			{
				term: 'Strike price',
				plain: 'What you pay per share to exercise an option. Worth nothing until the share price is above it.'
			},
			{
				term: 'Cliff',
				plain: 'The waiting period before any equity vests, usually one year. Leave before it and you take nothing.'
			}
		],
		next: [
			'Apply a haircut to private-company equity. A paper valuation is not cash until someone buys it.',
			'Compare the first four years of cash separately from the equity story.',
			'Ask what happens to unvested grants if the company is acquired.'
		]
	},

	'money-flow': {
		question: 'Where does each paycheck land, and what would routing it in a different order be worth over ten years?',
		haveReady: [
			'Your monthly take-home pay, after tax and deductions.',
			'Fixed costs: rent, debt payments, utilities, and the subscriptions you forgot.',
			'What your employer matches, and any debt above roughly 7% interest.'
		],
		words: [
			{
				term: 'Waterfall',
				plain: 'The order money moves through your accounts. The order changes the result more than the amount does.'
			},
			{
				term: 'Match',
				plain: 'The employer contribution you only get if you put in your own. Leaving it unclaimed is a pay cut.'
			}
		],
		next: [
			'Fund the employer match first. Nothing else on the list returns 50-100% immediately.',
			'Clear any debt above 7% before investing beyond the match.',
			'Automate the order once, on payday, instead of deciding it monthly.'
		]
	},

	'relocation-cost': {
		question: 'How many months of the new salary does it take to pay back the cost of moving?',
		haveReady: [
			'Moving quotes, deposits, and the first month of rent or a mortgage.',
			'Any lease break at the current address, including the notice period.',
			'The raise after tax, not the gross difference.'
		],
		words: [
			{
				term: 'Payback period',
				plain: 'The months of extra take-home pay it takes to recover what the move cost. Past that, the move is profit.'
			},
			{
				term: 'Gross-up',
				plain: 'Extra money an employer adds so that a relocation benefit covers the tax on itself.'
			}
		],
		next: [
			'Get the relocation package in writing, including whether it is repayable if you leave within a year.',
			'Check the state tax difference on the new salary. It can eat a visible share of the raise.',
			'If payback runs past two years, treat the move as a life decision rather than a financial one.'
		]
	},

	'coffee-arbitrage': {
		question: 'Is a $3,000 espresso setup cheaper than the café, at the number of cups you actually drink?',
		haveReady: [
			'The full kit price: machine, grinder, and the extras that always follow.',
			'Cups a week, counted honestly, including the weeks you are away.',
			'What you pay per café drink, and what a kilo of your beans costs.'
		],
		words: [
			{
				term: 'Cost per use',
				plain: 'Machine plus grinder plus beans plus upkeep, divided by the drinks it makes before it dies.'
			},
			{
				term: 'Depreciation',
				plain: 'What the machine loses in value each year. It does not change the coffee, but it is part of the cost.'
			}
		],
		next: [
			'Count the milk, the descaler and the beans you throw away. The kit is never just the machine.',
			'If you drink under one cup a day, buy the better café coffee and keep the counter space.',
			'Re-run it at the machine\u2019s second-hand price to see what owning actually cost you.'
		]
	},

	'tech-debt-repair': {
		question: 'Is repairing this laptop or phone cheaper than replacing it, once the repair\u2019s lifespan is counted?',
		haveReady: [
			'The repair quote, parts and labour, from a shop rather than a forum.',
			'The device age, and what a comparable replacement costs today.',
			'How many more years you need it to work.'
		],
		words: [
			{
				term: 'Cost per year',
				plain: 'The repair or replacement price divided by the years it buys. The only fair way to compare a $300 fix with a $1,400 laptop.'
			},
			{
				term: 'Residual value',
				plain: 'What the old device would sell for today. It offsets the replacement price, and it falls every month.'
			}
		],
		next: [
			'Divide both options by the years each one buys before comparing them.',
			'Check the repair warranty. Three months on a $400 fix is a different offer from a year.',
			'If the device is already off warranty and past four years, the honest comparison is against a refurbished replacement.'
		]
	},

	'no-code-terminator': {
		question: 'How much is the spreadsheet-and-automation workaround costing you in hours, against the price of proper software?',
		haveReady: [
			'Hours a week spent keeping the workaround alive: fixing, re-running, re-explaining.',
			'What your hour is worth, or what you would bill a client for it.',
			'The subscription price of the tool that replaces it, per seat, per month.'
		],
		words: [
			{
				term: 'Tinkering tax',
				plain: 'The hours a month you spend maintaining the workaround. Nobody invoices it, so nobody counts it.'
			},
			{
				term: 'SaaS',
				plain: 'Software you rent by the month instead of building and maintaining yourself.'
			}
		],
		next: [
			'Log the maintenance hours for one week before deciding. The estimate is always low.',
			'Check the migration cost: exporting years of a spreadsheet is the part that stalls these projects.',
			'If the workaround only survives because you maintain it, price your own time at a real rate.'
		]
	},

	'career-ai-resilience': {
		question: CAREER_AI_QUESTION,
		haveReady: [
			'Your job title, and the tasks that actually fill the week.',
			'The share of those tasks that happen at a desk, on text, in software.',
			'Which tasks you would hand over today if the output were good enough.'
		],
		words: CAREER_AI_WORDS,
		next: CAREER_AI_NEXT
	},

	'expat-evaluator': {
		question: 'If you move country, what is left of your pay after both tax systems have taken their share?',
		haveReady: [
			'The gross offer in the new country\u2019s currency, and the exchange rate you will actually get.',
			'Your equity grants, and where you will be resident when each one vests.',
			'Housing cost in the new city, and whether the employer covers it.'
		],
		words: [
			{
				term: 'FEIE',
				plain: 'Foreign earned income exclusion. A slice of foreign wages the US does not tax, if you live abroad long enough to qualify.'
			},
			{
				term: 'FTC',
				plain: 'Foreign tax credit. Tax paid abroad, credited against what the US says you owe, so the same income is not taxed twice.'
			},
			{
				term: 'Tax equalisation',
				plain: 'A company policy that keeps your tax bill at what it would have been at home, and takes back the difference if it drops.'
			}
		],
		next: [
			'Model the move at the exchange rate today and 15% weaker. Currency has moved more than the tax difference in recent years.',
			'Check where your equity vests. A move mid-vest can split one grant across two tax systems.',
			'Compare five years, not one. Relocation costs land in year one and the tax benefit accrues later.'
		]
	}
};

/**
 * Lookup by the slug CalculatorShell derives from the URL. Returns undefined for pages that are not
 * calculators, so the shell can render nothing rather than an empty panel.
 */
export function getPlainLanguage(slug: string): PlainLanguageEntry | undefined {
	return (PLAIN_LANGUAGE as Record<string, PlainLanguageEntry>)[slug];
}
