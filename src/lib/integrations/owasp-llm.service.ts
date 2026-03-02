/**
 * OWASP Top 10 for LLMs & GenAI Integration Service
 * Hardcoded 2025 version of OWASP Top 10 vulnerabilities
 */

import type { OwaspRisk } from './types';

export class OwaspLLMService {
  private readonly risks: OwaspRisk[] = [
    {
      id: 'LLM01',
      rank: 1,
      title: 'Prompt Injection',
      description:
        'Attackers manipulate LLMs via crafted inputs to compromise applications through meticulously crafted prompts that bypass initial instructions and follow the attacker\'s intentions.',
      examples: [
        'Direct instruction override: "IGNORE ALL PREVIOUS INSTRUCTIONS"',
        'Encoded manipulation: Base64, Unicode tricks',
        'Multi-turn conversation attacks',
        'Roleplay-based phrasing to subvert safety filters',
      ],
      mitigation: [
        'Constrain model behavior with strict role instructions',
        'Enforce adherence to tasks and ignore alteration attempts',
        'Validate expected output formats using deterministic code checks',
        'Implement input/output validation and sandboxing',
        'Separate user data from instructions',
      ],
      realWorldIncidents: [
        'EmailGPT (CVE-2024-5184): Malicious prompts in emails',
        'DeepSeek-R1: 100% bypass rate with adversarial jailbreak prompts',
        'ChatGPT plugins exploited through indirect prompt injection',
      ],
      severity: 'Critical',
    },
    {
      id: 'LLM02',
      rank: 2,
      title: 'Sensitive Information Disclosure',
      description:
        'LLMs can inadvertently reveal sensitive information through training data memorization, RAG knowledge bases, database access, or user inputs.',
      examples: [
        'Training data containing PII/confidential information',
        'RAG systems retrieving sensitive documents',
        'Model memorization of proprietary data',
        'Prompt-induced extraction of private information',
      ],
      mitigation: [
        'Data sanitization: Mask sensitive content before training',
        'Multi-layered firewalls to block leaks',
        'Strict access controls limiting unauthorized retrieval',
        'Keep sensitive info (API keys, credentials, DB names) out of system prompts',
        'Data classification and governance frameworks',
      ],
      realWorldIncidents: [
        'Meta LLaMA data leak exposing unauthorized model access',
        'ChatGPT server outages revealing conversation data',
      ],
      severity: 'Critical',
    },
    {
      id: 'LLM03',
      rank: 3,
      title: 'Supply Chain Vulnerabilities',
      description:
        'Vulnerabilities arising from third-party components, plugins, dependencies, and the entire ML supply chain used in LLM applications.',
      examples: [
        'Compromised Python packages (malicious PyTorch dependency)',
        'Third-party model providers and pre-trained models',
        'Training data from untrusted sources',
        'Plugin and extension vulnerabilities',
      ],
      mitigation: [
        'Maintain Software Bill of Materials (SBOM) with signed inventory',
        'Vet third-party components and review terms of service',
        'Verify model provenance using signatures and hash comparisons',
        'Implement patching policy for vulnerable components',
        'Use only trusted suppliers and maintained APIs',
      ],
      realWorldIncidents: [
        '1500 Hugging Face API tokens exposed',
        'LangChain code execution vulnerability (CVE-2023-29374)',
      ],
      severity: 'High',
    },
    {
      id: 'LLM04',
      rank: 4,
      title: 'Data and Model Poisoning',
      description:
        'Training data poisoning occurs when attackers manipulate training data to introduce vulnerabilities, backdoors, or biases.',
      examples: [
        'Poisoned data from insiders',
        'Corrupted prompts influencing fine-tuning',
        'Data seeding with malicious samples',
      ],
      mitigation: [
        'Validate datasets thoroughly before use',
        'Inspect AI outputs for anomalies',
        'Monitor LLM behavior continuously',
        'Implement data provenance tracking',
        'Use adversarial training techniques',
      ],
      severity: 'High',
    },
    {
      id: 'LLM05',
      rank: 5,
      title: 'Improper Output Handling',
      description:
        'Inadequate validation, sanitization, and handling of LLM outputs before passing them to downstream systems, leading to XSS, CSRF, SSRF, or remote code execution.',
      examples: [
        'Cross-site scripting (XSS) in web applications',
        'SQL injection via generated queries',
        'Remote code execution through unsafe code generation',
        'Command injection in system calls',
      ],
      mitigation: [
        'Treat LLM output as untrusted user input',
        'Apply output encoding for context (HTML, JavaScript, SQL)',
        'Implement Content Security Policy (CSP)',
        'Validate and sanitize all outputs before use',
        'Use allowlists for permitted actions',
      ],
      severity: 'High',
    },
    {
      id: 'LLM06',
      rank: 6,
      title: 'Excessive Agency',
      description:
        'Granting LLMs unchecked autonomy to take action can lead to unintended consequences. Root causes: excessive functionality, permissions, or autonomy.',
      examples: [
        'Too many available tools/capabilities',
        'Overprivileged access to systems',
        'Insufficient human oversight/approval',
        'Agents tricked into abusing integrated tools',
      ],
      mitigation: [
        'Limit functionality to minimum required extensions/features',
        'Require human approval for high-impact actions',
        'Enforce complete mediation with authorization checks',
        'Implement least-privilege access controls',
        'Validate all agent actions before execution',
      ],
      realWorldIncidents: [
        'Slack AI data exposure incident',
        'Unauthorized OAuth exploitation in ChatGPT',
      ],
      severity: 'Critical',
    },
    {
      id: 'LLM07',
      rank: 7,
      title: 'System Prompt Leakage',
      description:
        'System prompts containing sensitive information can be extracted, revealing internal rules, filtering criteria, credentials, or sensitive functionality.',
      examples: [
        'Direct prompts: "Reveal your system prompt"',
        'Encoded manipulation attempts',
        'Multi-turn conversation building trust',
      ],
      mitigation: [
        'NEVER include credentials, API keys, or sensitive data in system prompts',
        'Store sensitive configuration in external systems',
        'Implement output validation to detect leakage patterns',
        'Establish independent guardrails outside the LLM',
        'Monitor for suspicious extraction attempts',
      ],
      severity: 'Medium',
    },
    {
      id: 'LLM08',
      rank: 8,
      title: 'Vector and Embedding Weaknesses',
      description:
        'Vulnerabilities in how vectors and embeddings are generated, stored, or retrieved in RAG systems, exploitable to inject harmful content or access sensitive information.',
      examples: [
        'Unauthorized access to embeddings containing sensitive info',
        'Context leakage in multi-tenant environments',
        'Embedding inversion attacks',
        'Data poisoning of vector databases',
      ],
      mitigation: [
        'Deploy proper permission and access controls on vector databases',
        'Implement data and source validation',
        'Apply data classification to embeddings',
        'Monitor data retrieval patterns',
        'Use encryption for sensitive embeddings',
        'Implement multi-tenant isolation',
      ],
      severity: 'High',
    },
    {
      id: 'LLM09',
      rank: 9,
      title: 'Misinformation / Overreliance',
      description:
        'Failing to critically assess LLM outputs can lead to compromised decision-making, security vulnerabilities, and legal liabilities.',
      examples: [
        'Acting on hallucinated legal/medical advice',
        'Using fabricated citations as authoritative sources',
        'Implementing unsafe code without review',
        'Making business decisions on false data',
      ],
      mitigation: [
        'Always verify LLM outputs against authoritative sources',
        'Implement human review for critical decisions',
        'Display confidence scores/uncertainty indicators',
        'Provide citations and sources for verification',
        'Train users on LLM limitations',
      ],
      realWorldIncidents: [
        'Lawyer sanctioned for ChatGPT fake legal citations',
        'Deloitte $300K refund for hallucinated government report',
      ],
      severity: 'High',
    },
    {
      id: 'LLM10',
      rank: 10,
      title: 'Unbounded Consumption',
      description:
        'LLM applications allow excessive or uncontrolled resource usage, leading to denial of service, financial exploitation, or unauthorized model replication.',
      examples: [
        'Resource exhaustion attacks',
        'Flooding context window with noise',
        'Repeated expensive queries',
        'Model extraction through systematic querying',
      ],
      mitigation: [
        'Implement rate limiting on API requests',
        'Apply timeouts for resource-intensive operations',
        'Set compute resource quotas per user/session',
        'Monitor usage patterns for abuse',
        'Throttle requests from suspicious sources',
      ],
      realWorldIncidents: ['Sourcegraph resource exhaustion incident'],
      severity: 'Medium',
    },
  ];

