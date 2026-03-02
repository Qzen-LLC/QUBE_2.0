#!/usr/bin/env tsx

// Load environment variables
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.log('Warning: Could not load .env file');
}

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// ISO 42001 Clauses Data (7 main clauses)
const iso42001ClausesData = [
  { clauseId: '4', title: 'Context of the Organization', description: 'Understand the organization\'s context and establish the scope of the AI Management System.', orderIndex: 1 },
  { clauseId: '5', title: 'Leadership', description: 'Establish leadership commitment and organizational structure for AI management.', orderIndex: 2 },
  { clauseId: '6', title: 'Planning', description: 'Plan actions based on context, stakeholders, risks, and opportunities for AI systems.', orderIndex: 3 },
  { clauseId: '7', title: 'Support', description: 'Provide necessary resources, competence, awareness, communication, and documentation for the AIMS.', orderIndex: 4 },
  { clauseId: '8', title: 'Operation', description: 'Implement and control processes for AI system lifecycle management and risk treatment.', orderIndex: 5 },
  { clauseId: '9', title: 'Performance Evaluation', description: 'Monitor, measure, analyze, evaluate, audit, and review the AIMS performance.', orderIndex: 6 },
  { clauseId: '10', title: 'Improvement', description: 'Implement nonconformity management and continual improvement processes.', orderIndex: 7 }
];

