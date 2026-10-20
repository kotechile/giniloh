import fs from 'node:fs';

function generateWorkflow({ name, defaultDomain, defaultEmail, defaultColor }) {
  return {
    name,
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "vibe-telemetry",
          responseMode: "responseNode",
          options: {}
        },
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [-480, 300],
        id: "webhook-trigger",
        name: "Vibe Telemetry Webhook"
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: JSON.stringify({
            success: true,
            message: "Telemetry event received",
            timestamp: "{{ $now.toISO() }}"
          }, null, 2),
          options: {
            responseCode: 200
          }
        },
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [-240, 180],
        id: "respond-to-client",
        name: "Immediate 200 Response"
      },
      {
        parameters: {
          rules: {
            values: [
              {
                conditions: {
                  options: {
                    caseSensitive: false,
                    leftValue: "",
                    typeValidation: "loose"
                  },
                  conditions: [
                    {
                      leftValue: "={{ $json.body.type || $json.type }}",
                      rightValue: "lead_intent",
                      operator: {
                        type: "string",
                        operation: "equals"
                      }
                    }
                  ],
                  combinator: "and"
                },
                renameOutput: true,
                outputKey: "lead_intent"
              },
              {
                conditions: {
                  options: {
                    caseSensitive: false,
                    leftValue: "",
                    typeValidation: "loose"
                  },
                  conditions: [
                    {
                      leftValue: "={{ $json.body.type || $json.type }}",
                      rightValue: "telemetry_event",
                      operator: {
                        type: "string",
                        operation: "equals"
                      }
                    }
                  ],
                  combinator: "and"
                },
                renameOutput: true,
                outputKey: "telemetry_event"
              }
            ]
          },
          options: {}
        },
        type: "n8n-nodes-base.switch",
        typeVersion: 3.2,
        position: [-240, 420],
        id: "event-type-router",
        name: "Route by Event Type"
      },
      {
        parameters: {
          jsCode: `
const input = $json.body || $json;
const lead = input.lead || {};
const metrics = lead.calculatedMetrics || {};

const origin = input.origin || (lead.verticalSlug ? 'giniloh.com' : 'aichieve.net');
const verticalOrDomain = lead.verticalSlug || lead.domainCategory || 'general';
const assetSlug = lead.assetSlug || 'unspecified-asset';
const email = lead.email || '';
const calculatedDelta = metrics.calculatedDelta || metrics.calculatedMetric || 'Calculated during session';
const paramValue = metrics.paramValue !== undefined ? metrics.paramValue : 'N/A';

const summaryText = \`🎯 *New High-Intent Lead [\${origin}]*
• *Email:* \` + email + \`
• *Asset:* \` + assetSlug + \` (\` + verticalOrDomain + \`)
• *Tested Input:* \` + paramValue + \`
• *Computed Delta:* \` + calculatedDelta + \`
• *Session ID:* \` + (lead.sessionId || 'N/A') + \`
• *Timestamp:* \` + new Date().toISOString();

return {
  origin,
  email,
  assetSlug,
  verticalOrDomain,
  paramValue,
  calculatedDelta,
  metrics,
  summaryText,
  sessionId: lead.sessionId
};`.trim()
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [60, 340],
        id: "lead-normalizer",
        name: "Parse & Normalize Lead Data"
      },
      {
        parameters: {
          method: "POST",
          url: "https://hooks.slack.com/services/REPLACE/WITH/YOUR_SLACK_WEBHOOK",
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: "text",
                value: "={{ $json.summaryText }}"
              }
            ]
          },
          options: {}
        },
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [360, 240],
        id: "slack-alert",
        name: "Send Slack / Discord Alert",
        notes: "Replace URL with your Slack Incoming Webhook or Discord Webhook URL (/slack appended)"
      },
      {
        parameters: {
          fromEmail: defaultEmail,
          toEmail: "={{ $json.email }}",
          subject: "=Your Decision Model Dossier: {{ $json.assetSlug }}",
          html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #191610; line-height: 1.6; background-color: #fafafa; padding: 20px; }
    .card { background: #ffffff; border: 1px solid #d8d3c4; padding: 24px; max-width: 580px; margin: 0 auto; }
    .eyebrow { font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #5f5b52; }
    .headline { font-size: 22px; font-weight: 800; margin: 8px 0 16px 0; color: #191610; }
    .metric-box { background: #f4f1e8; border: 1px solid #d8d3c4; padding: 16px; margin: 16px 0; text-align: center; }
    .metric-val { font-size: 26px; font-weight: 900; color: ${defaultColor}; font-family: monospace; }
    .metric-label { font-size: 11px; text-transform: uppercase; font-family: monospace; color: #5f5b52; margin-top: 4px; }
    .footer { font-size: 11px; color: #8c8c8c; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">${defaultDomain} &middot; Precision Decision Dossier</div>
    <h1 class="headline">Your Calculated Scenario Model</h1>
    <p>Here are the verified calculation outputs generated during your interactive session for <strong>{{ $json.assetSlug }}</strong>:</p>
    <div class="metric-box">
      <div class="metric-val">{{ $json.calculatedDelta }}</div>
      <div class="metric-label">Calculated Net Yield Delta (Evaluated Input: {{ $json.paramValue }})</div>
    </div>
    <p>This deterministic model accounts for statutory tax adjustments, friction costs, and loaded operational overhead. Run multi-variable sensitivity models anytime on our web terminal:</p>
    <p><a href="https://${defaultDomain}/calculators/" style="color: #475f73; font-weight: bold;">Open Full Multivariable Engine &rarr;</a></p>
    <div class="footer">Session ID: {{ $json.sessionId }} &middot; ${defaultDomain} Decision Intelligence</div>
  </div>
</body>
</html>`,
          options: {}
        },
        type: "n8n-nodes-base.emailSend",
        typeVersion: 2.1,
        position: [360, 440],
        id: "email-lead-report",
        name: "Send Scenario Report to Lead",
        notes: "Configure with your SMTP or replace with Resend/Postmark/SendGrid node"
      },
      {
        parameters: {
          conditions: {
            options: {
              caseSensitive: false,
              leftValue: "",
              typeValidation: "loose"
            },
            conditions: [
              {
                leftValue: "={{ ($json.body && $json.body.event && $json.body.event.eventName) || $json.eventName || '' }}",
                rightValue: "card_impression",
                operator: {
                  type: "string",
                  operation: "notEquals"
                }
              }
            ],
            combinator: "and"
          },
          options: {}
        },
        type: "n8n-nodes-base.filter",
        typeVersion: 2.2,
        position: [60, 560],
        id: "filter-impressions",
        name: "Filter High-Signal Telemetry",
        notes: "Filters out passive card impressions to keep active calculations and slider adjustments"
      }
    ],
    connections: {
      "Vibe Telemetry Webhook": {
        main: [
          [
            { node: "Immediate 200 Response", type: "main", index: 0 },
            { node: "Route by Event Type", type: "main", index: 0 }
          ]
        ]
      },
      "Route by Event Type": {
        main: [
          [{ node: "Parse & Normalize Lead Data", type: "main", index: 0 }],
          [{ node: "Filter High-Signal Telemetry", type: "main", index: 0 }]
        ]
      },
      "Parse & Normalize Lead Data": {
        main: [
          [
            { node: "Send Slack / Discord Alert", type: "main", index: 0 },
            { node: "Send Scenario Report to Lead", type: "main", index: 0 }
          ]
        ]
      }
    },
    settings: {
      executionOrder: "v1"
    }
  };
}

fs.mkdirSync('n8n', { recursive: true });
fs.writeFileSync(
  'n8n/vibe_telemetry_workflow.json',
  JSON.stringify(
    generateWorkflow({
      name: 'GiniLoh & AIChieve - Vibe Marketing Telemetry & Lead Pipeline',
      defaultDomain: 'giniloh.com',
      defaultEmail: 'reports@giniloh.com',
      defaultColor: '#047857'
    }),
    null,
    2
  )
);

fs.mkdirSync('AICHIEVE/n8n', { recursive: true });
fs.writeFileSync(
  'AICHIEVE/n8n/vibe_telemetry_workflow.json',
  JSON.stringify(
    generateWorkflow({
      name: 'AIChieve & GiniLoh - Enterprise Telemetry & Lead Pipeline',
      defaultDomain: 'aichieve.net',
      defaultEmail: 'reports@aichieve.net',
      defaultColor: '#e8a33d'
    }),
    null,
    2
  )
);

console.log('Successfully generated n8n workflows!');
