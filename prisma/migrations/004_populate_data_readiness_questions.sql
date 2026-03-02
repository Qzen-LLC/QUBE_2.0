CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Data Readiness Questions
INSERT INTO "QuestionTemplate" (id, text, type, stage, "dataOrderIndex") VALUES
(gen_random_uuid()::text, 'Data Types', 'CHECKBOX', 'DATA_READINESS', 1),
(gen_random_uuid()::text, 'Data Volume', 'RADIO', 'DATA_READINESS', 2),
(gen_random_uuid()::text, 'Growth Rate', 'RADIO', 'DATA_READINESS', 3),
(gen_random_uuid()::text, 'Number of Records', 'RADIO', 'DATA_READINESS', 4),
(gen_random_uuid()::text, 'Primary Data Sources', 'CHECKBOX', 'DATA_READINESS', 5),
(gen_random_uuid()::text, 'Data Quality Score', 'SLIDER', 'DATA_READINESS', 6),
(gen_random_uuid()::text, 'Data Completeness', 'SLIDER', 'DATA_READINESS', 7),
(gen_random_uuid()::text, 'Data Accuracy Confidence', 'SLIDER', 'DATA_READINESS', 8),
(gen_random_uuid()::text, 'Data Freshness', 'RADIO', 'DATA_READINESS', 9),
(gen_random_uuid()::text, 'Data Subject Locations', 'RADIO', 'DATA_READINESS', 10),
(gen_random_uuid()::text, 'Data Storage Locations', 'RADIO', 'DATA_READINESS', 11),
(gen_random_uuid()::text, 'Data Processing Locations', 'RADIO', 'DATA_READINESS', 12),
(gen_random_uuid()::text, 'Cross-Border Data Transfer', 'RADIO', 'DATA_READINESS', 13),
(gen_random_uuid()::text, 'Data Localization Requirements', 'RADIO', 'DATA_READINESS', 14),
(gen_random_uuid()::text, 'Data Retention Period', 'RADIO', 'DATA_READINESS', 15),
(gen_random_uuid()::text, 'Training Data Requirements', 'CHECKBOX', 'DATA_READINESS', 16),
(gen_random_uuid()::text, 'Instruction Clarity Score', 'SLIDER', 'DATA_READINESS', 17),
(gen_random_uuid()::text, 'Response Quality Score', 'SLIDER', 'DATA_READINESS', 18),
(gen_random_uuid()::text, 'Diversity Index', 'SLIDER', 'DATA_READINESS', 19),
(gen_random_uuid()::text, 'Toxicity Score', 'SLIDER', 'DATA_READINESS', 20),
(gen_random_uuid()::text, 'Prompt Engineering', 'CHECKBOX', 'DATA_READINESS', 21),
(gen_random_uuid()::text, 'Knowledge Sources', 'CHECKBOX', 'DATA_READINESS', 22),
(gen_random_uuid()::text, 'Update Strategy', 'RADIO', 'DATA_READINESS', 23),
(gen_random_uuid()::text, 'Fact Verification Process', 'RADIO', 'DATA_READINESS', 24),
(gen_random_uuid()::text, 'Update Frequency', 'RADIO', 'DATA_READINESS', 25),
(gen_random_uuid()::text, 'Version Control', 'RADIO', 'DATA_READINESS', 26);

-- Options for Data Types
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Personal Identifiable Information (PII)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Sensitive Personal Data (race, religion, politics)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Financial Records', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Health/Medical Records', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Biometric Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Location/GPS Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Behavioral Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Communications (emails, messages)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Images/Video of People', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Voice Recordings', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Genetic Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Children''s Data (under 16)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Criminal Records', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Employment Records', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Educational Records', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Publicly Available Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Proprietary Business Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Trade Secrets', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Third-party Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Types' AND qt.stage='DATA_READINESS';

-- Options for Data Volume
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '< 1 GB', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Volume' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '1 GB - 100 GB', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Volume' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '100 GB - 1 TB', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Volume' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '1 TB - 10 TB', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Volume' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '10 TB - 100 TB', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Volume' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '> 100 TB', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Volume' AND qt.stage='DATA_READINESS';

-- Options for Growth Rate
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '< 10%', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Growth Rate' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '10-50%', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Growth Rate' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '50-100%', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Growth Rate' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '100-500%', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Growth Rate' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '> 500%', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Growth Rate' AND qt.stage='DATA_READINESS';

