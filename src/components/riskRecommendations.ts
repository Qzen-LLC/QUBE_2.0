export type RiskRecommendation = {
  riskFactor: string;
  description: string;
  recommendation: string;
};

export const riskRecommendations: Record<string, RiskRecommendation[]> = {
  regulatory: [
    {
      riskFactor: "GDPR",
      description: "General Data Protection Regulation, a European law governing data privacy and protection for individuals in the EU.",
      recommendation: "Consider implementing data minimization, encryption, and clear consent mechanisms to align with GDPR."
    },
    {
      riskFactor: "HIPAA",
      description: "Health Insurance Portability and Accountability Act, a US law governing the privacy and security of health information.",
      recommendation: "It is recommended to ensure access controls, audit logging, and secure data handling for HIPAA compliance."
    },
    {
      riskFactor: "PCI-DSS",
      description: "Payment Card Industry Data Security Standard, a set of security standards for organizations handling credit card information.",
      recommendation: "Consider regular vulnerability scans and strong encryption for payment data to support PCI-DSS compliance."
    },
    {
      riskFactor: "SOX",
      description: "Sarbanes-Oxley Act, a US law for financial reporting and internal controls for public companies.",
      recommendation: "It is recommended to maintain accurate records and implement internal controls to support SOX compliance."
    },
    {
      riskFactor: "CCPA",
      description: "California Consumer Privacy Act, a law enhancing privacy rights and consumer protection for California residents.",
      recommendation: "Consider providing clear privacy notices and opt-out mechanisms to align with CCPA requirements."
    },
    {
      riskFactor: "LGPD",
      description: "Lei Geral de Proteção de Dados, Brazil's general data protection law.",
      recommendation: "Consider implementing data subject rights and data protection measures to comply with LGPD."
    },
    {
      riskFactor: "Children's Data (COPPA)",
      description: "Children's Online Privacy Protection Act, a US law protecting the privacy of children under 13.",
      recommendation: "It is recommended to obtain parental consent and limit data collection for users under 13."
    }
  ],
  technical: [
    {
      riskFactor: "API Security",
      description: "Risks related to insecure or exposed application programming interfaces.",
      recommendation: "It is recommended to use authentication, authorization, and rate limiting for exposed APIs."
    },
    {
      riskFactor: "Sensitive PII",
      description: "Handling of personally identifiable information that could lead to identity theft or privacy violations.",
      recommendation: "Consider encrypting sensitive personal data both in transit and at rest."
    },
    {
      riskFactor: "PHI",
      description: "Protected Health Information, sensitive health data subject to strict privacy and security requirements.",
      recommendation: "It is recommended to restrict access and use strong encryption for PHI."
    },
    {
      riskFactor: "Insecure Storage",
      description: "Risks from storing sensitive data without adequate protection.",
      recommendation: "Consider using encrypted storage and regular security reviews."
    },
    {
      riskFactor: "Outdated Dependencies",
      description: "Use of software libraries or components with known vulnerabilities.",
      recommendation: "It is recommended to keep dependencies up to date and monitor for security advisories."
    },
    {
      riskFactor: "Supply Chain Risk",
      description: "Risks from third-party software or service providers.",
      recommendation: "Consider vetting vendors and monitoring third-party components for vulnerabilities."
    },
    {
      riskFactor: "Lack of Encryption",
      description: "Absence of encryption for sensitive data in transit or at rest.",
      recommendation: "It is recommended to use strong encryption algorithms for all sensitive data."
    },
    {
      riskFactor: "Authentication Weakness",
      description: "Risks from weak or improperly implemented authentication mechanisms.",
      recommendation: "Consider implementing multi-factor authentication and strong password policies."
    },
    {
      riskFactor: "Authorization Issues",
      description: "Risks from improper access controls or privilege escalation.",
      recommendation: "It is recommended to enforce least privilege and regularly review access rights."
    },
    {
      riskFactor: "Data Breach",
      description: "Unauthorized access to or disclosure of sensitive data.",
      recommendation: "Consider regular security assessments and incident response planning."
    }
  ],
  operational: [
    {
      riskFactor: "Lack of Backups",
      description: "Risks from not having regular or reliable data backups.",
      recommendation: "It is recommended to implement automated, regular backups and test restoration procedures."
    },
    {
      riskFactor: "Single Point of Failure",
      description: "Risks from critical systems or components without redundancy.",
      recommendation: "Consider designing systems with redundancy and failover capabilities."
    },
    {
      riskFactor: "Insufficient Monitoring",
      description: "Lack of real-time monitoring for system health and security events.",
      recommendation: "It is recommended to implement monitoring and alerting for key systems and data."
    },
    {
      riskFactor: "No Incident Response Plan",
      description: "Absence of a documented and tested plan for responding to security incidents.",
      recommendation: "Consider developing and regularly testing an incident response plan."
    },
    {
      riskFactor: "Disaster Recovery Gaps",
      description: "Lack of planning for recovery from major outages or disasters.",
      recommendation: "It is recommended to create and test a disaster recovery plan."
    },
    {
      riskFactor: "Lack of Training",
      description: "Risks from staff not being trained on security, privacy, or compliance requirements.",
      recommendation: "Consider providing regular training and awareness programs."
    }
  ],
  ethical: [
    {
      riskFactor: "Model Bias",
      description: "Risks from AI/ML models producing unfair or discriminatory outcomes.",
      recommendation: "Consider regular bias testing and dataset audits to mitigate ethical risks."
    },
    {
      riskFactor: "Lack of Explainability",
      description: "AI/ML models whose decisions cannot be easily understood or explained.",
      recommendation: "It is recommended to use interpretable models or provide explanations for key decisions."
    },
    {
      riskFactor: "Transparency",
      description: "Lack of clarity about how data is used or how decisions are made.",
      recommendation: "Consider providing clear documentation and communication about data use and decision logic."
    },
    {
      riskFactor: "Fairness",
      description: "Risks that systems treat individuals or groups unequally.",
      recommendation: "It is recommended to assess and address fairness in data and algorithms."
    },
    {
      riskFactor: "Informed Consent",
      description: "Risks from collecting or using data without clear, informed user consent.",
      recommendation: "Consider obtaining explicit, informed consent for data collection and use."
    }
  ],
  sectorSpecific: [
    {
      riskFactor: "Healthcare Data",
      description: "Sensitive health information subject to strict privacy and security requirements.",
      recommendation: "It is recommended to comply with sector-specific regulations such as HIPAA and implement strong data protections."
    },
    {
      riskFactor: "Financial Data",
      description: "Sensitive financial information requiring confidentiality and integrity.",
      recommendation: "Consider implementing encryption, access controls, and compliance with financial regulations."
    },
    {
      riskFactor: "Education Data",
      description: "Student and educational records subject to privacy laws such as FERPA.",
      recommendation: "It is recommended to restrict access and provide transparency for education data."
    },
    {
      riskFactor: "Children's Data",
      description: "Personal data of children, often subject to additional legal protections.",
      recommendation: "Consider obtaining parental consent and limiting data collection for minors."
    }
  ]
}; 