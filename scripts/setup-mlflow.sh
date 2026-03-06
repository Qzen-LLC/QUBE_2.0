#!/usr/bin/env bash
set -euo pipefail

echo "Installing MLflow..."
pip install mlflow

echo "Starting MLflow tracking server on port 5000..."
mlflow server --host 0.0.0.0 --port 5000 &

echo "MLflow server started. Waiting for it to be ready..."
for i in {1..10}; do
  if curl -s http://localhost:5000/health >/dev/null 2>&1 || curl -s http://localhost:5000/api/2.0/mlflow/registered-models/search >/dev/null 2>&1; then
    echo "MLflow is ready!"
    exit 0
  fi
  sleep 1
done

echo "MLflow server started (may still be initializing)."
echo "Verify at: http://localhost:5000"