-- Options for Number of Records
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '< 10,000', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Number of Records' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '10,000 - 100,000', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Number of Records' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '100,000 - 1 million', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Number of Records' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '1 million - 10 million', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Number of Records' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '10 million - 100 million', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Number of Records' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '> 100 million', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Number of Records' AND qt.stage='DATA_READINESS';

-- Options for Primary Data Sources
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Internal Databases', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Customer Input Forms', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'IoT Devices/Sensors', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Mobile Applications', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Web Applications', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Third-party APIs', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Public Datasets', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Social Media', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Partner Organizations', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Government Databases', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Purchased Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Web Scraping', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Manual Entry', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Legacy Systems', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cloud Storage', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Edge Devices', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Data Sources' AND qt.stage='DATA_READINESS';

-- Options for Data Freshness
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Real-time (< 1 second)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Freshness' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Near real-time (1-60 seconds)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Freshness' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Micro-batch (1-5 minutes)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Freshness' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Batch (hourly)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Freshness' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Daily', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Freshness' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Weekly or less frequent', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Freshness' AND qt.stage='DATA_READINESS';

-- Options for Data Subject/Storage/Processing Locations (reuse primary sources list as placeholders for locations)
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Internal Databases', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Subject Locations' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Internal Databases', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Storage Locations' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Internal Databases', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Processing Locations' AND qt.stage='DATA_READINESS';

-- Options for Cross-Border Data Transfer
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Yes', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Cross-Border Data Transfer' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'No', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Cross-Border Data Transfer' AND qt.stage='DATA_READINESS';

-- Options for Data Localization Requirements (reuse primary sources list as placeholders for requirement locations)
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Internal Databases', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Localization Requirements' AND qt.stage='DATA_READINESS';

-- Options for Data Retention Period
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '< 30 days', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Retention Period' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '30 days - 1 year', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Retention Period' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '1-3 years', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Retention Period' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '3-7 years', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Retention Period' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '7+ years', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Retention Period' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Indefinite', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Retention Period' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Varies by data type', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Data Retention Period' AND qt.stage='DATA_READINESS';

-- Options for Training Data Requirements
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Instruction Datasets', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Training Data Requirements' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Human Preference Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Training Data Requirements' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Domain-specific Corpus', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Training Data Requirements' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Few-shot Examples', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Training Data Requirements' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Negative Examples', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Training Data Requirements' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Test/Validation Sets', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Training Data Requirements' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Synthetic Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Training Data Requirements' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Reinforcement Learning Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Training Data Requirements' AND qt.stage='DATA_READINESS';

-- Options for Prompt Engineering
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'System Prompts Defined', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Prompt Templates Created', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Few-shot Examples Prepared', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Chain-of-thought Examples', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Output Format Specifications', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Error Handling Prompts', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Safety Prompts', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Context Management', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering' AND qt.stage='DATA_READINESS';

-- Options for Knowledge Sources
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Internal Documentation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'External APIs', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Web Content', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Databases', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Expert Knowledge', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'User Feedback', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Research Papers', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Sources' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Industry Reports', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Sources' AND qt.stage='DATA_READINESS';

-- Options for Update Strategy
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Continuous Learning', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Strategy' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Periodic Retraining', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Strategy' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Manual Updates', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Strategy' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Event-triggered', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Strategy' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Incremental Learning', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Strategy' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Batch Updates', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Strategy' AND qt.stage='DATA_READINESS';

-- Options for Fact Verification Process
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Manual Verification', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Fact Verification Process' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Automated Verification', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Fact Verification Process' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Hybrid Approach', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Fact Verification Process' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Crowdsourced', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Fact Verification Process' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Expert Review', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Fact Verification Process' AND qt.stage='DATA_READINESS';

-- Options for Update Frequency
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Daily', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Frequency' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Weekly', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Frequency' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Monthly', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Frequency' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Quarterly', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Frequency' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Annually', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Frequency' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'As Needed', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Update Frequency' AND qt.stage='DATA_READINESS';

-- Options for Version Control
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Enabled', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Version Control' AND qt.stage='DATA_READINESS';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Disabled', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Version Control' AND qt.stage='DATA_READINESS';


