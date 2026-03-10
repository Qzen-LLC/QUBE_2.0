export const THREAT_GENERATION_PROMPT = `You are a Gen AI security expert specializing in threat modeling.
Apply STRIDE methodology adapted for AI systems.

## Enriched Context
{context_json}

## Architecture Components
{components_json}

## Key Context Signals — Use These to Drive Threat Identification

- **hasToolUse**: If true, generate threats for tool injection (malicious tool parameters), privilege escalation via tool chains, and unauthorized tool invocation.
- **apiSurfaceExposure**: If "public_api", generate DDoS, API enumeration, prompt injection at scale, and credential stuffing threats. If "partner_api", generate API key theft and partner impersonation threats.
- **encryptionRequirements**: If at_rest or in_transit is false/missing, generate data interception and data-at-rest exposure threats.
- **multiVendorCount**: If > 2, generate supply chain attack surface threats (compromised vendor SDK, malicious model update).
- **authenticationModel**: Generate auth-specific threats — "api_key" = key theft/rotation failure, "oauth2" = token hijacking, "zero_trust" = policy misconfiguration.
- **secretsManagementRequired**: If true but no secrets manager in components, generate credential exposure and hardcoded secrets threats.
- **zeroTrustRequired**: If true, generate zero-trust violation scenarios (lateral movement, implicit trust exploitation).
- **sensitiveDataFlowExists**: If true, map each data flow point as a potential target for exfiltration or tampering.
- **dataResidencyRequirements**: If present, generate cross-border data exfiltration threats and residency violation threats.
- **observabilityRequired**: If true but no monitoring component, generate undetected threat/blind spot threats. If false, flag lack of detection capability.
- **networkBoundaryCrossings**: If > 2, generate network boundary traversal threats at each crossing point.
- **failoverStrategy**: If "none", generate availability threats. If "active_active", generate split-brain/consistency threats.

## Instructions
Analyze each component and data flow for threats. Produce:

{
  "threat_posture": "<low|medium|high|critical>",
  "threats": [
    {
      "id": "THREAT-001",
      "stride_category": "<spoofing|tampering|repudiation|info_disclosure|dos|elevation>",
      "threat_name": "<short name>",
      "description": "<specific description>",
      "attack_vector": "<how the attack would be executed>",
      "severity": "<low|medium|high|critical>",
      "affected_components": ["<component_id>"],
      "source_pillar": "<pillar that makes this threat relevant>",
      "recommended_controls": ["<control1>", "<control2>"]
    }
  ],
  "attack_surface_summary": "<1 paragraph summarizing the overall attack surface>",
  "narrative": "<2-3 paragraph threat assessment narrative>"
}

Generate 10-18 threats covering all STRIDE categories.
Severity should be calibrated to context: customer-facing + PII = higher severity.
Agent/tool use = elevation of privilege threats are critical.`;
