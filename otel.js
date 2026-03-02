// otel.js - Complete OpenTelemetry preload with console interception and audit log service
const { NodeSDK } = require("@opentelemetry/sdk-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-http");
const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-http");
const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");
const { LoggerProvider, SimpleLogRecordProcessor } = require("@opentelemetry/sdk-logs");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { resourceFromAttributes } = require("@opentelemetry/resources");
require('dotenv').config();

const resource = resourceFromAttributes({
  "service.name": "usecase-dashboard",
  "service.namespace": "my-application-group",
  "service.version": "1.0.0",
  "deployment.environment": "production",
});

// --- Trace exporter ---
const traceExporter = new OTLPTraceExporter({
  url: "https://otlp-gateway-prod-us-west-0.grafana.net/otlp/v1/traces",
  headers: {
    "Authorization": `Basic ${process.env.OTLP_TOKEN}`
  }
});

// --- Metrics exporter ---
const metricExporter = new OTLPMetricExporter({
  url: "https://otlp-gateway-prod-us-west-0.grafana.net/otlp/v1/metrics",
  headers: {
    "Authorization": `Basic ${process.env.OTLP_TOKEN}`
  }
});
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 60000,
});

// --- Logs exporter ---
const logExporter = new OTLPLogExporter({
  url: "https://otlp-gateway-prod-us-west-0.grafana.net/otlp/v1/logs",
  headers: {
    "Authorization": `Basic ${process.env.OTLP_TOKEN}`
  }
});
const loggerProvider = new LoggerProvider({
  resource,
  logRecordProcessors: [new SimpleLogRecordProcessor(logExporter)],
});

// --- SDK Setup ---
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  loggerProvider,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start the SDK before app code
try {
  sdk.start();

  // Optional test log
  const logger = loggerProvider.getLogger("my-app-logger");
  logger.emit({
    severityText: "INFO",
    body: "Hello LGTM logs 👋",
  });
} catch (err) {
  console.error("❌ Failed to start OTEL SDK:", err);
}

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

// Function to send log to LGTM backend (usecase-dashboard service)
async function sendLogToLGTM(severity, message, args = []) {
  try {
    const logData = {
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: "service.name", value: { stringValue: "usecase-dashboard" } },
              { key: "service.version", value: { stringValue: "1.0.0" } }
            ]
          },
          scopeLogs: [
            {
              logRecords: [
                {
                  timeUnixNano: Date.now() * 1000000,
                  severityText: severity,
                  body: { stringValue: message },
                  attributes: [
                    { key: "console.method", value: { stringValue: severity.toLowerCase() } },
                    { key: "console.args", value: { stringValue: JSON.stringify(args) } },
                    { key: "timestamp", value: { stringValue: new Date().toISOString() } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    await fetch("https://otlp-gateway-prod-us-west-0.grafana.net/otlp/v1/logs", {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.OTLP_TOKEN}`
      },
      body: JSON.stringify(logData)
    });
  } catch (error) {
    // Fallback to original console to avoid infinite loops
    originalConsole.error('Failed to send log to LGTM backend:', error);
  }
}

// Function to send CRUD logs to audit-log service
async function sendCrudLogToAuditLog(message, args = []) {
  try {
    // Check if message starts with [CRUD_LOG]
    if (!message.startsWith('[CRUD_LOG]')) {
      return;
    }

    // Extract the entity and operation from the message
    // Format: [CRUD_LOG] Entity Operation: { details }
    const match = message.match(/\[CRUD_LOG\]\s+([^:]+):\s+(.+)/);
    if (!match) {
      return;
    }

    const [, operation, detailsStr] = match;
    
    // Parse the details object
    let details = {};
    try {
      details = JSON.parse(detailsStr);
    } catch (e) {
      // If JSON parsing fails, store as raw string
      details = { rawDetails: detailsStr };
    }

    // Extract entity from operation (e.g., "UseCase created" -> "UseCase")
    const entityMatch = operation.match(/^([A-Za-z]+)/);
    const entity = entityMatch ? entityMatch[1] : 'Unknown';

    const logData = {
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: "service.name", value: { stringValue: "audit-log" } },
              { key: "service.version", value: { stringValue: "1.0.0" } }
            ]
          },
          scopeLogs: [
            {
              logRecords: [
                {
                  timeUnixNano: Date.now() * 1000000,
                  severityText: "INFO",
                  body: { stringValue: message },
                  attributes: [
                    { key: "entity", value: { stringValue: entity } },
                    { key: "operation", value: { stringValue: operation.trim() } },
                    { key: "details", value: { stringValue: JSON.stringify(details) } },
                    { key: "level", value: { stringValue: "INFO" } },
                    { key: "timestamp", value: { stringValue: new Date().toISOString() } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    await fetch("https://otlp-gateway-prod-us-west-0.grafana.net/otlp/v1/logs", {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.OTLP_TOKEN}`
      },
      body: JSON.stringify(logData)
    });
  } catch (error) {
    // Don't log to console to avoid infinite loops, just silently fail
  }
}

// Intercept console.log
console.log = (...args) => {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  // Send to LGTM backend (usecase-dashboard service)
  sendLogToLGTM("INFO", message, args);
  
  // Send to audit-log service if it's a CRUD log
  sendCrudLogToAuditLog(message, args);
  
  // Call original console.log
  originalConsole.log(...args);
};

// Intercept console.error
console.error = (...args) => {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  // Send to LGTM backend (usecase-dashboard service)
  sendLogToLGTM("ERROR", message, args);
  
  // Send to audit-log service if it's a CRUD log
  sendCrudLogToAuditLog(message, args);
  
  // Call original console.error
  originalConsole.error(...args);
};

// Intercept console.warn
console.warn = (...args) => {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  // Send to LGTM backend (usecase-dashboard service)
  sendLogToLGTM("WARN", message, args);
  
  // Send to audit-log service if it's a CRUD log
  sendCrudLogToAuditLog(message, args);
  
  // Call original console.warn
  originalConsole.warn(...args);
};

// Intercept console.info
console.info = (...args) => {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  // Send to LGTM backend (usecase-dashboard service)
  sendLogToLGTM("INFO", message, args);
  
  // Send to audit-log service if it's a CRUD log
  sendCrudLogToAuditLog(message, args);
  
  // Call original console.info
  originalConsole.info(...args);
};

// Intercept console.debug
console.debug = (...args) => {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  // Send to LGTM backend (usecase-dashboard service)
  sendLogToLGTM("DEBUG", message, args);
  
  // Send to audit-log service if it's a CRUD log
  sendCrudLogToAuditLog(message, args);
  
  // Call original console.debug
  originalConsole.debug(...args);
};

// Ensure clean shutdown
process.on("SIGTERM", async () => {
  try {
    await sdk.shutdown();
  } catch (err) {
    console.error("Error during OTEL shutdown", err);
  } finally {
    process.exit(0);
  }
});
