#!/bin/bash

# Script to help convert test agents to use autonomous reasoning
# Usage: Review the changes suggested below and apply manually if needed

echo "🔄 Converting Test Agents to Autonomous Reasoning"
echo "=================================================="
echo ""

AGENTS=(
  "ComplianceTestAgent"
  "CostTestAgent"
  "DriftTestAgent"
  "EthicsTestAgent"
  "PerformanceTestAgent"
  "RobustnessTestAgent"
  "SecurityTestAgent"
)

for agent in "${AGENTS[@]}"; do
  file="src/lib/evals/agents/${agent}.ts"

  if [ -f "$file" ]; then
    echo "📝 $agent"
    echo "   File: $file"

    # Count occurrences of generateScenariosWithLLM
    count=$(grep -c "generateScenariosWithLLM" "$file" || echo "0")

    if [ "$count" -gt "0" ]; then
      echo "   ⚠️  Found $count occurrences of generateScenariosWithLLM"
      echo "   ℹ️  Manual conversion recommended - see AGENT_CONVERSION_GUIDE.md"
    else
      echo "   ✅ Already converted or uses different pattern"
    fi

    echo ""
  fi
done

echo "=================================================="
echo "✅ Analysis complete"
echo ""
echo "Next steps:"
echo "1. Review AGENT_CONVERSION_GUIDE.md for conversion patterns"
echo "2. Manually convert each test generation method"
echo "3. Test the converted agents"
