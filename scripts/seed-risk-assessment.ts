import { PrismaClient } from '@/generated/prisma';
import { QuestionType, Stage } from '@/generated/prisma';
const prisma = new PrismaClient();

// Define the data structure to hold questions and their options
const riskAssessmentData = [

  //--- RISK QUESTIONS ---
  { questionText: "Regulatory changes", type: QuestionType.RISK, options: [], riskOrderIndex: 5 },
  { questionText: "User adoption resistance", type: QuestionType.RISK, options: [], riskOrderIndex: 4 },
  { questionText: "Integration failures", type: QuestionType.RISK, options: [], riskOrderIndex: 3 },
  { questionText: "Competitive response", type: QuestionType.RISK, options: [], riskOrderIndex: 6 },
  { questionText: "Model Accuracy Degradation", type: QuestionType.RISK, options: [], riskOrderIndex: 1 },
  { questionText: "Data quality issues", type: QuestionType.RISK, options: [], riskOrderIndex: 2 },  
  // --- SLIDER QUESTIONS (No Options/OptionTemplate records created) ---
  // { questionText: 'Model Hallucination Impact', type: QuestionType.SLIDER, options: [], riskOrderIndex: 19 },
  // { questionText: 'Prompt Injection Vulnerability', type: QuestionType.SLIDER, options: [], riskOrderIndex: 20 },
  // { questionText: 'Data Poisoning Risk', type: QuestionType.SLIDER, options: [], riskOrderIndex: 21 },
  // { questionText: 'Model Inversion Attacks', type: QuestionType.SLIDER, options: [], riskOrderIndex: 22 },
  // { questionText: 'Adversarial Inputs', type: QuestionType.SLIDER, options: [], riskOrderIndex: 23 },
  // { questionText: 'Model Drift/Degradation', type: QuestionType.SLIDER, options: [], riskOrderIndex: 24 },
  // { questionText: 'Unauthorized Actions', type: QuestionType.SLIDER, options: [], riskOrderIndex: 25 },
  // { questionText: 'Infinite Loops/Recursion', type: QuestionType.SLIDER, options: [], riskOrderIndex: 26 },
  // { questionText: 'Resource Exhaustion', type: QuestionType.SLIDER, options: [], riskOrderIndex: 27 },
  // { questionText: 'Multi-agent Conflicts', type: QuestionType.SLIDER, options: [], riskOrderIndex: 28 },
  // { questionText: 'Cascading Failures', type: QuestionType.SLIDER, options: [], riskOrderIndex: 29 },
  // { questionText: 'Goal Misalignment', type: QuestionType.SLIDER, options: [], riskOrderIndex: 30 },

  // // --- CHECKBOX QUESTIONS ---
  // {
  //   questionText: 'Dependency Risks',
  //   type: QuestionType.CHECKBOX,
  //   options: [
  //     'Model Provider Outage',
  //     'API Rate Limiting',
  //     'Token Cost Overrun',
  //     'Context Window Overflow',
  //     'Knowledge Base Corruption',
  //     'Third-party Service Failure',
  //   ],
  //   riskOrderIndex: 31,
  // },
  // {
  //   questionText: 'Certifications/Standards',
  //   type: QuestionType.CHECKBOX,
  //   options: [
  //     'ISO 27001 (Information Security)',
  //     'ISO 27701 (Privacy)',
  //     'ISO/IEC 23053 (AI)',
  //     'ISO/IEC 23894 (AI Risk)',
  //     'ISO/IEC 42001:2023 – AI Management System (AIMS)',
  //     'ISO/IEC JTC 1/SC 42 – AI Standardization Committee',
  //     'SOC 2',
  //     'FedRAMP',
  //     'NIST AI Standards and Risk Management Framework (RMF)',
  //     'AICPA AI Auditing',
  //     'IEEE AI Standards',
  //   ],
  //   riskOrderIndex: 14,
  // },
  // {
  //   questionText: 'AI-Specific Regulations',
  //   type: QuestionType.CHECKBOX,
  //   options: [
  //     'EU AI Act',
  //     'UAE AI/GenAI Controls',
  //     'US AI Bill of Rights',
  //     'China AI Regulations',
  //     'UK AI Framework',
  //     'Canada AIDA',
  //     'Singapore Model AI Governance',
  //   ],
  //   riskOrderIndex: 13,
  // },
  // {
  //   questionText: 'Sector-Specific',
  //   type: QuestionType.CHECKBOX,
  //   options: [
  //     'HIPAA (Healthcare)',
  //     'PCI-DSS (Payment Cards)',
  //     'SOX (Financial Reporting)',
  //     'GLBA (Financial Privacy)',
  //     'FCRA (Credit Reporting)',
  //     'FERPA (Education)',
  //     'COPPA (Children\'s Privacy)',
  //     'CAN-SPAM (Email)',
  //     'TCPA (Communications)',
  //   ],
  //   riskOrderIndex: 12,
  // },
  // {
  //   questionText: 'Data Protection',
  //   type: QuestionType.CHECKBOX,
  //   options: [
  //     'GDPR (EU)',
  //     'CCPA/CPRA (California)',
  //     'LGPD (Brazil)',
  //     'PIPEDA (Canada)',
  //     'POPI (South Africa)',
  //     'APPI (Japan)',
  //     'Privacy Act (Australia)',
  //     'PDPA (Singapore)',
  //     'Other State Privacy Laws',
  //   ],
  //   riskOrderIndex: 11,
  // },
  // // Jurisdictions (using compound text to match previous CSV)
  // {
  //   questionText: 'Operating Jurisdictions - Americas',
  //   type: QuestionType.CHECKBOX,
  //   options: [
  //     'United States (Federal)',
  //     'US State-specific (list states)',
  //     'Canada',
  //     'Mexico',
  //     'Brazil',
  //     'Argentina',
  //   ],
  //   riskOrderIndex: 7,
  // },
  // {
  //   questionText: 'Operating Jurisdictions - Europe',
  //   type: QuestionType.CHECKBOX,
  //   options: ['European Union', 'United Kingdom', 'Switzerland', 'Norway', 'Russia'],
  //   riskOrderIndex: 8,
  // },
  // {
  //   questionText: 'Operating Jurisdictions - Asia-Pacific',
  //   type: QuestionType.CHECKBOX,
  //   options: ['China', 'Japan', 'Singapore', 'Australia', 'India', 'South Korea'],
  //   riskOrderIndex: 9,
  // },
  // {
  //   questionText: 'Operating Jurisdictions - Middle East & Africa',
  //   type: QuestionType.CHECKBOX,
  //   options: ['UAE', 'Saudi Arabia', 'Israel', 'South Africa'],
  //   riskOrderIndex: 10,
  // },
  
  // // --- RADIO QUESTIONS ---
  // {
  //   questionText: 'Organization Risk Tolerance',
  //   type: QuestionType.RADIO,
  //   options: ['Risk Averse', 'Conservative', 'Moderate', 'Aggressive', 'Risk Seeking'],
  //   riskOrderIndex: 17,
  // },
  // {
  //   questionText: 'Previous AI Experience',
  //   type: QuestionType.RADIO,
  //   options: [
  //     'First AI Project',
  //     'Limited Experience',
  //     'Moderate Experience',
  //     'Extensive Experience',
  //     'AI-First Organization',
  //   ],
  //   riskOrderIndex: 18,
  // },
  // {
  //   questionText: 'Audit Requirements',
  //   type: QuestionType.RADIO,
  //   options: [
  //     'No Audit Required',
  //     'Annual Audit',
  //     'Quarterly Audit',
  //     'Continuous Monitoring',
  //     'Regulatory Examination',
  //   ],
  //   riskOrderIndex: 15,
  // },
  // {
  //   questionText: 'Compliance Reporting',
  //   type: QuestionType.RADIO,
  //   options: [
  //     'None Required',
  //     'Annual Reports',
  //     'Quarterly Reports',
  //     'Monthly Reports',
  //     'Real-time Dashboards',
  //     'Incident-based',
  //   ],
  //   riskOrderIndex: 16,
  // },
];

