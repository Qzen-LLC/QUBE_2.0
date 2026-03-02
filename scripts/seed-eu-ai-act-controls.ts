#!/usr/bin/env tsx

// Load environment variables
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.log('Warning: Could not load .env file');
}

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// EU AI Act Control Categories Data (13 categories)
const controlCategories = [
  { categoryId: '1', title: 'AI Literacy and Responsible AI Training', description: 'Ensure AI literacy and responsible AI training across the organization.', orderIndex: 1 },
  { categoryId: '2', title: 'Transparency and Provision of Information to Deployers', description: 'Ensure transparency in AI system deployment and information provision.', orderIndex: 2 },
  { categoryId: '3', title: 'Human Oversight', description: 'Establish effective human oversight mechanisms for AI systems.', orderIndex: 3 },
  { categoryId: '4', title: 'Corrective Actions and Duty of Information', description: 'Implement corrective actions and maintain information duties for AI systems.', orderIndex: 4 },
  { categoryId: '5', title: 'Responsibilities Along the AI Value Chain', description: 'Define and manage responsibilities throughout the AI value chain.', orderIndex: 5 },
  { categoryId: '6', title: 'Risk Management and Compliance', description: 'Implement comprehensive risk management and compliance measures for AI systems.', orderIndex: 6 },
  { categoryId: '7', title: 'Fundamental Rights Impact Assessment', description: 'Implement comprehensive fundamental rights impact assessments for AI systems.', orderIndex: 7 },
  { categoryId: '8', title: 'Transparency Obligations', description: 'Implement transparency obligations for AI systems under the EU AI Act.', orderIndex: 8 },
  { categoryId: '9', title: 'Registration and Conformity Assessment', description: 'Implement registration requirements and conformity assessments under the EU AI Act.', orderIndex: 9 },
  { categoryId: '10', title: 'Regulatory Compliance and Documentation', description: 'Maintain regulatory compliance and comprehensive documentation for AI systems.', orderIndex: 10 },
  { categoryId: '11', title: 'AI Lifecycle Risk Management', description: 'Implement comprehensive risk management throughout the AI system lifecycle.', orderIndex: 11 },
  { categoryId: '12', title: 'Post-Deployment Monitoring and Incident Management', description: 'Implement comprehensive post-deployment monitoring and incident management for AI systems.', orderIndex: 12 },
  { categoryId: '13', title: 'Continuous Monitoring and Incident Response', description: 'Maintain continuous monitoring and incident response capabilities for AI systems.', orderIndex: 13 }
];