// ISO 42001 Subclauses Data (24 subclauses)
const iso42001SubclausesData = [
  // Clause 4: Context of the Organization
  {
    subclauseId: '4.1',
    title: 'Understanding the Organization and Its Context',
    summary: 'Determine external and internal issues relevant to the organization\'s purpose and its AIMS',
    questions: ['What internal factors influence our AIMS?', 'What external factors influence our AIMS?', 'How does our use/development of AI align with our business strategy?'],
    evidenceExamples: ['Context analysis document (PESTLE, SWOT focused on AI)', 'Documentation of internal/external issues', 'Strategic planning documents referencing AI'],
    orderIndex: 1,
    clauseId: '4'
  },
  {
    subclauseId: '4.2',
    title: 'Understanding the Needs and Expectations of Interested Parties',
    summary: 'Identify interested parties relevant to the AIMS and their requirements/expectations concerning AI',
    questions: ['Who are the interested parties for our AI systems?', 'What are their relevant needs, expectations, and requirements?', 'How do we capture and review these requirements?'],
    evidenceExamples: ['Stakeholder analysis matrix/register', 'List of applicable legal/regulatory requirements for AI', 'Records of communication with stakeholders'],
    orderIndex: 2,
    clauseId: '4'
  },
  {
    subclauseId: '4.3',
    title: 'Determining the Scope of the AI Management System',
    summary: 'Define the boundaries and applicability of the AIMS within the organization',
    questions: ['What organizational units, processes, locations are included in the AIMS?', 'Which specific AI systems or applications are covered?', 'What stages of the AI lifecycle are included?'],
    evidenceExamples: ['Documented AIMS Scope Statement'],
    orderIndex: 3,
    clauseId: '4'
  },
  {
    subclauseId: '4.4',
    title: 'AI Management System',
    summary: 'Establish, implement, maintain, and continually improve the AIMS in accordance with ISO 42001 requirements',
    questions: ['Do we have the necessary processes and documentation established for the AIMS?', 'Are these processes being followed?', 'Are there mechanisms for maintaining and updating the AIMS?'],
    evidenceExamples: ['The AIMS documentation itself (policies, procedures)', 'Records of implementation activities', 'Management review records', 'Audit results'],
    orderIndex: 4,
    clauseId: '4'
  },
  // Clause 5: Leadership
  {
    subclauseId: '5.1',
    title: 'Leadership and Commitment',
    summary: 'Top management must demonstrate leadership by ensuring policy/objectives alignment, resource availability, integration, communication, and promoting improvement',
    questions: ['How does top management show active involvement and support for the AIMS?', 'Are AIMS objectives aligned with strategic goals?', 'Are sufficient resources allocated?'],
    evidenceExamples: ['Management meeting minutes discussing AIMS', 'Resource allocation records (budget, staffing)', 'Internal communications from leadership'],
    orderIndex: 1,
    clauseId: '5'
  },
  {
    subclauseId: '5.2',
    title: 'Policy',
    summary: 'Establish, communicate, and maintain an AI Policy appropriate to the organization\'s context',
    questions: ['Is there a documented AI Policy?', 'Does it include commitments to requirements and continual improvement?', 'Does it align with organizational AI principles/ethics?'],
    evidenceExamples: ['The documented AI Policy', 'Communication records (emails, intranet posts)', 'Training materials covering the policy'],
    orderIndex: 2,
    clauseId: '5'
  },
  {
    subclauseId: '5.3',
    title: 'Organizational Roles, Responsibilities, and Authorities',
    summary: 'Assign and communicate responsibilities and authorities for roles relevant to the AIMS',
    questions: ['Who is ultimately accountable for the AIMS?', 'Who is responsible for specific AIMS tasks?', 'Are these roles, responsibilities, and authorities documented and communicated?'],
    evidenceExamples: ['Organization chart showing AIMS roles', 'Documented role descriptions', 'Responsibility Assignment Matrix (RACI)'],
    orderIndex: 3,
    clauseId: '5'
  },
  // Clause 6: Planning
  {
    subclauseId: '6.1',
    title: 'Actions to Address Risks and Opportunities',
    summary: 'Plan actions based on context, stakeholders, risks, and opportunities. Conduct AI risk assessments, plan risk treatments, and assess AI system impacts',
    questions: ['Do we have a process for identifying risks and opportunities related to the AIMS?', 'Is there a defined AI risk assessment methodology?', 'Are risks related to AI systems systematically identified and assessed?'],
    evidenceExamples: ['Risk management framework/policy/procedure', 'AI Risk Assessment Methodology', 'Risk assessment reports per AI system', 'AI Risk Register', 'AI Risk Treatment Plan'],
    orderIndex: 1,
    clauseId: '6'
  },
  {
    subclauseId: '6.2',
    title: 'AI Objectives and Planning to Achieve Them',
    summary: 'Establish measurable AIMS objectives aligned with the AI policy and plan how to achieve them',
    questions: ['What are the specific, measurable objectives for our AIMS?', 'Are they consistent with the AI policy and organizational goals?', 'What actions, resources, responsibilities, and timelines are defined?'],
    evidenceExamples: ['Documented AIMS Objectives', 'Action plans linked to objectives', 'Performance indicators (KPIs) for objectives', 'Management review records discussing objectives progress'],
    orderIndex: 2,
    clauseId: '6'
  },
  // Clause 7: Support
  {
    subclauseId: '7.1',
    title: 'Resources',
    summary: 'Determine and provide the resources needed for the AIMS',
    questions: ['What resources (human, financial, technological, infrastructure) are needed?', 'Have these resources been identified and allocated?'],
    evidenceExamples: ['Budget approvals', 'Staffing plans', 'Technology acquisition records', 'Facility plans'],
    orderIndex: 1,
    clauseId: '7'
  },
  {
    subclauseId: '7.2',
    title: 'Competence',
    summary: 'Ensure personnel involved in the AIMS are competent based on education, training, or experience',
    questions: ['What competencies are required for different AIMS roles?', 'How do we ensure individuals possess these competencies?', 'Are training needs identified and addressed?'],
    evidenceExamples: ['Job descriptions with competency requirements', 'Competency matrix', 'Training plans and records', 'Performance reviews', 'Certifications'],
    orderIndex: 2,
    clauseId: '7'
  },
  {
    subclauseId: '7.3',
    title: 'Awareness',
    summary: 'Ensure relevant personnel are aware of the AI policy, their contribution, and the implications of non-conformance',
    questions: ['Are staff aware of the AI Policy?', 'Do they understand how their work contributes to the AIMS and AI ethics?', 'Are they aware of the benefits of effective AI governance?'],
    evidenceExamples: ['Awareness training materials and attendance logs', 'Internal communications (newsletters, posters)', 'Onboarding materials'],
    orderIndex: 3,
    clauseId: '7'
  },
  {
    subclauseId: '7.4',
    title: 'Communication',
    summary: 'Determine and implement internal and external communications relevant to the AIMS',
    questions: ['What needs to be communicated about the AIMS?', 'When, how, and with whom does communication occur?', 'Who is responsible for communication?'],
    evidenceExamples: ['Communication plan/matrix', 'Records of communications (meeting minutes, emails, public statements)'],
    orderIndex: 4,
    clauseId: '7'
  },
  {
    subclauseId: '7.5',
    title: 'Documented Information',
    summary: 'Manage documented information required by the standard and necessary for AIMS effectiveness',
    questions: ['What documentation is required by ISO 42001?', 'What other documentation do we need for our AIMS to be effective?', 'How do we ensure documents are properly identified, formatted, reviewed, approved, version controlled?'],
    evidenceExamples: ['Document control procedure', 'Master document list / Document register', 'Version history in documents', 'Access control records', 'Backup procedures'],
    orderIndex: 5,
    clauseId: '7'
  },
  // Clause 8: Operation
  {
    subclauseId: '8.1',
    title: 'Operational Planning and Control',
    summary: 'Plan, implement, and control processes to meet requirements, implement actions from Clause 6, manage changes, and control outsourced processes',
    questions: ['How are operational processes (related to AI development/deployment/use) planned and controlled?', 'How are changes to these processes or AI systems managed?', 'How do we control processes outsourced to third parties?'],
    evidenceExamples: ['Standard Operating Procedures (SOPs) for AI lifecycle stages', 'Change management procedures and records', 'Supplier contracts and oversight procedures'],
    orderIndex: 1,
    clauseId: '8'
  },
  {
    subclauseId: '8.2',
    title: 'AI Risk Assessment (Operational)',
    summary: 'Perform AI risk assessments operationally (at planned intervals or upon significant changes)',
    questions: ['How often are AI risk assessments reviewed and updated?', 'What triggers an ad-hoc risk assessment?'],
    evidenceExamples: ['Schedule/plan for risk assessment reviews', 'Updated risk assessment reports'],
    orderIndex: 2,
    clauseId: '8'
  },
  {
    subclauseId: '8.3',
    title: 'AI Risk Treatment (Operational)',
    summary: 'Implement the AI risk treatment plan',
    questions: ['Are the controls defined in the risk treatment plan actually implemented?', 'Is there evidence of control operation?'],
    evidenceExamples: ['Records of control implementation (configuration settings, logs, procedure execution records)', 'Completed checklists', 'Training records related to specific controls'],
    orderIndex: 3,
    clauseId: '8'
  },
  {
    subclauseId: '8.4',
    title: 'AI System Lifecycle',
    summary: 'Define and implement processes for managing the entire AI system lifecycle consistent with policy, objectives, and impact assessments',
    questions: ['Do we have documented processes for each stage?', 'How are AI principles embedded in these processes?', 'How is documentation managed throughout the lifecycle?'],
    evidenceExamples: ['Documented AI system lifecycle process description', 'Project plans', 'Requirements specifications', 'Design documents', 'Data processing procedures'],
    orderIndex: 4,
    clauseId: '8'
  },
  {
    subclauseId: '8.5',
    title: 'Third-Party Relationships',
    summary: 'Manage risks associated with third-party suppliers/partners involved in the AI lifecycle',
    questions: ['How do we identify and assess risks related to third-party AI components or services?', 'Are AI-specific requirements included in contracts?', 'How do we monitor third-party performance?'],
    evidenceExamples: ['Third-party risk management procedure', 'Supplier assessment questionnaires/reports', 'Contracts with AI clauses', 'Supplier audit reports'],
    orderIndex: 5,
    clauseId: '8'
  },
  // Clause 9: Performance Evaluation
  {
    subclauseId: '9.1',
    title: 'Monitoring, Measurement, Analysis, and Evaluation',
    summary: 'Determine what needs monitoring/measuring, the methods, frequency, and how results are analyzed/evaluated',
    questions: ['What aspects of the AIMS and AI systems are monitored/measured?', 'What methods are used?', 'How often is data collected and analyzed?', 'Who analyzes/evaluates?', 'How are results used?'],
    evidenceExamples: ['Monitoring procedure', 'Defined metrics/KPIs', 'Monitoring logs/reports', 'Performance dashboards', 'Analysis reports'],
    orderIndex: 1,
    clauseId: '9'
  },
  {
    subclauseId: '9.2',
    title: 'Internal Audit',
    summary: 'Conduct internal audits at planned intervals to ensure the AIMS conforms to requirements and is effectively implemented',
    questions: ['Is there an audit program?', 'Are audits conducted by objective auditors?', 'Are criteria/scope defined?', 'Are results reported?', 'Are nonconformities addressed?'],
    evidenceExamples: ['Internal audit procedure', 'Audit programme/schedule', 'Audit plans/reports', 'Auditor competence records', 'Nonconformity reports'],
    orderIndex: 2,
    clauseId: '9'
  },
  {
    subclauseId: '9.3',
    title: 'Management Review',
    summary: 'Top management must review the AIMS at planned intervals to ensure its continuing suitability, adequacy, and effectiveness',
    questions: ['Are reviews conducted regularly?', 'Does review cover required inputs?', 'Are decisions made regarding improvements/changes?', 'Are minutes documented?'],
    evidenceExamples: ['Management review procedure', 'Review schedule/agendas/minutes', 'Action items tracker'],
    orderIndex: 3,
    clauseId: '9'
  },
  // Clause 10: Improvement
  {
    subclauseId: '10.1',
    title: 'Nonconformity and Corrective Action',
    summary: 'React to nonconformities, evaluate need for action, implement corrective actions, review effectiveness, and update AIMS if needed',
    questions: ['Is there a process for nonconformities?', 'How is correction handled?', 'Is root cause analysis performed?', 'How are corrective actions tracked and verified?', 'Are changes made to AIMS?'],
    evidenceExamples: ['Corrective action procedure', 'Nonconformity register', 'Root cause analysis records', 'Corrective action plans/verification'],
    orderIndex: 1,
    clauseId: '10'
  },
  {
    subclauseId: '10.2',
    title: 'Continual Improvement',
    summary: 'Continually improve the suitability, adequacy, and effectiveness of the AIMS',
    questions: ['How does the organization use results to drive improvement?', 'Is there evidence of ongoing efforts?'],
    evidenceExamples: ['Management review outputs', 'Updated policies/procedures', 'Improvement project records', 'Trend analysis'],
    orderIndex: 2,
    clauseId: '10'
  }
];

