export const euAiActControlCategories = [
  {
    categoryId: "1",
    title: "AI Literacy and Responsible AI Training",
    description: "Ensure AI literacy and responsible AI training across the organization.",
    orderIndex: 1,
    controls: [
      {
        controlId: "1.1",
        title: "AI Literacy and Responsible AI Training",
        description: "Establish AI literacy and responsible AI training programs",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "1.1.1",
            title: "Executive Leadership Responsibility",
            description: "We ensure executive leadership takes responsibility for decisions related to AI risks",
            orderIndex: 1
          },
          {
            subcontrolId: "1.1.2",
            title: "AI Literacy Training",
            description: "We provide AI literacy and ethics training to relevant personnel",
            orderIndex: 2
          },
          {
            subcontrolId: "1.1.3",
            title: "Communication Plan",
            description: "We develop a clear and concise communication plan for informing workers about the use of high-risk AI systems",
            orderIndex: 3
          }
        ]
      },
      {
        controlId: "1.2",
        title: "Regulatory Training and Response Procedures",
        description: "Establish regulatory training and response procedures",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "1.2.1",
            title: "Roles and Responsibilities",
            description: "We clearly define roles and responsibilities related to AI risk management",
            orderIndex: 1
          },
          {
            subcontrolId: "1.2.2",
            title: "Regulatory Training",
            description: "We train personnel on the requirements of the regulation and the process for responding to requests",
            orderIndex: 2
          }
        ]
      }
    ]
  },
  {
    categoryId: "2",
    title: "Transparency and Provision of Information to Deployers",
    description: "Ensure transparency in AI system deployment and information provision.",
    orderIndex: 2,
    controls: [
      {
        controlId: "2.1",
        title: "Intended Use Description",
        description: "Provide detailed descriptions of AI system intended use",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "2.1.1",
            title: "Intended Use Documentation",
            description: "We provide detailed descriptions of the AI system's intended use",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "2.2",
        title: "Technical Documentation Review",
        description: "Review and verify technical documentation",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "2.2.1",
            title: "Documentation Review",
            description: "We review and verify technical documentation from providers",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "2.3",
        title: "Record Maintenance of AI System Activities",
        description: "Maintain accurate records of AI system activities",
        orderIndex: 3,
        subcontrols: [
          {
            subcontrolId: "2.3.1",
            title: "Activity Records",
            description: "We maintain accurate records of all AI system activities, including modifications and third-party involvements",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "2.4",
        title: "System Information Documentation",
        description: "Document system information comprehensively",
        orderIndex: 4,
        subcontrols: [
          {
            subcontrolId: "2.4.1",
            title: "System Information",
            description: "We document system information, including functionality, limitations, and risk controls",
            orderIndex: 1
          },
          {
            subcontrolId: "2.4.2",
            title: "Forbidden Uses",
            description: "We define and document forbidden uses and foresee potential misuse",
            orderIndex: 2
          }
        ]
      }
    ]
  },
  {
    categoryId: "3",
    title: "Human Oversight",
    description: "Establish effective human oversight mechanisms for AI systems.",
    orderIndex: 3,
    controls: [
      {
        controlId: "3.1",
        title: "Human Intervention Mechanisms",
        description: "Define mechanisms for human intervention in AI operations",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "3.1.1",
            title: "Intervention Mechanisms",
            description: "We define mechanisms for human intervention or override of AI outputs",
            orderIndex: 1
          },
          {
            subcontrolId: "3.1.2",
            title: "Competent Oversight",
            description: "We assign competent individuals with authority to oversee AI system usage",
            orderIndex: 2
          },
          {
            subcontrolId: "3.1.3",
            title: "Oversight Alignment",
            description: "We align oversight measures with provider's instructions for use",
            orderIndex: 3
          }
        ]
      },
      {
        controlId: "3.2",
        title: "Oversight Documentation",
        description: "Document oversight processes and limitations",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "3.2.1",
            title: "Limitation Documentation",
            description: "We document system limitations and human oversight options",
            orderIndex: 1
          },
          {
            subcontrolId: "3.2.2",
            title: "Appeal Processes",
            description: "We establish appeal processes related to AI system decisions",
            orderIndex: 2
          }
        ]
      }
    ]
  },
  {
    categoryId: "4",
    title: "Corrective Actions and Duty of Information",
    description: "Implement corrective actions and maintain information duties for AI systems.",
    orderIndex: 4,
    controls: [
      {
        controlId: "4.1",
        title: "Risk Mitigation Procedures",
        description: "Establish procedures for risk mitigation when serious incidents occur",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "4.1.1",
            title: "Risk Mitigation",
            description: "We have procedures to mitigate risks when serious incidents or malfunctions occur",
            orderIndex: 1
          },
          {
            subcontrolId: "4.1.2",
            title: "System Suspension",
            description: "We can suspend AI system operation when risks cannot be mitigated",
            orderIndex: 2
          }
        ]
      },
      {
        controlId: "4.2",
        title: "Information Duties",
        description: "Maintain information duties to relevant parties",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "4.2.1",
            title: "Provider Notification",
            description: "We inform providers about serious incidents or malfunctions",
            orderIndex: 1
          },
          {
            subcontrolId: "4.2.2",
            title: "Authority Notification",
            description: "We notify relevant authorities of serious incidents as required",
            orderIndex: 2
          }
        ]
      }
    ]
  },
  {
    categoryId: "5",
    title: "Responsibilities Along the AI Value Chain",
    description: "Define and manage responsibilities throughout the AI value chain.",
    orderIndex: 5,
    controls: [
      {
        controlId: "5.1",
        title: "Value Chain Responsibilities",
        description: "Clearly define responsibilities across the AI value chain",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "5.1.1",
            title: "Responsibility Documentation",
            description: "We document responsibilities of all parties in the AI value chain",
            orderIndex: 1
          },
          {
            subcontrolId: "5.1.2",
            title: "Contractual Agreements",
            description: "We establish clear contractual agreements defining roles and responsibilities",
            orderIndex: 2
          }
        ]
      },
      {
        controlId: "5.2",
        title: "Provider Cooperation",
        description: "Maintain cooperation with AI system providers",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "5.2.1",
            title: "Provider Cooperation",
            description: "We cooperate with providers for compliance and risk management",
            orderIndex: 1
          },
          {
            subcontrolId: "5.2.2",
            title: "Information Sharing",
            description: "We share relevant information with providers about system use and performance",
            orderIndex: 2
          }
        ]
      }
    ]
  },
  {
    categoryId: "6",
    title: "Risk Management and Compliance",
    description: "Implement comprehensive risk management and compliance measures for AI systems.",
    orderIndex: 6,
    controls: [
      {
        controlId: "6.1",
        title: "AI Act Compliance Policies and Guidelines",
        description: "Establish policies and guidelines for EU AI Act compliance",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "6.1.1",
            title: "Roles and Responsibilities Documentation",
            description: "We document roles, responsibilities, and communication lines for AI risk management",
            orderIndex: 1
          },
          {
            subcontrolId: "6.1.2",
            title: "Compliance Policies Development",
            description: "We develop policies and guidelines for AI Act compliance",
            orderIndex: 2
          }
        ]
      },
      {
        controlId: "6.2",
        title: "AI Risk Response Planning",
        description: "Plan and implement responses to AI system risks",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "6.2.1",
            title: "Risk Response Planning",
            description: "We plan responses to AI system risks, including defining risk tolerance and mitigation strategies",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "6.3",
        title: "Compliance with AI System Instructions",
        description: "Ensure compliance with AI system instructions for use",
        orderIndex: 3,
        subcontrols: [
          {
            subcontrolId: "6.3.1",
            title: "Technical and Organizational Measures",
            description: "We implement technical and organizational measures to adhere to AI system instructions for use",
            orderIndex: 1
          },
          {
            subcontrolId: "6.3.2",
            title: "System Evaluation",
            description: "We regularly evaluate safety, transparency, accountability, security, and resilience of AI systems",
            orderIndex: 2
          }
        ]
      },
      {
        controlId: "6.4",
        title: "System Risk Controls Documentation",
        description: "Document and manage system risk controls comprehensively",
        orderIndex: 4,
        subcontrols: [
          {
            subcontrolId: "6.4.1",
            title: "Legal Review",
            description: "We conduct thorough legal reviews relevant to AI system deployment",
            orderIndex: 1
          },
          {
            subcontrolId: "6.4.2",
            title: "Risk Prioritization",
            description: "We prioritize risk responses based on impact, likelihood, and resources",
            orderIndex: 2
          },
          {
            subcontrolId: "6.4.3",
            title: "Residual Risk Identification",
            description: "We identify residual risks to users and stakeholders",
            orderIndex: 3
          },
          {
            subcontrolId: "6.4.4",
            title: "Deployment Decision Evaluation",
            description: "We evaluate if AI systems meet objectives and decide on deployment continuation",
            orderIndex: 4
          },
          {
            subcontrolId: "6.4.5",
            title: "Cybersecurity Controls",
            description: "We implement cybersecurity controls to protect AI models",
            orderIndex: 5
          },
          {
            subcontrolId: "6.4.6",
            title: "Risk Controls Documentation",
            description: "We document system risk controls, including third-party components",
            orderIndex: 6
          }
        ]
      },
      {
        controlId: "6.5",
        title: "Transparency and Explainability Evaluation",
        description: "Ensure transparency and explainability of AI systems",
        orderIndex: 5,
        subcontrols: [
          {
            subcontrolId: "6.5.1",
            title: "Compliance Updates",
            description: "We regularly update compliance measures based on system or regulatory changes",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "6.6",
        title: "AI Model Explainability",
        description: "Maintain explainability and documentation of AI models",
        orderIndex: 6,
        subcontrols: [
          {
            subcontrolId: "6.6.1",
            title: "Model Explanation and Repository",
            description: "We explain AI models to ensure responsible use and maintain an AI systems repository",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "6.7",
        title: "Technical Documentation Maintenance",
        description: "Maintain up-to-date technical documentation",
        orderIndex: 7,
        subcontrols: [
          {
            subcontrolId: "6.7.1",
            title: "Documentation Updates",
            description: "We maintain and update technical documentation reflecting system changes",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "6.8",
        title: "Data Assessment and Validation",
        description: "Assess and validate input data quality",
        orderIndex: 8,
        subcontrols: [
          {
            subcontrolId: "6.8.1",
            title: "Data Relevance Assessment",
            description: "We assess input data relevance and representativeness",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "6.9",
        title: "AI System Logging Implementation",
        description: "Implement comprehensive logging for AI systems",
        orderIndex: 9,
        subcontrols: [
          {
            subcontrolId: "6.9.1",
            title: "Automatic Logging",
            description: "We implement automatic logging of AI system operations and retain logs appropriately",
            orderIndex: 1
          }
        ]
      }
    ]
  },
  {
    categoryId: "7",
    title: "Fundamental Rights Impact Assessment",
    description: "Implement comprehensive fundamental rights impact assessments for AI systems.",
    orderIndex: 7,
    controls: [
      {
        controlId: "7.1",
        title: "Fundamental Rights Impact Assessment Process Development",
        description: "Develop comprehensive processes for fundamental rights impact assessments",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "7.1.1",
            title: "Assessment Process Development",
            description: "We develop a comprehensive process for fundamental rights impact assessments",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "7.2",
        title: "AI System Usage Process Description",
        description: "Document AI system usage processes and intended purposes",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "7.2.1",
            title: "Usage Process Documentation",
            description: "We describe deployer processes for using high-risk AI systems, outlining intended purposes",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "7.3",
        title: "Impacted Groups Identification",
        description: "Identify all groups potentially affected by AI systems",
        orderIndex: 3,
        subcontrols: [
          {
            subcontrolId: "7.3.1",
            title: "Affected Groups Identification",
            description: "We identify all natural persons and groups potentially affected by AI system usage",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "7.4",
        title: "Data Assessment",
        description: "Assess data compliance with legal frameworks",
        orderIndex: 4,
        subcontrols: [
          {
            subcontrolId: "7.4.1",
            title: "Legal Data Assessment",
            description: "We assess data used by AI systems based on legal definitions (e.g., GDPR Article 3 (32))",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "7.5",
        title: "Impact Measurement Strategy",
        description: "Develop strategies for measuring AI system impacts",
        orderIndex: 5,
        subcontrols: [
          {
            subcontrolId: "7.5.1",
            title: "Impact Measurement Development",
            description: "We create and periodically re-evaluate strategies for measuring AI system impacts",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "7.6",
        title: "Bias and Fairness Evaluation",
        description: "Evaluate bias, fairness, and other critical issues",
        orderIndex: 6,
        subcontrols: [
          {
            subcontrolId: "7.6.1",
            title: "Comprehensive Evaluation",
            description: "We regularly evaluate bias, fairness, privacy, and environmental issues related to AI systems",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "7.7",
        title: "Risk Documentation",
        description: "Document risks to health, safety, and fundamental rights",
        orderIndex: 7,
        subcontrols: [
          {
            subcontrolId: "7.7.1",
            title: "Risk Documentation Process",
            description: "We document known or foreseeable risks to health, safety, or fundamental rights",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "7.8",
        title: "Assessment Documentation Maintenance",
        description: "Maintain comprehensive assessment documentation",
        orderIndex: 8,
        subcontrols: [
          {
            subcontrolId: "7.8.1",
            title: "Documentation Maintenance",
            description: "We maintain assessment documentation, including dates, results, and actions taken",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "7.9",
        title: "Assessment Integration",
        description: "Integrate assessments with existing data protection frameworks",
        orderIndex: 9,
        subcontrols: [
          {
            subcontrolId: "7.9.1",
            title: "DPIA Integration",
            description: "We integrate fundamental rights impact assessments with existing data protection assessments",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "7.10",
        title: "Dataset Documentation and Evaluation",
        description: "Document datasets and ensure representative evaluations",
        orderIndex: 10,
        subcontrols: [
          {
            subcontrolId: "7.10.1",
            title: "Dataset Specification",
            description: "We specify input data and details about training, validation, and testing datasets",
            orderIndex: 1
          },
          {
            subcontrolId: "7.10.2",
            title: "Human Subject Evaluation",
            description: "We ensure representative evaluations when using human subjects",
            orderIndex: 2
          }
        ]
      }
    ]
  },
  {
    categoryId: "8",
    title: "Transparency Obligations",
    description: "Implement transparency obligations for AI systems under the EU AI Act.",
    orderIndex: 8,
    controls: [
      {
        controlId: "8.1",
        title: "User Notification of AI System Use",
        description: "Design AI systems to clearly notify users of AI interaction",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "8.1.1",
            title: "AI Interaction Design",
            description: "We design AI systems to clearly indicate user interaction with AI",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "8.2",
        title: "Clear AI Indication for Users",
        description: "Ensure clear communication when users are subject to AI systems",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "8.2.1",
            title: "User Information",
            description: "We inform users when they are subject to AI system usage",
            orderIndex: 1
          },
          {
            subcontrolId: "8.2.2",
            title: "Clear Communication",
            description: "We ensure AI indications are clear and understandable for reasonably informed users",
            orderIndex: 2
          }
        ]
      },
      {
        controlId: "8.3",
        title: "AI System Scope and Impact Definition",
        description: "Define and document AI system scope, goals, and impacts",
        orderIndex: 3,
        subcontrols: [
          {
            subcontrolId: "8.3.1",
            title: "Scope and Impact Documentation",
            description: "We define and document AI system scope, goals, methods, and potential impacts",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "8.4",
        title: "AI System Activity Records",
        description: "Maintain comprehensive records of AI system activities",
        orderIndex: 4,
        subcontrols: [
          {
            subcontrolId: "8.4.1",
            title: "Activity Record Maintenance",
            description: "We maintain accurate records of AI system activities, modifications, and third-party involvements",
            orderIndex: 1
          }
        ]
      }
    ]
  },
  {
    categoryId: "9",
    title: "Registration and Conformity Assessment",
    description: "Implement registration requirements and conformity assessments under the EU AI Act.",
    orderIndex: 9,
    controls: [
      {
        controlId: "9.1",
        title: "EU Database Registration",
        description: "Complete conformity assessment and CE marking requirements",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "9.1.1",
            title: "Conformity Assessment Procedures",
            description: "We complete the relevant conformity assessment procedures",
            orderIndex: 1
          },
          {
            subcontrolId: "9.1.2",
            title: "CE Marking Verification",
            description: "We verify that high-risk AI systems have the required CE marking",
            orderIndex: 2
          }
        ]
      },
      {
        controlId: "9.2",
        title: "EU Database System Registration",
        description: "Ensure AI systems are registered in the EU database",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "9.2.1",
            title: "Article 71 Registration",
            description: "We ensure AI systems are registered in the EU database per Article 71",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "9.3",
        title: "Technical Standards Identification",
        description: "Identify necessary technical standards and certifications",
        orderIndex: 3,
        subcontrols: [
          {
            subcontrolId: "9.3.1",
            title: "Standards and Certifications",
            description: "We identify necessary technical standards and certifications for AI systems",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "9.4",
        title: "Common Specifications Compliance",
        description: "Comply with Commission-established specifications",
        orderIndex: 4,
        subcontrols: [
          {
            subcontrolId: "9.4.1",
            title: "Commission Specifications",
            description: "We comply with common specifications established by the Commission",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "9.5",
        title: "Registration Records Management",
        description: "Maintain records of registration activities",
        orderIndex: 5,
        subcontrols: [
          {
            subcontrolId: "9.5.1",
            title: "Registration Record Keeping",
            description: "We keep records of all registration activities and updates",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "9.6",
        title: "Database Entry Management",
        description: "Ensure accurate and timely database entries",
        orderIndex: 6,
        subcontrols: [
          {
            subcontrolId: "9.6.1",
            title: "Data Entry Accuracy",
            description: "We ensure timely and accurate data entry into the EU database",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "9.7",
        title: "Registration Information Maintenance",
        description: "Maintain current registration and conformity documentation",
        orderIndex: 7,
        subcontrols: [
          {
            subcontrolId: "9.7.1",
            title: "Information Currency",
            description: "We maintain up-to-date registration information and comprehensive conformity documentation",
            orderIndex: 1
          }
        ]
      }
    ]
  },
  {
    categoryId: "10",
    title: "Regulatory Compliance and Documentation",
    description: "Maintain regulatory compliance and comprehensive documentation for AI systems.",
    orderIndex: 10,
    controls: [
      {
        controlId: "10.1",
        title: "Conformity Assessment Engagement",
        description: "Engage with notified bodies or conduct internal assessments",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "10.1.1",
            title: "Assessment Engagement",
            description: "We engage with notified bodies or conduct internal conformity assessments",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "10.2",
        title: "Authority Response Processes",
        description: "Establish processes for responding to authorities",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "10.2.1",
            title: "Authority Request Response",
            description: "We establish processes to respond to national authority requests",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "10.3",
        title: "Conformity Documentation Management",
        description: "Maintain comprehensive conformity documentation and records",
        orderIndex: 3,
        subcontrols: [
          {
            subcontrolId: "10.3.1",
            title: "Conformity Documentation",
            description: "We maintain thorough documentation of AI system conformity",
            orderIndex: 1
          },
          {
            subcontrolId: "10.3.2",
            title: "Registration Records",
            description: "We keep records of registration and any subsequent updates",
            orderIndex: 2
          }
        ]
      },
      {
        controlId: "10.4",
        title: "EU Database Data Entry Timeliness",
        description: "Ensure timely and accurate database entries",
        orderIndex: 4,
        subcontrols: [
          {
            subcontrolId: "10.4.1",
            title: "Timely Data Entry",
            description: "We ensure timely and accurate data entry into the EU database",
            orderIndex: 1
          }
        ]
      }
    ]
  },
  {
    categoryId: "11",
    title: "AI Lifecycle Risk Management",
    description: "Implement comprehensive risk management throughout the AI system lifecycle.",
    orderIndex: 11,
    controls: [
      {
        controlId: "11.1",
        title: "Impact Measurement Methodology",
        description: "Define methods and tools for measuring AI system impacts",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "11.1.1",
            title: "Impact Measurement Definition",
            description: "We define methods and tools for measuring AI system impacts",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "11.2",
        title: "AI System Operations Monitoring",
        description: "Monitor AI system operations according to usage instructions",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "11.2.1",
            title: "Operations Monitoring",
            description: "We monitor AI system operations based on usage instructions",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "11.3",
        title: "Error and Incident Response",
        description: "Track and respond to errors and incidents systematically",
        orderIndex: 3,
        subcontrols: [
          {
            subcontrolId: "11.3.1",
            title: "Error Response Tracking",
            description: "We track and respond to errors and incidents through measurable activities",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "11.4",
        title: "Expert and User Consultation",
        description: "Consult with experts and end-users for risk management",
        orderIndex: 4,
        subcontrols: [
          {
            subcontrolId: "11.4.1",
            title: "Risk Management Consultation",
            description: "We consult with experts and end-users to inform risk management",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "11.5",
        title: "AI System Change Documentation",
        description: "Document and manage AI system changes and compliance",
        orderIndex: 5,
        subcontrols: [
          {
            subcontrolId: "11.5.1",
            title: "Objective Evaluation",
            description: "We continuously evaluate if AI systems meet objectives and decide on ongoing deployment",
            orderIndex: 1
          },
          {
            subcontrolId: "11.5.2",
            title: "Change and Metrics Documentation",
            description: "We document pre-determined changes and performance metrics",
            orderIndex: 2
          },
          {
            subcontrolId: "11.5.3",
            title: "Regulatory Compliance Updates",
            description: "We regularly review and update AI systems to maintain regulatory compliance",
            orderIndex: 3
          },
          {
            subcontrolId: "11.5.4",
            title: "Change Assessment Documentation",
            description: "We ensure that any system changes are documented and assessed for compliance",
            orderIndex: 4
          }
        ]
      }
    ]
  },
  {
    categoryId: "12",
    title: "Post-Deployment Monitoring and Incident Management",
    description: "Implement comprehensive post-deployment monitoring and incident management for AI systems.",
    orderIndex: 12,
    controls: [
      {
        controlId: "12.1",
        title: "Unexpected Impact Integration",
        description: "Capture and integrate unexpected impact inputs",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "12.1.1",
            title: "Impact Input Integration",
            description: "We implement processes to capture and integrate unexpected impact inputs",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "12.2",
        title: "AI Model Capability Assessment",
        description: "Assess AI model capabilities using appropriate tools",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "12.2.1",
            title: "Capability Assessment",
            description: "We assess AI model capabilities using appropriate tools",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "12.3",
        title: "Post-Deployment Incident Monitoring",
        description: "Monitor and respond to incidents after deployment",
        orderIndex: 3,
        subcontrols: [
          {
            subcontrolId: "12.3.1",
            title: "Unexpected Risk Planning",
            description: "We develop plans to address unexpected risks as they arise",
            orderIndex: 1
          },
          {
            subcontrolId: "12.3.2",
            title: "Incident Response Monitoring",
            description: "We monitor and respond to incidents post-deployment",
            orderIndex: 2
          }
        ]
      },
      {
        controlId: "12.4",
        title: "AI System Logging Implementation",
        description: "Implement comprehensive logging systems for AI operations",
        orderIndex: 4,
        subcontrols: [
          {
            subcontrolId: "12.4.1",
            title: "Log Capture and Storage",
            description: "We ensure providers implement systems for capturing and storing AI system logs",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "12.5",
        title: "Serious Incident Immediate Reporting",
        description: "Ensure immediate reporting of serious incidents to relevant parties",
        orderIndex: 5,
        subcontrols: [
          {
            subcontrolId: "12.5.1",
            title: "Immediate Incident Reporting",
            description: "We immediately report serious incidents to providers, importers, distributors, and relevant authorities",
            orderIndex: 1
          }
        ]
      }
    ]
  },
  {
    categoryId: "13",
    title: "Continuous Monitoring and Incident Response",
    description: "Maintain continuous monitoring and incident response capabilities for AI systems.",
    orderIndex: 13,
    controls: [
      {
        controlId: "13.1",
        title: "Unexpected Impact Integration",
        description: "Capture and integrate unexpected impact inputs",
        orderIndex: 1,
        subcontrols: [
          {
            subcontrolId: "13.1.1",
            title: "Impact Input Integration",
            description: "We implement processes to capture and integrate unexpected impact inputs",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "13.2",
        title: "AI Model Capability Assessment",
        description: "Assess AI model capabilities using appropriate tools",
        orderIndex: 2,
        subcontrols: [
          {
            subcontrolId: "13.2.1",
            title: "Capability Assessment",
            description: "We assess AI model capabilities using appropriate tools",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "13.3",
        title: "Post-Deployment Incident Monitoring",
        description: "Monitor and respond to incidents after deployment",
        orderIndex: 3,
        subcontrols: [
          {
            subcontrolId: "13.3.1",
            title: "Unexpected Risk Planning",
            description: "We develop plans to address unexpected risks as they arise",
            orderIndex: 1
          },
          {
            subcontrolId: "13.3.2",
            title: "Incident Response Monitoring",
            description: "We monitor and respond to incidents post-deployment",
            orderIndex: 2
          }
        ]
      },
      {
        controlId: "13.4",
        title: "AI System Logging Implementation",
        description: "Implement comprehensive logging systems for AI operations",
        orderIndex: 4,
        subcontrols: [
          {
            subcontrolId: "13.4.1",
            title: "Log Capture and Storage",
            description: "We ensure providers implement systems for capturing and storing AI system logs",
            orderIndex: 1
          }
        ]
      },
      {
        controlId: "13.5",
        title: "Serious Incident Immediate Reporting",
        description: "Ensure immediate reporting of serious incidents to relevant parties",
        orderIndex: 5,
        subcontrols: [
          {
            subcontrolId: "13.5.1",
            title: "Immediate Incident Reporting",
            description: "We immediately report serious incidents to providers, importers, distributors, and relevant authorities",
            orderIndex: 1
          }
        ]
      }
    ]
  }
];