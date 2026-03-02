// No-op logger: Grafana handles operational logging. This preserves the API
// so existing imports continue to work without producing local logs.

export class GuardrailLogger {
  private static instance: GuardrailLogger;

  private constructor() {}

  static getInstance(): GuardrailLogger {
    if (!GuardrailLogger.instance) {
      GuardrailLogger.instance = new GuardrailLogger();
    }
    return GuardrailLogger.instance;
  }

  // Session management (no-op)
  startSession(_useCaseId: string, _useCaseTitle: string) {}

  // LLM logging (no-op)
  logLLMInput(_approach: string, _prompt: string, _systemPrompt?: string) {}
  logLLMOutput(_approach: string, _response: any, _success: boolean, _error?: any) {}

  // Agent logging (no-op)
  logAgentInput(_agentName: string, _context: any) {}
  logAgentOutput(_agentName: string, _response: any) {}
  logAgentLLMCall(_agentName: string, _systemPrompt: string, _userPrompt: string, _model: string) {}
  logAgentLLMResponse(_agentName: string, _rawResponse: string | null, _parsedGuardrails: any[], _parseSuccess: boolean, _error?: any) {}

  // Orchestrator and synthesis (no-op)
  logOrchestratorAction(_action: string, _details: any) {}
  logSynthesis(_input: any, _output: any) {}
  logFinalOutput(_guardrails: any) {}

  // Persistence (no-op)
  saveToFile() {}
}

export const guardrailLogger = GuardrailLogger.getInstance();