// ISO 42001 Annex Categories Data (7 categories)
const iso42001AnnexCategoriesData = [
  { categoryId: 'A.5', title: 'Organizational Policies and Governance', description: 'Establish organizational policies and governance frameworks for AI systems.', orderIndex: 1 },
  { categoryId: 'A.6', title: 'Internal Organization', description: 'Define internal organizational structure and roles for AI management.', orderIndex: 2 },
  { categoryId: 'A.7', title: 'Resources for AI Systems', description: 'Manage human, computational, data, and system resources for AI systems.', orderIndex: 3 },
  { categoryId: 'A.8', title: 'AI System Lifecycle', description: 'Implement comprehensive AI system lifecycle management processes.', orderIndex: 4 },
  { categoryId: 'A.9', title: 'Data for AI Systems', description: 'Establish data management practices for AI systems throughout their lifecycle.', orderIndex: 5 },
  { categoryId: 'A.10', title: 'Information and Communication Technology (ICT)', description: 'Implement ICT security and resilience measures for AI systems.', orderIndex: 6 },
  { categoryId: 'A.11', title: 'Third-Party Relationships', description: 'Manage risks and requirements in third-party AI relationships.', orderIndex: 7 }
];

// ISO 42001 Annex Items Data (37 items)
const iso42001AnnexItemsData = [
  // A.5: Organizational Policies and Governance
  { itemId: 'A.5.1.1', title: 'Policies for AI', description: 'Management direction and support for AI via policies', guidance: 'Management should define and endorse a set of policies to provide clear direction and support for AI development and use within the organization', orderIndex: 1, categoryId: 'A.5' },
  { itemId: 'A.5.2.1', title: 'AI Governance Framework', description: 'Establishment of a governance structure for AI oversight', guidance: 'An AI governance framework, including roles, responsibilities, processes, and oversight mechanisms, should be established and maintained', orderIndex: 2, categoryId: 'A.5' },
  { itemId: 'A.5.3.1', title: 'AI Roles and Responsibilities', description: 'Defining and allocating AI responsibilities', guidance: 'All AI system related responsibilities should be defined and allocated', orderIndex: 3, categoryId: 'A.5' },
  { itemId: 'A.5.3.2', title: 'Segregation of Duties', description: 'Separating conflicting duties related to AI', guidance: 'Conflicting duties and areas of responsibility should be segregated', orderIndex: 4, categoryId: 'A.5' },
  { itemId: 'A.5.4.1', title: 'Accountability for AI Systems', description: 'Assigning accountability for AI systems', guidance: 'Accountability should be assigned for the establishment, implementation, maintenance, monitoring, evaluation and improvement of the AIMS', orderIndex: 5, categoryId: 'A.5' },
  { itemId: 'A.5.5.1', title: 'Contact with Authorities', description: 'Maintaining contact with relevant authorities', guidance: 'Appropriate contacts with relevant authorities should be maintained', orderIndex: 6, categoryId: 'A.5' },
  { itemId: 'A.5.5.2', title: 'Contact with Special Interest Groups', description: 'Maintaining contact with special interest groups', guidance: 'Appropriate contacts with special interest groups and other specialist forums should be maintained', orderIndex: 7, categoryId: 'A.5' },
  { itemId: 'A.5.6.1', title: 'AI in Project Management', description: 'Integrating AI aspects into project management', guidance: 'AI should be integrated into the organization\'s project management', orderIndex: 8, categoryId: 'A.5' },

  // A.6: Internal Organization
  { itemId: 'A.6.1.1', title: 'AI Roles and Responsibilities', description: 'Defining and allocating AI responsibilities', guidance: 'All responsibilities related to the development, deployment, operation, and governance of AI systems should be clearly defined and allocated', orderIndex: 1, categoryId: 'A.6' },
  { itemId: 'A.6.1.2', title: 'Segregation of Duties', description: 'Separating conflicting duties related to AI', guidance: 'Conflicting duties and areas of responsibility should be segregated to reduce opportunities for unauthorized or unintentional modification', orderIndex: 2, categoryId: 'A.6' },

  // A.7: Resources for AI Systems
  { itemId: 'A.7.1.1', title: 'Identification of Resources', description: 'Identifying resources needed for AI', guidance: 'Resources necessary for the development, operation, and maintenance of AI systems should be identified and managed', orderIndex: 1, categoryId: 'A.7' },
  { itemId: 'A.7.2.1', title: 'Computational Resources', description: 'Managing computational resources for AI', guidance: 'Computational resources required for AI systems should be managed throughout their lifecycle', orderIndex: 2, categoryId: 'A.7' },
  { itemId: 'A.7.3.1', title: 'Data Resources', description: 'Managing data resources for AI', guidance: 'Data resources required for AI systems should be managed throughout their lifecycle', orderIndex: 3, categoryId: 'A.7' },
  { itemId: 'A.7.4.1', title: 'System Resources', description: 'Managing system resources for AI', guidance: 'System resources required for AI systems, including tools and infrastructure, should be managed throughout their lifecycle', orderIndex: 4, categoryId: 'A.7' },
  { itemId: 'A.7.5.1', title: 'Human Resources', description: 'Managing human resources for AI', guidance: 'Human resources required for AI systems, including roles, competencies, and training, should be managed throughout their lifecycle', orderIndex: 5, categoryId: 'A.7' },

  // A.8: AI System Lifecycle
  { itemId: 'A.8.1.1', title: 'AI System Lifecycle Management', description: 'Establishing and managing a defined AI lifecycle process', guidance: 'A defined lifecycle process should be established and managed for AI systems, covering stages from conception through retirement', orderIndex: 1, categoryId: 'A.8' },
  { itemId: 'A.8.2.1', title: 'AI System Requirements Analysis', description: 'Analyzing and specifying AI system requirements', guidance: 'Requirements for AI systems, including functional, non-functional, data, ethical, legal, and societal aspects, should be analyzed and specified', orderIndex: 2, categoryId: 'A.8' },
  { itemId: 'A.8.3.1', title: 'AI System Design', description: 'Designing AI systems based on requirements', guidance: 'AI systems should be designed based on specified requirements, considering architecture, models, data handling, and interaction mechanisms', orderIndex: 3, categoryId: 'A.8' },
  { itemId: 'A.8.4.1', title: 'Data Acquisition and Preparation', description: 'Acquiring and preparing data for AI systems', guidance: 'Data for AI systems should be acquired, pre-processed, and prepared according to requirements and quality criteria', orderIndex: 4, categoryId: 'A.8' },
  { itemId: 'A.8.5.1', title: 'Model Building and Evaluation', description: 'Building, training, and evaluating AI models', guidance: 'AI models should be built, trained, tuned, and evaluated using appropriate techniques and metrics', orderIndex: 5, categoryId: 'A.8' },
  { itemId: 'A.8.6.1', title: 'AI System Verification and Validation', description: 'Verifying and validating AI systems', guidance: 'AI systems should be verified and validated against requirements before deployment', orderIndex: 6, categoryId: 'A.8' },
  { itemId: 'A.8.7.1', title: 'AI System Deployment', description: 'Deploying AI systems into the operational environment', guidance: 'AI systems should be deployed into the operational environment according to planned procedures', orderIndex: 7, categoryId: 'A.8' },
  { itemId: 'A.8.8.1', title: 'AI System Operation and Monitoring', description: 'Operating and monitoring AI systems', guidance: 'Deployed AI systems should be operated and monitored for performance, behaviour, and compliance with requirements', orderIndex: 8, categoryId: 'A.8' },
  { itemId: 'A.8.9.1', title: 'AI System Maintenance and Retirement', description: 'Maintaining and retiring AI systems', guidance: 'AI systems should be maintained throughout their operational life and retired securely when no longer needed', orderIndex: 9, categoryId: 'A.8' },

  // A.9: Data for AI Systems
  { itemId: 'A.9.1.1', title: 'Data Quality for AI Systems', description: 'Processes to ensure data quality characteristics', guidance: 'Processes should be implemented to ensure that data used for developing and operating AI systems meets defined quality criteria', orderIndex: 1, categoryId: 'A.9' },
  { itemId: 'A.9.2.1', title: 'Data Acquisition', description: 'Managing the acquisition of data for AI', guidance: 'Data acquisition processes should ensure data is obtained legally, ethically, and according to specified requirements', orderIndex: 2, categoryId: 'A.9' },
  { itemId: 'A.9.3.1', title: 'Data Preparation', description: 'Preparing data for use in AI systems', guidance: 'Data should be prepared (cleaned, transformed, annotated) suitable for its intended use in AI system development and operation', orderIndex: 3, categoryId: 'A.9' },
  { itemId: 'A.9.4.1', title: 'Data Provenance', description: 'Documenting the origin and history of data', guidance: 'Information about the origin, history, and processing steps applied to data (provenance) should be documented and maintained', orderIndex: 4, categoryId: 'A.9' },
  { itemId: 'A.9.5.1', title: 'Data Privacy', description: 'Protecting privacy in data used for AI', guidance: 'Privacy requirements should be addressed throughout the data lifecycle, including anonymization or pseudonymization where appropriate', orderIndex: 5, categoryId: 'A.9' },
  { itemId: 'A.9.6.1', title: 'Data Handling', description: 'Securely handling data throughout its lifecycle', guidance: 'Data should be handled securely, including storage, access control, transmission, and disposal, according to its classification', orderIndex: 6, categoryId: 'A.9' },

  // A.10: Information and Communication Technology (ICT)
  { itemId: 'A.10.1.1', title: 'Information Security for AI Systems', description: 'Application of information security controls to AI systems', guidance: 'Information security requirements and controls should be applied throughout the AI system lifecycle to protect confidentiality, integrity, and availability', orderIndex: 1, categoryId: 'A.10' },
  { itemId: 'A.10.2.1', title: 'Security of AI Models', description: 'Protecting AI models from threats', guidance: 'AI models should be protected against threats such as unauthorized access, modification, theft, or poisoning', orderIndex: 2, categoryId: 'A.10' },
  { itemId: 'A.10.3.1', title: 'Security of AI Data', description: 'Protecting data used by AI systems', guidance: 'Data used in AI systems should be protected according to information security policies and data classification', orderIndex: 3, categoryId: 'A.10' },
  { itemId: 'A.10.4.1', title: 'Resilience of AI Systems', description: 'Ensuring AI systems are resilient to failures and attacks', guidance: 'AI systems should be designed and operated to be resilient against failures, errors, and attacks', orderIndex: 4, categoryId: 'A.10' },

  // A.11: Third-Party Relationships
  { itemId: 'A.11.1.1', title: 'Management of Third-Party AI Related Risks', description: 'Managing risks when using third-party AI systems, components, or data', guidance: 'Risks associated with third-party provision or use of AI systems, components, services, or data should be identified, assessed, and managed', orderIndex: 1, categoryId: 'A.11' },
  { itemId: 'A.11.2.1', title: 'Supplier Agreements for AI', description: 'Including AI-specific requirements in supplier agreements', guidance: 'Agreements with third parties supplying AI systems, components, services, or data should include relevant AI-specific requirements', orderIndex: 2, categoryId: 'A.11' },
  { itemId: 'A.11.3.1', title: 'Monitoring of Third-Party AI Services', description: 'Monitoring third-party compliance and performance', guidance: 'The performance and compliance of third parties involved in the AI system lifecycle should be monitored according to agreements', orderIndex: 3, categoryId: 'A.11' }
];

