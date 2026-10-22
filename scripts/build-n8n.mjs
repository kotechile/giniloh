/**
 * Generates the n8n workflow JSON for the vibe-marketing pipeline.
 *
 * WHY GENERATED, NOT HAND-WRITTEN: all three properties (giniloh.com, aichieve.net,
 * wellroost.com) point `PUBLIC_N8N_WEBHOOK_URL` at the SAME endpoint
 * (`https://n8n.giniloh.com/webhook/vibe-telemetry`) on ONE n8n instance. A workflow file that
 * drifts per repo registers a different path or payload shape and silently stops matching. Generate
 * once, copy everywhere — the files are identical in every repo's `n8n/` folder on purpose.
 *
 * FOUR FAULTS THIS FIXES. The previous output was dead on arrival for all of them:
 *
 * 1. NO CORS. The webhook had `options: {}`, so n8n returned no `Access-Control-Allow-Origin` and
 *    the browser blocked every POST at the preflight. The site looked fine; n8n saw nothing.
 * 2. EMAIL IN THE TELEMETRY PATH. The workflow ended in `emailSend` reading `$json.email`, which a
 *    telemetry event never carries (field names only, by design). With no SMTP credential attached,
 *    every execution that reached it failed — the reported "failing because missing emails".
 *    Addresses live in Supabase, so mailing is now a scheduled poll of that table, not a reaction to
 *    a webhook that has no address in it.
 * 3. PLACEHOLDER SIDE EFFECTS. The Slack node pointed at `hooks.slack.com/services/REPLACE/...` with
 *    no error handling, so an unconfigured alert turned a good event into a failed execution.
 * 4. DUPLICATE WRITES. It also POSTed events to Supabase, which the browser already does.
 */
import fs from 'node:fs';

const SUPABASE_URL = 'https://ixfdkninqeqmwuxncpvh.supabase.co';
const WEBHOOK_PATH = 'vibe-telemetry';

/**
 * Property slug -> the hostname that may send as it. This is the ONE place the mapping lives; the
 * "Resolve Domain" node emits it into the workflow as a literal so a row cannot invent a sender.
 *
 * `vertical_slug` holds the PROPERTY (giniloh | wellroost | aichieve) on every lead table now;
 * `domain_category` holds the pillar (`career-capital`, `agentic-ai`, ...). The previous resolver
 * searched the string 'aichieve' inside vertical_slug and defaulted everything else to giniloh.com,
 * so a wellroost row without `calculated_metrics.domain` was mailed from reports@giniloh.com with a
 * giniloh link — and a client-chosen `metrics.domain` could choose the From address outright.
 */
const PROPERTY_DOMAINS = {
	giniloh: 'giniloh.com',
	wellroost: 'wellroost.com',
	aichieve: 'aichieve.net'
};

// Every lead table, polled by the ONE scheduled workflow. One file means importing it anywhere
// cannot double-send: each table is handled exactly once per tick.
const LEAD_TABLES = [
	// A table can hold rows for several properties, but a mail account cannot send as another
	// domain's address. `domains` is what the send step is split on.
	{
		table: 'vibe_lead_intents',
		label: 'giniloh + wellroost',
		fallbackDomain: 'giniloh.com',
		domains: ['wellroost.com', 'giniloh.com']
	},
	{ table: 'aichieve_lead_intents', label: 'aichieve', fallbackDomain: 'aichieve.net', domains: ['aichieve.net'] }
];

/** `wellroost.com` -> `wellroost`, so node names stay readable on the canvas. */
const domainLabel = (domain) => domain.split('.')[0];

const node = (type, name, parameters, position, extra = {}) => {
	// Anything that is not one of the four core fields is a platform-level node setting
	// (`onError`, `retryOnFail`, `alwaysOutputData`, ...) and is emitted as-is. Dropping them here
	// is how a workflow ends up with error handling that silently does not exist.
	const { typeVersion = 2, id, notes, ...rest } = extra;
	return {
		parameters,
		name,
		type: `n8n-nodes-base.${type}`,
		typeVersion,
		position,
		id: id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
		...(notes ? { notes } : {}),
		...rest
	};
};

