/**
 * E2E test: Fill core questions for existing use case, trigger expansion, verify.
 * Usage: npx tsx scripts/test-expansion-e2e.ts
 */
import { PrismaClient, Stage } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=');
      if (eq > 0) {
        const k = t.slice(0, eq).trim();
        const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
} catch {}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Answers keyed by stage + questionNumber
const ANSWERS: Record<string, Record<number, string>> = {
  REQUIREMENTS: {
    1: 'Automated document analysis, intelligent search across enterprise knowledge bases, and generating structured summaries.',
    2: 'Text documents (PDF, DOCX), structured data from internal databases, and natural language queries.',
    3: 'Structured analysis reports, relevance-ranked search results, executive summaries, and confidence-scored recommendations.',
    20: 'Yes — generative AI for summarization, question answering, and report generation using LLMs.',
    31: 'Semi-autonomous: AI generates recommendations and drafts, human reviewer approves all external-facing outputs.',
  },
  TECHNICAL: {
    1: 'Large Language Model (LLM) with Retrieval-Augmented Generation (RAG).',
    4: 'OpenAI GPT-4o primary, Anthropic Claude fallback. Azure OpenAI for enterprise.',
    6: 'Under 5s for search, under 30s for document analysis. Batch OK for large reports.',
    54: 'Cloud API via Azure OpenAI, application on Google Cloud Run containers.',
    65: 'Defense-in-depth: API key rotation, VPC isolation, encryption at rest/transit, RBAC, audit logging.',
  },
  BUSINESS: {
    1: 'Aligned with digital transformation — reduces manual review by 70%, accelerates compliance decisions.',
    4: 'VP of Legal Operations is executive sponsor. Budget approved through FY2027.',
    6: 'Operational efficiency — $2.4M annual savings from reduced manual review hours.',
    31: 'Vendor lock-in risk, AI hallucination risk in legal analysis, change management resistance.',
  },
  RESPONSIBLE_ETHICAL: {
    1: 'Regular fairness audits, demographic analysis of training data, third-party bias testing quarterly.',
    22: 'Human-in-the-loop for all legal opinions. AI provides recommendations with confidence scores.',
    38: 'Not safety-critical. Supports decision-making but no autonomous decisions affecting individuals.',
  },
  LEGAL_REGULATORY: {
    1: 'Limited Risk under EU AI Act — document analysis, no biometric ID or critical infrastructure.',
    11: 'GDPR Legitimate Interest (Art 6(1)(f)). DPAs in place with all AI providers.',
    43: 'EU (Germany, France, Netherlands) and US. GDPR, EU AI Act, SOC 2, CCPA.',
  },
  DATA_READINESS: {
    1: 'Internal repos (SharePoint, Confluence), structured DBs (PostgreSQL), third-party legal DBs.',
    3: 'Unstructured (PDF, DOCX, email), semi-structured (JSON, XML), structured (SQL, CSV).',
    33: 'Internal Confidential for business docs, Restricted for legal/contracts, Public for policies.',
  },
  FINOPS: {
    59: 'Year 1 TCO: $480K — $180K API, $120K infra, $100K dev, $80K ops.',
    69: '3-year ROI 340%. Year 1 net savings $1.9M. Break-even in 4 months.',
  },
};

