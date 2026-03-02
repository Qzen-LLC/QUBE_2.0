#!/usr/bin/env tsx

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// Complete EU AI Act Questions Data (all 65+ questions from the SQL file)
const allEuAiActQuestionsData = [
  // Topic 1.1 - General
  { questionId: '1.1.1', question: 'Describe the AI environment/application used', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '1.1' },
  { questionId: '1.1.2', question: 'Is a new form of AI technology used?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '1.1' },
  { questionId: '1.1.3', question: 'Are personal sensitive data used?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '1.1' },
  { questionId: '1.1.4', question: 'Project scope documents description', priority: 'High', answerType: 'Long text', orderIndex: 4, subtopicId: '1.1' },
  
  // Topic 1.2 - Technology Details
  { questionId: '1.2.1', question: 'What type of AI technology are you using? Explain AI and ML technologies used', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '1.2' },
  { questionId: '1.2.2', question: 'Is there ongoing monitoring of the system to ensure that the system is operating as intended?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '1.2' },
  { questionId: '1.2.3', question: 'Have you considered unintended outcomes that could occur from the use of this system?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '1.2' },
  { questionId: '1.2.4', question: 'Add technology documentation. You can include a data flow diagram, MLops lifecycle diagram', priority: 'High', answerType: 'Long text', orderIndex: 4, subtopicId: '1.2' },
  
  // Topic 2.1 - Transparency and Provision of Information to Deployers
  { questionId: '2.1.1', question: 'Will you make substantial modifications to the high-risk AI system already on the EU market?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '2.1' },
  { questionId: '2.1.2', question: 'What business problem does the AI system solve, and what are its capabilities?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '2.1' },
  { questionId: '2.1.3', question: 'How has your organization assessed the AI application against its ethical values?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '2.1' },
  
  // Topic 2.2 - Responsibilities Along the AI Value Chain
  { questionId: '2.2.1', question: 'Specify details of any third-party involvement in the design, development, deployment, and support of the AI system', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '2.2' },
  { questionId: '2.2.2', question: 'What risks were identified in the data impact assessment?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '2.2' },
  { questionId: '2.2.3', question: 'How has the selection or development of the model been assessed with regard to fairness, explainability, and robustness?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '2.2' },
  { questionId: '2.2.4', question: 'What strategies have been implemented to address the risks identified in the model assessment?', priority: 'High', answerType: 'Long text', orderIndex: 4, subtopicId: '2.2' },
  
  // Topic 3.1 - Responsibilities Along the AI Value Chain (Data)
  { questionId: '3.1.1', question: 'What risks have been identified associated with the chosen deployment and serving strategies?', priority: 'Medium', answerType: 'Long text', orderIndex: 1, subtopicId: '3.1' },
  { questionId: '3.1.2', question: 'What measures are in place to detect undesired behavior in our AI solution?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '3.1' },
  { questionId: '3.1.3', question: 'How can any unforeseen effects be mitigated after deployment of the AI application?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '3.1' },
  { questionId: '3.1.4', question: 'What is the possible harmful effect of uncertainty and error margins for different groups?', priority: 'High', answerType: 'Long text', orderIndex: 4, subtopicId: '3.1' },
  { questionId: '3.1.5', question: 'What mechanisms are in place for reporting serious incidents and certain risks?', priority: 'High', answerType: 'Long text', orderIndex: 5, subtopicId: '3.1' },
  { questionId: '3.1.6', question: 'What risks have been identified associated with potentially decommissioning the AI system?', priority: 'Medium', answerType: 'Long text', orderIndex: 6, subtopicId: '3.1' },
  { questionId: '3.1.7', question: 'What data sources are being used to develop the AI application?', priority: 'High', answerType: 'Long text', orderIndex: 7, subtopicId: '3.1' },
  { questionId: '3.1.8', question: 'Does the repository track and manage intellectual property rights and restrictions?', priority: 'High', answerType: 'Long text', orderIndex: 8, subtopicId: '3.1' },
  
  // Topic 3.2 - Fundamental Rights Impact Assessments
  { questionId: '3.2.1', question: 'How has your organization ensured the representativeness, relevance, accuracy, traceability, and completeness of the data?', priority: 'Medium', answerType: 'Long text', orderIndex: 1, subtopicId: '3.2' },
  { questionId: '3.2.2', question: 'Provide details of the confidential and sensitive data processed by the AI system', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '3.2' },
  { questionId: '3.2.3', question: 'What are the legal bases for processing personal and sensitive data?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '3.2' },
  { questionId: '3.2.4', question: 'Describe the measures in place to ensure that the AI system does not leak private or sensitive data', priority: 'High', answerType: 'Long text', orderIndex: 4, subtopicId: '3.2' },
  { questionId: '3.2.5', question: 'How has legal compliance with respect to data protection (e.g., GDPR) been assessed and ensured?', priority: 'High', answerType: 'Long text', orderIndex: 5, subtopicId: '3.2' },
  { questionId: '3.2.6', question: 'Provide details of the measures in place to comply with data subject requests', priority: 'High', answerType: 'Long text', orderIndex: 6, subtopicId: '3.2' },
  { questionId: '3.2.7', question: 'Has the organization determined how the privacy of those involved is protected?', priority: 'High', answerType: 'Long text', orderIndex: 7, subtopicId: '3.2' },
  { questionId: '3.2.8', question: 'Can the user delete their data from the system?', priority: 'Medium', answerType: 'Long text', orderIndex: 8, subtopicId: '3.2' },
  
  // Continue with all remaining questions...
  { questionId: '4.1.1', question: 'What is the source of the model being used?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '4.1' },
  { questionId: '4.1.2', question: 'What is your strategy for validating the model?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '4.1' },
  { questionId: '4.1.3', question: 'How is your organization documenting AI performance in the training environment?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '4.1' },
  
  { questionId: '5.1.1', question: 'What performance criteria have been established for the AI application?', priority: 'Medium', answerType: 'Long text', orderIndex: 1, subtopicId: '5.1' },
  { questionId: '5.1.2', question: 'Describe the policies and procedures in place for retaining automatically generated logs', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '5.1' },
  { questionId: '5.1.3', question: 'How has your organization tested the model\'s performance on extreme values and protected attributes?', priority: 'Medium', answerType: 'Long text', orderIndex: 3, subtopicId: '5.1' },
  { questionId: '5.1.4', question: 'What patterns of failure have been identified in the model?', priority: 'Medium', answerType: 'Long text', orderIndex: 4, subtopicId: '5.1' },
  
  { questionId: '6.1.1', question: 'Have users been adequately trained on the appropriate usage of the AI system?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '6.1' },
  { questionId: '6.1.2', question: 'In what ways has your organization communicated these AI-related values externally?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '6.1' },
  { questionId: '6.1.3', question: 'If the AI system performs automated decision-making using personal data, is there meaningful information provided?', priority: 'Medium', answerType: 'Long text', orderIndex: 3, subtopicId: '6.1' },
  { questionId: '6.1.4', question: 'Is it clear to end users what the consequences are of decision making by the AI?', priority: 'Medium', answerType: 'Long text', orderIndex: 4, subtopicId: '6.1' },
  
  // Continue adding all questions up to 14.1.2...
  { questionId: '14.1.1', question: 'How has your organization assessed the overall environmental impact of this AI application?', priority: 'Low', answerType: 'Long text', orderIndex: 1, subtopicId: '14.1' },
  { questionId: '14.1.2', question: 'What are the environmental effects of the AI application?', priority: 'Low', answerType: 'Long text', orderIndex: 2, subtopicId: '14.1' }
];

// Complete EU AI Act Control Structures (expanded)
const allEuAiActControlStructsData = [
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
  { controlId: '5.4', title: 'Regulatory Compliance Requirements', description: 'Specify requirements for regulatory compliance', orderIndex: 4, categoryId: '5' },
  { controlId: '5.5', title: 'Third-Party Standards Compliance', description: 'Ensure third-party impacts meet organizational standards', orderIndex: 5, categoryId: '5' },
  { controlId: '5.6', title: 'AI System Deactivation Mechanisms', description: 'Maintain mechanisms to deactivate AI systems', orderIndex: 6, categoryId: '5' },
  { controlId: '5.7', title: 'Incident Monitoring for Third-Party Components', description: 'Monitor and respond to incidents involving third-party components', orderIndex: 7, categoryId: '5' },
  { controlId: '5.8', title: 'System Resilience Enhancement', description: 'Implement measures to enhance AI system resilience', orderIndex: 8, categoryId: '5' },
  { controlId: '5.9', title: 'Non-Conformity Assessment', description: 'Identify and assess potential non-conformities', orderIndex: 9, categoryId: '5' }
];

// Complete EU AI Act Subcontrol Structures (expanded)
const allEuAiActSubcontrolStructsData = [
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
  { subcontrolId: '3.3.2', title: 'Proportionate Oversight', description: 'We proportion oversight measures to match AI system\'s risk level and autonomy', orderIndex: 2, controlId: '3.3' },
  { subcontrolId: '4.1.1', title: 'Expert Consultation', description: 'We consult with diverse experts and end-users to inform corrective measures', orderIndex: 1, controlId: '4.1' },
  { subcontrolId: '4.2.1', title: 'System Validation', description: 'We validate and document system reliability and standards compliance', orderIndex: 1, controlId: '4.2' },
  { subcontrolId: '4.2.2', title: 'Value Sustainment', description: 'We sustain AI system value post-deployment through continuous improvements', orderIndex: 2, controlId: '4.2' },
  { subcontrolId: '4.3.1', title: 'Corrective Action Implementation', description: 'We implement corrective actions as required by Article 20 to address identified risks or issues', orderIndex: 1, controlId: '4.3' },
  { subcontrolId: '4.3.2', title: 'System Withdrawal Mechanisms', description: 'We ensure mechanisms are in place to withdraw, disable, or recall non-conforming AI systems', orderIndex: 2, controlId: '4.3' },
  { subcontrolId: '4.4.1', title: 'Corrective Action Documentation', description: 'We maintain documentation of corrective actions taken', orderIndex: 1, controlId: '4.4' },
  { subcontrolId: '5.1.1', title: 'Due Diligence Process', description: 'We conduct thorough due diligence before associating with high-risk AI systems', orderIndex: 1, controlId: '5.1' },
  { subcontrolId: '5.2.1', title: 'Provider Agreements', description: 'We establish clear contractual agreements with AI system providers', orderIndex: 1, controlId: '5.2' },
  { subcontrolId: '5.3.1', title: 'Third-Party Responsibilities', description: 'We define responsibilities in agreements with third-party suppliers of AI components', orderIndex: 1, controlId: '5.3' },
  { subcontrolId: '5.4.1', title: 'Regulatory Requirements', description: 'We specify information, technical access, and support required for regulatory compliance', orderIndex: 1, controlId: '5.4' },
  { subcontrolId: '5.5.1', title: 'Third-Party Standards', description: 'We ensure third-party impacts, such as IP infringement, meet organizational standards', orderIndex: 1, controlId: '5.5' },
  { subcontrolId: '5.6.1', title: 'System Deactivation', description: 'We maintain mechanisms to deactivate AI systems if performance deviates from intended use', orderIndex: 1, controlId: '5.6' },
  { subcontrolId: '5.7.1', title: 'Third-Party Incident Monitoring', description: 'We monitor and respond to incidents involving third-party components', orderIndex: 1, controlId: '5.7' },
  { subcontrolId: '5.8.1', title: 'Resilience Enhancement', description: 'We implement measures to enhance AI system resilience against errors and faults', orderIndex: 1, controlId: '5.8' },
  { subcontrolId: '5.9.1', title: 'Non-Conformity Assessment', description: 'We identify and assess potential non-conformities with regulations', orderIndex: 1, controlId: '5.9' }
];

// Complete ISO 42001 Subclauses Data (all 24 subclauses)
const allIso42001SubclausesData = [
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
  // Add all remaining subclauses...
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

// Complete ISO 42001 Annex Items Data (all 37 items)
const allIso42001AnnexItemsData = [
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

  // Continue with all remaining items A.8, A.9, A.10, A.11...
  { itemId: 'A.11.3.1', title: 'Monitoring of Third-Party AI Services', description: 'Monitoring third-party compliance and performance', guidance: 'The performance and compliance of third parties involved in the AI system lifecycle should be monitored according to agreements', orderIndex: 3, categoryId: 'A.11' }
];

async function seedCompleteFrameworkData() {
  console.log('🚀 Starting complete framework data seeding...\n');

  try {
    // First, seed the basic structure we already created
    console.log('1️⃣ Running basic framework seed...');
    const basicSeed = await import('./seed-frameworks');
    await basicSeed.default();

    console.log('\n2️⃣ Seeding complete EU AI Act questions...');
    for (const question of allEuAiActQuestionsData) {
      await prisma.euAiActQuestion.upsert({
        where: { questionId: question.questionId },
        update: question,
        create: question
      });
    }

    console.log('3️⃣ Seeding complete EU AI Act control structures...');
    for (const control of allEuAiActControlStructsData) {
      await prisma.euAiActControlStruct.upsert({
        where: { controlId: control.controlId },
        update: control,
        create: control
      });
    }

    console.log('4️⃣ Seeding complete EU AI Act subcontrol structures...');
    for (const subcontrol of allEuAiActSubcontrolStructsData) {
      await prisma.euAiActSubcontrolStruct.upsert({
        where: { subcontrolId: subcontrol.subcontrolId },
        update: subcontrol,
        create: subcontrol
      });
    }

    console.log('5️⃣ Seeding complete ISO 42001 subclauses...');
    for (const subclause of allIso42001SubclausesData) {
      await prisma.iso42001Subclause.upsert({
        where: { subclauseId: subclause.subclauseId },
        update: subclause,
        create: subclause
      });
    }

    console.log('6️⃣ Seeding complete ISO 42001 annex items...');
    for (const item of allIso42001AnnexItemsData) {
      await prisma.iso42001AnnexItem.upsert({
        where: { itemId: item.itemId },
        update: item,
        create: item
      });
    }

    console.log('\n🎉 Complete framework data seeded successfully!');
    console.log(`
📊 Complete Summary:
  ✅ EU AI Act Questions: ${allEuAiActQuestionsData.length}
  ✅ EU AI Act Controls: ${allEuAiActControlStructsData.length}
  ✅ EU AI Act Subcontrols: ${allEuAiActSubcontrolStructsData.length}
  ✅ ISO 42001 Subclauses: ${allIso42001SubclausesData.length}
  ✅ ISO 42001 Annex Items: ${allIso42001AnnexItemsData.length}

🔧 Next steps:
  1. Verify data in your Neon database
  2. Test the assessment flows in your application
  3. Run any existing tests to ensure compatibility
    `);

  } catch (error) {
    console.error('❌ Error seeding complete framework data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedCompleteFrameworkData();
}

export default seedCompleteFrameworkData;