// EU AI Act Control Structures Data
const controlStructures = [
  // Category 1
  { controlId: '1.1', title: 'AI Literacy and Responsible AI Training', description: 'Establish AI literacy and responsible AI training programs', orderIndex: 1, categoryId: '1' },
  { controlId: '1.2', title: 'Regulatory Training and Response Procedures', description: 'Establish regulatory training and response procedures', orderIndex: 2, categoryId: '1' },
  
  // Category 2
  { controlId: '2.1', title: 'Intended Use Description', description: 'Provide detailed descriptions of AI system intended use', orderIndex: 1, categoryId: '2' },
  { controlId: '2.2', title: 'Technical Documentation Review', description: 'Review and verify technical documentation', orderIndex: 2, categoryId: '2' },
  { controlId: '2.3', title: 'Record Maintenance of AI System Activities', description: 'Maintain accurate records of AI system activities', orderIndex: 3, categoryId: '2' },
  { controlId: '2.4', title: 'System Information Documentation', description: 'Document system information comprehensively', orderIndex: 4, categoryId: '2' },
  
  // Category 3
  { controlId: '3.1', title: 'Human Intervention Mechanisms', description: 'Define mechanisms for human intervention in AI operations', orderIndex: 1, categoryId: '3' },
  { controlId: '3.2', title: 'Oversight Documentation', description: 'Document oversight processes and limitations', orderIndex: 2, categoryId: '3' },
  
  // Category 4
  { controlId: '4.1', title: 'Risk Mitigation Procedures', description: 'Establish procedures for risk mitigation when serious incidents occur', orderIndex: 1, categoryId: '4' },
  { controlId: '4.2', title: 'Information Duties', description: 'Maintain information duties to relevant parties', orderIndex: 2, categoryId: '4' },
  
  // Category 5
  { controlId: '5.1', title: 'Value Chain Responsibilities', description: 'Clearly define responsibilities across the AI value chain', orderIndex: 1, categoryId: '5' },
  { controlId: '5.2', title: 'Provider Cooperation', description: 'Maintain cooperation with AI system providers', orderIndex: 2, categoryId: '5' },
  
  // Category 6
  { controlId: '6.1', title: 'AI Act Compliance Policies and Guidelines', description: 'Establish policies and guidelines for EU AI Act compliance', orderIndex: 1, categoryId: '6' },
  { controlId: '6.2', title: 'AI Risk Response Planning', description: 'Plan and implement responses to AI system risks', orderIndex: 2, categoryId: '6' },
  { controlId: '6.3', title: 'Compliance with AI System Instructions', description: 'Ensure compliance with AI system instructions for use', orderIndex: 3, categoryId: '6' },
  { controlId: '6.4', title: 'System Risk Controls Documentation', description: 'Document and manage system risk controls comprehensively', orderIndex: 4, categoryId: '6' },
  { controlId: '6.5', title: 'Transparency and Explainability Evaluation', description: 'Ensure transparency and explainability of AI systems', orderIndex: 5, categoryId: '6' },
  { controlId: '6.6', title: 'AI Model Explainability', description: 'Maintain explainability and documentation of AI models', orderIndex: 6, categoryId: '6' },
  { controlId: '6.7', title: 'Technical Documentation Maintenance', description: 'Maintain up-to-date technical documentation', orderIndex: 7, categoryId: '6' },
  { controlId: '6.8', title: 'Data Assessment and Validation', description: 'Assess and validate input data quality', orderIndex: 8, categoryId: '6' },
  { controlId: '6.9', title: 'AI System Logging Implementation', description: 'Implement comprehensive logging for AI systems', orderIndex: 9, categoryId: '6' },
  
  // Category 7
  { controlId: '7.1', title: 'Fundamental Rights Impact Assessment Process Development', description: 'Develop comprehensive processes for fundamental rights impact assessments', orderIndex: 1, categoryId: '7' },
  { controlId: '7.2', title: 'AI System Usage Process Description', description: 'Document AI system usage processes and intended purposes', orderIndex: 2, categoryId: '7' },
  { controlId: '7.3', title: 'Impacted Groups Identification', description: 'Identify all groups potentially affected by AI systems', orderIndex: 3, categoryId: '7' },
  { controlId: '7.4', title: 'Data Assessment', description: 'Assess data compliance with legal frameworks', orderIndex: 4, categoryId: '7' },
  { controlId: '7.5', title: 'Impact Measurement Strategy', description: 'Develop strategies for measuring AI system impacts', orderIndex: 5, categoryId: '7' },
  { controlId: '7.6', title: 'Bias and Fairness Evaluation', description: 'Evaluate bias, fairness, and other critical issues', orderIndex: 6, categoryId: '7' },
  { controlId: '7.7', title: 'Risk Documentation', description: 'Document risks to health, safety, and fundamental rights', orderIndex: 7, categoryId: '7' },
  { controlId: '7.8', title: 'Assessment Documentation Maintenance', description: 'Maintain comprehensive assessment documentation', orderIndex: 8, categoryId: '7' },
  { controlId: '7.9', title: 'Assessment Integration', description: 'Integrate assessments with existing data protection frameworks', orderIndex: 9, categoryId: '7' },
  { controlId: '7.10', title: 'Dataset Documentation and Evaluation', description: 'Document datasets and ensure representative evaluations', orderIndex: 10, categoryId: '7' },
  
  // Category 8
  { controlId: '8.1', title: 'User Notification of AI System Use', description: 'Design AI systems to clearly notify users of AI interaction', orderIndex: 1, categoryId: '8' },
  { controlId: '8.2', title: 'Clear AI Indication for Users', description: 'Ensure clear communication when users are subject to AI systems', orderIndex: 2, categoryId: '8' },
  { controlId: '8.3', title: 'AI System Scope and Impact Definition', description: 'Define and document AI system scope, goals, and impacts', orderIndex: 3, categoryId: '8' },
  { controlId: '8.4', title: 'AI System Activity Records', description: 'Maintain comprehensive records of AI system activities', orderIndex: 4, categoryId: '8' },
  
  // Category 9
  { controlId: '9.1', title: 'EU Database Registration', description: 'Complete conformity assessment and CE marking requirements', orderIndex: 1, categoryId: '9' },
  { controlId: '9.2', title: 'EU Database System Registration', description: 'Ensure AI systems are registered in the EU database', orderIndex: 2, categoryId: '9' },
  { controlId: '9.3', title: 'Technical Standards Identification', description: 'Identify necessary technical standards and certifications', orderIndex: 3, categoryId: '9' },
  { controlId: '9.4', title: 'Common Specifications Compliance', description: 'Comply with Commission-established specifications', orderIndex: 4, categoryId: '9' },
  { controlId: '9.5', title: 'Registration Records Management', description: 'Maintain records of registration activities', orderIndex: 5, categoryId: '9' },
  { controlId: '9.6', title: 'Database Entry Management', description: 'Ensure accurate and timely database entries', orderIndex: 6, categoryId: '9' },
  { controlId: '9.7', title: 'Registration Information Maintenance', description: 'Maintain current registration and conformity documentation', orderIndex: 7, categoryId: '9' },
  
  // Category 10
  { controlId: '10.1', title: 'Conformity Assessment Engagement', description: 'Engage with notified bodies or conduct internal assessments', orderIndex: 1, categoryId: '10' },
  { controlId: '10.2', title: 'Authority Response Processes', description: 'Establish processes for responding to authorities', orderIndex: 2, categoryId: '10' },
  { controlId: '10.3', title: 'Conformity Documentation Management', description: 'Maintain comprehensive conformity documentation and records', orderIndex: 3, categoryId: '10' },
  { controlId: '10.4', title: 'EU Database Data Entry Timeliness', description: 'Ensure timely and accurate database entries', orderIndex: 4, categoryId: '10' },
  
  // Category 11
  { controlId: '11.1', title: 'Impact Measurement Methodology', description: 'Define methods and tools for measuring AI system impacts', orderIndex: 1, categoryId: '11' },
  { controlId: '11.2', title: 'AI System Operations Monitoring', description: 'Monitor AI system operations according to usage instructions', orderIndex: 2, categoryId: '11' },
  { controlId: '11.3', title: 'Error and Incident Response', description: 'Track and respond to errors and incidents systematically', orderIndex: 3, categoryId: '11' },
  { controlId: '11.4', title: 'Expert and User Consultation', description: 'Consult with experts and end-users for risk management', orderIndex: 4, categoryId: '11' },
  { controlId: '11.5', title: 'AI System Change Documentation', description: 'Document and manage AI system changes and compliance', orderIndex: 5, categoryId: '11' },
  
  // Category 12
  { controlId: '12.1', title: 'Unexpected Impact Integration', description: 'Capture and integrate unexpected impact inputs', orderIndex: 1, categoryId: '12' },
  { controlId: '12.2', title: 'AI Model Capability Assessment', description: 'Assess AI model capabilities using appropriate tools', orderIndex: 2, categoryId: '12' },
  { controlId: '12.3', title: 'Post-Deployment Incident Monitoring', description: 'Monitor and respond to incidents after deployment', orderIndex: 3, categoryId: '12' },
  { controlId: '12.4', title: 'AI System Logging Implementation', description: 'Implement comprehensive logging systems for AI operations', orderIndex: 4, categoryId: '12' },
  { controlId: '12.5', title: 'Serious Incident Immediate Reporting', description: 'Ensure immediate reporting of serious incidents to relevant parties', orderIndex: 5, categoryId: '12' },
  
  // Category 13
  { controlId: '13.1', title: 'Continuous Monitoring Implementation', description: 'Implement continuous monitoring capabilities for AI systems', orderIndex: 1, categoryId: '13' },
  { controlId: '13.2', title: 'Incident Detection and Response', description: 'Detect and respond to AI system incidents promptly', orderIndex: 2, categoryId: '13' },
  { controlId: '13.3', title: 'Performance Monitoring and Assessment', description: 'Monitor and assess AI system performance continuously', orderIndex: 3, categoryId: '13' },
  { controlId: '13.4', title: 'Automated Alert Systems', description: 'Implement automated systems for AI incident alerts', orderIndex: 4, categoryId: '13' },
  { controlId: '13.5', title: 'Incident Documentation and Learning', description: 'Document incidents and implement learning processes', orderIndex: 5, categoryId: '13' }
];

