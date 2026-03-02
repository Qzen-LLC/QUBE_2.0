import { SpecialistAgent } from '../specialist-agent';
import { GuardrailsContext, AgentProposal, Guardrail } from '../types';

/**
 * Performance Specialist Agent
 * Focuses on SLA, response time, throughput, and availability requirements
 */
export class PerformanceAgent extends SpecialistAgent {
  name = 'performance';
  description = 'Performance and SLA optimization specialist';

  async analyze(context: GuardrailsContext): Promise<AgentProposal> {
    const guardrails: Guardrail[] = [];
    const insights: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Analyze response time requirements
    const responseTime = context.businessFeasibility?.responseTimeRequirement;
    if (responseTime) {
      this.analyzeResponseTime(responseTime, context, guardrails, insights);
    }

    // Analyze availability requirements
    const availability = context.businessFeasibility?.availabilityRequirement;
    if (availability) {
      this.analyzeAvailability(availability, context, guardrails, insights);
    }

    // Analyze throughput requirements
    const concurrentUsers = context.businessFeasibility?.concurrentUsers;
    const requestsPerDay = context.technicalFeasibility?.expectedRequestsPerDay;
    if (concurrentUsers || requestsPerDay) {
      this.analyzeThroughput(concurrentUsers, requestsPerDay, guardrails, insights);
    }

    // Analyze system criticality
    const criticality = context.businessFeasibility?.systemCriticality;
    if (criticality?.includes('Critical')) {
      this.analyzeCriticality(criticality, guardrails, concerns);
    }

    // Add streaming considerations
    if (context.technicalFeasibility?.streamingEnabled) {
      this.analyzeStreaming(context, guardrails, recommendations);
    }

    // Generate LLM-based guardrails if available
    // TODO: Enable when LLM service is properly initialized
    // if (this.llmService) {
    //   const llmGuardrails = await this.generateLLMGuardrails(context);
    //   guardrails.push(...llmGuardrails);
    // }

    return {
      agentName: this.name,
      guardrails,
      insights,
      concerns,
      recommendations,
      confidence: this.calculateConfidence(guardrails, insights, concerns)
    };
  }

  private analyzeResponseTime(
    responseTime: string,
    context: GuardrailsContext,
    guardrails: Guardrail[],
    insights: string[]
  ) {
    // Parse response time requirement
    const match = responseTime.match(/(\d+)s?\s*-?\s*(\d+)?s?/);
    if (match) {
      const minTime = parseInt(match[1]);
      const maxTime = parseInt(match[2] || match[1]);

      if (maxTime <= 5) {
        // Ultra-low latency requirement
        guardrails.push({
          id: `perf-response-ultra-${Date.now()}`,
          type: 'performance',
          severity: 'critical',
          rule: 'ULTRA_LOW_LATENCY_ENFORCEMENT',
          description: `Enforce response time under ${maxTime} seconds`,
          rationale: 'Ultra-low latency requirement for critical user experience',
          implementation: {
            platform: ['all'],
            configuration: {
              timeout: maxTime * 1000,
              cache_strategy: 'aggressive',
              precompute: true,
              edge_deployment: true
            },
            monitoring: [{
              metric: 'p99_latency',
              threshold: `${maxTime}s`,
              frequency: 'realtime'
            }]
          }
        });
        insights.push(`Ultra-low latency requirement detected: ${maxTime}s - requires edge deployment and aggressive caching`);
      } else if (maxTime <= 30) {
        // Standard latency requirement
        guardrails.push({
          id: `perf-response-standard-${Date.now()}`,
          type: 'performance',
          severity: 'high',
          rule: 'RESPONSE_TIME_SLA',
          description: `Maintain response time between ${minTime}-${maxTime} seconds`,
          rationale: 'SLA requirement for acceptable user experience',
          implementation: {
            platform: ['all'],
            configuration: {
              timeout: maxTime * 1000,
              cache_ttl: 3600,
              connection_pooling: true
            },
            monitoring: [{
              metric: 'p95_latency',
              threshold: `${maxTime}s`,
              frequency: '1m'
            }]
          }
        });
      }

      // Add timeout configuration
      guardrails.push({
        id: `perf-timeout-${Date.now()}`,
        type: 'performance',
        severity: 'high',
        rule: 'TIMEOUT_CONFIGURATION',
        description: 'Configure request timeouts with circuit breakers',
        rationale: 'Prevent cascade failures from slow responses',
        implementation: {
          platform: ['all'],
          configuration: {
            request_timeout: maxTime * 1000,
            circuit_breaker_threshold: 5,
            circuit_breaker_timeout: 30000,
            retry_policy: {
              max_retries: 3,
              backoff: 'exponential'
            }
          }
        }
      });
    }
  }

