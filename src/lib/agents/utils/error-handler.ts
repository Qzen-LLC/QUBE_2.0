/**
 * Error handling utilities for the guardrails system
 */

export class GuardrailsError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'GuardrailsError';
  }
}

export class LLMError extends GuardrailsError {
  constructor(message: string, details?: any) {
    super(message, 'LLM_ERROR', details, true);
    this.name = 'LLMError';
  }
}

export class ValidationError extends GuardrailsError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details, false);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends GuardrailsError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details, false);
    this.name = 'ConfigurationError';
  }
}

/**
 * Retry logic for transient failures
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = true,
    onRetry
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry non-recoverable errors
      if (error instanceof GuardrailsError && !error.recoverable) {
        throw error;
      }
      
      if (attempt < maxAttempts) {
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        
        if (onRetry) {
          onRetry(attempt, lastError);
        }
        
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.timeout) {
        this.state = 'half-open';
        this.failures = 0;
      } else {
        throw new GuardrailsError(
          'Circuit breaker is open',
          'CIRCUIT_OPEN',
          { failures: this.failures, timeout: this.timeout },
          false
        );
      }
    }
    
    try {
      const result = await fn();
      
      // Reset on success
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.error(`Circuit breaker opened after ${this.failures} failures`);
      }
      
      throw error;
    }
  }
  
  reset() {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      threshold: this.threshold
    };
  }
}

/**
 * Error recovery strategies
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  logError: boolean = true
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (logError) {
      console.error('Primary operation failed, using fallback:', error);
    }
    return await fallback();
  }
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new GuardrailsError(errorMessage, 'TIMEOUT', { timeoutMs }, true));
    }, timeoutMs);
  });
  
  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Batch error handler for parallel operations
 */
export async function handleBatchErrors<T>(
  operations: Promise<T>[],
  options: {
    stopOnFirstError?: boolean;
    collectErrors?: boolean;
  } = {}
): Promise<{ results: T[], errors: Error[] }> {
  const { stopOnFirstError = false, collectErrors = true } = options;
  
  if (stopOnFirstError) {
    const results = await Promise.all(operations);
    return { results, errors: [] };
  }
  
  const settled = await Promise.allSettled(operations);
  const results: T[] = [];
  const errors: Error[] = [];
  
  settled.forEach(result => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else if (collectErrors) {
      errors.push(result.reason);
    }
  });
  
  return { results, errors };
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T = any>(
  text: string,
  fallback?: T
): T | undefined {
  try {
    return JSON.parse(text);
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    console.error('JSON parsing failed:', error);
    return undefined;
  }
}

/**
 * Error reporting utility
 */
export function reportError(
  error: Error,
  context: Record<string, any> = {}
): void {
  const errorReport = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof GuardrailsError && {
        code: error.code,
        details: error.details,
        recoverable: error.recoverable
      })
    },
    context
  };
  
  // In production, this would send to monitoring service
  console.error('Error Report:', JSON.stringify(errorReport, null, 2));
}