async function seedCompleteIso42001Data() {
  console.log('🌱 Seeding Complete ISO 42001 Framework Data...\n');

  try {
    // Seed Clauses
    console.log('📋 Seeding ISO 42001 Clauses...');
    for (const clause of iso42001ClausesData) {
      await prisma.iso42001Clause.upsert({
        where: { clauseId: clause.clauseId },
        update: clause,
        create: clause,
      });
    }
    console.log(`✅ Processed ${iso42001ClausesData.length} clauses`);

    // Seed Subclauses
    console.log('📝 Seeding ISO 42001 Subclauses...');
    for (const subclause of iso42001SubclausesData) {
      await prisma.iso42001Subclause.upsert({
        where: { subclauseId: subclause.subclauseId },
        update: subclause,
        create: subclause,
      });
    }
    console.log(`✅ Processed ${iso42001SubclausesData.length} subclauses`);

    // Seed Annex Categories
    console.log('🏗️ Seeding ISO 42001 Annex Categories...');
    for (const category of iso42001AnnexCategoriesData) {
      await prisma.iso42001AnnexCategory.upsert({
        where: { categoryId: category.categoryId },
        update: category,
        create: category,
      });
    }
    console.log(`✅ Processed ${iso42001AnnexCategoriesData.length} annex categories`);

    // Seed Annex Items
    console.log('📦 Seeding ISO 42001 Annex Items...');
    for (const item of iso42001AnnexItemsData) {
      await prisma.iso42001AnnexItem.upsert({
        where: { itemId: item.itemId },
        update: item,
        create: item,
      });
    }
    console.log(`✅ Processed ${iso42001AnnexItemsData.length} annex items`);

    // Final verification
    console.log('\n📊 Final Verification Results:');
    const clauses = await prisma.iso42001Clause.count();
    const subclauses = await prisma.iso42001Subclause.count();
    const annexCategories = await prisma.iso42001AnnexCategory.count();
    const annexItems = await prisma.iso42001AnnexItem.count();
    
    console.log(`Clauses: ${clauses}`);
    console.log(`Subclauses: ${subclauses}`);
    console.log(`Annex Categories: ${annexCategories}`);
    console.log(`Annex Items: ${annexItems}`);

    console.log('\n🎉 Complete ISO 42001 Framework data seeded successfully!');

    // Detailed breakdown
    console.log('\n📈 Detailed Breakdown by Clause:');
    const clauseBreakdown = await prisma.iso42001Clause.findMany({
      include: {
        subclauses: true
      },
      orderBy: { orderIndex: 'asc' }
    });

    clauseBreakdown.forEach((clause) => {
      console.log(`${clause.title}: ${clause.subclauses.length} subclauses`);
    });

    console.log('\n📈 Detailed Breakdown by Annex Category:');
    const annexBreakdown = await prisma.iso42001AnnexCategory.findMany({
      include: {
        items: true
      },
      orderBy: { orderIndex: 'asc' }
    });

    annexBreakdown.forEach((category) => {
      console.log(`${category.title}: ${category.items.length} items`);
    });

  } catch (error) {
    console.error('❌ Error seeding ISO 42001 data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedCompleteIso42001Data();
}

export default seedCompleteIso42001Data;