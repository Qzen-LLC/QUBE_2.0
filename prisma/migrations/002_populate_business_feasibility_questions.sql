CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO "QuestionTemplate" (id, text, type, stage, "businessOrderIndex") VALUES 
(gen_random_uuid()::text, 'Strategic Alignment Score', 'SLIDER', 'BUSINESS_FEASIBILITY', 1),
(gen_random_uuid()::text, 'Market Opportunity', 'RADIO', 'BUSINESS_FEASIBILITY', 2),
(gen_random_uuid()::text, 'Stakeholder Support', 'CHECKBOX', 'BUSINESS_FEASIBILITY', 3);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "businessOrderIndex") VALUES 
(gen_random_uuid()::text, 'Availability Requirements', 'RADIO', 'BUSINESS_FEASIBILITY', 4),
(gen_random_uuid()::text, 'Response Time Requirements', 'RADIO', 'BUSINESS_FEASIBILITY', 5),
(gen_random_uuid()::text, 'Concurrent Users', 'RADIO', 'BUSINESS_FEASIBILITY', 6);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "businessOrderIndex") VALUES 
(gen_random_uuid()::text, 'Revenue Impact Type', 'CHECKBOX', 'BUSINESS_FEASIBILITY', 7),
(gen_random_uuid()::text, 'Estimated Financial Impact', 'RADIO', 'BUSINESS_FEASIBILITY', 8),
(gen_random_uuid()::text, 'Target User Categories', 'CHECKBOX', 'BUSINESS_FEASIBILITY', 9);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "businessOrderIndex") VALUES 
(gen_random_uuid()::text, 'System Criticality', 'RADIO', 'BUSINESS_FEASIBILITY', 10),
(gen_random_uuid()::text, 'Failure Impact Assessment', 'RADIO', 'BUSINESS_FEASIBILITY', 11),
(gen_random_uuid()::text, 'Executive Sponsor Level', 'RADIO', 'BUSINESS_FEASIBILITY', 12),
(gen_random_uuid()::text, 'Stakeholder Groups', 'CHECKBOX', 'BUSINESS_FEASIBILITY', 13);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "businessOrderIndex") VALUES 
(gen_random_uuid()::text, 'Primary Use Case Type', 'RADIO', 'BUSINESS_FEASIBILITY', 14),
(gen_random_uuid()::text, 'Interaction Pattern', 'RADIO', 'BUSINESS_FEASIBILITY', 15),
(gen_random_uuid()::text, 'User Interaction Modes', 'CHECKBOX', 'BUSINESS_FEASIBILITY', 16);