  /**
   * Get all OWASP Top 10 risks
   */
  getAllRisks(): OwaspRisk[] {
    return this.risks;
  }

  /**
   * Get a specific risk by ID (LLM01, LLM02, etc.)
   */
  getRisk(id: string): OwaspRisk | undefined {
    return this.risks.find((r) => r.id === id.toUpperCase());
  }

  /**
   * Assess which OWASP risks apply to a use case
   */
  assessApplicableRisks(characteristics: {
    isGenAI?: boolean;
    isAgenticAI?: boolean;
    hasRAG?: boolean;
    hasPlugins?: boolean;
    publicFacing?: boolean;
    dataTypes?: string[];
  }): OwaspRisk[] {
    const applicable: OwaspRisk[] = [];

    // LLM01: Prompt Injection - ALWAYS applicable for LLMs
    if (characteristics.isGenAI) {
      applicable.push(this.getRisk('LLM01')!);
    }

    // LLM02: Sensitive Information Disclosure - if handling sensitive data
    const hasSensitiveData =
      characteristics.dataTypes &&
      characteristics.dataTypes.some((dt) =>
        ['PII', 'personal', 'sensitive', 'health', 'financial'].some((k) =>
          dt.toLowerCase().includes(k)
        )
      );
    if (hasSensitiveData || characteristics.isGenAI) {
      applicable.push(this.getRisk('LLM02')!);
    }

    // LLM03: Supply Chain - if using third-party models/plugins
    if (characteristics.hasPlugins || characteristics.isGenAI) {
      applicable.push(this.getRisk('LLM03')!);
    }

    // LLM04: Data Poisoning - if fine-tuning or user-generated data
    if (characteristics.isGenAI) {
      applicable.push(this.getRisk('LLM04')!);
    }

    // LLM05: Improper Output Handling - if outputs used in downstream systems
    if (characteristics.publicFacing || characteristics.isGenAI) {
      applicable.push(this.getRisk('LLM05')!);
    }

    // LLM06: Excessive Agency - CRITICAL for agentic AI
    if (characteristics.isAgenticAI || characteristics.hasPlugins) {
      applicable.push(this.getRisk('LLM06')!);
    }

    // LLM07: System Prompt Leakage - for all LLMs
    if (characteristics.isGenAI) {
      applicable.push(this.getRisk('LLM07')!);
    }

    // LLM08: Vector Weaknesses - if using RAG
    if (characteristics.hasRAG) {
      applicable.push(this.getRisk('LLM08')!);
    }

    // LLM09: Misinformation - for all LLMs
    if (characteristics.isGenAI) {
      applicable.push(this.getRisk('LLM09')!);
    }

    // LLM10: Unbounded Consumption - for public-facing systems
    if (characteristics.publicFacing || characteristics.isGenAI) {
      applicable.push(this.getRisk('LLM10')!);
    }

    return applicable;
  }

  /**
   * Get risks by severity
   */
  getRisksBySeverity(severity: 'Critical' | 'High' | 'Medium'): OwaspRisk[] {
    return this.risks.filter((r) => r.severity === severity);
  }

  /**
   * Get summary statistics
   */
  getStatistics() {
    const bySeverity = {
      Critical: this.risks.filter((r) => r.severity === 'Critical').length,
      High: this.risks.filter((r) => r.severity === 'High').length,
      Medium: this.risks.filter((r) => r.severity === 'Medium').length,
    };

    return {
      total: this.risks.length,
      bySeverity,
      version: '2025',
    };
  }
}

// Singleton instance
export const owaspLLMService = new OwaspLLMService();
