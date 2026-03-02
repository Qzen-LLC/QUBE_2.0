#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';
import { uaeAiControls } from '../src/lib/framework-data/uae-ai-controls';

const prisma = prismaClient;

// EU AI Act Topics Data
const euAiActTopicsData = [
  { topicId: '1', title: 'Project Scope', description: 'Define and document the scope of the AI project including environment, technology, and stakeholder requirements.', orderIndex: 1 },
  { topicId: '2', title: 'Risk Management System', description: 'Establish comprehensive risk management processes for AI systems.', orderIndex: 2 },
  { topicId: '3', title: 'Data Governance', description: 'Establish data governance frameworks for AI systems.', orderIndex: 3 },
  { topicId: '4', title: 'Technical Documentation', description: 'Document technical aspects of AI systems and their capabilities.', orderIndex: 4 },
  { topicId: '5', title: 'Record Keeping', description: 'Maintain comprehensive records of AI system operations and performance.', orderIndex: 5 },
  { topicId: '6', title: 'Transparency and User Information', description: 'Ensure transparency in AI system operations and provide adequate user information.', orderIndex: 6 },
  { topicId: '7', title: 'Human Oversight', description: 'Establish effective human oversight mechanisms for AI systems.', orderIndex: 7 },
  { topicId: '8', title: 'Accuracy, Robustness, and Cybersecurity', description: 'Ensure AI systems are accurate, robust, and secure.', orderIndex: 8 },
  { topicId: '9', title: 'Conformity Assessment', description: 'Establish conformity assessment processes for AI systems.', orderIndex: 9 },
  { topicId: '10', title: 'Post-Market Monitoring', description: 'Monitor AI systems after deployment for ongoing compliance.', orderIndex: 10 },
  { topicId: '11', title: 'Bias Monitoring and Mitigation', description: 'Identify, monitor, and mitigate bias in AI systems.', orderIndex: 11 },
  { topicId: '12', title: 'Accountability and Governance', description: 'Establish accountability frameworks and governance structures.', orderIndex: 12 },
  { topicId: '13', title: 'Explainability', description: 'Ensure AI systems provide adequate explainability and interpretability.', orderIndex: 13 },
  { topicId: '14', title: 'Environmental Impact', description: 'Assess and manage the environmental impact of AI systems.', orderIndex: 14 }
];

// EU AI Act Subtopics Data
const euAiActSubtopicsData = [
  { subtopicId: '1.1', title: 'General', description: 'General project scope documentation', orderIndex: 1, topicId: '1' },
  { subtopicId: '1.2', title: 'Technology Details', description: 'Detailed technology requirements and specifications', orderIndex: 2, topicId: '1' },
  { subtopicId: '2.1', title: 'Transparency and Provision of Information to Deployers', description: 'Ensure transparency in AI system deployment and information sharing', orderIndex: 1, topicId: '2' },
  { subtopicId: '2.2', title: 'Responsibilities Along the AI Value Chain', description: 'Define responsibilities across the AI development and deployment value chain', orderIndex: 2, topicId: '2' },
  { subtopicId: '3.1', title: 'Responsibilities Along the AI Value Chain', description: 'Data-related responsibilities across the AI value chain', orderIndex: 1, topicId: '3' },
  { subtopicId: '3.2', title: 'Fundamental Rights Impact Assessments', description: 'Assess impact on fundamental rights and privacy', orderIndex: 2, topicId: '3' },
  { subtopicId: '4.1', title: 'AI Model Capability Assessment', description: 'Assess AI model capabilities and limitations', orderIndex: 1, topicId: '4' },
  { subtopicId: '5.1', title: 'AI Model Capability Assessment', description: 'Record keeping for AI model capabilities', orderIndex: 1, topicId: '5' },
  { subtopicId: '6.1', title: 'User Notification of AI System Use', description: 'Notify users about AI system usage and implications', orderIndex: 1, topicId: '6' },
  { subtopicId: '7.1', title: 'Oversight Documentation', description: 'Document oversight processes and responsibilities', orderIndex: 1, topicId: '7' },
  { subtopicId: '7.2', title: 'Human Intervention Mechanisms', description: 'Establish mechanisms for human intervention in AI operations', orderIndex: 2, topicId: '7' },
  { subtopicId: '8.1', title: 'System Validation and Reliability Documentation', description: 'Document system validation and reliability processes', orderIndex: 1, topicId: '8' },
  { subtopicId: '8.2', title: 'AI System Change Documentation', description: 'Document changes to AI systems and their impacts', orderIndex: 2, topicId: '8' },
  { subtopicId: '9.1', title: 'EU Database Registration', description: 'Register AI systems in EU databases as required', orderIndex: 1, topicId: '9' },
  { subtopicId: '10.1', title: 'Post-Market Monitoring by Providers', description: 'Monitor AI systems after market deployment', orderIndex: 1, topicId: '10' },
  { subtopicId: '11.1', title: 'Bias and Fairness Evaluation', description: 'Evaluate bias and fairness in AI systems', orderIndex: 1, topicId: '11' },
  { subtopicId: '12.1', title: 'System Information Documentation', description: 'Document system information and governance processes', orderIndex: 1, topicId: '12' },
  { subtopicId: '13.1', title: 'Transparency Obligations', description: 'Meet transparency obligations for AI systems', orderIndex: 1, topicId: '13' },
  { subtopicId: '14.1', title: 'Environmental Impact Assessment', description: 'Assess environmental impact of AI systems', orderIndex: 1, topicId: '14' }
];