INSERT INTO "QuestionTemplate" (id, text, type, stage, "businessOrderIndex") VALUES 
(gen_random_uuid()::text, 'Success Metrics', 'CHECKBOX', 'BUSINESS_FEASIBILITY', 17),
(gen_random_uuid()::text, 'Min Acceptable Accuracy (%)', 'SLIDER', 'BUSINESS_FEASIBILITY', 18),
(gen_random_uuid()::text, 'Max Hallucination Rate (%)', 'SLIDER', 'BUSINESS_FEASIBILITY', 19),
(gen_random_uuid()::text, 'Required Response Relevance (%)', 'SLIDER', 'BUSINESS_FEASIBILITY', 20),
(gen_random_uuid()::text, 'Conversations/Month', 'TEXT', 'BUSINESS_FEASIBILITY', 21),
(gen_random_uuid()::text, 'Concurrent Agents', 'TEXT', 'BUSINESS_FEASIBILITY', 22),
(gen_random_uuid()::text, 'Peak Load (req/min)', 'TEXT', 'BUSINESS_FEASIBILITY', 23);

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'small', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Market Opportunity' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'medium', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Market Opportunity' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'large', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Market Opportunity' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'exec', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Support' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'endUser', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Support' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'it', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Support' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '99% (3.65 days downtime/year)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Availability Requirements' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '99.9% (8.76 hours downtime/year)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Availability Requirements' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '99.99% (52.56 minutes downtime/year)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Availability Requirements' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '99.999% (5.26 minutes downtime/year)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Availability Requirements' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '< 100ms', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Time Requirements' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '100ms - 1s', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Time Requirements' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '1s - 5s', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Time Requirements' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '5s - 30s', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Time Requirements' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '> 30s', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Response Time Requirements' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '< 100', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Concurrent Users' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '100 - 1,000', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Concurrent Users' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '1,000 - 10,000', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Concurrent Users' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '10,000 - 100,000', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Concurrent Users' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '100,000 - 1 million', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Concurrent Users' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '> 1 million', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Concurrent Users' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Direct Revenue Generation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Revenue Impact Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cost Reduction', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Revenue Impact Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Risk Mitigation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Revenue Impact Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Compliance and Regulatory', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Revenue Impact Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Customer Experience', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Revenue Impact Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Operational Efficiency', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Revenue Impact Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'No Direct Impact', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Revenue Impact Type' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '< $100K annually', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Estimated Financial Impact' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '$100K - $1M', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Estimated Financial Impact' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '$1M - $10M', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Estimated Financial Impact' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '$10M - $100M', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Estimated Financial Impact' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, '> $100M', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Estimated Financial Impact' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Internal Employees', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Target User Categories' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Customers', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Target User Categories' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Partners/Vendors', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Target User Categories' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'General Public', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Target User Categories' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Regulators', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Target User Categories' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Executives', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Target User Categories' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Developers/IT', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Target User Categories' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Analysts', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Target User Categories' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Minors/Children', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Target User Categories' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Non-critical (Experimental)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='System Criticality' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Low (Convenience)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='System Criticality' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Medium (Important)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='System Criticality' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'High (Business Critical)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='System Criticality' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Mission Critical', qt.id FROM "QuestionTemplate" qt WHERE qt.text='System Criticality' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Minimal/No Impact', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Failure Impact Assessment' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Minor Inconvenience', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Failure Impact Assessment' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Moderate Business Impact', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Failure Impact Assessment' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Severe Business Impact', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Failure Impact Assessment' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Catastrophic/Life Safety', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Failure Impact Assessment' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'C-Suite', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Executive Sponsor Level' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'VP/Director', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Executive Sponsor Level' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Manager', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Executive Sponsor Level' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Team Lead', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Executive Sponsor Level' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Board of Directors', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Groups' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Executive Team', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Groups' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Legal/Compliance', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Groups' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'IT/Security', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Groups' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Business Users', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Groups' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Customers', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Groups' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Regulators', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Groups' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Partners', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Groups' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Public/Media', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Stakeholder Groups' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Content Generation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Code Generation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Customer Service', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Research & Analysis', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Process Automation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Decision Support', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Creative/Design', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Personal Assistant', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Document Processing', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Data Analysis', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Primary Use Case Type' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Conversational', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Interaction Pattern' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Task-based', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Interaction Pattern' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Hybrid', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Interaction Pattern' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Autonomous', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Interaction Pattern' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Chat Interface', qt.id FROM "QuestionTemplate" qt WHERE qt.text='User Interaction Modes' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Voice Interface', qt.id FROM "QuestionTemplate" qt WHERE qt.text='User Interaction Modes' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'API Integration', qt.id FROM "QuestionTemplate" qt WHERE qt.text='User Interaction Modes' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Email Integration', qt.id FROM "QuestionTemplate" qt WHERE qt.text='User Interaction Modes' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Slack/Teams', qt.id FROM "QuestionTemplate" qt WHERE qt.text='User Interaction Modes' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Custom UI', qt.id FROM "QuestionTemplate" qt WHERE qt.text='User Interaction Modes' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Command Line', qt.id FROM "QuestionTemplate" qt WHERE qt.text='User Interaction Modes' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Mobile App', qt.id FROM "QuestionTemplate" qt WHERE qt.text='User Interaction Modes' AND qt.stage='BUSINESS_FEASIBILITY';

INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Task Completion Rate', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Human Handoff Rate', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Content Quality Score', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'User Satisfaction (CSAT)', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Time to Resolution', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Automation Percentage', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Cost per Interaction', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Revenue per Conversation', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Error Rate', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
INSERT INTO "OptionTemplate" (id, text, "questionTemplateId") SELECT gen_random_uuid()::text, 'Response Relevance', qt.id FROM "QuestionTemplate" qt WHERE qt.text='Success Metrics' AND qt.stage='BUSINESS_FEASIBILITY';
