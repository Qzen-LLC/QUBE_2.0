import { prisma } from '@/lib/prisma'

export interface SecurityEvent {
  id: string
  type: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system_change' | 'security_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  userEmail?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  action: string
  details: Record<string, any>
  timestamp: Date
  organizationId: string
  metadata?: {
    location?: string
    device?: string
    browser?: string
    os?: string
  }
}

export interface SecurityViolation {
  id: string
  type: 'unauthorized_access' | 'privilege_escalation' | 'data_breach' | 'suspicious_activity' | 'policy_violation'
  severity: 'medium' | 'high' | 'critical'
  userId?: string
  description: string
  evidence: Record<string, any>
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  organizationId: string
}

export interface SecurityPolicy {
  id: string
  name: string
  description: string
  type: 'access_control' | 'data_protection' | 'authentication' | 'authorization' | 'audit' | 'compliance'
  rules: SecurityRule[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  organizationId: string
}

export interface SecurityRule {
  id: string
  name: string
  condition: string
  action: 'allow' | 'deny' | 'alert' | 'block'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  isActive: boolean
}

export interface ComplianceFramework {
  id: string
  name: string
  description: string
  type: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI_DSS' | 'ISO_27001' | 'SOC_2' | 'EU_AI_ACT' | 'ISO_42001'
  requirements: ComplianceRequirement[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  organizationId: string
}

export interface ComplianceRequirement {
  id: string
  title: string
  description: string
  category: string
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable'
  evidence?: string[]
  lastAssessed: Date
  nextAssessment: Date
  assignedTo?: string
  notes?: string
}

export interface SecurityMetrics {
  totalEvents: number
  criticalEvents: number
  highSeverityEvents: number
  mediumSeverityEvents: number
  lowSeverityEvents: number
  violationsOpen: number
  violationsResolved: number
  complianceScore: number
  lastAuditDate: Date
  riskScore: number
}

export class SecurityAuditSystem {
  private events = new Map<string, SecurityEvent>()
  private violations = new Map<string, SecurityViolation>()
  private policies = new Map<string, SecurityPolicy>()
  private frameworks = new Map<string, ComplianceFramework>()

  constructor() {
    this.initializeDefaultPolicies()
    this.initializeDefaultFrameworks()
  }

  // Security Event Management
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<SecurityEvent> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }

    this.events.set(securityEvent.id, securityEvent)

    // Check for violations
    await this.checkForViolations(securityEvent)

    // Store in database
    try {
      await prisma.securityEvent.create({
        data: {
          id: securityEvent.id,
          type: securityEvent.type,
          severity: securityEvent.severity,
          userId: securityEvent.userId,
          userEmail: securityEvent.userEmail,
          sessionId: securityEvent.sessionId,
          ipAddress: securityEvent.ipAddress,
          userAgent: securityEvent.userAgent,
          resource: securityEvent.resource,
          action: securityEvent.action,
          details: securityEvent.details,
          timestamp: securityEvent.timestamp,
          organizationId: securityEvent.organizationId,
          metadata: securityEvent.metadata,
        },
      })
    } catch (error) {
      console.error('Failed to store security event:', error)
    }

    return securityEvent
  }

  async getSecurityEvents(
    organizationId: string,
    filters?: {
      type?: SecurityEvent['type']
      severity?: SecurityEvent['severity']
      userId?: string
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<SecurityEvent[]> {
    let events = Array.from(this.events.values())
      .filter(event => event.organizationId === organizationId)

    if (filters) {
      if (filters.type) {
        events = events.filter(event => event.type === filters.type)
      }
      if (filters.severity) {
        events = events.filter(event => event.severity === filters.severity)
      }
      if (filters.userId) {
        events = events.filter(event => event.userId === filters.userId)
      }
      if (filters.startDate) {
        events = events.filter(event => event.timestamp >= filters.startDate!)
      }
      if (filters.endDate) {
        events = events.filter(event => event.timestamp <= filters.endDate!)
      }
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, filters?.limit || 100)
  }

  // Security Violation Management
  async createViolation(violation: Omit<SecurityViolation, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityViolation> {
    const securityViolation: SecurityViolation = {
      ...violation,
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.violations.set(securityViolation.id, securityViolation)

    // Store in database
    try {
      await prisma.securityViolation.create({
        data: {
          id: securityViolation.id,
          type: securityViolation.type,
          severity: securityViolation.severity,
          userId: securityViolation.userId,
          description: securityViolation.description,
          evidence: securityViolation.evidence,
          status: securityViolation.status,
          assignedTo: securityViolation.assignedTo,
          createdAt: securityViolation.createdAt,
          updatedAt: securityViolation.updatedAt,
          resolvedAt: securityViolation.resolvedAt,
          organizationId: securityViolation.organizationId,
        },
      })
    } catch (error) {
      console.error('Failed to store security violation:', error)
    }

    return securityViolation
  }

  async getViolations(
    organizationId: string,
    filters?: {
      type?: SecurityViolation['type']
      severity?: SecurityViolation['severity']
      status?: SecurityViolation['status']
      assignedTo?: string
      limit?: number
    }
  ): Promise<SecurityViolation[]> {
    let violations = Array.from(this.violations.values())
      .filter(violation => violation.organizationId === organizationId)

    if (filters) {
      if (filters.type) {
        violations = violations.filter(violation => violation.type === filters.type)
      }
      if (filters.severity) {
        violations = violations.filter(violation => violation.severity === filters.severity)
      }
      if (filters.status) {
        violations = violations.filter(violation => violation.status === filters.status)
      }
      if (filters.assignedTo) {
        violations = violations.filter(violation => violation.assignedTo === filters.assignedTo)
      }
    }

    return violations
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, filters?.limit || 100)
  }

  async updateViolationStatus(
    violationId: string,
    status: SecurityViolation['status'],
    assignedTo?: string
  ): Promise<SecurityViolation | null> {
    const violation = this.violations.get(violationId)
    if (!violation) return null

    violation.status = status
    violation.updatedAt = new Date()
    if (assignedTo) {
      violation.assignedTo = assignedTo
    }
    if (status === 'resolved') {
      violation.resolvedAt = new Date()
    }

    this.violations.set(violationId, violation)

    // Update in database
    try {
      await prisma.securityViolation.update({
        where: { id: violationId },
        data: {
          status: violation.status,
          assignedTo: violation.assignedTo,
          updatedAt: violation.updatedAt,
          resolvedAt: violation.resolvedAt,
        },
      })
    } catch (error) {
      console.error('Failed to update security violation:', error)
    }

    return violation
  }

  // Security Policy Management
  async createPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy> {
    const securityPolicy: SecurityPolicy = {
      ...policy,
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.policies.set(securityPolicy.id, securityPolicy)
    return securityPolicy
  }

  async getPolicies(organizationId: string): Promise<SecurityPolicy[]> {
    return Array.from(this.policies.values())
      .filter(policy => policy.organizationId === organizationId)
  }

  async updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy | null> {
    const policy = this.policies.get(policyId)
    if (!policy) return null

    const updatedPolicy = {
      ...policy,
      ...updates,
      updatedAt: new Date(),
    }

    this.policies.set(policyId, updatedPolicy)
    return updatedPolicy
  }

  // Compliance Framework Management
  async createFramework(framework: Omit<ComplianceFramework, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceFramework> {
    const complianceFramework: ComplianceFramework = {
      ...framework,
      id: `framework_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.frameworks.set(complianceFramework.id, complianceFramework)
    return complianceFramework
  }

  async getFrameworks(organizationId: string): Promise<ComplianceFramework[]> {
    return Array.from(this.frameworks.values())
      .filter(framework => framework.organizationId === organizationId)
  }

  async updateRequirementStatus(
    frameworkId: string,
    requirementId: string,
    status: ComplianceRequirement['status'],
    evidence?: string[],
    notes?: string
  ): Promise<ComplianceRequirement | null> {
    const framework = this.frameworks.get(frameworkId)
    if (!framework) return null

    const requirement = framework.requirements.find(req => req.id === requirementId)
    if (!requirement) return null

    requirement.status = status
    requirement.lastAssessed = new Date()
    if (evidence) {
      requirement.evidence = evidence
    }
    if (notes) {
      requirement.notes = notes
    }

    this.frameworks.set(frameworkId, framework)
    return requirement
  }

  // Security Analysis
  async analyzeSecurityPosture(organizationId: string): Promise<{
    riskScore: number
    complianceScore: number
    recommendations: string[]
    criticalIssues: SecurityViolation[]
  }> {
    const events = await this.getSecurityEvents(organizationId)
    const violations = await this.getViolations(organizationId)
    const frameworks = await this.getFrameworks(organizationId)

    // Calculate risk score
    const riskScore = this.calculateRiskScore(events, violations)

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(frameworks)

    // Generate recommendations
    const recommendations = this.generateRecommendations(events, violations, frameworks)

    // Get critical issues
    const criticalIssues = violations.filter(v => v.severity === 'critical' && v.status !== 'resolved')

    return {
      riskScore,
      complianceScore,
      recommendations,
      criticalIssues,
    }
  }

  private calculateRiskScore(events: SecurityEvent[], violations: SecurityViolation[]): number {
    let score = 0

    // Base score from events
    events.forEach(event => {
      switch (event.severity) {
        case 'critical': score += 10; break
        case 'high': score += 5; break
        case 'medium': score += 2; break
        case 'low': score += 1; break
      }
    })

    // Additional score from violations
    violations.forEach(violation => {
      if (violation.status !== 'resolved') {
        switch (violation.severity) {
          case 'critical': score += 20; break
          case 'high': score += 10; break
          case 'medium': score += 5; break
        }
      }
    })

    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, score))
  }

  private calculateComplianceScore(frameworks: ComplianceFramework[]): number {
    if (frameworks.length === 0) return 0

    let totalScore = 0
    let totalRequirements = 0

    frameworks.forEach(framework => {
      framework.requirements.forEach(requirement => {
        totalRequirements++
        switch (requirement.status) {
          case 'compliant': totalScore += 100; break
          case 'partial': totalScore += 50; break
          case 'non_compliant': totalScore += 0; break
          case 'not_applicable': totalScore += 100; break
        }
      })
    })

    return totalRequirements > 0 ? totalScore / totalRequirements : 0
  }

  private generateRecommendations(
    events: SecurityEvent[],
    violations: SecurityViolation[],
    frameworks: ComplianceFramework[]
  ): string[] {
    const recommendations: string[] = []

    // Security recommendations
    const criticalEvents = events.filter(e => e.severity === 'critical')
    if (criticalEvents.length > 0) {
      recommendations.push('Review and address critical security events immediately')
    }

    const openViolations = violations.filter(v => v.status === 'open')
    if (openViolations.length > 5) {
      recommendations.push('Investigate and resolve open security violations')
    }

    // Compliance recommendations
    frameworks.forEach(framework => {
      const nonCompliant = framework.requirements.filter(r => r.status === 'non_compliant')
      if (nonCompliant.length > 0) {
        recommendations.push(`Address ${nonCompliant.length} non-compliant requirements in ${framework.name}`)
      }
    })

    return recommendations
  }

  // Violation Detection
  private async checkForViolations(event: SecurityEvent): Promise<void> {
    const policies = await this.getPolicies(event.organizationId)
    
    for (const policy of policies) {
      if (!policy.isActive) continue

      for (const rule of policy.rules) {
        if (!rule.isActive) continue

        if (this.evaluateRule(rule, event)) {
          await this.createViolation({
            type: this.mapEventTypeToViolationType(event.type),
            severity: rule.severity,
            userId: event.userId,
            description: `Policy violation: ${rule.description}`,
            evidence: {
              eventId: event.id,
              policyId: policy.id,
              ruleId: rule.id,
              eventDetails: event.details,
            },
            status: 'open',
            organizationId: event.organizationId,
          })
        }
      }
    }
  }

  private evaluateRule(rule: SecurityRule, event: SecurityEvent): boolean {
    // Simple rule evaluation - in production, this would be more sophisticated
    try {
      // This is a simplified evaluation - in reality, you'd use a proper rule engine
      const condition = rule.condition.toLowerCase()
      
      if (condition.includes('failed_login') && event.action.includes('login_failed')) {
        return true
      }
      
      if (condition.includes('unauthorized_access') && event.type === 'authorization') {
        return true
      }
      
      if (condition.includes('data_access') && event.type === 'data_access') {
        return true
      }
      
      return false
    } catch (error) {
      console.error('Rule evaluation failed:', error)
      return false
    }
  }

  private mapEventTypeToViolationType(eventType: SecurityEvent['type']): SecurityViolation['type'] {
    switch (eventType) {
      case 'authentication': return 'unauthorized_access'
      case 'authorization': return 'privilege_escalation'
      case 'data_access': return 'data_breach'
      case 'data_modification': return 'data_breach'
      case 'system_change': return 'policy_violation'
      case 'security_violation': return 'suspicious_activity'
      default: return 'suspicious_activity'
    }
  }

  // Default Policies and Frameworks
  private initializeDefaultPolicies(): void {
    const defaultPolicies: SecurityPolicy[] = [
      {
        id: 'default_access_control',
        name: 'Default Access Control Policy',
        description: 'Basic access control rules',
        type: 'access_control',
        rules: [
          {
            id: 'rule_1',
            name: 'Failed Login Attempts',
            condition: 'failed_login > 3',
            action: 'alert',
            severity: 'medium',
            description: 'Alert on multiple failed login attempts',
            isActive: true,
          },
          {
            id: 'rule_2',
            name: 'Unauthorized Data Access',
            condition: 'unauthorized_access',
            action: 'block',
            severity: 'high',
            description: 'Block unauthorized data access attempts',
            isActive: true,
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        organizationId: 'default',
      },
    ]

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy)
    })
  }

  private initializeDefaultFrameworks(): void {
    const defaultFrameworks: ComplianceFramework[] = [
      {
        id: 'gdpr_framework',
        name: 'GDPR Compliance',
        description: 'General Data Protection Regulation compliance framework',
        type: 'GDPR',
        requirements: [
          {
            id: 'gdpr_1',
            title: 'Data Processing Lawfulness',
            description: 'Ensure all data processing has a lawful basis',
            category: 'Data Processing',
            status: 'not_applicable',
            lastAssessed: new Date(),
            nextAssessment: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'gdpr_2',
            title: 'Data Subject Rights',
            description: 'Implement mechanisms for data subject rights',
            category: 'Data Subject Rights',
            status: 'not_applicable',
            lastAssessed: new Date(),
            nextAssessment: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: 'default',
      },
    ]

    defaultFrameworks.forEach(framework => {
      this.frameworks.set(framework.id, framework)
    })
  }

  // Metrics
  async getSecurityMetrics(organizationId: string): Promise<SecurityMetrics> {
    const events = await this.getSecurityEvents(organizationId)
    const violations = await this.getViolations(organizationId)
    const frameworks = await this.getFrameworks(organizationId)

    const totalEvents = events.length
    const criticalEvents = events.filter(e => e.severity === 'critical').length
    const highSeverityEvents = events.filter(e => e.severity === 'high').length
    const mediumSeverityEvents = events.filter(e => e.severity === 'medium').length
    const lowSeverityEvents = events.filter(e => e.severity === 'low').length

    const violationsOpen = violations.filter(v => v.status === 'open').length
    const violationsResolved = violations.filter(v => v.status === 'resolved').length

    const complianceScore = this.calculateComplianceScore(frameworks)
    const riskScore = this.calculateRiskScore(events, violations)

    const lastAuditDate = events.length > 0 
      ? events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
      : new Date()

    return {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      mediumSeverityEvents,
      lowSeverityEvents,
      violationsOpen,
      violationsResolved,
      complianceScore,
      lastAuditDate,
      riskScore,
    }
  }
}

export const securityAuditSystem = new SecurityAuditSystem()


