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

// EU AI Act Topics Data (14 topics)
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

// EU AI Act Subtopics Data (19 subtopics)
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

// Complete EU AI Act Questions Data (65+ questions)
const euAiActQuestionsData = [
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

  // Topic 4.1 - AI Model Capability Assessment
  { questionId: '4.1.1', question: 'What is the source of the model being used?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '4.1' },
  { questionId: '4.1.2', question: 'What is your strategy for validating the model?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '4.1' },
  { questionId: '4.1.3', question: 'How is your organization documenting AI performance in the training environment?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '4.1' },

  // Topic 5.1 - AI Model Capability Assessment (Record Keeping)
  { questionId: '5.1.1', question: 'What performance criteria have been established for the AI application?', priority: 'Medium', answerType: 'Long text', orderIndex: 1, subtopicId: '5.1' },
  { questionId: '5.1.2', question: 'Describe the policies and procedures in place for retaining automatically generated logs', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '5.1' },
  { questionId: '5.1.3', question: 'How has your organization tested the model\'s performance on extreme values and protected attributes?', priority: 'Medium', answerType: 'Long text', orderIndex: 3, subtopicId: '5.1' },
  { questionId: '5.1.4', question: 'What patterns of failure have been identified in the model?', priority: 'Medium', answerType: 'Long text', orderIndex: 4, subtopicId: '5.1' },

  // Topic 6.1 - User Notification of AI System Use
  { questionId: '6.1.1', question: 'Have users been adequately trained on the appropriate usage of the AI system?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '6.1' },
  { questionId: '6.1.2', question: 'In what ways has your organization communicated these AI-related values externally?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '6.1' },
  { questionId: '6.1.3', question: 'If the AI system performs automated decision-making using personal data, is there meaningful information provided?', priority: 'Medium', answerType: 'Long text', orderIndex: 3, subtopicId: '6.1' },
  { questionId: '6.1.4', question: 'Is it clear to end users what the consequences are of decision making by the AI?', priority: 'Medium', answerType: 'Long text', orderIndex: 4, subtopicId: '6.1' },

  // Topic 7.1 - Oversight Documentation
  { questionId: '7.1.1', question: 'How is the supervision of the AI system designed to ensure human oversight?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '7.1' },
  { questionId: '7.1.2', question: 'How is the effectiveness of human oversight ensured?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '7.1' },
  { questionId: '7.1.3', question: 'What is your organization\'s strategy for conducting periodic reviews of the AI application?', priority: 'Medium', answerType: 'Long text', orderIndex: 3, subtopicId: '7.1' },

  // Topic 7.2 - Human Intervention Mechanisms
  { questionId: '7.2.1', question: 'How is human oversight empowered to stop or alter the AI system\'s operations?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '7.2' },
  { questionId: '7.2.2', question: 'To what extent is human deliberation replaced by automated systems?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '7.2' },

  // Topic 8.1 - System Validation and Reliability Documentation
  { questionId: '8.1.1', question: 'What is your strategy for testing the model?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '8.1' },
  { questionId: '8.1.2', question: 'How will the AI system be served to end-users?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '8.1' },

  // Topic 8.2 - AI System Change Documentation
  { questionId: '8.2.1', question: 'What monitoring systems will be in place to track the AI system\'s performance?', priority: 'Medium', answerType: 'Long text', orderIndex: 1, subtopicId: '8.2' },
  { questionId: '8.2.2', question: 'Are the details of the cloud provider and secure deployment architecture clearly defined?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '8.2' },
  { questionId: '8.2.3', question: 'How will your organization detect and address risks associated with changing data quality?', priority: 'Medium', answerType: 'Long text', orderIndex: 3, subtopicId: '8.2' },

  // Topic 9.1 - EU Database Registration
  { questionId: '9.1.1', question: 'How has your organization defined and documented the set of values that guide the development and deployment of AI systems?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '9.1' },
  { questionId: '9.1.2', question: 'What governance framework has your organization implemented for AI projects?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '9.1' },
  { questionId: '9.1.3', question: 'Internal regular schedule of self-assessment and certification', priority: 'Medium', answerType: 'Long text', orderIndex: 3, subtopicId: '9.1' },

  // Topic 10.1 - Post-Market Monitoring by Providers
  { questionId: '10.1.1', question: 'What processes have been established for users of the AI system to raise concerns?', priority: 'Medium', answerType: 'Long text', orderIndex: 1, subtopicId: '10.1' },
  { questionId: '10.1.2', question: 'What is your organization\'s problem-to-resolution process for issues?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '10.1' },
  { questionId: '10.1.3', question: 'How will your organization update the AI application on an ongoing basis?', priority: 'Medium', answerType: 'Long text', orderIndex: 3, subtopicId: '10.1' },

  // Topic 11.1 - Bias and Fairness Evaluation
  { questionId: '11.1.1', question: 'What measures have been undertaken to address bias in the AI system\'s training data?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '11.1' },
  { questionId: '11.1.2', question: 'Are there specific groups that are favored or disadvantaged?', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '11.1' },
  { questionId: '11.1.3', question: 'Is your user base comprised of individuals or groups from vulnerable populations?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '11.1' },

  // Topic 12.1 - System Information Documentation
  { questionId: '12.1.1', question: 'Who in your organization is responsible for ensuring and demonstrating that AI systems adhere to defined organizational values?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '12.1' },
  { questionId: '12.1.2', question: 'Are the inputs and outputs of the AI system logged?', priority: 'Medium', answerType: 'Long text', orderIndex: 2, subtopicId: '12.1' },
  { questionId: '12.1.3', question: 'To what extent does the deployment of AI influence legal certainty and civil liberties?', priority: 'High', answerType: 'Long text', orderIndex: 3, subtopicId: '12.1' },
  { questionId: '12.1.4', question: 'What strategies has your organization developed to address the risks associated with decommissioning the AI system?', priority: 'Medium', answerType: 'Long text', orderIndex: 4, subtopicId: '12.1' },

  // Topic 13.1 - Transparency Obligations
  { questionId: '13.1.1', question: 'What are the primary objectives of your AI application?', priority: 'High', answerType: 'Long text', orderIndex: 1, subtopicId: '13.1' },
  { questionId: '13.1.2', question: 'Provide the high-level business process logic of the AI system', priority: 'High', answerType: 'Long text', orderIndex: 2, subtopicId: '13.1' },
  { questionId: '13.1.3', question: 'To what extent can the operation of the application/algorithm be explained to end users?', priority: 'Medium', answerType: 'Long text', orderIndex: 3, subtopicId: '13.1' },

  // Topic 14.1 - Environmental Impact Assessment
  { questionId: '14.1.1', question: 'How has your organization assessed the overall environmental impact of this AI application?', priority: 'Low', answerType: 'Long text', orderIndex: 1, subtopicId: '14.1' },
  { questionId: '14.1.2', question: 'What are the environmental effects of the AI application?', priority: 'Low', answerType: 'Long text', orderIndex: 2, subtopicId: '14.1' }
];

// Additional Control Categories for complete coverage (13 categories)
const additionalControlCategories = [
  { categoryId: '6', title: 'Risk Management', description: 'Establish comprehensive risk management frameworks.', orderIndex: 6 },
  { categoryId: '7', title: 'Data Governance', description: 'Implement data governance controls for AI systems.', orderIndex: 7 },
  { categoryId: '8', title: 'Technical Documentation', description: 'Maintain technical documentation and standards.', orderIndex: 8 },
  { categoryId: '9', title: 'Accuracy and Robustness', description: 'Ensure accuracy and robustness of AI systems.', orderIndex: 9 },
  { categoryId: '10', title: 'Cybersecurity', description: 'Implement cybersecurity measures for AI systems.', orderIndex: 10 },
  { categoryId: '11', title: 'Bias Monitoring', description: 'Monitor and mitigate bias in AI systems.', orderIndex: 11 },
  { categoryId: '12', title: 'Explainability', description: 'Ensure explainability and interpretability of AI systems.', orderIndex: 12 },
  { categoryId: '13', title: 'Post-Market Monitoring', description: 'Monitor AI systems after deployment.', orderIndex: 13 }
];

// Additional Control Structures for complete coverage
const additionalControlStructures = [
  { controlId: '2.5', title: 'Dataset Description', description: 'Describe training, validation, and testing datasets', orderIndex: 5, categoryId: '2' },
  { controlId: '2.6', title: 'Mitigation Strategies and Bias Testing', description: 'Explain mitigation strategies and bias testing results', orderIndex: 6, categoryId: '2' },
  { controlId: '2.7', title: 'AI System Accuracy and Security Information', description: 'Provide accuracy metrics, robustness, and cybersecurity information', orderIndex: 7, categoryId: '2' },
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

// Additional Subcontrol Structures for complete coverage
const additionalSubcontrolStructures = [
  { subcontrolId: '2.5.1', title: 'Dataset Documentation', description: 'We describe training, validation, and testing datasets used', orderIndex: 1, controlId: '2.5' },
  { subcontrolId: '2.6.1', title: 'Mitigation Strategies', description: 'We explain mitigation strategies and bias testing results', orderIndex: 1, controlId: '2.6' },
  { subcontrolId: '2.7.1', title: 'Accuracy and Security Information', description: 'We provide accuracy metrics, robustness, and cybersecurity information', orderIndex: 1, controlId: '2.7' },
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

async function seedCompleteEuAiActData() {
  console.log('🌱 Seeding Complete EU AI Act Framework Data...\n');

  try {
    // Seed Topics
    console.log('📋 Seeding EU AI Act Topics...');
    for (const topic of euAiActTopicsData) {
      await prisma.euAiActTopic.upsert({
        where: { topicId: topic.topicId },
        update: topic,
        create: topic,
      });
    }
    console.log(`✅ Processed ${euAiActTopicsData.length} topics`);

    // Seed Subtopics
    console.log('📝 Seeding EU AI Act Subtopics...');
    for (const subtopic of euAiActSubtopicsData) {
      await prisma.euAiActSubtopic.upsert({
        where: { subtopicId: subtopic.subtopicId },
        update: subtopic,
        create: subtopic,
      });
    }
    console.log(`✅ Processed ${euAiActSubtopicsData.length} subtopics`);

    // Seed Questions
    console.log('❓ Seeding EU AI Act Questions...');
    for (const question of euAiActQuestionsData) {
      await prisma.euAiActQuestion.upsert({
        where: { questionId: question.questionId },
        update: question,
        create: question,
      });
    }
    console.log(`✅ Processed ${euAiActQuestionsData.length} questions`);

    // Seed Additional Control Categories
    console.log('🏗️ Seeding Additional Control Categories...');
    for (const category of additionalControlCategories) {
      await prisma.euAiActControlCategory.upsert({
        where: { categoryId: category.categoryId },
        update: category,
        create: category,
      });
    }
    console.log(`✅ Processed ${additionalControlCategories.length} additional control categories`);

    // Seed Additional Control Structures
    console.log('🎯 Seeding Additional Control Structures...');
    for (const control of additionalControlStructures) {
      await prisma.euAiActControlStruct.upsert({
        where: { controlId: control.controlId },
        update: control,
        create: control,
      });
    }
    console.log(`✅ Processed ${additionalControlStructures.length} additional control structures`);

    // Seed Additional Subcontrol Structures
    console.log('🔧 Seeding Additional Subcontrol Structures...');
    for (const subcontrol of additionalSubcontrolStructures) {
      await prisma.euAiActSubcontrolStruct.upsert({
        where: { subcontrolId: subcontrol.subcontrolId },
        update: subcontrol,
        create: subcontrol,
      });
    }
    console.log(`✅ Processed ${additionalSubcontrolStructures.length} additional subcontrol structures`);

    // Final verification
    console.log('\n📊 Final Verification Results:');
    const topics = await prisma.euAiActTopic.count();
    const subtopics = await prisma.euAiActSubtopic.count();
    const questions = await prisma.euAiActQuestion.count();
    const categories = await prisma.euAiActControlCategory.count();
    const controls = await prisma.euAiActControlStruct.count();
    const subcontrols = await prisma.euAiActSubcontrolStruct.count();
    
    console.log(`Topics: ${topics}`);
    console.log(`Subtopics: ${subtopics}`);
    console.log(`Questions: ${questions}`);
    console.log(`Control Categories: ${categories}`);
    console.log(`Controls: ${controls}`);
    console.log(`Subcontrols: ${subcontrols}`);

    console.log('\n🎉 Complete EU AI Act Framework data seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding EU AI Act data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedCompleteEuAiActData();
}

export default seedCompleteEuAiActData;