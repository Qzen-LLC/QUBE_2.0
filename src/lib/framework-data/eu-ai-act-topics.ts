export const euAiActTopics = [
  {
    topicId: "1",
    title: "Project Scope",
    description: "Define and document the scope of the AI project including environment, technology, and stakeholder requirements.",
    orderIndex: 1,
    subtopics: [
      {
        subtopicId: "1.1",
        title: "General",
        description: "General project scope documentation",
        orderIndex: 1,
        questions: [
          {
            questionId: "1.1.1",
            question: "Describe the AI environment/application used",
            priority: "High",
            answerType: "Long text",
            orderIndex: 1
          },
          {
            questionId: "1.1.2",
            question: "Is a new form of AI technology used?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 2
          },
          {
            questionId: "1.1.3",
            question: "Are personal sensitive data used?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 3
          },
          {
            questionId: "1.1.4",
            question: "Project scope documents description",
            priority: "High",
            answerType: "Long text",
            orderIndex: 4
          }
        ]
      },
      {
        subtopicId: "1.2",
        title: "Technology Details",
        description: "Detailed technology requirements and specifications",
        orderIndex: 2,
        questions: [
          {
            questionId: "1.2.1",
            question: "What type of AI technology are you using? Explain AI and ML technologies used",
            priority: "High",
            answerType: "Long text",
            orderIndex: 1
          },
          {
            questionId: "1.2.2",
            question: "Is there ongoing monitoring of the system to ensure that the system is operating as intended?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 2
          },
          {
            questionId: "1.2.3",
            question: "Have you considered unintended outcomes that could occur from the use of this system?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 3
          },
          {
            questionId: "1.2.4",
            question: "Add technology documentation. You can include a data flow diagram, MLops lifecycle diagram",
            priority: "High",
            answerType: "Long text",
            orderIndex: 4
          }
        ]
      }
    ]
  },
  {
    topicId: "2",
    title: "Risk Management System",
    description: "Establish comprehensive risk management processes for AI systems.",
    orderIndex: 2,
    subtopics: [
      {
        subtopicId: "2.1",
        title: "Transparency and Provision of Information to Deployers",
        description: "Ensure transparency in AI system deployment and information sharing",
        orderIndex: 1,
        questions: [
          {
            questionId: "2.1.1",
            question: "Will you make substantial modifications to the high-risk AI system already on the EU market?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 1
          },
          {
            questionId: "2.1.2",
            question: "What business problem does the AI system solve, and what are its capabilities?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 2
          },
          {
            questionId: "2.1.3",
            question: "How has your organization assessed the AI application against its ethical values?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 3
          }
        ]
      },
      {
        subtopicId: "2.2",
        title: "Responsibilities Along the AI Value Chain",
        description: "Define responsibilities across the AI development and deployment value chain",
        orderIndex: 2,
        questions: [
          {
            questionId: "2.2.1",
            question: "Specify details of any third-party involvement in the design, development, deployment, and support of the AI system",
            priority: "High",
            answerType: "Long text",
            orderIndex: 1
          },
          {
            questionId: "2.2.2",
            question: "What risks were identified in the data impact assessment?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 2
          },
          {
            questionId: "2.2.3",
            question: "How has the selection or development of the model been assessed with regard to fairness, explainability, and robustness?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 3
          },
          {
            questionId: "2.2.4",
            question: "What strategies have been implemented to address the risks identified in the model assessment?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 4
          }
        ]
      }
    ]
  },
  {
    topicId: "3",
    title: "Data Governance",
    description: "Establish data governance frameworks for AI systems.",
    orderIndex: 3,
    subtopics: [
      {
        subtopicId: "3.1",
        title: "Responsibilities Along the AI Value Chain",
        description: "Data-related responsibilities across the AI value chain",
        orderIndex: 1,
        questions: [
          {
            questionId: "3.1.1",
            question: "What risks have been identified associated with the chosen deployment and serving strategies?",
            priority: "Medium",
            answerType: "Long text",
            orderIndex: 1
          },
          {
            questionId: "3.1.2",
            question: "What measures are in place to detect undesired behavior in our AI solution?",
            priority: "Medium",
            answerType: "Long text",
            orderIndex: 2
          },
          {
            questionId: "3.1.3",
            question: "How can any unforeseen effects be mitigated after deployment of the AI application?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 3
          },
          {
            questionId: "3.1.4",
            question: "What is the possible harmful effect of uncertainty and error margins for different groups?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 4
          },
          {
            questionId: "3.1.5",
            question: "What mechanisms are in place for reporting serious incidents and certain risks?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 5
          },
          {
            questionId: "3.1.6",
            question: "What risks have been identified associated with potentially decommissioning the AI system?",
            priority: "Medium",
            answerType: "Long text",
            orderIndex: 6
          },
          {
            questionId: "3.1.7",
            question: "What data sources are being used to develop the AI application?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 7
          },
          {
            questionId: "3.1.8",
            question: "Does the repository track and manage intellectual property rights and restrictions?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 8
          }
        ]
      },
      {
        subtopicId: "3.2",
        title: "Fundamental Rights Impact Assessments",
        description: "Assess impact on fundamental rights and privacy",
        orderIndex: 2,
        questions: [
          {
            questionId: "3.2.1",
            question: "How has your organization ensured the representativeness, relevance, accuracy, traceability, and completeness of the data?",
            priority: "Medium",
            answerType: "Long text",
            orderIndex: 1
          },
          {
            questionId: "3.2.2",
            question: "Provide details of the confidential and sensitive data processed by the AI system",
            priority: "High",
            answerType: "Long text",
            orderIndex: 2
          },
          {
            questionId: "3.2.3",
            question: "What are the legal bases for processing personal and sensitive data?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 3
          },
          {
            questionId: "3.2.4",
            question: "Describe the measures in place to ensure that the AI system does not leak private or sensitive data",
            priority: "High",
            answerType: "Long text",
            orderIndex: 4
          },
          {
            questionId: "3.2.5",
            question: "How has legal compliance with respect to data protection (e.g., GDPR) been assessed and ensured?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 5
          },
          {
            questionId: "3.2.6",
            question: "Provide details of the measures in place to comply with data subject requests",
            priority: "High",
            answerType: "Long text",
            orderIndex: 6
          },
          {
            questionId: "3.2.7",
            question: "Has the organization determined how the privacy of those involved is protected?",
            priority: "High",
            answerType: "Long text",
            orderIndex: 7
          },
          {
            questionId: "3.2.8",
            question: "Can the user delete their data from the system?",
            priority: "Medium",
            answerType: "Long text",
            orderIndex: 8
          }
        ]
      }
    ]
  }
  // Additional topics would be added here following the same pattern...
];