-- Migration to populate Ethical Impact questions and options
-- Stage: ETHICAL_IMPACT

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Decision Making
INSERT INTO "QuestionTemplate" (id, text, type, stage, "ethicalOrderIndex") VALUES
(gen_random_uuid()::text, 'Decision Automation Level', 'RADIO', 'ETHICAL_IMPACT', 1),
(gen_random_uuid()::text, 'Decision Types (Multi-select)', 'CHECKBOX', 'ETHICAL_IMPACT', 2);

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Information Only (No decisions)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Automation Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Decision Support (Human decides)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Automation Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Assisted Decision (AI recommends)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Automation Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Automated with Override', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Automation Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Fully Automated', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Automation Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Autonomous', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Automation Level' AND qt.stage='ETHICAL_IMPACT';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Credit/Lending Decisions', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Employment Decisions', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Insurance Underwriting', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Medical Diagnosis/Treatment', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Legal Judgments', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Pricing Decisions', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Access Control', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Content Moderation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Fraud Detection', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Risk Scoring', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Resource Allocation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Predictive Maintenance', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Decision Types (Multi-select)' AND qt.stage='ETHICAL_IMPACT';

-- Model Characteristics
INSERT INTO "QuestionTemplate" (id, text, type, stage, "ethicalOrderIndex") VALUES
(gen_random_uuid()::text, 'Explainability Level', 'RADIO', 'ETHICAL_IMPACT', 3),
(gen_random_uuid()::text, 'Bias Testing', 'RADIO', 'ETHICAL_IMPACT', 4);

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Black Box (No explanation)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Explainability Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Basic Feature Importance', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Explainability Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Partial Explanations', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Explainability Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Full Explainability', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Explainability Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Human-interpretable Rules', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Explainability Level' AND qt.stage='ETHICAL_IMPACT';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'No Testing Planned', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Bias Testing' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Basic Statistical Testing', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Bias Testing' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Comprehensive Bias Audit', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Bias Testing' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Continuous Monitoring', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Bias Testing' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Third-party Audit', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Bias Testing' AND qt.stage='ETHICAL_IMPACT';

-- AI Governance
INSERT INTO "QuestionTemplate" (id, text, type, stage, "ethicalOrderIndex") VALUES
(gen_random_uuid()::text, 'Human Oversight Level', 'RADIO', 'ETHICAL_IMPACT', 5),
(gen_random_uuid()::text, 'Performance Monitoring', 'CHECKBOX', 'ETHICAL_IMPACT', 6);

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Fully Autonomous', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Periodic Review', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Regular Monitoring', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Active Supervision', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Human-in-the-loop', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Level' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Human Approval Required', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Level' AND qt.stage='ETHICAL_IMPACT';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Accuracy/Precision', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Performance Monitoring' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Fairness Metrics', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Performance Monitoring' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Drift Detection', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Performance Monitoring' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Resource Usage', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Performance Monitoring' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Latency Tracking', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Performance Monitoring' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Error Analysis', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Performance Monitoring' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'A/B Testing', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Performance Monitoring' AND qt.stage='ETHICAL_IMPACT';

