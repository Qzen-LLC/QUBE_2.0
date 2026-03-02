import 'dotenv/config';
import OpenAI from 'openai';
import { langsmithTracer } from '../src/lib/observability/LangSmithTracer';

async function main() {
  // Ensure observability is enabled for this validation run
  if (!process.env.ENABLE_OBSERVABILITY) process.env.ENABLE_OBSERVABILITY = 'true';
  if (!process.env.OBSERVABILITY_LEVEL) process.env.OBSERVABILITY_LEVEL = 'detailed';

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error('Missing OPENAI_API_KEY in environment.');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: openaiKey });

  console.log('Starting LangSmith validation run...');

  // Start a LangSmith session directly
  const session = await langsmithTracer.startSession({
    useCaseId: '00000000-0000-0000-0000-000000000001',
    useCaseTitle: 'Validation Test',
    phase: 'evaluation',
    agentName: 'ValidationAgent',
    agentType: 'evaluation',
    tags: ['validation', 'langsmith', 'observability'],
  });

  const preUrl = langsmithTracer.getTraceUrl();
  if (preUrl) {
    console.log('Trace URL (before end):', preUrl);
  }

  // Execute a minimal OpenAI call wrapped by tracer
  const completion = await langsmithTracer.traceLLMCall(
    () =>
      client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Reply with a short sentence confirming validation is working.' },
        ],
        temperature: 0.2,
        max_tokens: 50,
      }),
    {
      prompt: 'Reply with a short sentence confirming validation is working.',
      systemPrompt: 'You are a helpful assistant.',
      model: 'gpt-4o-mini',
      agentName: 'ValidationAgent',
      agentType: 'evaluation',
      tags: ['validation-call'],
    }
  );

  const content = completion.choices?.[0]?.message?.content || '';
  console.log('OpenAI response length:', content.length);
  if (content) console.log('OpenAI response preview:', content.substring(0, 120));

  // End the session and print final URL
  await langsmithTracer.endSession({ ok: true });
  const postUrl = langsmithTracer.getTraceUrl();
  console.log('Trace URL (after end):', postUrl || '(null after end)');

  console.log('Done. Visit the pre-end trace URL in LangSmith to verify outputs.');
}

main().catch((err) => {
  console.error('Validation run failed:', err);
  process.exit(1);
});