// EU AI Act Subcontrol Structures Data (sample - you would need to add all subcontrols)
const subcontrolStructures = [
  // Category 1 Subcontrols
  { subcontrolId: '1.1.1', title: 'Executive Leadership Responsibility', description: 'We ensure executive leadership takes responsibility for decisions related to AI risks', orderIndex: 1, controlId: '1.1' },
  { subcontrolId: '1.1.2', title: 'AI Literacy Training', description: 'We provide AI literacy and ethics training to relevant personnel', orderIndex: 2, controlId: '1.1' },
  { subcontrolId: '1.1.3', title: 'Communication Plan', description: 'We develop a clear and concise communication plan for informing workers about the use of high-risk AI systems', orderIndex: 3, controlId: '1.1' },
  { subcontrolId: '1.2.1', title: 'Roles and Responsibilities', description: 'We clearly define roles and responsibilities related to AI risk management', orderIndex: 1, controlId: '1.2' },
  { subcontrolId: '1.2.2', title: 'Regulatory Training', description: 'We train personnel on the requirements of the regulation and the process for responding to requests', orderIndex: 2, controlId: '1.2' },
  
  // Category 2 Subcontrols
  { subcontrolId: '2.1.1', title: 'Intended Use Documentation', description: 'We provide detailed descriptions of the AI system\'s intended use', orderIndex: 1, controlId: '2.1' },
  { subcontrolId: '2.2.1', title: 'Documentation Review', description: 'We review and verify technical documentation from providers', orderIndex: 1, controlId: '2.2' },
  { subcontrolId: '2.3.1', title: 'Activity Records', description: 'We maintain accurate records of all AI system activities, including modifications and third-party involvements', orderIndex: 1, controlId: '2.3' },
  { subcontrolId: '2.4.1', title: 'System Information', description: 'We document system information, including functionality, limitations, and risk controls', orderIndex: 1, controlId: '2.4' },
  { subcontrolId: '2.4.2', title: 'Forbidden Uses', description: 'We define and document forbidden uses and foresee potential misuse', orderIndex: 2, controlId: '2.4' },
  
  // Add more subcontrols as needed - this is a sample to get you started
  // You can add all the remaining subcontrols from the SQL script above
];