async function main() {
  console.log('=== E2E Expansion Test ===\n');

  // Step 1: Find a use case
  const useCase = await prisma.useCase.findFirst({ select: { id: true, title: true } });
  if (!useCase) {
    console.error('No use case found. Create one in the UI first.');
    return;
  }
  console.log(`Use case: "${useCase.title}" (${useCase.id})`);

  // Step 2: Load core templates
  const coreTemplates = await prisma.questionTemplate.findMany({
    where: { coreQuestion: true, isInactive: false },
    include: { optionTemplates: true },
    orderBy: [{ stage: 'asc' }, { questionNumber: 'asc' }],
  });
  console.log(`Core templates: ${coreTemplates.length}`);

  // Step 3: Save answers
  console.log('\nSaving answers...');
  let saved = 0;
  for (const tmpl of coreTemplates) {
    const stageAnswers = ANSWERS[tmpl.stage];
    const text = stageAnswers?.[tmpl.questionNumber || 0];
    if (!text) {
      console.log(`  SKIP ${tmpl.stage} Q${tmpl.questionNumber} — no answer`);
      continue;
    }

    // Delete existing
    await prisma.answer.deleteMany({ where: { templateId: tmpl.id, useCaseId: useCase.id } });

    if (tmpl.type === 'CHECKBOX' || tmpl.type === 'RADIO') {
      if (tmpl.optionTemplates.length > 0) {
        const opt = tmpl.optionTemplates[0];
        await prisma.answer.create({
          data: {
            templateId: tmpl.id,
            useCaseId: useCase.id,
            value: { optionIds: [opt.id], labels: [opt.text] },
          },
        });
        saved++;
        console.log(`  ${tmpl.stage} Q${tmpl.questionNumber} -> "${opt.text.slice(0, 40)}"`);
      }
    } else {
      await prisma.answer.create({
        data: {
          templateId: tmpl.id,
          useCaseId: useCase.id,
          value: { text },
        },
      });
      saved++;
      console.log(`  ${tmpl.stage} Q${tmpl.questionNumber} -> "${text.slice(0, 50)}..."`);
    }
  }
  console.log(`Saved ${saved} answers`);

  // Verify
  const count = await prisma.answer.count({ where: { useCaseId: useCase.id } });
  console.log(`Total answers in DB for this use case: ${count}`);

  // Step 4: Run expansion directly (no HTTP needed)
  console.log('\nRunning expansion agent...');
  const { AssessmentExpansionAgent } = await import('../src/lib/expansion/assessment-expansion-agent');
  const { STAGE_TO_PILLAR } = await import('../src/lib/expansion/types');
  type PillarKey = 'requirements' | 'technical' | 'business' | 'responsibleEthical' | 'legalRegulatory' | 'dataReadiness' | 'finops';

  // Build core answers for agent
  const coreAnswers: any[] = [];
  for (const tmpl of coreTemplates) {
    const answer = await prisma.answer.findFirst({ where: { templateId: tmpl.id, useCaseId: useCase.id } });
    if (!answer) continue;
    const pillar = STAGE_TO_PILLAR[tmpl.stage];
    if (!pillar) continue;
    coreAnswers.push({
      questionText: tmpl.text,
      questionNumber: tmpl.questionNumber || 0,
      pillar,
      value: answer.value,
      type: tmpl.type,
    });
  }
  console.log(`Core answers for agent: ${coreAnswers.length}`);

  // Build question catalog
  const allTemplates = await prisma.questionTemplate.findMany({
    where: { coreQuestion: false, isInactive: false },
    include: { optionTemplates: true },
    orderBy: [{ stage: 'asc' }, { orderIndex: 'asc' }],
  });

  const catalog: Record<PillarKey, any[]> = {
    requirements: [], technical: [], business: [],
    responsibleEthical: [], legalRegulatory: [], dataReadiness: [], finops: [],
  };
  for (const t of allTemplates) {
    const p = STAGE_TO_PILLAR[t.stage];
    if (!p) continue;
    catalog[p].push({
      id: t.id, text: t.text, questionNumber: t.questionNumber || 0, type: t.type,
      options: t.optionTemplates.map(o => ({ id: o.id, text: o.text })),
    });
  }
  console.log('Catalog:', Object.entries(catalog).map(([k, v]) => `${k}:${v.length}`).join(', '));

  const useCaseFull = await prisma.useCase.findUnique({ where: { id: useCase.id } });

  const agent = new AssessmentExpansionAgent();
  const start = Date.now();
  const result = await agent.expand({
    useCaseId: useCase.id,
    useCase: {
      title: useCaseFull?.title || '',
      problemStatement: useCaseFull?.problemStatement || '',
      proposedAISolution: useCaseFull?.proposedAISolution || '',
      currentState: useCaseFull?.currentState || '',
      desiredState: useCaseFull?.desiredState || '',
      primaryStakeholders: (useCaseFull?.primaryStakeholders as string[]) || [],
      secondaryStakeholders: (useCaseFull?.secondaryStakeholders as string[]) || [],
      successCriteria: (useCaseFull?.successCriteria as string[]) || [],
      confidenceLevel: useCaseFull?.confidenceLevel ?? null,
      operationalImpactScore: useCaseFull?.operationalImpactScore ?? null,
      productivityImpactScore: useCaseFull?.productivityImpactScore ?? null,
      revenueImpactScore: useCaseFull?.revenueImpactScore ?? null,
      implementationComplexity: useCaseFull?.implementationComplexity ?? null,
    },
    coreAnswers,
    questionCatalog: catalog,
  });
  const duration = ((Date.now() - start) / 1000).toFixed(1);

  const totalFields = Object.values(result.profiles).reduce((s, p) => s + Object.keys(p.fields).length, 0);

  console.log(`\n=== EXPANSION COMPLETE (${duration}s) ===`);
  console.log(`Fields inferred: ${totalFields}`);
  console.log(`Overall confidence: ${Math.round(result.overallConfidence * 100)}%`);
  console.log(`Tokens: ${JSON.stringify(result.tokenUsage)}`);

  for (const [pillar, profile] of Object.entries(result.profiles)) {
    const n = Object.keys(profile.fields).length;
    if (n === 0) { console.log(`  ${pillar}: empty`); continue; }
    const avg = Object.values(profile.fields).reduce((s, f) => s + f.confidence, 0) / n;
    console.log(`  ${pillar}: ${n} fields, confidence ${Math.round(avg * 100)}%`);
    // Show 2 samples
    for (const [key, f] of Object.entries(profile.fields).slice(0, 2)) {
      const val = typeof f.value === 'string' ? f.value.slice(0, 60) : JSON.stringify(f.value).slice(0, 60);
      console.log(`    ${key}: "${val}" (${Math.round(f.confidence * 100)}%)`);
    }
  }

  // Save to DB
  console.log('\nSaving expansion to DB...');
  await prisma.assessmentExpansion.upsert({
    where: { useCaseId: useCase.id },
    create: {
      useCaseId: useCase.id, status: 'completed',
      coreAnswerCount: coreAnswers.length, expandedFieldCount: totalFields,
      overallConfidence: result.overallConfidence, modelUsed: 'gpt-4o',
      tokenUsage: result.tokenUsage as any, expansionDuration: result.duration,
      requirementsProfile: result.profiles.requirements as any,
      technicalProfile: result.profiles.technical as any,
      businessProfile: result.profiles.business as any,
      responsibleEthicalProfile: result.profiles.responsibleEthical as any,
      legalRegulatoryProfile: result.profiles.legalRegulatory as any,
      dataReadinessProfile: result.profiles.dataReadiness as any,
      finopsProfile: result.profiles.finops as any,
    },
    update: {
      status: 'completed',
      coreAnswerCount: coreAnswers.length, expandedFieldCount: totalFields,
      overallConfidence: result.overallConfidence, modelUsed: 'gpt-4o',
      tokenUsage: result.tokenUsage as any, expansionDuration: result.duration,
      requirementsProfile: result.profiles.requirements as any,
      technicalProfile: result.profiles.technical as any,
      businessProfile: result.profiles.business as any,
      responsibleEthicalProfile: result.profiles.responsibleEthical as any,
      legalRegulatoryProfile: result.profiles.legalRegulatory as any,
      dataReadinessProfile: result.profiles.dataReadiness as any,
      finopsProfile: result.profiles.finops as any,
    },
  });
  console.log('Saved.');

  // Step 5: Test context builder
  console.log('\nTesting context builder...');
  const { buildAssessmentContext, formatContextForPrompt } = await import('../src/lib/assessment/assessment-context-builder');
  const ctx = await buildAssessmentContext(useCase.id);
  console.log(`Stats: ${ctx.stats.userAnswered} user, ${ctx.stats.llmInferred} inferred, ${Math.round(ctx.stats.overallConfidence * 100)}% confidence`);
  const text = formatContextForPrompt(ctx, 3000);
  console.log(`Prompt text (${text.length} chars):\n${text.slice(0, 800)}...\n`);

  console.log('=== DONE ===');
}

main()
  .catch(e => { console.error('FATAL:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
