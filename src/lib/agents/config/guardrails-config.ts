/**
 * Configuration for Guardrails Generation System
 */

export const GUARDRAILS_CONFIG = {
  // LLM Configuration
  llm: {
    model: process.env.DEFAULT_LLM_MODEL || 'gpt-4o-mini',
    timeout: parseInt(process.env.LLM_TIMEOUT_MS || '60000'), // Default 60 seconds
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.LLM_RETRY_DELAY_MS || '2000'),
    maxTokens: {
      comprehensive: parseInt(process.env.LLM_MAX_TOKENS_COMPREHENSIVE || '4000'),
      domain: parseInt(process.env.LLM_MAX_TOKENS_DOMAIN || '2000')
    },
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    promptOptimization: {
      enabled: process.env.LLM_OPTIMIZE_PROMPTS !== 'false',
      maxLength: parseInt(process.env.LLM_MAX_PROMPT_LENGTH || '8000')
    }
  },

  // Cache Configuration
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    guardrailsTTL: parseInt(process.env.CACHE_GUARDRAILS_TTL_MS || '1800000'), // 30 minutes
    promptTTL: parseInt(process.env.CACHE_PROMPT_TTL_MS || '3600000'), // 1 hour
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100')
  },

  // Circuit Breaker Configuration
  circuitBreaker: {
    enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false',
    threshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5'),
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT_MS || '60000')
  },

  // Fallback Configuration
  fallback: {
    // When LLM fails, use agent-only mode
    agentOnlyMode: process.env.FALLBACK_AGENT_ONLY !== 'false',
    // Minimum guardrails to generate even on failure
    minimumGuardrails: process.env.FALLBACK_MIN_GUARDRAILS !== 'false'
  },

  // Performance Configuration
  performance: {
    parallelAgents: process.env.PARALLEL_AGENTS !== 'false',
    batchSize: parseInt(process.env.AGENT_BATCH_SIZE || '10')
  },

  // Logging Configuration
  logging: {
    enabled: process.env.LOGGING_ENABLED !== 'false',
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIRECTORY || './logs',
    maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760') // 10MB
  },

  // Validation Configuration
  validation: {
    enabled: process.env.VALIDATION_ENABLED !== 'false',
    strictMode: process.env.VALIDATION_STRICT !== 'false',
    minScore: parseInt(process.env.VALIDATION_MIN_SCORE || '60')
  }
};

/**
 * Get configuration for specific environment
 */
export function getConfig(env: 'development' | 'production' | 'test' = 'production') {
  const config = { ...GUARDRAILS_CONFIG };

  if (env === 'development') {
    // Development overrides
    config.llm.timeout = 120000; // 2 minutes for development
    config.logging.level = 'debug';
    config.cache.enabled = false; // Disable cache in development
  } else if (env === 'test') {
    // Test overrides
    config.llm.maxRetries = 1;
    config.llm.timeout = 5000; // 5 seconds for tests
    config.cache.enabled = false;
    config.circuitBreaker.enabled = false;
  }

  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: typeof GUARDRAILS_CONFIG): void {
  // Validate LLM configuration
  if (config.llm.timeout < 5000) {
    console.warn('LLM timeout is very low (<5s), may cause frequent failures');
  }
  
  if (config.llm.maxTokens.comprehensive < 1000) {
    console.warn('Comprehensive token limit is very low, may affect quality');
  }

  // Validate cache configuration
  if (config.cache.enabled && config.cache.ttl < 60000) {
    console.warn('Cache TTL is very low (<1 minute), may reduce effectiveness');
  }

  // Validate circuit breaker
  if (config.circuitBreaker.threshold < 3) {
    console.warn('Circuit breaker threshold is very low, may trip too easily');
  }
}

// Export validated configuration
export const CONFIG = getConfig(process.env.NODE_ENV as any);
validateConfig(CONFIG);