// EU AI Act Questions Data (sample - first 20)
const euAiActQuestionsData = [
  { questionId: '1.1.1', question: 'Describe the AI environment/application used', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '1.1' },
  { questionId: '1.1.2', question: 'Is a new form of AI technology used?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '1.1' },
  { questionId: '1.1.3', question: 'Are personal sensitive data used?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '1.1' },
  { questionId: '1.1.4', question: 'Project scope documents description', priority: 'High', answerType: 'Long text', orderIndex: 4, subtopicId: '1.1' },
  { questionId: '1.2.1', question: 'What type of AI technology are you using? Explain AI and ML technologies used', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '1.2' },
  { questionId: '1.2.2', question: 'Is there ongoing monitoring of the system to ensure that the system is operating as intended?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '1.2' },
  { questionId: '1.2.3', question: 'Have you considered unintended outcomes that could occur from the use of this system?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '1.2' },
  { questionId: '1.2.4', question: 'Add technology documentation. You can include a data flow diagram, MLops lifecycle diagram', priority: 'High', answerType: 'Long text', orderIndex: 4, subtopicId: '1.2' },
  { questionId: '2.1.1', question: 'Will you make substantial modifications to the high-risk AI system already on the EU market?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '2.1' },
  { questionId: '2.1.2', question: 'What business problem does the AI system solve, and what are its capabilities?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '2.1' },
  { questionId: '2.1.3', question: 'How has your organization assessed the AI application against its ethical values?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '2.1' },
  { questionId: '2.2.1', question: 'Specify details of any third-party involvement in the design, development, deployment, and support of the AI system', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '2.2' },
  { questionId: '2.2.2', question: 'What risks were identified in the data impact assessment?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '2.2' },
  { questionId: '2.2.3', question: 'How has the selection or development of the model been assessed with regard to fairness, explainability, and robustness?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '2.2' },
  { questionId: '2.2.4', question: 'What strategies have been implemented to address the risks identified in the model assessment?', priority: 'High', answerType: 'Long text', orderIndex: 4, subtopicId: '2.2' },
  { questionId: '3.1.1', question: 'What risks have been identified associated with the chosen deployment and serving strategies?', priority: 'Medium', answerType: 'Long text', orderIndex: 1, subtopicId: '3.1' },
  { questionId: '3.1.2', question: 'What measures are in place to detect undesired behavior in our AI solution?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '3.1' },
  { questionId: '3.1.3', question: 'How can any unforeseen effects be mitigated after deployment of the AI application?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '3.1' },
  { questionId: '3.1.4', question: 'What is the possible harmful effect of uncertainty and error margins for different groups?', priority: 'High', answerType: 'Long text', orderIndex: 4, subtopicId: '3.1' },
  { questionId: '3.1.5', question: 'What mechanisms are in place for reporting serious incidents and certain risks?', priority: 'High', answerType: 'Long text', orderIndex: 5, subtopicId: '3.1' }
];

// EU AI Act Control Categories Data
const euAiActControlCategoriesData = [
  { categoryId: '1', title: 'AI Literacy and Responsible AI Training', description: 'Ensure AI literacy and responsible AI training across the organization.', orderIndex: 1 },
  { categoryId: '2', title: 'Transparency and Provision of Information to Deployers', description: 'Ensure transparency in AI system deployment and information provision.', orderIndex: 2 },
  { categoryId: '3', title: 'Human Oversight', description: 'Establish effective human oversight mechanisms for AI systems.', orderIndex: 3 },
  { categoryId: '4', title: 'Corrective Actions and Duty of Information', description: 'Implement corrective actions and maintain information duties.', orderIndex: 4 },
  { categoryId: '5', title: 'Responsibilities Along the AI Value Chain', description: 'Define responsibilities across the AI value chain.', orderIndex: 5 },
  { categoryId: '6', title: 'Risk Management', description: 'Establish comprehensive risk management frameworks.', orderIndex: 6 },
  { categoryId: '7', title: 'Data Governance', description: 'Implement data governance controls for AI systems.', orderIndex: 7 },
  { categoryId: '8', title: 'Technical Documentation', description: 'Maintain technical documentation and standards.', orderIndex: 8 },
  { categoryId: '9', title: 'Accuracy and Robustness', description: 'Ensure accuracy and robustness of AI systems.', orderIndex: 9 },
  { categoryId: '10', title: 'Cybersecurity', description: 'Implement cybersecurity measures for AI systems.', orderIndex: 10 },
  { categoryId: '11', title: 'Bias Monitoring', description: 'Monitor and mitigate bias in AI systems.', orderIndex: 11 },
  { categoryId: '12', title: 'Explainability', description: 'Ensure explainability and interpretability of AI systems.', orderIndex: 12 },
  { categoryId: '13', title: 'Post-Market Monitoring', description: 'Monitor AI systems after deployment.', orderIndex: 13 }
];

// EU AI Act Control Structures Data (sample - first 20)
const euAiActControlStructsData = [
  { controlId: '1.1', title: 'AI Literacy and Responsible AI Training', description: 'Establish AI literacy and responsible AI training programs', orderIndex: 1, categoryId: '1' },
  { controlId: '1.2', title: 'Regulatory Training and Response Procedures', description: 'Establish regulatory training and response procedures', orderIndex: 2, categoryId: '1' },
  { controlId: '2.1', title: 'Intended Use Description', description: 'Provide detailed descriptions of AI system intended use', orderIndex: 1, categoryId: '2' },
  { controlId: '2.2', title: 'Technical Documentation Review', description: 'Review and verify technical documentation', orderIndex: 2, categoryId: '2' },
  { controlId: '2.3', title: 'Record Maintenance of AI System Activities', description: 'Maintain accurate records of AI system activities', orderIndex: 3, categoryId: '2' },
  { controlId: '2.4', title: 'System Information Documentation', description: 'Document system information comprehensively', orderIndex: 4, categoryId: '2' },
  { controlId: '2.5', title: 'Dataset Description', description: 'Describe training, validation, and testing datasets', orderIndex: 5, categoryId: '2' },
  { controlId: '2.6', title: 'Mitigation Strategies and Bias Testing', description: 'Explain mitigation strategies and bias testing results', orderIndex: 6, categoryId: '2' },
  { controlId: '2.7', title: 'AI System Accuracy and Security Information', description: 'Provide accuracy metrics, robustness, and cybersecurity information', orderIndex: 7, categoryId: '2' },
  { controlId: '3.1', title: 'Human Intervention Mechanisms', description: 'Define mechanisms for human intervention in AI operations', orderIndex: 1, categoryId: '3' },
  { controlId: '3.2', title: 'Oversight Documentation', description: 'Document oversight processes and limitations', orderIndex: 2, categoryId: '3' },
  { controlId: '3.3', title: 'Oversight Communication', description: 'Ensure clear communication of AI system capabilities and limitations', orderIndex: 3, categoryId: '3' },
  { controlId: '4.1', title: 'Proportionate Oversight Measures', description: 'Implement proportionate oversight measures', orderIndex: 1, categoryId: '4' },
  { controlId: '4.2', title: 'System Validation and Reliability Documentation', description: 'Validate and document system reliability', orderIndex: 2, categoryId: '4' },
  { controlId: '4.3', title: 'Prompt Corrective Actions Implementation', description: 'Implement corrective actions as required', orderIndex: 3, categoryId: '4' },
  { controlId: '4.4', title: 'Documentation of Corrective Actions', description: 'Maintain documentation of corrective actions taken', orderIndex: 4, categoryId: '4' },
  { controlId: '5.1', title: 'Due Diligence Before Association', description: 'Conduct thorough due diligence before associating with AI systems', orderIndex: 1, categoryId: '5' },
  { controlId: '5.2', title: 'Contractual Agreements', description: 'Establish clear contractual agreements with AI system providers', orderIndex: 2, categoryId: '5' },
  { controlId: '5.3', title: 'Third-Party Supplier Responsibilities', description: 'Define responsibilities with third-party suppliers', orderIndex: 3, categoryId: '5' },
  { controlId: '5.4', title: 'Regulatory Compliance Requirements', description: 'Specify requirements for regulatory compliance', orderIndex: 4, categoryId: '5' }
];

// EU AI Act Subcontrol Structures Data (sample - first 20)
const euAiActSubcontrolStructsData = [
  { subcontrolId: '1.1.1', title: 'Executive Leadership Responsibility', description: 'We ensure executive leadership takes responsibility for decisions related to AI risks', orderIndex: 1, controlId: '1.1' },
  { subcontrolId: '1.1.2', title: 'AI Literacy Training', description: 'We provide AI literacy and ethics training to relevant personnel', orderIndex: 2, controlId: '1.1' },
  { subcontrolId: '1.1.3', title: 'Communication Plan', description: 'We develop a clear and concise communication plan for informing workers about the use of high-risk AI systems', orderIndex: 3, controlId: '1.1' },
  { subcontrolId: '1.2.1', title: 'Roles and Responsibilities', description: 'We clearly define roles and responsibilities related to AI risk management', orderIndex: 1, controlId: '1.2' },
  { subcontrolId: '1.2.2', title: 'Regulatory Training', description: 'We train personnel on the requirements of the regulation and the process for responding to requests', orderIndex: 2, controlId: '1.2' },
  { subcontrolId: '2.1.1', title: 'Intended Use Documentation', description: 'We provide detailed descriptions of the AI system\'s intended use', orderIndex: 1, controlId: '2.1' },
  { subcontrolId: '2.2.1', title: 'Documentation Review', description: 'We review and verify technical documentation from providers', orderIndex: 1, controlId: '2.2' },
  { subcontrolId: '2.3.1', title: 'Activity Records', description: 'We maintain accurate records of all AI system activities, including modifications and third-party involvements', orderIndex: 1, controlId: '2.3' },
  { subcontrolId: '2.4.1', title: 'System Information', description: 'We document system information, including functionality, limitations, and risk controls', orderIndex: 1, controlId: '2.4' },
  { subcontrolId: '2.4.2', title: 'Forbidden Uses', description: 'We define and document forbidden uses and foresee potential misuse', orderIndex: 2, controlId: '2.4' },
  { subcontrolId: '2.5.1', title: 'Dataset Documentation', description: 'We describe training, validation, and testing datasets used', orderIndex: 1, controlId: '2.5' },
  { subcontrolId: '2.6.1', title: 'Mitigation Strategies', description: 'We explain mitigation strategies and bias testing results', orderIndex: 1, controlId: '2.6' },
  { subcontrolId: '2.7.1', title: 'Accuracy and Security Information', description: 'We provide accuracy metrics, robustness, and cybersecurity information', orderIndex: 1, controlId: '2.7' },
  { subcontrolId: '3.1.1', title: 'Intervention Mechanisms', description: 'We define mechanisms for human intervention or override of AI outputs', orderIndex: 1, controlId: '3.1' },
  { subcontrolId: '3.1.2', title: 'Competent Oversight', description: 'We assign competent individuals with authority to oversee AI system usage', orderIndex: 2, controlId: '3.1' },
  { subcontrolId: '3.1.3', title: 'Oversight Alignment', description: 'We align oversight measures with provider\'s instructions for use', orderIndex: 3, controlId: '3.1' },
  { subcontrolId: '3.2.1', title: 'Limitation Documentation', description: 'We document system limitations and human oversight options', orderIndex: 1, controlId: '3.2' },
  { subcontrolId: '3.2.2', title: 'Appeal Processes', description: 'We establish appeal processes related to AI system decisions', orderIndex: 2, controlId: '3.2' },
  { subcontrolId: '3.3.1', title: 'Oversight Communication', description: 'We ensure clear communication of AI system capabilities, limitations, and risks to human operators', orderIndex: 1, controlId: '3.3' },
  { subcontrolId: '3.3.2', title: 'Proportionate Oversight', description: 'We proportion oversight measures to match AI system\'s risk level and autonomy', orderIndex: 2, controlId: '3.3' }
];

// ISO 42001 Clauses Data
const iso42001ClausesData = [
  { clauseId: '4', title: 'Context of the Organization', description: 'Understand the organization\'s context and establish the scope of the AI Management System.', orderIndex: 1 },
  { clauseId: '5', title: 'Leadership', description: 'Establish leadership commitment and organizational structure for AI management.', orderIndex: 2 },
  { clauseId: '6', title: 'Planning', description: 'Plan actions based on context, stakeholders, risks, and opportunities for AI systems.', orderIndex: 3 },
  { clauseId: '7', title: 'Support', description: 'Provide necessary resources, competence, awareness, communication, and documentation for the AIMS.', orderIndex: 4 },
  { clauseId: '8', title: 'Operation', description: 'Implement and control processes for AI system lifecycle management and risk treatment.', orderIndex: 5 },
  { clauseId: '9', title: 'Performance Evaluation', description: 'Monitor, measure, analyze, evaluate, audit, and review the AIMS performance.', orderIndex: 6 },
  { clauseId: '10', title: 'Improvement', description: 'Implement nonconformity management and continual improvement processes.', orderIndex: 7 }
];

// ISO 42001 Subclauses Data (sample - first 10)
const iso42001SubclausesData = [
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
  {
    subclauseId: '7.1',
    title: 'Resources',
    summary: 'Determine and provide the resources needed for the AIMS',
    questions: ['What resources (human, financial, technological, infrastructure) are needed?', 'Have these resources been identified and allocated?'],
    evidenceExamples: ['Budget approvals', 'Staffing plans', 'Technology acquisition records', 'Facility plans'],
    orderIndex: 1,
    clauseId: '7'
  }
];

// ISO 42001 Annex Categories Data
const iso42001AnnexCategoriesData = [
  { categoryId: 'A.5', title: 'Organizational Policies and Governance', description: 'Establish organizational policies and governance frameworks for AI systems.', orderIndex: 1 },
  { categoryId: 'A.6', title: 'Internal Organization', description: 'Define internal organizational structure and roles for AI management.', orderIndex: 2 },
  { categoryId: 'A.7', title: 'Resources for AI Systems', description: 'Manage human, computational, data, and system resources for AI systems.', orderIndex: 3 },
  { categoryId: 'A.8', title: 'AI System Lifecycle', description: 'Implement comprehensive AI system lifecycle management processes.', orderIndex: 4 },
  { categoryId: 'A.9', title: 'Data for AI Systems', description: 'Establish data management practices for AI systems throughout their lifecycle.', orderIndex: 5 },
  { categoryId: 'A.10', title: 'Information and Communication Technology (ICT)', description: 'Implement ICT security and resilience measures for AI systems.', orderIndex: 6 },
  { categoryId: 'A.11', title: 'Third-Party Relationships', description: 'Manage risks and requirements in third-party AI relationships.', orderIndex: 7 }
];

// ISO 42001 Annex Items Data (sample - first 15)
const iso42001AnnexItemsData = [
  { itemId: 'A.5.1.1', title: 'Policies for AI', description: 'Management direction and support for AI via policies', guidance: 'Management should define and endorse a set of policies to provide clear direction and support for AI development and use within the organization', orderIndex: 1, categoryId: 'A.5' },
  { itemId: 'A.5.2.1', title: 'AI Governance Framework', description: 'Establishment of a governance structure for AI oversight', guidance: 'An AI governance framework, including roles, responsibilities, processes, and oversight mechanisms, should be established and maintained', orderIndex: 2, categoryId: 'A.5' },
  { itemId: 'A.5.3.1', title: 'AI Roles and Responsibilities', description: 'Defining and allocating AI responsibilities', guidance: 'All AI system related responsibilities should be defined and allocated', orderIndex: 3, categoryId: 'A.5' },
  { itemId: 'A.5.3.2', title: 'Segregation of Duties', description: 'Separating conflicting duties related to AI', guidance: 'Conflicting duties and areas of responsibility should be segregated', orderIndex: 4, categoryId: 'A.5' },
  { itemId: 'A.5.4.1', title: 'Accountability for AI Systems', description: 'Assigning accountability for AI systems', guidance: 'Accountability should be assigned for the establishment, implementation, maintenance, monitoring, evaluation and improvement of the AIMS', orderIndex: 5, categoryId: 'A.5' },
  { itemId: 'A.6.1.1', title: 'AI Roles and Responsibilities', description: 'Defining and allocating AI responsibilities', guidance: 'All responsibilities related to the development, deployment, operation, and governance of AI systems should be clearly defined and allocated', orderIndex: 1, categoryId: 'A.6' },
  { itemId: 'A.6.1.2', title: 'Segregation of Duties', description: 'Separating conflicting duties related to AI', guidance: 'Conflicting duties and areas of responsibility should be segregated to reduce opportunities for unauthorized or unintentional modification', orderIndex: 2, categoryId: 'A.6' },
  { itemId: 'A.7.1.1', title: 'Identification of Resources', description: 'Identifying resources needed for AI', guidance: 'Resources necessary for the development, operation, and maintenance of AI systems should be identified and managed', orderIndex: 1, categoryId: 'A.7' },
  { itemId: 'A.7.2.1', title: 'Computational Resources', description: 'Managing computational resources for AI', guidance: 'Computational resources required for AI systems should be managed throughout their lifecycle', orderIndex: 2, categoryId: 'A.7' },
  { itemId: 'A.7.3.1', title: 'Data Resources', description: 'Managing data resources for AI', guidance: 'Data resources required for AI systems should be managed throughout their lifecycle', orderIndex: 3, categoryId: 'A.7' },
  { itemId: 'A.8.1.1', title: 'AI System Lifecycle Management', description: 'Establishing and managing a defined AI lifecycle process', guidance: 'A defined lifecycle process should be established and managed for AI systems, covering stages from conception through retirement', orderIndex: 1, categoryId: 'A.8' },
  { itemId: 'A.8.2.1', title: 'AI System Requirements Analysis', description: 'Analyzing and specifying AI system requirements', guidance: 'Requirements for AI systems, including functional, non-functional, data, ethical, legal, and societal aspects, should be analyzed and specified', orderIndex: 2, categoryId: 'A.8' },
  { itemId: 'A.9.1.1', title: 'Data Quality for AI Systems', description: 'Processes to ensure data quality characteristics', guidance: 'Processes should be implemented to ensure that data used for developing and operating AI systems meets defined quality criteria', orderIndex: 1, categoryId: 'A.9' },
  { itemId: 'A.10.1.1', title: 'Information Security for AI Systems', description: 'Application of information security controls to AI systems', guidance: 'Information security requirements and controls should be applied throughout the AI system lifecycle to protect confidentiality, integrity, and availability', orderIndex: 1, categoryId: 'A.10' },
  { itemId: 'A.11.1.1', title: 'Management of Third-Party AI Related Risks', description: 'Managing risks when using third-party AI systems, components, or data', guidance: 'Risks associated with third-party provision or use of AI systems, components, services, or data should be identified, assessed, and managed', orderIndex: 1, categoryId: 'A.11' }
];

async function seedEuAiActFramework() {
  console.log('🌱 Seeding EU AI Act framework...');

  // Seed Topics
  console.log('  📝 Creating topics...');
  for (const topic of euAiActTopicsData) {
    await prisma.euAiActTopic.upsert({
      where: { topicId: topic.topicId },
      update: topic,
      create: topic
    });
  }

  // Seed Subtopics
  console.log('  📋 Creating subtopics...');
  for (const subtopic of euAiActSubtopicsData) {
    await prisma.euAiActSubtopic.upsert({
      where: { subtopicId: subtopic.subtopicId },
      update: subtopic,
      create: subtopic
    });
  }

  // Seed Questions
  console.log('  ❓ Creating questions...');
  for (const question of euAiActQuestionsData) {
    await prisma.euAiActQuestion.upsert({
      where: { questionId: question.questionId },
      update: question,
      create: question
    });
  }

  // Seed Control Categories
  console.log('  🗂️  Creating control categories...');
  for (const category of euAiActControlCategoriesData) {
    await prisma.euAiActControlCategory.upsert({
      where: { categoryId: category.categoryId },
      update: category,
      create: category
    });
  }

  // Seed Control Structures
  console.log('  🎯 Creating control structures...');
  for (const control of euAiActControlStructsData) {
    await prisma.euAiActControlStruct.upsert({
      where: { controlId: control.controlId },
      update: control,
      create: control
    });
  }

  // Seed Subcontrol Structures
  console.log('  🔍 Creating subcontrol structures...');
  for (const subcontrol of euAiActSubcontrolStructsData) {
    await prisma.euAiActSubcontrolStruct.upsert({
      where: { subcontrolId: subcontrol.subcontrolId },
      update: subcontrol,
      create: subcontrol
    });
  }

  console.log('✅ EU AI Act framework seeded successfully!');
}

async function seedIso42001Framework() {
  console.log('🌱 Seeding ISO 42001 framework...');

  // Seed Clauses
  console.log('  📜 Creating clauses...');
  for (const clause of iso42001ClausesData) {
    await prisma.iso42001Clause.upsert({
      where: { clauseId: clause.clauseId },
      update: clause,
      create: clause
    });
  }

  // Seed Subclauses
  console.log('  📑 Creating subclauses...');
  for (const subclause of iso42001SubclausesData) {
    await prisma.iso42001Subclause.upsert({
      where: { subclauseId: subclause.subclauseId },
      update: subclause,
      create: subclause
    });
  }

  // Seed Annex Categories
  console.log('  📂 Creating annex categories...');
  for (const category of iso42001AnnexCategoriesData) {
    await prisma.iso42001AnnexCategory.upsert({
      where: { categoryId: category.categoryId },
      update: category,
      create: category
    });
  }

  // Seed Annex Items
  console.log('  📄 Creating annex items...');
  for (const item of iso42001AnnexItemsData) {
    await prisma.iso42001AnnexItem.upsert({
      where: { itemId: item.itemId },
      update: item,
      create: item
    });
  }

  console.log('✅ ISO 42001 framework seeded successfully!');
}

async function seedUaeAiControlsFramework() {
  console.log('🌱 Seeding UAE AI Controls framework...');

  // Clear existing UAE AI control data
  console.log('  🧹 Clearing existing UAE AI control data...');
  await prisma.uaeAiControlInstance.deleteMany({});
  await prisma.uaeAiControl.deleteMany({});

  // Seed UAE AI Controls
  console.log('  📋 Creating UAE AI controls...');
  for (const control of uaeAiControls) {
    await prisma.uaeAiControl.upsert({
      where: { controlId: control.controlId },
      update: {
        title: control.title,
        description: control.description,
        legalBasis: control.legalBasis,
        evidenceTypes: control.evidenceTypes,
        orderIndex: control.orderIndex
      },
      create: {
        controlId: control.controlId,
        title: control.title,
        description: control.description,
        legalBasis: control.legalBasis,
        evidenceTypes: control.evidenceTypes,
        orderIndex: control.orderIndex
      }
    });
    console.log(`    ✅ Created control: ${control.controlId} - ${control.title}`);
  }

  console.log('✅ UAE AI Controls framework seeded successfully!');
}

async function main() {
  try {
    console.log('🚀 Starting framework data seeding...\n');

    await seedEuAiActFramework();
    console.log('');
    await seedIso42001Framework();
    console.log('');
    await seedUaeAiControlsFramework();

    console.log('\n🎉 All framework data seeded successfully!');
    console.log(`
📊 Summary:
  - EU AI Act Topics: ${euAiActTopicsData.length}
  - EU AI Act Subtopics: ${euAiActSubtopicsData.length}  
  - EU AI Act Questions: ${euAiActQuestionsData.length}
  - EU AI Act Control Categories: ${euAiActControlCategoriesData.length}
  - EU AI Act Controls: ${euAiActControlStructsData.length}
  - EU AI Act Subcontrols: ${euAiActSubcontrolStructsData.length}
  - ISO 42001 Clauses: ${iso42001ClausesData.length}
  - ISO 42001 Subclauses: ${iso42001SubclausesData.length}
  - ISO 42001 Annex Categories: ${iso42001AnnexCategoriesData.length}
  - ISO 42001 Annex Items: ${iso42001AnnexItemsData.length}
  - UAE AI Controls: ${uaeAiControls.length}
    `);

  } catch (error) {
    console.error('❌ Error seeding framework data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export default main;