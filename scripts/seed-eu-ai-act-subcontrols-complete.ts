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

// Complete EU AI Act Subcontrol Structures Data
const allSubcontrolStructures = [
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
  
  // Category 3 Subcontrols
  { subcontrolId: '3.1.1', title: 'Intervention Mechanisms', description: 'We define mechanisms for human intervention or override of AI outputs', orderIndex: 1, controlId: '3.1' },
  { subcontrolId: '3.1.2', title: 'Competent Oversight', description: 'We assign competent individuals with authority to oversee AI system usage', orderIndex: 2, controlId: '3.1' },
  { subcontrolId: '3.1.3', title: 'Oversight Alignment', description: 'We align oversight measures with provider\'s instructions for use', orderIndex: 3, controlId: '3.1' },
  { subcontrolId: '3.2.1', title: 'Limitation Documentation', description: 'We document system limitations and human oversight options', orderIndex: 1, controlId: '3.2' },
  { subcontrolId: '3.2.2', title: 'Appeal Processes', description: 'We establish appeal processes related to AI system decisions', orderIndex: 2, controlId: '3.2' },
  
  // Category 4 Subcontrols
  { subcontrolId: '4.1.1', title: 'Risk Mitigation', description: 'We have procedures to mitigate risks when serious incidents or malfunctions occur', orderIndex: 1, controlId: '4.1' },
  { subcontrolId: '4.1.2', title: 'System Suspension', description: 'We can suspend AI system operation when risks cannot be mitigated', orderIndex: 2, controlId: '4.1' },
  { subcontrolId: '4.2.1', title: 'Provider Notification', description: 'We inform providers about serious incidents or malfunctions', orderIndex: 1, controlId: '4.2' },
  { subcontrolId: '4.2.2', title: 'Authority Notification', description: 'We notify relevant authorities of serious incidents as required', orderIndex: 2, controlId: '4.2' },
  
  // Category 5 Subcontrols
  { subcontrolId: '5.1.1', title: 'Responsibility Documentation', description: 'We document responsibilities of all parties in the AI value chain', orderIndex: 1, controlId: '5.1' },
  { subcontrolId: '5.1.2', title: 'Contractual Agreements', description: 'We establish clear contractual agreements defining roles and responsibilities', orderIndex: 2, controlId: '5.1' },
  { subcontrolId: '5.2.1', title: 'Provider Cooperation', description: 'We cooperate with providers for compliance and risk management', orderIndex: 1, controlId: '5.2' },
  { subcontrolId: '5.2.2', title: 'Information Sharing', description: 'We share relevant information with providers about system use and performance', orderIndex: 2, controlId: '5.2' },
  
  // Category 6 Subcontrols
  { subcontrolId: '6.1.1', title: 'Roles and Responsibilities Documentation', description: 'We document roles, responsibilities, and communication lines for AI risk management', orderIndex: 1, controlId: '6.1' },
  { subcontrolId: '6.1.2', title: 'Compliance Policies Development', description: 'We develop policies and guidelines for AI Act compliance', orderIndex: 2, controlId: '6.1' },
  { subcontrolId: '6.2.1', title: 'Risk Response Planning', description: 'We plan responses to AI system risks, including defining risk tolerance and mitigation strategies', orderIndex: 1, controlId: '6.2' },
  { subcontrolId: '6.3.1', title: 'Technical and Organizational Measures', description: 'We implement technical and organizational measures to adhere to AI system instructions for use', orderIndex: 1, controlId: '6.3' },
  { subcontrolId: '6.3.2', title: 'System Evaluation', description: 'We regularly evaluate safety, transparency, accountability, security, and resilience of AI systems', orderIndex: 2, controlId: '6.3' },
  { subcontrolId: '6.4.1', title: 'Legal Review', description: 'We conduct thorough legal reviews relevant to AI system deployment', orderIndex: 1, controlId: '6.4' },
  { subcontrolId: '6.4.2', title: 'Risk Prioritization', description: 'We prioritize risk responses based on impact, likelihood, and resources', orderIndex: 2, controlId: '6.4' },
  { subcontrolId: '6.4.3', title: 'Residual Risk Identification', description: 'We identify residual risks to users and stakeholders', orderIndex: 3, controlId: '6.4' },
  { subcontrolId: '6.4.4', title: 'Deployment Decision Evaluation', description: 'We evaluate if AI systems meet objectives and decide on deployment continuation', orderIndex: 4, controlId: '6.4' },
  { subcontrolId: '6.4.5', title: 'Cybersecurity Controls', description: 'We implement cybersecurity controls to protect AI models', orderIndex: 5, controlId: '6.4' },
  { subcontrolId: '6.4.6', title: 'Risk Controls Documentation', description: 'We document system risk controls, including third-party components', orderIndex: 6, controlId: '6.4' },
  { subcontrolId: '6.5.1', title: 'Compliance Updates', description: 'We regularly update compliance measures based on system or regulatory changes', orderIndex: 1, controlId: '6.5' },
  { subcontrolId: '6.6.1', title: 'Model Explanation and Repository', description: 'We explain AI models to ensure responsible use and maintain an AI systems repository', orderIndex: 1, controlId: '6.6' },
  { subcontrolId: '6.7.1', title: 'Documentation Updates', description: 'We maintain and update technical documentation reflecting system changes', orderIndex: 1, controlId: '6.7' },
  { subcontrolId: '6.8.1', title: 'Data Relevance Assessment', description: 'We assess input data relevance and representativeness', orderIndex: 1, controlId: '6.8' },
  { subcontrolId: '6.9.1', title: 'Automatic Logging', description: 'We implement automatic logging of AI system operations and retain logs appropriately', orderIndex: 1, controlId: '6.9' },
  
  // Category 7 Subcontrols
  { subcontrolId: '7.1.1', title: 'Assessment Process Development', description: 'We develop a comprehensive process for fundamental rights impact assessments', orderIndex: 1, controlId: '7.1' },
  { subcontrolId: '7.2.1', title: 'Usage Process Documentation', description: 'We describe deployer processes for using high-risk AI systems, outlining intended purposes', orderIndex: 1, controlId: '7.2' },
  { subcontrolId: '7.3.1', title: 'Affected Groups Identification', description: 'We identify all natural persons and groups potentially affected by AI system usage', orderIndex: 1, controlId: '7.3' },
  { subcontrolId: '7.4.1', title: 'Legal Data Assessment', description: 'We assess data used by AI systems based on legal definitions (e.g., GDPR Article 3 (32))', orderIndex: 1, controlId: '7.4' },
  { subcontrolId: '7.5.1', title: 'Impact Measurement Development', description: 'We create and periodically re-evaluate strategies for measuring AI system impacts', orderIndex: 1, controlId: '7.5' },
  { subcontrolId: '7.6.1', title: 'Comprehensive Evaluation', description: 'We regularly evaluate bias, fairness, privacy, and environmental issues related to AI systems', orderIndex: 1, controlId: '7.6' },
  { subcontrolId: '7.7.1', title: 'Risk Documentation Process', description: 'We document known or foreseeable risks to health, safety, or fundamental rights', orderIndex: 1, controlId: '7.7' },
  { subcontrolId: '7.8.1', title: 'Documentation Maintenance', description: 'We maintain assessment documentation, including dates, results, and actions taken', orderIndex: 1, controlId: '7.8' },
  { subcontrolId: '7.9.1', title: 'DPIA Integration', description: 'We integrate fundamental rights impact assessments with existing data protection assessments', orderIndex: 1, controlId: '7.9' },
  { subcontrolId: '7.10.1', title: 'Dataset Specification', description: 'We specify input data and details about training, validation, and testing datasets', orderIndex: 1, controlId: '7.10' },
  { subcontrolId: '7.10.2', title: 'Human Subject Evaluation', description: 'We ensure representative evaluations when using human subjects', orderIndex: 2, controlId: '7.10' },
  
  // Category 8 Subcontrols
  { subcontrolId: '8.1.1', title: 'AI Interaction Design', description: 'We design AI systems to clearly indicate user interaction with AI', orderIndex: 1, controlId: '8.1' },
  { subcontrolId: '8.2.1', title: 'User Information', description: 'We inform users when they are subject to AI system usage', orderIndex: 1, controlId: '8.2' },
  { subcontrolId: '8.2.2', title: 'Clear Communication', description: 'We ensure AI indications are clear and understandable for reasonably informed users', orderIndex: 2, controlId: '8.2' },
  { subcontrolId: '8.3.1', title: 'Scope and Impact Documentation', description: 'We define and document AI system scope, goals, methods, and potential impacts', orderIndex: 1, controlId: '8.3' },
  { subcontrolId: '8.4.1', title: 'Activity Record Maintenance', description: 'We maintain accurate records of AI system activities, modifications, and third-party involvements', orderIndex: 1, controlId: '8.4' },
  
  // Category 9 Subcontrols
  { subcontrolId: '9.1.1', title: 'Conformity Assessment Procedures', description: 'We complete the relevant conformity assessment procedures', orderIndex: 1, controlId: '9.1' },
  { subcontrolId: '9.1.2', title: 'CE Marking Verification', description: 'We verify that high-risk AI systems have the required CE marking', orderIndex: 2, controlId: '9.1' },
  { subcontrolId: '9.2.1', title: 'Article 71 Registration', description: 'We ensure AI systems are registered in the EU database per Article 71', orderIndex: 1, controlId: '9.2' },
  { subcontrolId: '9.3.1', title: 'Standards and Certifications', description: 'We identify necessary technical standards and certifications for AI systems', orderIndex: 1, controlId: '9.3' },
  { subcontrolId: '9.4.1', title: 'Commission Specifications', description: 'We comply with common specifications established by the Commission', orderIndex: 1, controlId: '9.4' },
  { subcontrolId: '9.5.1', title: 'Registration Record Keeping', description: 'We keep records of all registration activities and updates', orderIndex: 1, controlId: '9.5' },
  { subcontrolId: '9.6.1', title: 'Data Entry Accuracy', description: 'We ensure timely and accurate data entry into the EU database', orderIndex: 1, controlId: '9.6' },
  { subcontrolId: '9.7.1', title: 'Information Currency', description: 'We maintain up-to-date registration information and comprehensive conformity documentation', orderIndex: 1, controlId: '9.7' },
  
  // Category 10 Subcontrols
  { subcontrolId: '10.1.1', title: 'Assessment Engagement', description: 'We engage with notified bodies or conduct internal conformity assessments', orderIndex: 1, controlId: '10.1' },
  { subcontrolId: '10.2.1', title: 'Authority Request Response', description: 'We establish processes to respond to national authority requests', orderIndex: 1, controlId: '10.2' },
  { subcontrolId: '10.3.1', title: 'Conformity Documentation', description: 'We maintain thorough documentation of AI system conformity', orderIndex: 1, controlId: '10.3' },
  { subcontrolId: '10.3.2', title: 'Registration Records', description: 'We keep records of registration and any subsequent updates', orderIndex: 2, controlId: '10.3' },
  { subcontrolId: '10.4.1', title: 'Timely Data Entry', description: 'We ensure timely and accurate data entry into the EU database', orderIndex: 1, controlId: '10.4' },
  
  // Category 11 Subcontrols
  { subcontrolId: '11.1.1', title: 'Impact Measurement Definition', description: 'We define methods and tools for measuring AI system impacts', orderIndex: 1, controlId: '11.1' },
  { subcontrolId: '11.2.1', title: 'Operations Monitoring', description: 'We monitor AI system operations based on usage instructions', orderIndex: 1, controlId: '11.2' },
  { subcontrolId: '11.3.1', title: 'Error Response Tracking', description: 'We track and respond to errors and incidents through measurable activities', orderIndex: 1, controlId: '11.3' },
  { subcontrolId: '11.4.1', title: 'Risk Management Consultation', description: 'We consult with experts and end-users to inform risk management', orderIndex: 1, controlId: '11.4' },
  { subcontrolId: '11.5.1', title: 'Objective Evaluation', description: 'We continuously evaluate if AI systems meet objectives and decide on ongoing deployment', orderIndex: 1, controlId: '11.5' },
  { subcontrolId: '11.5.2', title: 'Change and Metrics Documentation', description: 'We document pre-determined changes and performance metrics', orderIndex: 2, controlId: '11.5' },
  { subcontrolId: '11.5.3', title: 'Regulatory Compliance Updates', description: 'We regularly review and update AI systems to maintain regulatory compliance', orderIndex: 3, controlId: '11.5' },
  { subcontrolId: '11.5.4', title: 'Change Assessment Documentation', description: 'We ensure that any system changes are documented and assessed for compliance', orderIndex: 4, controlId: '11.5' },
  
  // Category 12 Subcontrols
  { subcontrolId: '12.1.1', title: 'Impact Input Integration', description: 'We implement processes to capture and integrate unexpected impact inputs', orderIndex: 1, controlId: '12.1' },
  { subcontrolId: '12.2.1', title: 'Capability Assessment', description: 'We assess AI model capabilities using appropriate tools', orderIndex: 1, controlId: '12.2' },
  { subcontrolId: '12.3.1', title: 'Unexpected Risk Planning', description: 'We develop plans to address unexpected risks as they arise', orderIndex: 1, controlId: '12.3' },
  { subcontrolId: '12.3.2', title: 'Incident Response Monitoring', description: 'We monitor and respond to incidents post-deployment', orderIndex: 2, controlId: '12.3' },
  { subcontrolId: '12.4.1', title: 'Log Capture and Storage', description: 'We ensure providers implement systems for capturing and storing AI system logs', orderIndex: 1, controlId: '12.4' },
  { subcontrolId: '12.5.1', title: 'Immediate Incident Reporting', description: 'We immediately report serious incidents to providers, importers, distributors, and relevant authorities', orderIndex: 1, controlId: '12.5' },
  
  // Category 13 Subcontrols
  { subcontrolId: '13.1.1', title: 'Monitoring Framework Implementation', description: 'We implement comprehensive monitoring frameworks for continuous AI system oversight', orderIndex: 1, controlId: '13.1' },
  { subcontrolId: '13.2.1', title: 'Incident Detection Systems', description: 'We maintain systems to detect AI incidents and anomalies in real-time', orderIndex: 1, controlId: '13.2' },
  { subcontrolId: '13.2.2', title: 'Response Protocol Execution', description: 'We execute established response protocols when incidents are detected', orderIndex: 2, controlId: '13.2' },
  { subcontrolId: '13.3.1', title: 'Performance Metric Tracking', description: 'We track key performance metrics for AI systems on an ongoing basis', orderIndex: 1, controlId: '13.3' },
  { subcontrolId: '13.3.2', title: 'Assessment Review Cycles', description: 'We conduct regular assessment review cycles to evaluate AI system performance', orderIndex: 2, controlId: '13.3' },
  { subcontrolId: '13.4.1', title: 'Automated Alert Configuration', description: 'We configure automated alert systems for critical AI system events', orderIndex: 1, controlId: '13.4' },
  { subcontrolId: '13.5.1', title: 'Incident Documentation Process', description: 'We maintain comprehensive documentation of all AI system incidents', orderIndex: 1, controlId: '13.5' },
  { subcontrolId: '13.5.2', title: 'Learning and Improvement', description: 'We implement learning processes to improve AI systems based on incident analysis', orderIndex: 2, controlId: '13.5' },
];