-- Ethical Considerations
INSERT INTO "QuestionTemplate" (id, text, type, stage, "ethicalOrderIndex") VALUES
(gen_random_uuid()::text, 'Potential Harm Areas (Multi-select)', 'CHECKBOX', 'ETHICAL_IMPACT', 7),
(gen_random_uuid()::text, 'Vulnerable Populations (Multi-select)', 'CHECKBOX', 'ETHICAL_IMPACT', 8);

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Discrimination/Bias', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Potential Harm Areas (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Privacy Violation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Potential Harm Areas (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Manipulation/Deception', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Potential Harm Areas (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Physical Harm', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Potential Harm Areas (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Economic Harm', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Potential Harm Areas (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Psychological Harm', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Potential Harm Areas (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Environmental Impact', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Potential Harm Areas (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Misinformation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Potential Harm Areas (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Addiction/Overuse', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Potential Harm Areas (Multi-select)' AND qt.stage='ETHICAL_IMPACT';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Children/Minors', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vulnerable Populations (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Elderly', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vulnerable Populations (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Disabled Individuals', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vulnerable Populations (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Minorities', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vulnerable Populations (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Low-income Groups', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vulnerable Populations (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Non-native Speakers', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vulnerable Populations (Multi-select)' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Specific Medical Conditions', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Vulnerable Populations (Multi-select)' AND qt.stage='ETHICAL_IMPACT';

-- Content Safety & Generation Ethics
INSERT INTO "QuestionTemplate" (id, text, type, stage, "ethicalOrderIndex") VALUES
(gen_random_uuid()::text, 'Content Generation Risks', 'CHECKBOX', 'ETHICAL_IMPACT', 9),
(gen_random_uuid()::text, 'Hallucination Tolerance', 'RADIO', 'ETHICAL_IMPACT', 10),
(gen_random_uuid()::text, 'Attribution Requirements', 'CHECKBOX', 'ETHICAL_IMPACT', 11),
(gen_random_uuid()::text, 'Prompt Safety Measures', 'CHECKBOX', 'ETHICAL_IMPACT', 12);

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Misinformation/Disinformation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Content Generation Risks' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Harmful Content Generation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Content Generation Risks' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Biased Outputs', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Content Generation Risks' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Copyright Infringement', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Content Generation Risks' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Personal Information Leakage', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Content Generation Risks' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Inappropriate Content for Minors', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Content Generation Risks' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Hate Speech Generation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Content Generation Risks' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Medical/Legal Misinformation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Content Generation Risks' AND qt.stage='ETHICAL_IMPACT';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Zero Tolerance', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Hallucination Tolerance' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Low (<5%)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Hallucination Tolerance' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Medium (5-15%)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Hallucination Tolerance' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Acceptable (>15%)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Hallucination Tolerance' AND qt.stage='ETHICAL_IMPACT';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'AI Disclosure Required', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Attribution Requirements' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Source Attribution Needed', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Attribution Requirements' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Watermarking Required', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Attribution Requirements' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Human Review Mandatory', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Attribution Requirements' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Content Labeling', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Attribution Requirements' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Confidence Scores Shown', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Attribution Requirements' AND qt.stage='ETHICAL_IMPACT';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Prompt Injection Prevention', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Safety Measures' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Jailbreak Protection', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Safety Measures' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Content Filtering', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Safety Measures' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Output Validation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Safety Measures' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Input Sanitization', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Safety Measures' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'System Prompt Protection', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Safety Measures' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Adversarial Input Detection', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Prompt Safety Measures' AND qt.stage='ETHICAL_IMPACT';

-- Agent Behavior Governance
INSERT INTO "QuestionTemplate" (id, text, type, stage, "ethicalOrderIndex") VALUES
(gen_random_uuid()::text, 'Behavioral Boundaries', 'CHECKBOX', 'ETHICAL_IMPACT', 13),
(gen_random_uuid()::text, 'Transparency Requirements', 'RADIO', 'ETHICAL_IMPACT', 14),
(gen_random_uuid()::text, 'Human Oversight Triggers', 'CHECKBOX', 'ETHICAL_IMPACT', 15);

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cannot Make Financial Transactions', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Behavioral Boundaries' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cannot Access Personal Data', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Behavioral Boundaries' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cannot Make Irreversible Changes', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Behavioral Boundaries' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cannot Communicate Externally', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Behavioral Boundaries' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Must Log All Actions', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Behavioral Boundaries' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cannot Override Safety Limits', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Behavioral Boundaries' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Must Respect User Consent', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Behavioral Boundaries' AND qt.stage='ETHICAL_IMPACT';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Always Disclose AI Nature', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Transparency Requirements' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Disclose When Asked', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Transparency Requirements' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Disclose in Documentation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Transparency Requirements' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'No Disclosure Required', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Transparency Requirements' AND qt.stage='ETHICAL_IMPACT';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'High-stake Decisions', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Triggers' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Uncertain Outputs', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Triggers' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'User Request', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Triggers' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Error Conditions', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Triggers' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Ethical Concerns', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Triggers' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Anomaly Detection', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Triggers' AND qt.stage='ETHICAL_IMPACT';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Compliance Requirements', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Human Oversight Triggers' AND qt.stage='ETHICAL_IMPACT';

