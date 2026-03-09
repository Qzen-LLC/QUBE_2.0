"""
Seed MLflow Model Registry with demo models for QUBE discovery testing.

Creates 6 models with realistic names that match QUBE use cases.
Some are tagged for auto-matching, some rely on fuzzy matching,
and one is intentionally ungoverned ("shadow AI").

Usage:
  pip install mlflow requests
  python scripts/seed-mlflow-models.py

Requires:
  - MLflow tracking server running at http://localhost:5000
  - QUBE dev server running at http://localhost:3000 (optional, for auto-tagging)
"""

import mlflow
import requests
import sys

MLFLOW_URI = "http://localhost:5000"
QUBE_API = "http://localhost:3000"

mlflow.set_tracking_uri(MLFLOW_URI)
client = mlflow.tracking.MlflowClient()

# ── Step 1: Try to fetch real use case IDs from QUBE ────────────────

use_case_ids: dict[str, str] = {}  # title_lower -> id

try:
    # Try fetching use cases from QUBE (requires auth token in cookie/header)
    # For local dev, you may need to adjust auth
    res = requests.get(f"{QUBE_API}/api/get-usecases", timeout=5)
    if res.ok:
        data = res.json()
        cases = data if isinstance(data, list) else data.get("useCases", [])
        for uc in cases:
            title = uc.get("title", "")
            uid = uc.get("id", "")
            if title and uid:
                use_case_ids[title.lower()] = uid
        print(f"Fetched {len(use_case_ids)} use cases from QUBE")
    else:
        print(f"Could not fetch use cases (status {res.status_code}) — will skip auto-tagging")
except Exception as e:
    print(f"QUBE not reachable ({e}) — will skip auto-tagging")

# Helper to find a use case ID by fuzzy keyword match
def find_use_case_id(*keywords: str) -> str | None:
    for title_lower, uid in use_case_ids.items():
        for kw in keywords:
            if kw.lower() in title_lower:
                return uid
    return None


# ── Step 2: Define demo models ──────────────────────────────────────

# Each model: (name, description, tag_keywords, target_stage)
# tag_keywords: used to find a matching QUBE use case for qube_use_case_id tag
# target_stage: the MLflow stage to transition the latest version to
DEMO_MODELS = [
    (
        "Fraud-Detection-v2",
        "Real-time transaction fraud scoring model using gradient boosting. "
        "Processes 50K transactions/min with <100ms p99 latency.",
        ["fraud"],
        "Production",
    ),
    (
        "Customer-Churn-Predictor",
        "Monthly churn prediction model for subscription customers. "
        "XGBoost ensemble with 0.89 AUC on holdout set.",
        ["churn", "customer"],
        "Production",
    ),
    (
        "Enterprise-RAG-Bot",
        "Retrieval-Augmented Generation chatbot for internal knowledge base. "
        "Uses GPT-4 with vector search over 2M documents.",
        ["rag", "chatbot", "knowledge"],
        "Staging",
    ),
    (
        "Content-Moderation-LLM",
        "Content safety classifier for user-generated content. "
        "Fine-tuned LLaMA model with 97.3% accuracy on harmful content detection.",
        ["content", "moderation", "safety"],
        "Staging",
    ),
    (
        "Demand-Forecasting-Engine",
        "Time-series demand forecasting for supply chain optimization. "
        "Prophet + LSTM hybrid model with 12-week forecast horizon.",
        ["demand", "forecast", "supply"],
        "Production",
    ),
    (
        "Shadow-AI-Experiment",
        "Untracked experiment model — uploaded by data science intern. "
        "No documentation, no governance approval, no cost allocation.",
        [],  # No tags — this should show as UNGOVERNED
        "None",
    ),
]


# ── Step 3: Create models in MLflow ─────────────────────────────────

print(f"\nSeeding {len(DEMO_MODELS)} models into MLflow at {MLFLOW_URI}...\n")

created = 0
for name, desc, tag_keywords, target_stage in DEMO_MODELS:
    try:
        # Build tags
        tags: dict[str, str] = {}

        # Try to auto-tag with a real QUBE use case ID
        matched_id = find_use_case_id(*tag_keywords) if tag_keywords else None
        if matched_id:
            tags["qube_use_case_id"] = matched_id
            print(f"  Tagged {name} -> use case {matched_id}")

        # Add descriptive tags
        tags["team"] = "ml-platform"
        tags["framework"] = "pytorch" if "LLM" in name or "RAG" in name else "sklearn"

        tag_list = [{"key": k, "value": v} for k, v in tags.items()]

        # Create or get registered model
        try:
            client.create_registered_model(name, tags=tag_list, description=desc)
        except Exception:
            # Model already exists — update description and tags
            client.update_registered_model(name, description=desc)
            for k, v in tags.items():
                client.set_registered_model_tag(name, k, v)

        # Create a model version
        version = client.create_model_version(
            name,
            f"runs:/demo-run-{name.lower()}/model",
            description=f"Version for {name}",
        )

        # Transition to target stage if not "None"
        if target_stage and target_stage != "None":
            try:
                client.transition_model_version_stage(
                    name,
                    version.version,
                    target_stage,
                )
            except Exception as e:
                print(f"  Could not set stage for {name}: {e}")

        stage_label = f" [{target_stage}]" if target_stage != "None" else " [Ungoverned]"
        tag_label = " (auto-tagged)" if matched_id else ""
        print(f"  Created: {name}{stage_label}{tag_label}")
        created += 1

    except Exception as e:
        print(f"  Error creating {name}: {e}")

print(f"\nDone! {created}/{len(DEMO_MODELS)} models seeded in MLflow.")
print(f"\nDemo ready:")
print(f"  MLflow UI:       {MLFLOW_URI}")
print(f"  QUBE Production: http://localhost:3000/dashboard/production")
print(f"  QUBE Discovery:  http://localhost:3000/dashboard/production/mlflow-discovery")

if not use_case_ids:
    print(f"\nNote: Could not auto-tag models with QUBE use case IDs.")
    print(f"  For best demo results, create use cases in QUBE with titles like:")
    print(f"  - 'Fraud Detection System'")
    print(f"  - 'Customer Churn Prediction'")
    print(f"  - 'Enterprise RAG Chatbot'")
    print(f"  - 'Content Moderation'")
    print(f"  - 'Demand Forecasting'")
    print(f"  Then re-run this script to auto-tag them.")
