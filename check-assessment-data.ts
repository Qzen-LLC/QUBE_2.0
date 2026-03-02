import { prismaClient } from './src/utils/db';

async function compareAssessmentData() {
  try {
    // Fetch AIUC-10
    const aiuc10 = await prismaClient.useCase.findUnique({
      where: { id: '2eb5a610-b9ec-435c-b377-ad7c194f0388' },
      select: {
        title: true,
        aiucId: true,
        assessData: true
      }
    });

    // Fetch AIUC-1
    const aiuc1 = await prismaClient.useCase.findUnique({
      where: { id: 'd46f1c28-c1e3-46f4-8882-e7f6d39c843e' },
      select: {
        title: true,
        aiucId: true,
        assessData: true
      }
    });

    console.log('\n=== AIUC-10 Assessment Data ===');
    console.log('Title:', aiuc10?.title);
    console.log('Has assessData:', !!aiuc10?.assessData);

    if (aiuc10?.assessData?.stepsData?.riskAssessment) {
      const ra = aiuc10.assessData.stepsData.riskAssessment;
      console.log('\nModel Risks:');
      console.log('  dataLeakage:', ra.modelRisks?.dataLeakage);
      console.log('  promptInjection:', ra.modelRisks?.promptInjection);
      console.log('  modelInversion:', ra.modelRisks?.modelInversion);
      console.log('  biasAmplification:', ra.modelRisks?.biasAmplification);
      console.log('  hallucinationRisk:', ra.modelRisks?.hallucinationRisk);

      console.log('\nAgent Risks:');
      console.log('  goalMisalignment:', ra.agentRisks?.goalMisalignment);
      console.log('  cascadingFailures:', ra.agentRisks?.cascadingFailures);
      console.log('  excessiveAutonomy:', ra.agentRisks?.excessiveAutonomy);
      console.log('  unexpectedBehavior:', ra.agentRisks?.unexpectedBehavior);
    }

    console.log('\n\n=== AIUC-1 Assessment Data ===');
    console.log('Title:', aiuc1?.title);
    console.log('Has assessData:', !!aiuc1?.assessData);

    if (aiuc1?.assessData?.stepsData?.riskAssessment) {
      const ra = aiuc1.assessData.stepsData.riskAssessment;
      console.log('\nModel Risks:');
      console.log('  dataLeakage:', ra.modelRisks?.dataLeakage);
      console.log('  promptInjection:', ra.modelRisks?.promptInjection);
      console.log('  modelInversion:', ra.modelRisks?.modelInversion);
      console.log('  biasAmplification:', ra.modelRisks?.biasAmplification);
      console.log('  hallucinationRisk:', ra.modelRisks?.hallucinationRisk);

      console.log('\nAgent Risks:');
      console.log('  goalMisalignment:', ra.agentRisks?.goalMisalignment);
      console.log('  cascadingFailures:', ra.agentRisks?.cascadingFailures);
      console.log('  excessiveAutonomy:', ra.agentRisks?.excessiveAutonomy);
      console.log('  unexpectedBehavior:', ra.agentRisks?.unexpectedBehavior);
    }

    console.log('\n\n=== Comparison ===');
    const aiuc10ModelRisks = aiuc10?.assessData?.stepsData?.riskAssessment?.modelRisks;
    const aiuc1ModelRisks = aiuc1?.assessData?.stepsData?.riskAssessment?.modelRisks;
    const aiuc10AgentRisks = aiuc10?.assessData?.stepsData?.riskAssessment?.agentRisks;
    const aiuc1AgentRisks = aiuc1?.assessData?.stepsData?.riskAssessment?.agentRisks;

    const modelRisksMatch = JSON.stringify(aiuc10ModelRisks) === JSON.stringify(aiuc1ModelRisks);
    const agentRisksMatch = JSON.stringify(aiuc10AgentRisks) === JSON.stringify(aiuc1AgentRisks);

    console.log('Model Risks Match:', modelRisksMatch);
    console.log('Agent Risks Match:', agentRisksMatch);

    if (modelRisksMatch && agentRisksMatch) {
      console.log('\n⚠️  WARNING: Both use cases have IDENTICAL risk assessment data!');
    } else {
      console.log('\n✓ Use cases have DIFFERENT assessment data');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

compareAssessmentData();