async function seedEuAiActSubcontrolsComplete() {
  console.log('🔧 Seeding Complete EU AI Act Subcontrols...\n');

  try {
    console.log(`📋 Inserting ${allSubcontrolStructures.length} subcontrols...`);
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const subcontrol of allSubcontrolStructures) {
      const result = await prisma.euAiActSubcontrolStruct.upsert({
        where: { subcontrolId: subcontrol.subcontrolId },
        update: {
          title: subcontrol.title,
          description: subcontrol.description,
          orderIndex: subcontrol.orderIndex,
          controlId: subcontrol.controlId,
        },
        create: subcontrol,
      });
      
      // Check if this was an insert or update
      const existing = await prisma.euAiActSubcontrolStruct.findUnique({
        where: { subcontrolId: subcontrol.subcontrolId }
      });
      
      if (existing) {
        updatedCount++;
      } else {
        insertedCount++;
      }
    }
    
    console.log(`✅ Processed ${allSubcontrolStructures.length} subcontrols`);
    console.log(`   - New: ${insertedCount}`);
    console.log(`   - Updated: ${updatedCount}`);

    // Verify the final count
    console.log('\n📊 Final Verification:');
    
    const totalSubcontrols = await prisma.euAiActSubcontrolStruct.count();
    console.log(`Total Subcontrols: ${totalSubcontrols}`);

    // Detailed breakdown by category
    console.log('\n📈 Subcontrols by Category:');
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

    let totalSubcontrolsVerify = 0;
    breakdown.forEach((category) => {
      const subcontrolCount = category.controls.reduce((sum, control) => sum + control.subcontrols.length, 0);
      totalSubcontrolsVerify += subcontrolCount;
      console.log(`${category.title}: ${subcontrolCount} subcontrols`);
    });

    console.log(`\n🎯 Total subcontrols across all categories: ${totalSubcontrolsVerify}`);
    console.log('\n🎉 Complete EU AI Act Subcontrols seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding EU AI Act subcontrols:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedEuAiActSubcontrolsComplete();
}

export default seedEuAiActSubcontrolsComplete;