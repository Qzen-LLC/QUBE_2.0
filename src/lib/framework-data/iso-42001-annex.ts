export const iso42001AnnexCategories = [
  {
    categoryId: "A.5",
    title: "Organizational Policies and Governance",
    description: "Establish organizational policies and governance frameworks for AI systems.",
    orderIndex: 1,
    items: [
      {
        itemId: "A.5.1.1",
        title: "Policies for AI",
        description: "Management direction and support for AI via policies",
        guidance: "Management should define and endorse a set of policies to provide clear direction and support for AI development and use within the organization",
        orderIndex: 1
      },
      {
        itemId: "A.5.2.1",
        title: "AI Governance Framework",
        description: "Establishment of a governance structure for AI oversight",
        guidance: "An AI governance framework, including roles, responsibilities, processes, and oversight mechanisms, should be established and maintained",
        orderIndex: 2
      },
      {
        itemId: "A.5.3.1",
        title: "AI Roles and Responsibilities",
        description: "Defining and allocating AI responsibilities",
        guidance: "All AI system related responsibilities should be defined and allocated",
        orderIndex: 3
      },
      {
        itemId: "A.5.3.2",
        title: "Segregation of Duties",
        description: "Separating conflicting duties related to AI",
        guidance: "Conflicting duties and areas of responsibility should be segregated",
        orderIndex: 4
      },
      {
        itemId: "A.5.4.1",
        title: "Accountability for AI Systems",
        description: "Assigning accountability for AI systems",
        guidance: "Accountability should be assigned for the establishment, implementation, maintenance, monitoring, evaluation and improvement of the AIMS",
        orderIndex: 5
      }
    ]
  },
  {
    categoryId: "A.6",
    title: "Internal Organization",
    description: "Establish internal organizational structures for AI management.",
    orderIndex: 2,
    items: [
      {
        itemId: "A.6.1.1",
        title: "AI Roles and Responsibilities",
        description: "Defining and allocating AI responsibilities",
        guidance: "All responsibilities related to the development, deployment, operation, and governance of AI systems should be clearly defined and allocated",
        orderIndex: 1
      },
      {
        itemId: "A.6.1.2",
        title: "Segregation of Duties",
        description: "Separating conflicting duties related to AI",
        guidance: "Conflicting duties and areas of responsibility should be segregated to reduce opportunities for unauthorized or unintentional modification",
        orderIndex: 2
      }
    ]
  },
  {
    categoryId: "A.7",
    title: "Resources for AI Systems",
    description: "Manage resources required for AI system development and operation.",
    orderIndex: 3,
    items: [
      {
        itemId: "A.7.1.1",
        title: "Identification of Resources",
        description: "Identifying resources needed for AI",
        guidance: "Resources necessary for the development, operation, and maintenance of AI systems should be identified and managed",
        orderIndex: 1
      },
      {
        itemId: "A.7.2.1",
        title: "Computational Resources",
        description: "Managing computational resources for AI",
        guidance: "Computational resources required for AI systems should be managed throughout their lifecycle",
        orderIndex: 2
      },
      {
        itemId: "A.7.3.1",
        title: "Data Resources",
        description: "Managing data resources for AI",
        guidance: "Data resources required for AI systems should be managed throughout their lifecycle",
        orderIndex: 3
      },
      {
        itemId: "A.7.4.1",
        title: "System Resources",
        description: "Managing system resources for AI",
        guidance: "System resources required for AI systems, including tools and infrastructure, should be managed throughout their lifecycle",
        orderIndex: 4
      },
      {
        itemId: "A.7.5.1",
        title: "Human Resources",
        description: "Managing human resources for AI",
        guidance: "Human resources required for AI systems, including roles, competencies, and training, should be managed throughout their lifecycle",
        orderIndex: 5
      }
    ]
  },
  {
    categoryId: "A.8",
    title: "AI System Lifecycle",
    description: "Manage the complete lifecycle of AI systems from conception to retirement.",
    orderIndex: 4,
    items: [
      {
        itemId: "A.8.1.1",
        title: "AI System Lifecycle Management",
        description: "Establishing and managing a defined AI lifecycle process",
        guidance: "A defined lifecycle process should be established and managed for AI systems, covering stages from conception through retirement",
        orderIndex: 1
      },
      {
        itemId: "A.8.2.1",
        title: "AI System Requirements Analysis",
        description: "Analyzing and specifying AI system requirements",
        guidance: "Requirements for AI systems, including functional, non-functional, data, ethical, legal, and societal aspects, should be analyzed and specified",
        orderIndex: 2
      },
      {
        itemId: "A.8.3.1",
        title: "AI System Design",
        description: "Designing AI systems based on requirements",
        guidance: "AI systems should be designed based on specified requirements, considering architecture, models, data handling, and interaction mechanisms",
        orderIndex: 3
      },
      {
        itemId: "A.8.4.1",
        title: "Data Acquisition and Preparation",
        description: "Acquiring and preparing data for AI systems",
        guidance: "Data for AI systems should be acquired, pre-processed, and prepared according to requirements and quality criteria",
        orderIndex: 4
      },
      {
        itemId: "A.8.5.1",
        title: "Model Building and Evaluation",
        description: "Building, training, and evaluating AI models",
        guidance: "AI models should be built, trained, tuned, and evaluated using appropriate techniques and metrics",
        orderIndex: 5
      }
    ]
  },
  {
    categoryId: "A.9",
    title: "Data for AI Systems",
    description: "Manage data quality, acquisition, and handling for AI systems.",
    orderIndex: 5,
    items: [
      {
        itemId: "A.9.1.1",
        title: "Data Quality for AI Systems",
        description: "Processes to ensure data quality characteristics",
        guidance: "Processes should be implemented to ensure that data used for developing and operating AI systems meets defined quality criteria",
        orderIndex: 1
      },
      {
        itemId: "A.9.2.1",
        title: "Data Acquisition",
        description: "Managing the acquisition of data for AI",
        guidance: "Data acquisition processes should ensure data is obtained legally, ethically, and according to specified requirements",
        orderIndex: 2
      },
      {
        itemId: "A.9.3.1",
        title: "Data Preparation",
        description: "Preparing data for use in AI systems",
        guidance: "Data should be prepared (cleaned, transformed, annotated) suitable for its intended use in AI system development and operation",
        orderIndex: 3
      },
      {
        itemId: "A.9.4.1",
        title: "Data Provenance",
        description: "Documenting the origin and history of data",
        guidance: "Information about the origin, history, and processing steps applied to data (provenance) should be documented and maintained",
        orderIndex: 4
      },
      {
        itemId: "A.9.5.1",
        title: "Data Privacy",
        description: "Protecting privacy in data used for AI",
        guidance: "Privacy requirements should be addressed throughout the data lifecycle, including anonymization or pseudonymization where appropriate",
        orderIndex: 5
      }
    ]
  },
  {
    categoryId: "A.10",
    title: "Information and Communication Technology (ICT)",
    description: "Establish ICT security and resilience for AI systems.",
    orderIndex: 6,
    items: [
      {
        itemId: "A.10.1.1",
        title: "Information Security for AI Systems",
        description: "Application of information security controls to AI systems",
        guidance: "Information security requirements and controls should be applied throughout the AI system lifecycle to protect confidentiality, integrity, and availability",
        orderIndex: 1
      },
      {
        itemId: "A.10.2.1",
        title: "Security of AI Models",
        description: "Protecting AI models from threats",
        guidance: "AI models should be protected against threats such as unauthorized access, modification, theft, or poisoning",
        orderIndex: 2
      },
      {
        itemId: "A.10.3.1",
        title: "Security of AI Data",
        description: "Protecting data used by AI systems",
        guidance: "Data used in AI systems should be protected according to information security policies and data classification",
        orderIndex: 3
      },
      {
        itemId: "A.10.4.1",
        title: "Resilience of AI Systems",
        description: "Ensuring AI systems are resilient to failures and attacks",
        guidance: "AI systems should be designed and operated to be resilient against failures, errors, and attacks",
        orderIndex: 4
      }
    ]
  },
  {
    categoryId: "A.11",
    title: "Third-Party Relationships",
    description: "Manage third-party relationships and associated risks for AI systems.",
    orderIndex: 7,
    items: [
      {
        itemId: "A.11.1.1",
        title: "Management of Third-Party AI Related Risks",
        description: "Managing risks when using third-party AI systems, components, or data",
        guidance: "Risks associated with third-party provision or use of AI systems, components, services, or data should be identified, assessed, and managed",
        orderIndex: 1
      },
      {
        itemId: "A.11.2.1",
        title: "Supplier Agreements for AI",
        description: "Including AI-specific requirements in supplier agreements",
        guidance: "Agreements with third parties supplying AI systems, components, services, or data should include relevant AI-specific requirements",
        orderIndex: 2
      },
      {
        itemId: "A.11.3.1",
        title: "Monitoring of Third-Party AI Services",
        description: "Monitoring third-party compliance and performance",
        guidance: "The performance and compliance of third parties involved in the AI system lifecycle should be monitored according to agreements",
        orderIndex: 3
      }
    ]
  }
];