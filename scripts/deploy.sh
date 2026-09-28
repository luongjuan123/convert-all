#!/usr/bin/env bash
set -e

PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null || echo "")}

if [ -z "$PROJECT_ID" ]; then
  echo "Error: Google Cloud Project ID not specified."
  echo "Usage: npm run deploy <PROJECT_ID>"
  exit 1
fi

REGION="us-central1"
SERVICE_NAME="universal-file-converter"
REPO_NAME="containers"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

echo "=== 1. Ensuring Artifact Registry Repository Exists ==="
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Creating Artifact Registry repository ${REPO_NAME}..."
  gcloud artifacts repositories create "$REPO_NAME" --repository-format=docker --location="$REGION" --project "$PROJECT_ID"
fi

echo "=== 2. Building Container Image with Cloud Build ==="
gcloud builds submit --tag "$IMAGE_TAG" --project "$PROJECT_ID"

echo "=== 3. Deploying to Cloud Run ==="
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_TAG" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --concurrency 10 \
  --min-instances 0 \
  --max-instances 5 \
  --project "$PROJECT_ID"

echo "=== 4. Deploying Firebase Hosting Rewrites ==="
npx -y firebase-tools@latest use "$PROJECT_ID"
npx -y firebase-tools@latest deploy --only hosting --project "$PROJECT_ID"

echo "=== Production Deployment Complete! ==="
