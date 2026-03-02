import { prismaClient } from '../src/utils/db';

async function main() {
  console.log('Seeding sample users and organizations...');

  // Create a sample organization
  const organization = await prismaClient.organization.create({
    data: {
      name: 'Sample Organization',
      domain: 'sample.com',
      isActive: true,
    },
  });

  console.log('Created organization:', organization.name);

  // Create sample users
  const users = [
    {
      clerkId: 'user_2abc123def456', // Replace with actual Clerk user ID
      email: 'admin@sample.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ORG_ADMIN',
      organizationId: organization.id,
    },
    {
      clerkId: 'user_2def456ghi789', // Replace with actual Clerk user ID
      email: 'user@sample.com',
      firstName: 'Regular',
      lastName: 'User',
      role: 'ORG_USER',
      organizationId: organization.id,
    },
    {
      clerkId: 'user_2ghi789jkl012', // Replace with actual Clerk user ID
      email: 'qzen@admin.com',
      firstName: 'QZen',
      lastName: 'Admin',
      role: 'QZEN_ADMIN',
      organizationId: null,
    },
  ];

  for (const userData of users) {
    const user = await prismaClient.user.create({
      data: userData,
    });
    console.log('[CRUD_LOG] User created (script):', { id: user.id, email: user.email, role: user.role, authoredBy: user.id });
    console.log('Created user:', user.email, 'with role:', user.role);
  }

  // Create sample use cases
  const useCases = [
    {
      title: 'AI-Powered Customer Support',
      problemStatement: 'Manual customer support is slow and expensive',
      proposedAISolution: 'Implement AI chatbot for customer inquiries',
      keyBenefits: 'Reduced response time, cost savings',
      currentState: 'Manual phone and email support',
      desiredState: 'Automated AI chatbot with human fallback',
      primaryStakeholders: ['Customer Service Team', 'IT Department'],
      secondaryStakeholders: ['Customers', 'Management'],
      successCriteria: ['50% reduction in response time', '30% cost savings'],
      problemValidation: 'Customer satisfaction surveys show long wait times',
      solutionHypothesis: 'AI chatbot can handle 80% of common inquiries',
      keyAssumptions: ['AI can understand customer intent', 'Integration with existing systems'],
      initialCost: '50000',
      initialROI: '150%',
      confidenceLevel: 75,
      operationalImpactScore: 8,
      productivityImpactScore: 9,
      revenueImpactScore: 7,
      implementationComplexity: 6,
      estimatedTimeline: '6 months',
      plannedStartDate: '2024-01-15',
      estimatedTimelineMonths: '6',
      requiredResources: 'AI development team, customer service training',
      businessFunction: 'Customer Service',
      stage: 'Planning',
      priority: 'HIGH',
      organizationId: organization.id,
      userId: 'user_2abc123def456', // Admin user
      aiucId: 1,
    },
    {
      title: 'Predictive Maintenance System',
      problemStatement: 'Equipment failures cause costly downtime',
      proposedAISolution: 'ML-based predictive maintenance system',
      keyBenefits: 'Reduced downtime, optimized maintenance schedules',
      currentState: 'Reactive maintenance approach',
      desiredState: 'Proactive maintenance with AI predictions',
      primaryStakeholders: ['Operations Team', 'Maintenance Crew'],
      secondaryStakeholders: ['Management', 'Equipment Suppliers'],
      successCriteria: ['20% reduction in unplanned downtime', '15% maintenance cost reduction'],
      problemValidation: 'Equipment failure logs show preventable breakdowns',
      solutionHypothesis: 'ML can predict equipment failures 2 weeks in advance',
      keyAssumptions: ['Sensor data is reliable', 'Historical data is sufficient'],
      initialCost: '75000',
      initialROI: '200%',
      confidenceLevel: 80,
      operationalImpactScore: 9,
      productivityImpactScore: 8,
      revenueImpactScore: 8,
      implementationComplexity: 7,
      estimatedTimeline: '8 months',
      plannedStartDate: '2024-02-01',
      estimatedTimelineMonths: '8',
      requiredResources: 'Data science team, IoT sensors, ML infrastructure',
      businessFunction: 'Operations',
      stage: 'Development',
      priority: 'CRITICAL',
      organizationId: organization.id,
      userId: 'user_2def456ghi789', // Regular user
      aiucId: 2,
    },
  ];

  for (const useCaseData of useCases) {
    const useCase = await prismaClient.useCase.create({
      data: useCaseData,
    });
    console.log('Created use case:', useCase.title);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
