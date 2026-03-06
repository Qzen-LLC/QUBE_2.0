"""
Seed MLflow Model Registry with test models for QUBE discovery testing.

Usage:
  pip install mlflow
  python scripts/seed-mlflow-models.py

Requires MLflow tracking server running at http://localhost:5000
"""

import mlflow

mlflow.set_tracking_uri("http://localhost:5000")
client = mlflow.tracking.MlflowClient()

# Models: (name, description, tags)
# Some have qube_use_case_id tags for auto-matching, others are "shadow AI"
models = [
    (
        "Enterprise-RAG-Bot",
        "RAG chatbot for internal knowledge base",
        {"qube_use_case_id": "replace-with-real-id"},
    ),
    (
        "Fraud-Detection-v2",
        "Real-time fraud scoring model",
        {},
    ),
    (
        "Customer-Churn-Predictor",
        "Monthly churn prediction",
        {},
    ),
    (
        "Content-Moderation-LLM",
        "Content safety classifier",
        {},
    ),
    (
        "Shadow-AI-Experiment",
        "Untracked experiment model",
        {},
    ),
]

for name, desc, tags in models:
    try:
        tag_list = [{"key": k, "value": v} for k, v in tags.items()]
        client.create_registered_model(name, tags=tag_list, description=desc)
        # Create a version (requires a fake artifact path)
        client.create_model_version(
            name,
            f"runs:/fake-run-id/{name}",
            tags=[{"key": k, "value": v} for k, v in tags.items()],
        )
        print(f"Created: {name}")
    except Exception as e:
        print(f"Skipping {name}: {e}")

print("\nDone! Models registered in MLflow.")