  private analyzeAvailability(
    availability: string,
    context: GuardrailsContext,
    guardrails: Guardrail[],
    insights: string[]
  ) {
    // Count the number of 9s
    const nines = (availability.match(/9/g) || []).length;
    
    if (nines >= 4) {
      // 99.99% or higher - High availability
      guardrails.push({
        id: `perf-ha-${Date.now()}`,
        type: 'performance',
        severity: 'critical',
        rule: 'HIGH_AVAILABILITY_CONFIGURATION',
        description: `Maintain ${availability} availability`,
        rationale: 'Critical availability requirement',
        implementation: {
          platform: ['all'],
          configuration: {
            redundancy: 'multi-region',
            failover: 'automatic',
            health_check_interval: 5000,
            min_healthy_instances: 3
          },
          monitoring: [{
            metric: 'availability',
            threshold: availability,
            frequency: '1m'
          }]
        }
      });
      insights.push(`High availability requirement (${availability}) requires multi-region deployment and automatic failover`);
    }

    // Add load balancing
    guardrails.push({
      id: `perf-lb-${Date.now()}`,
      type: 'performance',
      severity: 'high',
      rule: 'LOAD_BALANCING',
      description: 'Implement intelligent load balancing',
      rationale: 'Distribute load for availability and performance',
      implementation: {
        platform: ['all'],
        configuration: {
          algorithm: 'least_connections',
          health_check_path: '/health',
          sticky_sessions: false
        }
      }
    });
  }

  private analyzeThroughput(
    concurrentUsers: string | undefined,
    requestsPerDay: number | undefined,
    guardrails: Guardrail[],
    insights: string[]
  ) {
    const rps = requestsPerDay ? requestsPerDay / 86400 : 0;
    
    if (rps > 10 || concurrentUsers?.includes('10,000')) {
      guardrails.push({
        id: `perf-throughput-${Date.now()}`,
        type: 'performance',
        severity: 'high',
        rule: 'THROUGHPUT_OPTIMIZATION',
        description: 'Optimize for high throughput',
        rationale: `Handle ${requestsPerDay || 'high'} requests per day`,
        implementation: {
          platform: ['all'],
          configuration: {
            connection_pool_size: 100,
            worker_threads: 8,
            batch_processing: true,
            queue_size: 1000
          },
          monitoring: [{
            metric: 'requests_per_second',
            threshold: `${Math.ceil(rps * 1.5)}`,
            frequency: '1m'
          }]
        }
      });

      // Add rate limiting
      guardrails.push({
        id: `perf-ratelimit-${Date.now()}`,
        type: 'performance',
        severity: 'medium',
        rule: 'RATE_LIMITING',
        description: 'Implement rate limiting to prevent overload',
        rationale: 'Protect system from abuse and ensure fair usage',
        implementation: {
          platform: ['all'],
          configuration: {
            rate_limit_per_user: 100,
            rate_limit_window: 60000,
            burst_allowance: 20
          }
        }
      });
    }
  }

  private analyzeCriticality(
    criticality: string,
    guardrails: Guardrail[],
    concerns: string[]
  ) {
    guardrails.push({
      id: `perf-critical-${Date.now()}`,
      type: 'performance',
      severity: 'critical',
      rule: 'CRITICAL_SYSTEM_MONITORING',
      description: 'Enhanced monitoring for critical system',
      rationale: `System classified as ${criticality}`,
      implementation: {
        platform: ['all'],
        configuration: {
          monitoring_interval: 10000,
          alert_channels: ['pagerduty', 'slack', 'email'],
          metrics: [
            'latency_p50',
            'latency_p95',
            'latency_p99',
            'error_rate',
            'success_rate',
            'queue_depth'
          ]
        },
        monitoring: [{
          metric: 'error_rate',
          threshold: '0.1%',
          frequency: 'realtime'
        }]
      }
    });
    concerns.push(`Critical system requires 24/7 monitoring and immediate incident response`);
  }

  private analyzeStreaming(
    context: GuardrailsContext,
    guardrails: Guardrail[],
    recommendations: string[]
  ) {
    guardrails.push({
      id: `perf-streaming-${Date.now()}`,
      type: 'performance',
      severity: 'medium',
      rule: 'STREAMING_OPTIMIZATION',
      description: 'Optimize streaming response delivery',
      rationale: 'Streaming enabled for better perceived performance',
      implementation: {
        platform: ['all'],
        configuration: {
          chunk_size: 1024,
          flush_interval: 100,
          compression: 'gzip',
          keep_alive_timeout: 65000
        }
      }
    });
    recommendations.push('Implement chunked transfer encoding for streaming responses');
  }

  private async generateLLMGuardrails(context: GuardrailsContext): Promise<Guardrail[]> {
    const prompt = `Generate performance guardrails for an AI system with these requirements:
    - Response Time: ${context.businessFeasibility?.responseTimeRequirement || 'Not specified'}
    - Availability: ${context.businessFeasibility?.availabilityRequirement || 'Not specified'}
    - System Criticality: ${context.businessFeasibility?.systemCriticality || 'Not specified'}
    - Concurrent Users: ${context.businessFeasibility?.concurrentUsers || 'Not specified'}
    - Requests/Day: ${context.technicalFeasibility?.expectedRequestsPerDay || 'Not specified'}
    
    Focus on:
    1. Caching strategies
    2. Connection pooling
    3. Resource optimization
    4. Monitoring and alerting
    5. Graceful degradation
    
    Return specific, implementable performance guardrails.`;

    try {
      // const response = await this.llmService.generateGuardrails(prompt, 'performance');
      // return this.parseGuardrails(response);
      console.warn('LLM service not available for PerformanceAgent');
      return [];
    } catch (error) {
      console.error('PerformanceAgent LLM generation failed:', error);
      return [];
    }
  }
}