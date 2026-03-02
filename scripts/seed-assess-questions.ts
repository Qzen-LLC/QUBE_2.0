import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SEED_DATA = [
  {
    text: "Model Type",
    type: "CHECKBOX",
    options: [
      "Large Language Model (LLM)",
      "Computer Vision",
      "Natural Language Processing",
      "Time Series Forecasting",
      "Recommendation System",
      "Classification",
      "Regression",
      "Clustering",
      "Anomaly Detection",
      "Reinforcement Learning",
      "Generative AI",
      "Multi-modal Models",
      "Custom/Proprietary",
    ],
  },
  {
    text: "Model Size",
    type: "CHECKBOX",
    options: [
      "< 1M parameters",
      "1M - 100M parameters",
      "100M - 1B parameters",
      "1B - 10B parameters",
      "10B - 100B parameters",
      "> 100B parameters",
    ],
  },
  {
    text: "Deployment Model",
    type: "CHECKBOX",
    options: [
      "Public Cloud",
      "Private Cloud",
      "Hybrid Cloud",
      "On-premise",
      "Edge Computing",
      "Distributed/Federated",
      "Multi-cloud",
    ],
  },
  {
    text: "Cloud Provider",
    type: "CHECKBOX",
    options: [
      "AWS",
      "Azure",
      "Google Cloud",
      "IBM Cloud",
      "Oracle Cloud",
      "Alibaba Cloud",
      "Other Regional Providers",
    ],
  },
  {
    text: "Compute Requirement",
    type: "CHECKBOX",
    options: [
      "CPU only",
      "GPU required",
      "TPU required",
      "Specialized hardware",
      "Quantum computing",
    ],
  },
  {
    text: "Integration Points",
    type: "CHECKBOX",
    options: [
      "ERP Systems (SAP, Oracle, etc.)",
      "CRM Systems (Salesforce, etc.)",
      "Payment Systems",
      "Banking/Financial Systems",
      "Healthcare Systems (EHR/EMR)",
      "Supply Chain Systems",
      "HR Systems",
      "Marketing Platforms",
      "Communication Systems",
      "IoT Platforms",
      "Data Warehouses",
      "Business Intelligence Tools",
      "Custom Applications",
      "Legacy Systems",
    ],
  },
  {
    text: "API Specification",
    type: "CHECKBOX",
    options: [
      "No API",
      "Internal API only",
      "Partner API",
      "Public API",
      "GraphQL",
      "REST",
      "gRPC",
      "WebSocket",
      "Message Queue",
    ],
  },
  {
    text: "Authentication Method",
    type: "CHECKBOX",
    options: [
      "Username/Password",
      "Multi-factor Authentication",
      "SSO/SAML",
      "OAuth",
      "API Keys",
      "Certificate-based",
      "Biometric",
      "Token-based",
      "Zero Trust",
    ],
  },
  {
    text: "Encryption Standard",
    type: "CHECKBOX",
    options: [
      "TLS 1.3",
      "AES-256",
      "End-to-end Encryption",
      "Homomorphic Encryption",
      "At-rest Encryption",
      "In-transit Encryption",
      "Key Management System",
    ],
  },
  {
    text: "Output Type",
    type: "CHECKBOX",
    options: [
      "Predictions/Scores",
      "Classifications",
      "Recommendations",
      "Generated Content",
      "Automated Actions",
      "Insights/Analytics",
    ],
  },
  {
    text: "Confidence Score",
    type: "RADIO",
    options: [
      "Not Provided",
      "Binary (Yes/No)",
      "Percentage/Probability",
      "Multi-level Categories",
      "Detailed Explanations",
    ],
  },
  {
    text: "Model Update Frequency",
    type: "RADIO",
    options: [
      "Annual",
      "Quarterly",
      "Monthly",
      "Weekly",
      "Daily",
      "Real-time/Continuous",
    ],
  },
];

async function main() {
  for (const q of SEED_DATA) {
    const question = await prisma.questionTemplate.create({
      data: {
        text: q.text,
        type: q.type as any, // cast to QuestionType enum
        optionTemplates: {
          create: q.options.map((opt) => ({ text: opt })),
        },
      },
    });
    console.log(`Seeded QuestionTemplate: ${question.text}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
