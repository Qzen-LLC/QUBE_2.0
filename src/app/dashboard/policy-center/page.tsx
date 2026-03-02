'use client';
import React, { useState } from 'react';

export default function PolicyCenterPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 'responsible-ai', label: 'Responsible & Ethical AI' },
    { id: 'responsible-use', label: 'Responsible Use Policy' }
  ];

  const renderResponsibleAI = () => (
    <div className="space-y-2">
      {/* Introduction */}
      <div className="card-standard p-3 rounded-md">
        <h2 className="text-lg font-bold text-foreground mb-1">Responsible & Ethical AI Framework</h2>
        <p className="text-xs text-muted-foreground leading-normal">
          Our comprehensive framework ensures that all AI systems developed and deployed within our organization 
          adhere to the highest standards of responsibility, ethics, and transparency. This framework is designed 
          to guide decision-making processes and ensure compliance with both internal policies and external regulations.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid-cards">
        <div className="card-standard p-3 rounded-md">
          <h3 className="text-base font-semibold text-foreground mb-1">Transparency</h3>
          <p className="text-muted-foreground text-xs leading-normal">
            All AI systems must provide clear explanations of their decision-making processes and be open about 
            their capabilities and limitations. Users should understand how and why decisions are made.
          </p>
        </div>

        <div className="card-standard p-3 rounded-md">
          <h3 className="text-base font-semibold text-foreground mb-1">Accountability</h3>
          <p className="text-muted-foreground text-xs leading-normal">
            Clear lines of responsibility must be established for AI system outcomes. Human oversight and 
            intervention capabilities must be maintained for critical decision-making processes.
          </p>
        </div>

        <div className="card-standard p-3 rounded-md">
          <h3 className="text-base font-semibold text-foreground mb-1">Fairness</h3>
          <p className="text-muted-foreground text-xs leading-normal">
            AI systems must be designed and tested to avoid bias and discrimination. Regular audits should 
            be conducted to ensure equitable treatment across all user groups and demographics.
          </p>
        </div>
      </div>

      {/* Implementation Guidelines */}
      <div className="card-standard p-3 rounded-md">
        <h3 className="text-base font-bold text-foreground mb-2">Implementation Guidelines</h3>
        <div className="space-y-2">
          <div className="border-l-4 border-primary pl-3">
            <h4 className="text-sm font-semibold text-foreground mb-1">1. Pre-Development Assessment</h4>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• Conduct thorough risk assessments before AI system development</li>
              <li>• Evaluate potential impacts on stakeholders and society</li>
              <li>• Define clear success metrics and failure modes</li>
            </ul>
          </div>

          <div className="border-l-4 border-success pl-3">
            <h4 className="text-sm font-semibold text-foreground mb-1">2. Development Phase</h4>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• Implement bias detection and mitigation strategies</li>
              <li>• Ensure data quality and representativeness</li>
              <li>• Build explainability and interpretability features</li>
            </ul>
          </div>

          <div className="border-l-4 border-accent pl-3">
            <h4 className="text-sm font-semibold text-foreground mb-1">3. Deployment & Monitoring</h4>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• Establish continuous monitoring and evaluation systems</li>
              <li>• Implement feedback mechanisms for users and stakeholders</li>
              <li>• Maintain human oversight for critical decisions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Compliance Requirements */}
      <div className="card-standard p-3 rounded-md">
        <h3 className="text-base font-bold text-foreground mb-2">Compliance Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">GDPR Compliance</div>
            <div className="text-sm font-medium text-foreground">EU AI Act Alignment</div>
            <div className="text-sm font-medium text-foreground">ISO 42001 Standards</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Industry Best Practices</div>
            <div className="text-sm font-medium text-foreground">Internal Audit Requirements</div>
            <div className="text-sm font-medium text-foreground">Stakeholder Reporting</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResponsibleUse = () => (
    <div className="space-y-2">
      {/* Policy Overview */}
      <div className="card-standard p-3 rounded-md">
        <h2 className="text-lg font-bold text-foreground mb-1">Responsible Use Policy</h2>
        <p className="text-xs text-muted-foreground leading-normal">
          This policy establishes guidelines for the responsible use of AI technologies within our organization. 
          It ensures that AI systems are used ethically, safely, and in compliance with all applicable laws 
          and regulations while maximizing their potential benefits.
        </p>
      </div>

      {/* Key Principles */}
      <div className="grid-cards">
        <div className="card-standard p-3 rounded-md">
          <h3 className="text-base font-semibold text-foreground mb-1">Human-Centric Design</h3>
          <p className="text-muted-foreground text-xs leading-normal">
            AI systems should augment human capabilities rather than replace them. Human oversight and 
            decision-making authority must be maintained for critical functions.
          </p>
        </div>

        <div className="card-standard p-3 rounded-md">
          <h3 className="text-base font-semibold text-foreground mb-1">Risk Management</h3>
          <p className="text-muted-foreground text-xs leading-normal">
            Comprehensive risk assessments must be conducted for all AI applications. Mitigation strategies 
            should be developed and regularly reviewed to address identified risks.
          </p>
        </div>

        <div className="card-standard p-3 rounded-md">
          <h3 className="text-base font-semibold text-foreground mb-1">Privacy Protection</h3>
          <p className="text-muted-foreground text-xs leading-normal">
            All AI systems must comply with data protection regulations and implement appropriate security 
            measures to protect user privacy and sensitive information.
          </p>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className="card-standard p-3 rounded-md">
        <h3 className="text-base font-bold text-foreground mb-2">Usage Guidelines</h3>
        <div className="space-y-2">
          <div className="border-l-4 border-primary pl-3">
            <h4 className="text-sm font-semibold text-foreground mb-1">Approved Use Cases</h4>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• Process automation and optimization</li>
              <li>• Data analysis and insights generation</li>
              <li>• Customer service and support enhancement</li>
              <li>• Predictive analytics for business planning</li>
            </ul>
          </div>

          <div className="border-l-4 border-destructive pl-3">
            <h4 className="text-sm font-semibold text-foreground mb-1">Prohibited Use Cases</h4>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• Automated decision-making without human oversight</li>
              <li>• Biometric identification without consent</li>
              <li>• Social scoring or behavioral manipulation</li>
              <li>• Surveillance without proper authorization</li>
            </ul>
          </div>

          <div className="border-l-4 border-success pl-3">
            <h4 className="text-sm font-semibold text-foreground mb-1">Required Safeguards</h4>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• Regular performance monitoring and evaluation</li>
              <li>• Bias detection and mitigation procedures</li>
              <li>• Incident response and reporting protocols</li>
              <li>• User feedback and complaint mechanisms</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Training Requirements */}
      <div className="card-standard p-3 rounded-md">
        <h3 className="text-base font-bold text-foreground mb-2">Training & Awareness</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Required Training</h4>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• AI ethics and responsible use principles</li>
              <li>• Data privacy and security best practices</li>
              <li>• Bias detection and mitigation techniques</li>
              <li>• Incident reporting and response procedures</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Ongoing Education</h4>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• Regular policy updates and refresher courses</li>
              <li>• Industry best practices and emerging trends</li>
              <li>• Case studies and lessons learned</li>
              <li>• Compliance monitoring and reporting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-2">
          <p className="text-xs text-muted-foreground leading-normal mb-1">
            Our AI Policy Center serves as the central hub for understanding and implementing responsible artificial intelligence practices within our organization. 
            This comprehensive resource provides guidance on ethical AI development, responsible use policies, and compliance with global AI governance frameworks.
          </p>
          <p className="text-xs text-muted-foreground leading-normal">
            As AI technologies continue to evolve, it's crucial to establish clear policies that promote transparency, accountability, and fairness while ensuring 
            the protection of privacy and human rights. Our policies align with international standards and best practices to create a trustworthy AI ecosystem.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-2">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-4">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  className={`py-2 px-1 border-b-2 font-medium text-xs transition-colors ${
                    activeTab === index
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 0 ? renderResponsibleAI() : renderResponsibleUse()}
        </div>
      </div>
    </div>
  );
}