async function seedEuAiActControls() {
  console.log('🌱 Seeding EU AI Act Control Framework...\n');

  try {
    // Insert Control Categories
    console.log('📋 Inserting Control Categories...');
    for (const category of controlCategories) {
      await prisma.euAiActControlCategory.upsert({
        where: { categoryId: category.categoryId },
        update: {
          title: category.title,
          description: category.description,
          orderIndex: category.orderIndex,
        },
        create: category,
      });
    }
    console.log(`✅ Inserted ${controlCategories.length} categories`);

    // Insert Control Structures
    console.log('\n🎯 Inserting Control Structures...');
    for (const control of controlStructures) {
      await prisma.euAiActControlStruct.upsert({
        where: { controlId: control.controlId },
        update: {
          title: control.title,
          description: control.description,
          orderIndex: control.orderIndex,
          categoryId: control.categoryId,
        },
        create: control,
      });
    }
    console.log(`✅ Inserted ${controlStructures.length} controls`);

    // Insert Subcontrol Structures
    console.log('\n🔧 Inserting Subcontrol Structures...');
    for (const subcontrol of subcontrolStructures) {
      await prisma.euAiActSubcontrolStruct.upsert({
        where: { subcontrolId: subcontrol.subcontrolId },
        update: {
          title: subcontrol.title,
          description: subcontrol.description,
          orderIndex: subcontrol.orderIndex,
          controlId: subcontrol.controlId,
        },
        create: subcontrol,
      });
    }
    console.log(`✅ Inserted ${subcontrolStructures.length} subcontrols`);

    // Verify the data
    console.log('\n📊 Verification Results:');
    
    const categories = await prisma.euAiActControlCategory.count();
    const controls = await prisma.euAiActControlStruct.count();
    const subcontrols = await prisma.euAiActSubcontrolStruct.count();
    
    console.log(`Categories: ${categories}`);
    console.log(`Controls: ${controls}`);
    console.log(`Subcontrols: ${subcontrols}`);

    // Detailed breakdown
    console.log('\n📈 Detailed Breakdown:');
    const breakdown = await prisma.euAiActControlCategory.findMany({
      include: {
        controls: {
          include: {
            subcontrols: true
          }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    breakdown.forEach((category) => {
      const controlCount = category.controls.length;
      const subcontrolCount = category.controls.reduce((sum, control) => sum + control.subcontrols.length, 0);
      console.log(`${category.title}: ${controlCount} controls, ${subcontrolCount} subcontrols`);
    });

    console.log('\n🎉 EU AI Act Control Framework seeded successfully!');
    console.log('\n💡 Note: This script includes sample subcontrols. You may need to add the remaining subcontrols from your complete dataset.');

  } catch (error) {
    console.error('❌ Error seeding EU AI Act controls:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedEuAiActControls();
}

export default seedEuAiActControls;