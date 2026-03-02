-- EU AI Act Control Categories Population Script for Neon DB (PostgreSQL)
-- This script populates the EU AI Act control framework with 13 categories, controls, and subcontrols

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert Control Categories (13 categories)
INSERT INTO "EuAiActControlCategory" (id, "categoryId", title, description, "orderIndex") VALUES
(uuid_generate_v4(), '1', 'AI Literacy and Responsible AI Training', 'Ensure AI literacy and responsible AI training across the organization.', 1),
(uuid_generate_v4(), '2', 'Transparency and Provision of Information to Deployers', 'Ensure transparency in AI system deployment and information provision.', 2),
(uuid_generate_v4(), '3', 'Human Oversight', 'Establish effective human oversight mechanisms for AI systems.', 3),
(uuid_generate_v4(), '4', 'Corrective Actions and Duty of Information', 'Implement corrective actions and maintain information duties for AI systems.', 4),
(uuid_generate_v4(), '5', 'Responsibilities Along the AI Value Chain', 'Define and manage responsibilities throughout the AI value chain.', 5),
(uuid_generate_v4(), '6', 'Risk Management and Compliance', 'Implement comprehensive risk management and compliance measures for AI systems.', 6),
(uuid_generate_v4(), '7', 'Fundamental Rights Impact Assessment', 'Implement comprehensive fundamental rights impact assessments for AI systems.', 7),
(uuid_generate_v4(), '8', 'Transparency Obligations', 'Implement transparency obligations for AI systems under the EU AI Act.', 8),
(uuid_generate_v4(), '9', 'Registration and Conformity Assessment', 'Implement registration requirements and conformity assessments under the EU AI Act.', 9),
(uuid_generate_v4(), '10', 'Regulatory Compliance and Documentation', 'Maintain regulatory compliance and comprehensive documentation for AI systems.', 10),
(uuid_generate_v4(), '11', 'AI Lifecycle Risk Management', 'Implement comprehensive risk management throughout the AI system lifecycle.', 11),
(uuid_generate_v4(), '12', 'Post-Deployment Monitoring and Incident Management', 'Implement comprehensive post-deployment monitoring and incident management for AI systems.', 12),
(uuid_generate_v4(), '13', 'Continuous Monitoring and Incident Response', 'Maintain continuous monitoring and incident response capabilities for AI systems.', 13)
ON CONFLICT ("categoryId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex";

-- Insert Control Structures for Category 1
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '1.1', 'AI Literacy and Responsible AI Training', 'Establish AI literacy and responsible AI training programs', 1, '1'),
(uuid_generate_v4(), '1.2', 'Regulatory Training and Response Procedures', 'Establish regulatory training and response procedures', 2, '1')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 1
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '1.1.1', 'Executive Leadership Responsibility', 'We ensure executive leadership takes responsibility for decisions related to AI risks', 1, '1.1'),
(uuid_generate_v4(), '1.1.2', 'AI Literacy Training', 'We provide AI literacy and ethics training to relevant personnel', 2, '1.1'),
(uuid_generate_v4(), '1.1.3', 'Communication Plan', 'We develop a clear and concise communication plan for informing workers about the use of high-risk AI systems', 3, '1.1'),
(uuid_generate_v4(), '1.2.1', 'Roles and Responsibilities', 'We clearly define roles and responsibilities related to AI risk management', 1, '1.2'),
(uuid_generate_v4(), '1.2.2', 'Regulatory Training', 'We train personnel on the requirements of the regulation and the process for responding to requests', 2, '1.2')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 2
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '2.1', 'Intended Use Description', 'Provide detailed descriptions of AI system intended use', 1, '2'),
(uuid_generate_v4(), '2.2', 'Technical Documentation Review', 'Review and verify technical documentation', 2, '2'),
(uuid_generate_v4(), '2.3', 'Record Maintenance of AI System Activities', 'Maintain accurate records of AI system activities', 3, '2'),
(uuid_generate_v4(), '2.4', 'System Information Documentation', 'Document system information comprehensively', 4, '2')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 2
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '2.1.1', 'Intended Use Documentation', 'We provide detailed descriptions of the AI system''s intended use', 1, '2.1'),
(uuid_generate_v4(), '2.2.1', 'Documentation Review', 'We review and verify technical documentation from providers', 1, '2.2'),
(uuid_generate_v4(), '2.3.1', 'Activity Records', 'We maintain accurate records of all AI system activities, including modifications and third-party involvements', 1, '2.3'),
(uuid_generate_v4(), '2.4.1', 'System Information', 'We document system information, including functionality, limitations, and risk controls', 1, '2.4'),
(uuid_generate_v4(), '2.4.2', 'Forbidden Uses', 'We define and document forbidden uses and foresee potential misuse', 2, '2.4')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 3
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '3.1', 'Human Intervention Mechanisms', 'Define mechanisms for human intervention in AI operations', 1, '3'),
(uuid_generate_v4(), '3.2', 'Oversight Documentation', 'Document oversight processes and limitations', 2, '3')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 3
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '3.1.1', 'Intervention Mechanisms', 'We define mechanisms for human intervention or override of AI outputs', 1, '3.1'),
(uuid_generate_v4(), '3.1.2', 'Competent Oversight', 'We assign competent individuals with authority to oversee AI system usage', 2, '3.1'),
(uuid_generate_v4(), '3.1.3', 'Oversight Alignment', 'We align oversight measures with provider''s instructions for use', 3, '3.1'),
(uuid_generate_v4(), '3.2.1', 'Limitation Documentation', 'We document system limitations and human oversight options', 1, '3.2'),
(uuid_generate_v4(), '3.2.2', 'Appeal Processes', 'We establish appeal processes related to AI system decisions', 2, '3.2')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 4
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '4.1', 'Risk Mitigation Procedures', 'Establish procedures for risk mitigation when serious incidents occur', 1, '4'),
(uuid_generate_v4(), '4.2', 'Information Duties', 'Maintain information duties to relevant parties', 2, '4')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 4
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '4.1.1', 'Risk Mitigation', 'We have procedures to mitigate risks when serious incidents or malfunctions occur', 1, '4.1'),
(uuid_generate_v4(), '4.1.2', 'System Suspension', 'We can suspend AI system operation when risks cannot be mitigated', 2, '4.1'),
(uuid_generate_v4(), '4.2.1', 'Provider Notification', 'We inform providers about serious incidents or malfunctions', 1, '4.2'),
(uuid_generate_v4(), '4.2.2', 'Authority Notification', 'We notify relevant authorities of serious incidents as required', 2, '4.2')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 5
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '5.1', 'Value Chain Responsibilities', 'Clearly define responsibilities across the AI value chain', 1, '5'),
(uuid_generate_v4(), '5.2', 'Provider Cooperation', 'Maintain cooperation with AI system providers', 2, '5')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 5
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '5.1.1', 'Responsibility Documentation', 'We document responsibilities of all parties in the AI value chain', 1, '5.1'),
(uuid_generate_v4(), '5.1.2', 'Contractual Agreements', 'We establish clear contractual agreements defining roles and responsibilities', 2, '5.1'),
(uuid_generate_v4(), '5.2.1', 'Provider Cooperation', 'We cooperate with providers for compliance and risk management', 1, '5.2'),
(uuid_generate_v4(), '5.2.2', 'Information Sharing', 'We share relevant information with providers about system use and performance', 2, '5.2')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 6
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '6.1', 'AI Act Compliance Policies and Guidelines', 'Establish policies and guidelines for EU AI Act compliance', 1, '6'),
(uuid_generate_v4(), '6.2', 'AI Risk Response Planning', 'Plan and implement responses to AI system risks', 2, '6'),
(uuid_generate_v4(), '6.3', 'Compliance with AI System Instructions', 'Ensure compliance with AI system instructions for use', 3, '6'),
(uuid_generate_v4(), '6.4', 'System Risk Controls Documentation', 'Document and manage system risk controls comprehensively', 4, '6'),
(uuid_generate_v4(), '6.5', 'Transparency and Explainability Evaluation', 'Ensure transparency and explainability of AI systems', 5, '6'),
(uuid_generate_v4(), '6.6', 'AI Model Explainability', 'Maintain explainability and documentation of AI models', 6, '6'),
(uuid_generate_v4(), '6.7', 'Technical Documentation Maintenance', 'Maintain up-to-date technical documentation', 7, '6'),
(uuid_generate_v4(), '6.8', 'Data Assessment and Validation', 'Assess and validate input data quality', 8, '6'),
(uuid_generate_v4(), '6.9', 'AI System Logging Implementation', 'Implement comprehensive logging for AI systems', 9, '6')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 6
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '6.1.1', 'Roles and Responsibilities Documentation', 'We document roles, responsibilities, and communication lines for AI risk management', 1, '6.1'),
(uuid_generate_v4(), '6.1.2', 'Compliance Policies Development', 'We develop policies and guidelines for AI Act compliance', 2, '6.1'),
(uuid_generate_v4(), '6.2.1', 'Risk Response Planning', 'We plan responses to AI system risks, including defining risk tolerance and mitigation strategies', 1, '6.2'),
(uuid_generate_v4(), '6.3.1', 'Technical and Organizational Measures', 'We implement technical and organizational measures to adhere to AI system instructions for use', 1, '6.3'),
(uuid_generate_v4(), '6.3.2', 'System Evaluation', 'We regularly evaluate safety, transparency, accountability, security, and resilience of AI systems', 2, '6.3'),
(uuid_generate_v4(), '6.4.1', 'Legal Review', 'We conduct thorough legal reviews relevant to AI system deployment', 1, '6.4'),
(uuid_generate_v4(), '6.4.2', 'Risk Prioritization', 'We prioritize risk responses based on impact, likelihood, and resources', 2, '6.4'),
(uuid_generate_v4(), '6.4.3', 'Residual Risk Identification', 'We identify residual risks to users and stakeholders', 3, '6.4'),
(uuid_generate_v4(), '6.4.4', 'Deployment Decision Evaluation', 'We evaluate if AI systems meet objectives and decide on deployment continuation', 4, '6.4'),
(uuid_generate_v4(), '6.4.5', 'Cybersecurity Controls', 'We implement cybersecurity controls to protect AI models', 5, '6.4'),
(uuid_generate_v4(), '6.4.6', 'Risk Controls Documentation', 'We document system risk controls, including third-party components', 6, '6.4'),
(uuid_generate_v4(), '6.5.1', 'Compliance Updates', 'We regularly update compliance measures based on system or regulatory changes', 1, '6.5'),
(uuid_generate_v4(), '6.6.1', 'Model Explanation and Repository', 'We explain AI models to ensure responsible use and maintain an AI systems repository', 1, '6.6'),
(uuid_generate_v4(), '6.7.1', 'Documentation Updates', 'We maintain and update technical documentation reflecting system changes', 1, '6.7'),
(uuid_generate_v4(), '6.8.1', 'Data Relevance Assessment', 'We assess input data relevance and representativeness', 1, '6.8'),
(uuid_generate_v4(), '6.9.1', 'Automatic Logging', 'We implement automatic logging of AI system operations and retain logs appropriately', 1, '6.9')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 7
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '7.1', 'Fundamental Rights Impact Assessment Process Development', 'Develop comprehensive processes for fundamental rights impact assessments', 1, '7'),
(uuid_generate_v4(), '7.2', 'AI System Usage Process Description', 'Document AI system usage processes and intended purposes', 2, '7'),
(uuid_generate_v4(), '7.3', 'Impacted Groups Identification', 'Identify all groups potentially affected by AI systems', 3, '7'),
(uuid_generate_v4(), '7.4', 'Data Assessment', 'Assess data compliance with legal frameworks', 4, '7'),
(uuid_generate_v4(), '7.5', 'Impact Measurement Strategy', 'Develop strategies for measuring AI system impacts', 5, '7'),
(uuid_generate_v4(), '7.6', 'Bias and Fairness Evaluation', 'Evaluate bias, fairness, and other critical issues', 6, '7'),
(uuid_generate_v4(), '7.7', 'Risk Documentation', 'Document risks to health, safety, and fundamental rights', 7, '7'),
(uuid_generate_v4(), '7.8', 'Assessment Documentation Maintenance', 'Maintain comprehensive assessment documentation', 8, '7'),
(uuid_generate_v4(), '7.9', 'Assessment Integration', 'Integrate assessments with existing data protection frameworks', 9, '7'),
(uuid_generate_v4(), '7.10', 'Dataset Documentation and Evaluation', 'Document datasets and ensure representative evaluations', 10, '7')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 7
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '7.1.1', 'Assessment Process Development', 'We develop a comprehensive process for fundamental rights impact assessments', 1, '7.1'),
(uuid_generate_v4(), '7.2.1', 'Usage Process Documentation', 'We describe deployer processes for using high-risk AI systems, outlining intended purposes', 1, '7.2'),
(uuid_generate_v4(), '7.3.1', 'Affected Groups Identification', 'We identify all natural persons and groups potentially affected by AI system usage', 1, '7.3'),
(uuid_generate_v4(), '7.4.1', 'Legal Data Assessment', 'We assess data used by AI systems based on legal definitions (e.g., GDPR Article 3 (32))', 1, '7.4'),
(uuid_generate_v4(), '7.5.1', 'Impact Measurement Development', 'We create and periodically re-evaluate strategies for measuring AI system impacts', 1, '7.5'),
(uuid_generate_v4(), '7.6.1', 'Comprehensive Evaluation', 'We regularly evaluate bias, fairness, privacy, and environmental issues related to AI systems', 1, '7.6'),
(uuid_generate_v4(), '7.7.1', 'Risk Documentation Process', 'We document known or foreseeable risks to health, safety, or fundamental rights', 1, '7.7'),
(uuid_generate_v4(), '7.8.1', 'Documentation Maintenance', 'We maintain assessment documentation, including dates, results, and actions taken', 1, '7.8'),
(uuid_generate_v4(), '7.9.1', 'DPIA Integration', 'We integrate fundamental rights impact assessments with existing data protection assessments', 1, '7.9'),
(uuid_generate_v4(), '7.10.1', 'Dataset Specification', 'We specify input data and details about training, validation, and testing datasets', 1, '7.10'),
(uuid_generate_v4(), '7.10.2', 'Human Subject Evaluation', 'We ensure representative evaluations when using human subjects', 2, '7.10')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 8
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '8.1', 'User Notification of AI System Use', 'Design AI systems to clearly notify users of AI interaction', 1, '8'),
(uuid_generate_v4(), '8.2', 'Clear AI Indication for Users', 'Ensure clear communication when users are subject to AI systems', 2, '8'),
(uuid_generate_v4(), '8.3', 'AI System Scope and Impact Definition', 'Define and document AI system scope, goals, and impacts', 3, '8'),
(uuid_generate_v4(), '8.4', 'AI System Activity Records', 'Maintain comprehensive records of AI system activities', 4, '8')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 8
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '8.1.1', 'AI Interaction Design', 'We design AI systems to clearly indicate user interaction with AI', 1, '8.1'),
(uuid_generate_v4(), '8.2.1', 'User Information', 'We inform users when they are subject to AI system usage', 1, '8.2'),
(uuid_generate_v4(), '8.2.2', 'Clear Communication', 'We ensure AI indications are clear and understandable for reasonably informed users', 2, '8.2'),
(uuid_generate_v4(), '8.3.1', 'Scope and Impact Documentation', 'We define and document AI system scope, goals, methods, and potential impacts', 1, '8.3'),
(uuid_generate_v4(), '8.4.1', 'Activity Record Maintenance', 'We maintain accurate records of AI system activities, modifications, and third-party involvements', 1, '8.4')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 9
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '9.1', 'EU Database Registration', 'Complete conformity assessment and CE marking requirements', 1, '9'),
(uuid_generate_v4(), '9.2', 'EU Database System Registration', 'Ensure AI systems are registered in the EU database', 2, '9'),
(uuid_generate_v4(), '9.3', 'Technical Standards Identification', 'Identify necessary technical standards and certifications', 3, '9'),
(uuid_generate_v4(), '9.4', 'Common Specifications Compliance', 'Comply with Commission-established specifications', 4, '9'),
(uuid_generate_v4(), '9.5', 'Registration Records Management', 'Maintain records of registration activities', 5, '9'),
(uuid_generate_v4(), '9.6', 'Database Entry Management', 'Ensure accurate and timely database entries', 6, '9'),
(uuid_generate_v4(), '9.7', 'Registration Information Maintenance', 'Maintain current registration and conformity documentation', 7, '9')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 9
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '9.1.1', 'Conformity Assessment Procedures', 'We complete the relevant conformity assessment procedures', 1, '9.1'),
(uuid_generate_v4(), '9.1.2', 'CE Marking Verification', 'We verify that high-risk AI systems have the required CE marking', 2, '9.1'),
(uuid_generate_v4(), '9.2.1', 'Article 71 Registration', 'We ensure AI systems are registered in the EU database per Article 71', 1, '9.2'),
(uuid_generate_v4(), '9.3.1', 'Standards and Certifications', 'We identify necessary technical standards and certifications for AI systems', 1, '9.3'),
(uuid_generate_v4(), '9.4.1', 'Commission Specifications', 'We comply with common specifications established by the Commission', 1, '9.4'),
(uuid_generate_v4(), '9.5.1', 'Registration Record Keeping', 'We keep records of all registration activities and updates', 1, '9.5'),
(uuid_generate_v4(), '9.6.1', 'Data Entry Accuracy', 'We ensure timely and accurate data entry into the EU database', 1, '9.6'),
(uuid_generate_v4(), '9.7.1', 'Information Currency', 'We maintain up-to-date registration information and comprehensive conformity documentation', 1, '9.7')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 10
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '10.1', 'Conformity Assessment Engagement', 'Engage with notified bodies or conduct internal assessments', 1, '10'),
(uuid_generate_v4(), '10.2', 'Authority Response Processes', 'Establish processes for responding to authorities', 2, '10'),
(uuid_generate_v4(), '10.3', 'Conformity Documentation Management', 'Maintain comprehensive conformity documentation and records', 3, '10'),
(uuid_generate_v4(), '10.4', 'EU Database Data Entry Timeliness', 'Ensure timely and accurate database entries', 4, '10')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 10
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '10.1.1', 'Assessment Engagement', 'We engage with notified bodies or conduct internal conformity assessments', 1, '10.1'),
(uuid_generate_v4(), '10.2.1', 'Authority Request Response', 'We establish processes to respond to national authority requests', 1, '10.2'),
(uuid_generate_v4(), '10.3.1', 'Conformity Documentation', 'We maintain thorough documentation of AI system conformity', 1, '10.3'),
(uuid_generate_v4(), '10.3.2', 'Registration Records', 'We keep records of registration and any subsequent updates', 2, '10.3'),
(uuid_generate_v4(), '10.4.1', 'Timely Data Entry', 'We ensure timely and accurate data entry into the EU database', 1, '10.4')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 11
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '11.1', 'Impact Measurement Methodology', 'Define methods and tools for measuring AI system impacts', 1, '11'),
(uuid_generate_v4(), '11.2', 'AI System Operations Monitoring', 'Monitor AI system operations according to usage instructions', 2, '11'),
(uuid_generate_v4(), '11.3', 'Error and Incident Response', 'Track and respond to errors and incidents systematically', 3, '11'),
(uuid_generate_v4(), '11.4', 'Expert and User Consultation', 'Consult with experts and end-users for risk management', 4, '11'),
(uuid_generate_v4(), '11.5', 'AI System Change Documentation', 'Document and manage AI system changes and compliance', 5, '11')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 11
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '11.1.1', 'Impact Measurement Definition', 'We define methods and tools for measuring AI system impacts', 1, '11.1'),
(uuid_generate_v4(), '11.2.1', 'Operations Monitoring', 'We monitor AI system operations based on usage instructions', 1, '11.2'),
(uuid_generate_v4(), '11.3.1', 'Error Response Tracking', 'We track and respond to errors and incidents through measurable activities', 1, '11.3'),
(uuid_generate_v4(), '11.4.1', 'Risk Management Consultation', 'We consult with experts and end-users to inform risk management', 1, '11.4'),
(uuid_generate_v4(), '11.5.1', 'Objective Evaluation', 'We continuously evaluate if AI systems meet objectives and decide on ongoing deployment', 1, '11.5'),
(uuid_generate_v4(), '11.5.2', 'Change and Metrics Documentation', 'We document pre-determined changes and performance metrics', 2, '11.5'),
(uuid_generate_v4(), '11.5.3', 'Regulatory Compliance Updates', 'We regularly review and update AI systems to maintain regulatory compliance', 3, '11.5'),
(uuid_generate_v4(), '11.5.4', 'Change Assessment Documentation', 'We ensure that any system changes are documented and assessed for compliance', 4, '11.5')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 12
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '12.1', 'Unexpected Impact Integration', 'Capture and integrate unexpected impact inputs', 1, '12'),
(uuid_generate_v4(), '12.2', 'AI Model Capability Assessment', 'Assess AI model capabilities using appropriate tools', 2, '12'),
(uuid_generate_v4(), '12.3', 'Post-Deployment Incident Monitoring', 'Monitor and respond to incidents after deployment', 3, '12'),
(uuid_generate_v4(), '12.4', 'AI System Logging Implementation', 'Implement comprehensive logging systems for AI operations', 4, '12'),
(uuid_generate_v4(), '12.5', 'Serious Incident Immediate Reporting', 'Ensure immediate reporting of serious incidents to relevant parties', 5, '12')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 12
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '12.1.1', 'Impact Input Integration', 'We implement processes to capture and integrate unexpected impact inputs', 1, '12.1'),
(uuid_generate_v4(), '12.2.1', 'Capability Assessment', 'We assess AI model capabilities using appropriate tools', 1, '12.2'),
(uuid_generate_v4(), '12.3.1', 'Unexpected Risk Planning', 'We develop plans to address unexpected risks as they arise', 1, '12.3'),
(uuid_generate_v4(), '12.3.2', 'Incident Response Monitoring', 'We monitor and respond to incidents post-deployment', 2, '12.3'),
(uuid_generate_v4(), '12.4.1', 'Log Capture and Storage', 'We ensure providers implement systems for capturing and storing AI system logs', 1, '12.4'),
(uuid_generate_v4(), '12.5.1', 'Immediate Incident Reporting', 'We immediately report serious incidents to providers, importers, distributors, and relevant authorities', 1, '12.5')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Insert Control Structures for Category 13
INSERT INTO "EuAiActControlStruct" (id, "controlId", title, description, "orderIndex", "categoryId") VALUES
(uuid_generate_v4(), '13.1', 'Continuous Monitoring Implementation', 'Implement continuous monitoring capabilities for AI systems', 1, '13'),
(uuid_generate_v4(), '13.2', 'Incident Detection and Response', 'Detect and respond to AI system incidents promptly', 2, '13'),
(uuid_generate_v4(), '13.3', 'Performance Monitoring and Assessment', 'Monitor and assess AI system performance continuously', 3, '13'),
(uuid_generate_v4(), '13.4', 'Automated Alert Systems', 'Implement automated systems for AI incident alerts', 4, '13'),
(uuid_generate_v4(), '13.5', 'Incident Documentation and Learning', 'Document incidents and implement learning processes', 5, '13')
ON CONFLICT ("controlId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "categoryId" = EXCLUDED."categoryId";

-- Insert Subcontrol Structures for Category 13
INSERT INTO "EuAiActSubcontrolStruct" (id, "subcontrolId", title, description, "orderIndex", "controlId") VALUES
(uuid_generate_v4(), '13.1.1', 'Monitoring Framework Implementation', 'We implement comprehensive monitoring frameworks for continuous AI system oversight', 1, '13.1'),
(uuid_generate_v4(), '13.2.1', 'Incident Detection Systems', 'We maintain systems to detect AI incidents and anomalies in real-time', 1, '13.2'),
(uuid_generate_v4(), '13.2.2', 'Response Protocol Execution', 'We execute established response protocols when incidents are detected', 2, '13.2'),
(uuid_generate_v4(), '13.3.1', 'Performance Metric Tracking', 'We track key performance metrics for AI systems on an ongoing basis', 1, '13.3'),
(uuid_generate_v4(), '13.3.2', 'Assessment Review Cycles', 'We conduct regular assessment review cycles to evaluate AI system performance', 2, '13.3'),
(uuid_generate_v4(), '13.4.1', 'Automated Alert Configuration', 'We configure automated alert systems for critical AI system events', 1, '13.4'),
(uuid_generate_v4(), '13.5.1', 'Incident Documentation Process', 'We maintain comprehensive documentation of all AI system incidents', 1, '13.5'),
(uuid_generate_v4(), '13.5.2', 'Learning and Improvement', 'We implement learning processes to improve AI systems based on incident analysis', 2, '13.5')
ON CONFLICT ("subcontrolId") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "orderIndex" = EXCLUDED."orderIndex",
  "controlId" = EXCLUDED."controlId";

-- Verification Query - Run this to check the data was inserted correctly
SELECT 
  cc.title as category_title,
  cc."orderIndex" as category_order,
  COUNT(DISTINCT cs."controlId") as control_count,
  COUNT(sc."subcontrolId") as subcontrol_count
FROM "EuAiActControlCategory" cc
LEFT JOIN "EuAiActControlStruct" cs ON cc."categoryId" = cs."categoryId"
LEFT JOIN "EuAiActSubcontrolStruct" sc ON cs."controlId" = sc."controlId"
GROUP BY cc."categoryId", cc.title, cc."orderIndex"
ORDER BY cc."orderIndex";

-- Summary count query
SELECT 
  'Categories' as type, COUNT(*) as count FROM "EuAiActControlCategory"
UNION ALL
SELECT 
  'Controls' as type, COUNT(*) as count FROM "EuAiActControlStruct"
UNION ALL
SELECT 
  'Subcontrols' as type, COUNT(*) as count FROM "EuAiActSubcontrolStruct";