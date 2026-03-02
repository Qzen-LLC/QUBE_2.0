export const iso42001Clauses = [
  {
    clauseId: "4",
    title: "Context of the Organization",
    description: "Understand the organization's context and establish the scope of the AI Management System.",
    orderIndex: 1,
    subclauses: [
      {
        subclauseId: "4.1",
        title: "Understanding the Organization and Its Context",
        summary: "Determine external and internal issues relevant to the organization's purpose and its AIMS",
        questions: [
          "What internal factors influence our AIMS?",
          "What external factors influence our AIMS?",
          "How does our use/development of AI align with our business strategy?"
        ],
        evidenceExamples: [
          "Context analysis document (PESTLE, SWOT focused on AI)",
          "Documentation of internal/external issues",
          "Strategic planning documents referencing AI"
        ],
        orderIndex: 1
      },
      {
        subclauseId: "4.2",
        title: "Understanding the Needs and Expectations of Interested Parties",
        summary: "Identify interested parties relevant to the AIMS and their requirements/expectations concerning AI",
        questions: [
          "Who are the interested parties for our AI systems?",
          "What are their relevant needs, expectations, and requirements?",
          "How do we capture and review these requirements?"
        ],
        evidenceExamples: [
          "Stakeholder analysis matrix/register",
          "List of applicable legal/regulatory requirements for AI",
          "Records of communication with stakeholders"
        ],
        orderIndex: 2
      },
      {
        subclauseId: "4.3",
        title: "Determining the Scope of the AI Management System",
        summary: "Define the boundaries and applicability of the AIMS within the organization",
        questions: [
          "What organizational units, processes, locations are included in the AIMS?",
          "Which specific AI systems or applications are covered?",
          "What stages of the AI lifecycle are included?"
        ],
        evidenceExamples: [
          "Documented AIMS Scope Statement"
        ],
        orderIndex: 3
      },
      {
        subclauseId: "4.4",
        title: "AI Management System",
        summary: "Establish, implement, maintain, and continually improve the AIMS in accordance with ISO 42001 requirements",
        questions: [
          "Do we have the necessary processes and documentation established for the AIMS?",
          "Are these processes being followed?",
          "Are there mechanisms for maintaining and updating the AIMS?"
        ],
        evidenceExamples: [
          "The AIMS documentation itself (policies, procedures)",
          "Records of implementation activities",
          "Management review records",
          "Audit results"
        ],
        orderIndex: 4
      }
    ]
  },
  {
    clauseId: "5",
    title: "Leadership",
    description: "Establish leadership commitment and organizational structure for AI management.",
    orderIndex: 2,
    subclauses: [
      {
        subclauseId: "5.1",
        title: "Leadership and Commitment",
        summary: "Top management must demonstrate leadership by ensuring policy/objectives alignment, resource availability, integration, communication, and promoting improvement",
        questions: [
          "How does top management show active involvement and support for the AIMS?",
          "Are AIMS objectives aligned with strategic goals?",
          "Are sufficient resources allocated?"
        ],
        evidenceExamples: [
          "Management meeting minutes discussing AIMS",
          "Resource allocation records (budget, staffing)",
          "Internal communications from leadership"
        ],
        orderIndex: 1
      },
      {
        subclauseId: "5.2",
        title: "Policy",
        summary: "Establish, communicate, and maintain an AI Policy appropriate to the organization's context",
        questions: [
          "Is there a documented AI Policy?",
          "Does it include commitments to requirements and continual improvement?",
          "Does it align with organizational AI principles/ethics?"
        ],
        evidenceExamples: [
          "The documented AI Policy",
          "Communication records (emails, intranet posts)",
          "Training materials covering the policy"
        ],
        orderIndex: 2
      },
      {
        subclauseId: "5.3",
        title: "Organizational Roles, Responsibilities, and Authorities",
        summary: "Assign and communicate responsibilities and authorities for roles relevant to the AIMS",
        questions: [
          "Who is ultimately accountable for the AIMS?",
          "Who is responsible for specific AIMS tasks?",
          "Are these roles, responsibilities, and authorities documented and communicated?"
        ],
        evidenceExamples: [
          "Organization chart showing AIMS roles",
          "Documented role descriptions",
          "Responsibility Assignment Matrix (RACI)"
        ],
        orderIndex: 3
      }
    ]
  },
  {
    clauseId: "6",
    title: "Planning",
    description: "Plan actions to address risks and opportunities and establish AI objectives.",
    orderIndex: 3,
    subclauses: [
      {
        subclauseId: "6.1",
        title: "Actions to Address Risks and Opportunities",
        summary: "Plan actions based on context, stakeholders, risks, and opportunities. Conduct AI risk assessments, plan risk treatments, and assess AI system impacts",
        questions: [
          "Do we have a process for identifying risks and opportunities related to the AIMS?",
          "Is there a defined AI risk assessment methodology?",
          "Are risks related to AI systems systematically identified and assessed?"
        ],
        evidenceExamples: [
          "Risk management framework/policy/procedure",
          "AI Risk Assessment Methodology",
          "Risk assessment reports per AI system",
          "AI Risk Register",
          "AI Risk Treatment Plan"
        ],
        orderIndex: 1
      },
      {
        subclauseId: "6.2",
        title: "AI Objectives and Planning to Achieve Them",
        summary: "Establish measurable AIMS objectives aligned with the AI policy and plan how to achieve them",
        questions: [
          "What are the specific, measurable objectives for our AIMS?",
          "Are they consistent with the AI policy and organizational goals?",
          "What actions, resources, responsibilities, and timelines are defined?"
        ],
        evidenceExamples: [
          "Documented AIMS Objectives",
          "Action plans linked to objectives",
          "Performance indicators (KPIs) for objectives",
          "Management review records discussing objectives progress"
        ],
        orderIndex: 2
      }
    ]
  },
  {
    clauseId: "7",
    title: "Support",
    description: "Provide necessary resources, competence, awareness, and communication for the AIMS.",
    orderIndex: 4,
    subclauses: [
      {
        subclauseId: "7.1",
        title: "Resources",
        summary: "Determine and provide the resources needed for the AIMS",
        questions: [
          "What resources (human, financial, technological, infrastructure) are needed?",
          "Have these resources been identified and allocated?"
        ],
        evidenceExamples: [
          "Budget approvals",
          "Staffing plans",
          "Technology acquisition records",
          "Facility plans"
        ],
        orderIndex: 1
      },
      {
        subclauseId: "7.2",
        title: "Competence",
        summary: "Ensure personnel involved in the AIMS are competent based on education, training, or experience",
        questions: [
          "What competencies are required for different AIMS roles?",
          "How do we ensure individuals possess these competencies?",
          "Are training needs identified and addressed?"
        ],
        evidenceExamples: [
          "Job descriptions with competency requirements",
          "Competency matrix",
          "Training plans and records",
          "Performance reviews",
          "Certifications"
        ],
        orderIndex: 2
      },
      {
        subclauseId: "7.3",
        title: "Awareness",
        summary: "Ensure relevant personnel are aware of the AI policy, their contribution, and the implications of non-conformance",
        questions: [
          "Are staff aware of the AI Policy?",
          "Do they understand how their work contributes to the AIMS and AI ethics?",
          "Are they aware of the benefits of effective AI governance?"
        ],
        evidenceExamples: [
          "Awareness training materials and attendance logs",
          "Internal communications (newsletters, posters)",
          "Onboarding materials"
        ],
        orderIndex: 3
      }
    ]
  }
  // Additional clauses would be added here following the same pattern...
];