/** Telemetry receiver — human alerts only. Events are already stored by the browser. */
function telemetryWorkflow() {
	return {
		name: 'Vibe Telemetry — giniloh / aichieve / wellroost',
		nodes: [
			node(
				'webhook',
				'Telemetry Webhook',
				{
					httpMethod: 'POST',
					path: WEBHOOK_PATH,
					responseMode: 'onReceived',
					options: { allowedOrigins: '*' }
				},
				[-560, 200],
				{
					typeVersion: 2,
					notes: `Path must stay "${WEBHOOK_PATH}" — that is the path inside PUBLIC_N8N_WEBHOOK_URL on all three apps.`
				}
			),
			node(
				'switch',
				'Route by Payload Type',
				{
					rules: {
						values: [
							{
								conditions: {
									options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
									conditions: [
										{
											leftValue: '={{ $json.body.type }}',
											rightValue: 'lead_intent',
											operator: { type: 'string', operation: 'equals' }
										}
									],
									combinator: 'and'
								},
								renameOutput: true,
								outputKey: 'lead_intent'
							}
						]
					},
					options: { fallbackOutput: 'extra' }
				},
				[-300, 200],
				{
					typeVersion: 3.2,
					notes: 'Clients send { type: "lead_intent", lead } or { type: "telemetry_event", event }; anything else falls through to Ignore instead of failing.'
				}
			),
			node(
				'code',
				'Shape Lead Alert',
				{
					jsCode: `// giniloh/aichieve send camelCase inside \`lead\`; accept snake_case too.
// verticalSlug is the PROPERTY, domainCategory is the PILLAR. Keep them apart in the alert: the
// point of the notification is "which site, which topic, what did they build".
const body = $json.body || $json;
const lead = body.lead || body;
const email = lead.email || '';
const assetSlug = lead.assetSlug || lead.asset_slug || 'unknown-asset';
const metrics = lead.calculatedMetrics || lead.calculated_metrics || {};
const assetTitle = metrics.assetTitle || assetSlug;
const property = lead.verticalSlug || lead.vertical_slug || body.origin || 'unknown-property';
const pillar = lead.domainCategory || lead.domain_category || 'unclassified';
const consent = lead.consentTextVersion || lead.consent_text_version || 'unrecorded';
return [{ json: {
  email,
  assetSlug,
  assetTitle,
  property,
  pillar,
  consentTextVersion: consent,
  hasEmail: String(email).includes('@'),
  summary: 'New scenario request — ' + assetTitle + ' (' + property + ' · ' + pillar + ')'
} }];`
				},
				[-40, 100],
				{ typeVersion: 2, notes: 'Leads are mailed by the scheduled "Lead Reports" workflow; this branch only alerts a human.' }
			),
			node(
				'if',
				'Has Email?',
				{
					conditions: {
						options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
						conditions: [
							{
								leftValue: '={{ $json.hasEmail }}',
								rightValue: true,
								operator: { type: 'boolean', operation: 'true', singleValue: true }
							}
						],
						combinator: 'and'
					},
					options: {}
				},
				[200, 100],
				{ typeVersion: 2.2 }
			),
			node(
				'noOp',
				'Notify a Human',
				{},
				[440, 0],
				{
					typeVersion: 1,
					notes: 'Attach Slack / email / Telegram here. Empty on purpose: a placeholder webhook used to make every execution report failure.'
				}
			),
			node(
				'noOp',
				'Ignore',
				{},
				[440, 200],
				{ typeVersion: 1, notes: 'Telemetry events are already written by the browser. Nothing to do.' }
			)
		],
		connections: {
			'Telemetry Webhook': { main: [[{ node: 'Route by Payload Type', type: 'main', index: 0 }]] },
			'Route by Payload Type': {
				main: [
					[{ node: 'Shape Lead Alert', type: 'main', index: 0 }],
					[{ node: 'Ignore', type: 'main', index: 0 }]
				]
			},
			'Shape Lead Alert': { main: [[{ node: 'Has Email?', type: 'main', index: 0 }]] },
			'Has Email?': { main: [[{ node: 'Notify a Human', type: 'main', index: 0 }], []] }
		},
		settings: { executionOrder: 'v1' },
		pinData: {}
	};
}

/**
 * One table's poll → route → mail → mark-sent chain.
 *
 * The send step is split per domain when a table holds several properties, because one SMTP
 * credential authenticates one mail account and that account may only send as its own address.
 */
function leadBranch({ table, label, fallbackDomain, domains }, x) {
	const fetchName = `Fetch Pending (${label})`;
	const resolveName = `Resolve Domain (${label})`;
	const loopName = `One at a Time (${label})`;
	const markName = `Mark Sent (${label})`;
	const attemptName = `Record Attempt (${label})`;

	const fetchNode = node(
		'httpRequest',
		fetchName,
		{
			// `send_attempts=lt.5` is the retry budget: a hard-bounced address used to stay pending and
			// come back every five minutes forever (288 sends a day, to a stranger, from our domain).
			url: `${SUPABASE_URL}/rest/v1/${table}?select=*&status=eq.pending_n8n_sync&send_attempts=lt.5&order=created_at.asc&limit=20`,
			authentication: 'genericCredentialType',
			genericAuthType: 'httpHeaderAuth',
			sendHeaders: true,
			headerParameters: { parameters: [{ name: 'Accept', value: 'application/json' }] },
			options: {}
		},
		[x, 200],
		{
			typeVersion: 4.2,
			notes: 'Header Auth credential: apikey = service role key, Authorization = "Bearer <service role key>". Service role, not anon: this reads rows.'
		}
	);

	const resolveNode = node(
		'code',
		resolveName,
		{
			jsCode: `// Route the sending domain from the row's PROPERTY. \`vertical_slug\` is the property
// (giniloh | wellroost | aichieve); \`domain_category\` is what the asset is about. Merging the two
// is what sent wellroost leads out under a giniloh From with a giniloh link.
const rows = $input.all();
const PROPERTY_DOMAINS = ${JSON.stringify(PROPERTY_DOMAINS)};
// Only this branch's own domains: a row must never borrow another property's sender.
const allowed = ${JSON.stringify(domains)};
const normalise = (value) => String(value || '').trim().toLowerCase()
  .replace(/^https?:\\/\\//, '').replace(/^www\\./, '').replace(/\\/$/, '');
return rows.map((item) => {
  const row = item.json;
  const metrics = row.calculated_metrics || {};
  const propertyKey = normalise(row.vertical_slug).replace(/\\.(com|net|org|io)$/, '');
  const byProperty = PROPERTY_DOMAINS[propertyKey];
  // \`metrics.domain\` is a CLIENT-supplied hint. Honoured only when this branch may send as it.
  const declared = normalise(metrics.domain);
  const domain = allowed.includes(byProperty)
    ? byProperty
    : allowed.includes(declared)
      ? declared
      : '${fallbackDomain}';
  return {
    json: {
      ...row,
      resolved_domain: domain,
      from_email: 'reports@' + domain,
      asset_title: metrics.assetTitle || row.asset_slug
    }
  };
});`
		},
		[x + 240, 200],
		{ typeVersion: 2 }
	);

	const loopNode = node('splitInBatches', loopName, { batchSize: 1, options: {} }, [x + 480, 200], {
		typeVersion: 3,
		notes: 'One email per item, so one bad address cannot block the rest.'
	});

	const emailNodes = domains.map((domain, i) => {
		const stacked = domains.length > 1;
		return node(
			'emailSend',
			`Send Report (${domainLabel(domain)})`,
			{
				// Literal, not `$json.from_email`: this node exists precisely because one credential
				// can only authenticate one account, and that account signs its own domain.
				fromEmail: `reports@${domain}`,
				toEmail: '={{ $json.email }}',
				subject: '=Your scenario report: {{ $json.asset_title || $json.asset_slug }}',
				html: `=<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#191610;line-height:1.6;max-width:580px;margin:0 auto;border:1px solid #d8d3c4;padding:24px">
  <div style="font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:#5f5b52">{{ $json.resolved_domain }} &middot; Scenario report</div>
  <h1 style="font-size:22px;font-weight:800;margin:8px 0 16px">Your model, as you built it</h1>
  <p>You asked us to send the scenario you calculated for <strong>{{ $json.asset_title || $json.asset_slug }}</strong>.</p>
  <p><a href="https://{{ $json.resolved_domain }}/calculators/" style="color:#0f766e;font-weight:700">Open the decision engine &rarr;</a></p>
  <div style="background:#f4f1e8;border:1px solid #d8d3c4;padding:14px;margin:16px 0;font-family:monospace;font-size:11px;white-space:pre-wrap;overflow-wrap:anywhere">{{ JSON.stringify($json.calculated_metrics) }}</div>
  <p style="font-size:11px;color:#8c8c8c;border-top:1px solid #eee;padding-top:12px">You received this because you asked for a scenario report. Reply to unsubscribe.</p>
</div>`,
				options: {}
			},
			[stacked ? x + 960 : x + 720, stacked ? 200 + (i - (domains.length - 1) / 2) * 220 : 200],
			{
				typeVersion: 2.1,
				// Output 0 = sent, output 1 = failed. Without this a single bad address aborts the whole
				// tick and the remaining rows are never attempted.
				onError: 'continueErrorOutput',
				notes: `Attach the SMTP credential for reports@${domain}. From is a literal: this branch is already domain-specific.`
			}
		);
	});

	const routeNode =
		domains.length > 1
			? node(
					'switch',
					`Route by Domain (${label})`,
					{
						rules: {
							values: domains.map((domain) => ({
								conditions: {
									options: { caseSensitive: false, leftValue: '', typeValidation: 'loose', version: 1 },
									conditions: [
										{
											leftValue: '={{ $json.resolved_domain }}',
											rightValue: domain,
											operator: { type: 'string', operation: 'equals' }
										}
									],
									combinator: 'and'
								},
								renameOutput: true,
								outputKey: domainLabel(domain)
							}))
						},
						// Unmatched rows take the fallback, which Resolve Domain has already defaulted.
						options: { fallbackOutput: 'extra' }
					},
					[x + 720, 200],
					{
						typeVersion: 3.2,
						notes: 'One send node per domain, because each SMTP account may only send as its own address.'
					}
				)
			: null;

	const markNode = node(
		'httpRequest',
		markName,
		{
			method: 'PATCH',
			// `$json` is the EMAIL node's output by now — it carries no row id, so the PATCH built
			// "...id=eq.undefined" and Supabase answered 400 (invalid uuid). Reach back through the
			// paired item on the node that still holds the row.
			url: `={{ "${SUPABASE_URL}/rest/v1/${table}?id=eq." + $("${resolveName}").item.json.id }}`,
			authentication: 'genericCredentialType',
			genericAuthType: 'httpHeaderAuth',
			sendBody: true,
			specifyBody: 'json',
			jsonBody: '={{ JSON.stringify({ status: "sent", delivered_at: $now.toISO() }) }}',
			options: {}
		},
		[domains.length > 1 ? x + 1200 : x + 960, 200],
		{ typeVersion: 4.2, notes: 'Runs only after the email succeeds — a failed send leaves the lead pending for the next tick.' }
	);

	// Failure branch. Counts the attempt and, at five, retires the row: before this, a single
	// hard-bounced address stayed pending forever and was retried every five minutes indefinitely,
	// with nothing recording how many times it had already been tried.
	const prevAttempts = `($("${resolveName}").item.json.send_attempts || 0)`;
	const attemptNode = node(
		'httpRequest',
		attemptName,
		{
			method: 'PATCH',
			url: `={{ "${SUPABASE_URL}/rest/v1/${table}?id=eq." + $("${resolveName}").item.json.id }}`,
			authentication: 'genericCredentialType',
			genericAuthType: 'httpHeaderAuth',
			sendBody: true,
			specifyBody: 'json',
			jsonBody: `={{ JSON.stringify({ send_attempts: ${prevAttempts} + 1, last_attempt_at: $now.toISO(), status: (${prevAttempts} + 1) >= 5 ? "failed" : "pending_n8n_sync" }) }}`,
			options: {}
		},
		[domains.length > 1 ? x + 1200 : x + 960, 480],
		{
			typeVersion: 4.2,
			notes: 'Runs only when the send fails. Five failures retires the row as `failed`; below that it stays pending for the next tick.'
		}
	);

	const connections = {
		[fetchName]: { main: [[{ node: resolveName, type: 'main', index: 0 }]] },
		[resolveName]: { main: [[{ node: loopName, type: 'main', index: 0 }]] }
	};

	// SplitInBatches v3 has outputNames ['done', 'loop']: index 0 is `done`, index 1 is `loop`.
	// Wiring the work to index 0 sends every item down the "nothing left to do" branch — the batch
	// node then waits forever for a loop-back that never comes, and no email is ever sent. The loop
	// output also requires the body to connect back, or only the first batch is processed.
	const loopOut = routeNode ? { node: routeNode.name, type: 'main', index: 0 } : { node: emailNodes[0].name, type: 'main', index: 0 };
	connections[loopName] = { main: [[], [loopOut]] };

	if (routeNode) {
		const outputs = emailNodes.map((e) => [{ node: e.name, type: 'main', index: 0 }]);
		// The extra output is the fallback: send as the table's default property rather than nowhere.
		outputs.push([{ node: emailNodes[emailNodes.length - 1].name, type: 'main', index: 0 }]);
		connections[routeNode.name] = { main: outputs };
	}

	// `onError: continueErrorOutput` gives every email node two outputs: 0 sent, 1 failed.
	for (const emailNode of emailNodes) {
		connections[emailNode.name] = {
			main: [
				[{ node: markName, type: 'main', index: 0 }],
				[{ node: attemptName, type: 'main', index: 0 }]
			]
		};
	}

	// Loop back: whichever node closed the iteration hands control back for the next item.
	connections[markName] = { main: [[{ node: loopName, type: 'main', index: 0 }]] };
	connections[attemptName] = { main: [[{ node: loopName, type: 'main', index: 0 }]] };

	return {
		nodes: [fetchNode, resolveNode, loopNode, ...(routeNode ? [routeNode] : []), ...emailNodes, markNode, attemptNode],
		connections
	};
}

/**
 * Scheduled report sender — polls both lead tables every five minutes.
 *
 * Polling rather than reacting to the webhook, because the address only exists in Supabase
 * (wellroost never posts leads to n8n at all) and because a failed send must be retried, not lost:
 * the row stays `pending_n8n_sync` until it is mailed.
 *
 * REQUIRES THREE CREDENTIALS, attached once in n8n (JSON cannot carry them):
 *   - HTTP Header Auth  (apikey + Authorization, service role key)  — shared by the six Supabase nodes
 *   - SMTP × 3          (reports@giniloh.com, reports@wellroost.com, reports@aichieve.net)
 *
 * One SMTP credential per sending domain, not one for all: Stalwart authenticates an account and
 * that account only signs its own address. A shared credential with a per-row `From` either gets
 * refused by the submission server or is signed by the wrong domain, and DMARC is `p=reject` on
 * giniloh.com and wellroost.com — so "wrong domain" means rejected mail, not a spam folder.
 */
function leadReportsWorkflow() {
	const trigger = node(
		'scheduleTrigger',
		'Every 5 Minutes',
		{ rule: { interval: [{ field: 'minutes', minutesInterval: 5 }] } },
		[-560, 200],
		{ typeVersion: 1.2, notes: 'A failed send leaves the row pending, so the next tick retries it — no manual replay.' }
	);

	const branches = LEAD_TABLES.map((t, i) => leadBranch(t, -300 + i * 1400));
	const connections = branches.reduce((acc, b) => ({ ...acc, ...b.connections }), {});
	connections['Every 5 Minutes'] = {
		main: [LEAD_TABLES.map((t) => ({ node: `Fetch Pending (${t.label})`, type: 'main', index: 0 }))]
	};

	return {
		name: 'Lead Reports — all properties',
		nodes: [trigger, ...branches.flatMap((b) => b.nodes)],
		connections,
		settings: { executionOrder: 'v1' },
		pinData: {}
	};
}

const telemetry = JSON.stringify(telemetryWorkflow(), null, 2) + '\n';
const lead = JSON.stringify(leadReportsWorkflow(), null, 2) + '\n';

for (const dir of ['n8n/', 'AICHIEVE/n8n/', '../wellroost front end/n8n/']) {
	try {
		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(`${dir}vibe_telemetry_workflow.json`, telemetry);
		fs.writeFileSync(`${dir}lead_reports_workflow.json`, lead);
		console.log(`wrote ${dir}vibe_telemetry_workflow.json + ${dir}lead_reports_workflow.json`);
	} catch (error) {
		console.warn(`skipped ${dir}: ${error.message}`);
	}
}
