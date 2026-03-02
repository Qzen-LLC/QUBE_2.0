CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Technical Complexity Level', 'SLIDER', 'TECHNICAL_FEASIBILITY', 1);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Model Type', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 2),
(gen_random_uuid()::text, 'Model Size/Complexity', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 3);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Deployment Model', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 4),
(gen_random_uuid()::text, 'Cloud Providers', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 5),
(gen_random_uuid()::text, 'Compute Requirements', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 6);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Integration Points', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 7),
(gen_random_uuid()::text, 'API Specifications', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 8);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Authentication Methods', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 9),
(gen_random_uuid()::text, 'Encryption Standards', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 10);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Output Type', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 11),
(gen_random_uuid()::text, 'Confidence Scores', 'RADIO', 'TECHNICAL_FEASIBILITY', 12),
(gen_random_uuid()::text, 'Model Update Frequency', 'RADIO', 'TECHNICAL_FEASIBILITY', 13);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Model Providers', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 14),
(gen_random_uuid()::text, 'Specific Models', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 15),
(gen_random_uuid()::text, 'Context Window Requirements', 'RADIO', 'TECHNICAL_FEASIBILITY', 16),
(gen_random_uuid()::text, 'Avg Input Tokens/Request', 'TEXT', 'TECHNICAL_FEASIBILITY', 17),
(gen_random_uuid()::text, 'Avg Output Tokens/Request', 'TEXT', 'TECHNICAL_FEASIBILITY', 18),
(gen_random_uuid()::text, 'Expected Requests/Day', 'TEXT', 'TECHNICAL_FEASIBILITY', 19),
(gen_random_uuid()::text, 'Multimodal Capabilities', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 20),
(gen_random_uuid()::text, 'Response Formats', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 21),
(gen_random_uuid()::text, 'Prompt Engineering Requirements', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 22);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Agent Pattern', 'RADIO', 'TECHNICAL_FEASIBILITY', 23),
(gen_random_uuid()::text, 'Agent Autonomy Level', 'RADIO', 'TECHNICAL_FEASIBILITY', 24),
(gen_random_uuid()::text, 'Memory Requirements', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 25),
(gen_random_uuid()::text, 'Orchestration Pattern', 'RADIO', 'TECHNICAL_FEASIBILITY', 26),
(gen_random_uuid()::text, 'State Management', 'RADIO', 'TECHNICAL_FEASIBILITY', 27);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Vector Databases', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 28),
(gen_random_uuid()::text, 'Embedding Model', 'RADIO', 'TECHNICAL_FEASIBILITY', 29),
(gen_random_uuid()::text, 'Embedding Dimensions', 'TEXT', 'TECHNICAL_FEASIBILITY', 30),
(gen_random_uuid()::text, 'Chunking Strategy', 'RADIO', 'TECHNICAL_FEASIBILITY', 31),
(gen_random_uuid()::text, 'Retrieval Strategies', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 32),
(gen_random_uuid()::text, 'Knowledge Update Frequency', 'RADIO', 'TECHNICAL_FEASIBILITY', 33);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "technicalOrderIndex") VALUES 
(gen_random_uuid()::text, 'Tool Categories', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 34),
(gen_random_uuid()::text, 'Tool Authentication Methods', 'CHECKBOX', 'TECHNICAL_FEASIBILITY', 35),
(gen_random_uuid()::text, 'Execution Environment', 'RADIO', 'TECHNICAL_FEASIBILITY', 36),
(gen_random_uuid()::text, 'Tool Approval Process', 'RADIO', 'TECHNICAL_FEASIBILITY', 37);

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Large Language Model (LLM)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Computer Vision', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Natural Language Processing', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Time Series Forecasting', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Recommendation System', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Classification', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Regression', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Clustering', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Anomaly Detection', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Reinforcement Learning', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Generative AI', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Multi-modal Models', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, 'Custom/Proprietary', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Type' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, '< 1M parameters', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Size/Complexity' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, '1M - 100M parameters', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Size/Complexity' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, '100M - 1B parameters', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Size/Complexity' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, '1B - 10B parameters', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Size/Complexity' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, '10B - 100B parameters', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Size/Complexity' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId")
SELECT gen_random_uuid()::text, '> 100B parameters', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Size/Complexity' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Public Cloud', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Deployment Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Private Cloud', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Deployment Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Hybrid Cloud', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Deployment Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'On-premise', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Deployment Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Edge Computing', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Deployment Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Distributed/Federated', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Deployment Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Multi-cloud', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Deployment Model' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'AWS', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Cloud Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Azure', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Cloud Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Google Cloud', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Cloud Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'IBM Cloud', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Cloud Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Oracle Cloud', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Cloud Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Alibaba Cloud', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Cloud Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Other Regional Providers', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Cloud Providers' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'CPU only', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Compute Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'GPU required', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Compute Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'TPU required', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Compute Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Specialized hardware', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Compute Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Quantum computing', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Compute Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'ERP Systems (SAP, Oracle, etc.)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'CRM Systems (Salesforce, etc.)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Payment Systems', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Banking/Financial Systems', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Healthcare Systems (EHR/EMR)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Supply Chain Systems', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'HR Systems', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Marketing Platforms', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Communication Systems', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'IoT Platforms', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Data Warehouses', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Business Intelligence Tools', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Custom Applications', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Legacy Systems', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Integration Points' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'No API', qt.id FROM "QuestionTemplate" qt WHERE qt.text='API Specifications' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Internal API only', qt.id FROM "QuestionTemplate" qt WHERE qt.text='API Specifications' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Partner API', qt.id FROM "QuestionTemplate" qt WHERE qt.text='API Specifications' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Public API', qt.id FROM "QuestionTemplate" qt WHERE qt.text='API Specifications' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'GraphQL', qt.id FROM "QuestionTemplate" qt WHERE qt.text='API Specifications' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'REST', qt.id FROM "QuestionTemplate" qt WHERE qt.text='API Specifications' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'gRPC', qt.id FROM "QuestionTemplate" qt WHERE qt.text='API Specifications' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'WebSocket', qt.id FROM "QuestionTemplate" qt WHERE qt.text='API Specifications' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Message Queue', qt.id FROM "QuestionTemplate" qt WHERE qt.text='API Specifications' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Username/Password', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Multi-factor Authentication', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'SSO/SAML', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'OAuth', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'API Keys', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Certificate-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Biometric', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Token-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Zero Trust', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'TLS 1.3', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Encryption Standards' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'AES-256', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Encryption Standards' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'End-to-end Encryption', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Encryption Standards' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Homomorphic Encryption', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Encryption Standards' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'At-rest Encryption', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Encryption Standards' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'In-transit Encryption', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Encryption Standards' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Key Management System', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Encryption Standards' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Predictions/Scores', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Output Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Classifications', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Output Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Recommendations', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Output Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Generated Content', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Output Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Automated Actions', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Output Type' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Insights/Analytics', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Output Type' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Not Provided', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Confidence Scores' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Binary (Yes/No)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Confidence Scores' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Percentage/Probability', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Confidence Scores' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Multi-level Categories', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Confidence Scores' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Detailed Explanations', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Confidence Scores' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Annual', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Quarterly', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Monthly', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Weekly', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Daily', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Real-time/Continuous', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'OpenAI', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Anthropic', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Google (Vertex AI)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'AWS Bedrock', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Azure OpenAI', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cohere', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Meta (Llama)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Mistral AI', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Hugging Face', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Self-hosted', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Custom/Proprietary', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Model Providers' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'GPT-4', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'GPT-4 Turbo', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'GPT-3.5 Turbo', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Claude 3 Opus', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Claude 3 Sonnet', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Claude 3 Haiku', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Gemini Pro', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Gemini Ultra', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Llama 2', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Llama 3', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Mistral Large', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Custom Fine-tuned', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Specific Models' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '< 4K tokens', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Context Window Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '4K - 16K tokens', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Context Window Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '16K - 32K tokens', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Context Window Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '32K - 128K tokens', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Context Window Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '> 128K tokens', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Context Window Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Text only', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Multimodal Capabilities' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Text + Vision', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Multimodal Capabilities' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Text + Audio', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Multimodal Capabilities' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Text + Code', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Multimodal Capabilities' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Text + Video', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Multimodal Capabilities' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Text + Documents', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Multimodal Capabilities' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'All modalities', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Multimodal Capabilities' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Streaming', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Formats' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Batch', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Formats' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Async/Webhooks', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Formats' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Real-time', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Formats' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cached responses', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Formats' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Zero-shot prompting', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Few-shot examples', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Chain of thought', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Role-based prompting', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Structured output formats', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Dynamic prompt templates', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Context injection', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Prompt chaining', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Self-consistency checking', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Constitutional AI prompting', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Engineering Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Single agent', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Agent Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Multi-agent collaborative', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Agent Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Hierarchical agents', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Agent Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Competitive agents', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Agent Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Agent swarm', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Agent Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Reactive (responds only)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Agent Autonomy Level' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Proactive (suggests)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Agent Autonomy Level' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Semi-autonomous (confirms)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Agent Autonomy Level' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Fully autonomous', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Agent Autonomy Level' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Short-term conversation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Memory Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Long-term user memory', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Memory Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Episodic memory', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Memory Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Semantic memory', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Memory Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Working memory', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Memory Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Vector memory', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Memory Requirements' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Linear/Sequential', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Orchestration Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Branching/Conditional', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Orchestration Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Loop-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Orchestration Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Event-driven', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Orchestration Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Dynamic/Adaptive', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Orchestration Pattern' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Stateless', qt.id FROM "QuestionTemplate" qt WHERE qt.text='State Management' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Session-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='State Management' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Persistent', qt.id FROM "QuestionTemplate" qt WHERE qt.text='State Management' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Distributed', qt.id FROM "QuestionTemplate" qt WHERE qt.text='State Management' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Pinecone', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vector Databases' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Weaviate', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vector Databases' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Qdrant', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vector Databases' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Chroma', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vector Databases' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'pgvector', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vector Databases' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Elasticsearch', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vector Databases' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Milvus', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vector Databases' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'FAISS', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vector Databases' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Custom', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vector Databases' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'OpenAI Ada', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Embedding Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'OpenAI Text-3', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Embedding Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cohere Embed', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Embedding Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Sentence Transformers', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Embedding Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'BGE Models', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Embedding Model' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Custom embeddings', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Embedding Model' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Fixed size', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Chunking Strategy' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Semantic chunking', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Chunking Strategy' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Sentence-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Chunking Strategy' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Paragraph-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Chunking Strategy' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Document-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Chunking Strategy' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Custom strategy', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Chunking Strategy' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Similarity search', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Retrieval Strategies' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Hybrid search', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Retrieval Strategies' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Re-ranking', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Retrieval Strategies' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'MMR (Max Marginal Relevance)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Retrieval Strategies' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Semantic + Keyword', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Retrieval Strategies' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Graph-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Retrieval Strategies' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Real-time', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Daily', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Weekly', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Monthly', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'On-demand', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Knowledge Update Frequency' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Database access', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'API calls', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'File system ops', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Code execution', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Web browsing', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Email/messaging', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Calendar/scheduling', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Document processing', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Data analysis', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Image generation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Categories' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'OAuth', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'API keys', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Service accounts', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Managed identity', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Token-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Certificate-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Authentication Methods' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Sandboxed', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Execution Environment' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Containerized', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Execution Environment' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Serverless', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Execution Environment' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Direct access', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Execution Environment' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Isolated VM', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Execution Environment' AND qt.stage='TECHNICAL_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Pre-approved only', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Approval Process' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Runtime approval', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Approval Process' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Human confirmation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Approval Process' AND qt.stage='TECHNICAL_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Unrestricted', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Tool Approval Process' AND qt.stage='TECHNICAL_FEASIBILITY';