async function main() {
  console.log('Start seeding the OptionTemplates...');

  // Ensure unique constraints on QuestionTemplate fields are respected (e.g., 'text' is unique)
  for (const group of riskAssessmentData) {
    // 1. Upsert (find or create) the QuestionTemplate record
    const question = await prisma.questionTemplate.create({
      data: {
        text: group.questionText,
        type: group.type,
        stage: Stage.RISK_ASSESSMENT,
        isInactive: false,
        // Set default ordering index for the RISK stage
        riskOrderIndex: group.riskOrderIndex,
      },
    });

    console.log(`Upserted QuestionTemplate: ${question.text} (${question.id})`);

    // 2. Create the OptionTemplate records ONLY if options exist (i.e., not a SLIDER)
    if (group.options.length > 0) {
      const optionPromises = group.options.map(optionText =>
        prisma.optionTemplate.create({
          data: {
            text: optionText,
            questionTemplateId: question.id,
          },
          // We use .create() here and handle potential unique constraint errors on the 'text' field
          // if it were also unique, as upserting OptionTemplates can be complex.
          // The error handling below will skip duplicates.
        }).catch(e => {
            // Log if creation fails (e.g., due to duplicate unique text if such an index exists)
            // This is expected if the seed script runs multiple times.
            if (e.code === 'P2002') { // P2002 is for Unique constraint violation
                 console.log(`Skipping existing option: ${optionText} for question ${question.text} (Already exists)`);
            } else {
                 console.error(`Creation failed for option ${optionText}:`, e);
            }
            return null;
        })
      );

      // Execute all option creations
      await Promise.all(optionPromises);
    }
    // SLIDER questions skip this block entirely, fulfilling your requirement.
  }

  console.log('OptionTemplates and QuestionTemplates seeding complete. 🌱');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });