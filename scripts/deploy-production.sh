#!/usr/bin/env bash
set -e

PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null || echo "")}

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
  echo "Error: Google Cloud Project ID not specified."
  echo "Usage: bash scripts/deploy-production.sh <PROJECT_ID>"
  exit 1
fi

REGION="us-central1"
SERVICE_NAME="universal-file-converter"
REPO_NAME="containers"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"
BUCKET_NAME="${PROJECT_ID}-temp-storage"

# Load environment variables from .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

ADSENSE_CLIENT_ID=${NEXT_PUBLIC_ADSENSE_CLIENT_ID:-""}
ADSENSE_TOP_SLOT=${NEXT_PUBLIC_ADSENSE_TOP_SLOT:-""}
ADSENSE_BOTTOM_SLOT=${NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT:-""}
ANALYTICS_ID=${NEXT_PUBLIC_ANALYTICS_ID:-""}

export NEXT_PUBLIC_ADSENSE_CLIENT_ID="$ADSENSE_CLIENT_ID"
export NEXT_PUBLIC_ADSENSE_TOP_SLOT="$ADSENSE_TOP_SLOT"
export NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT="$ADSENSE_BOTTOM_SLOT"
export NEXT_PUBLIC_ANALYTICS_ID="$ANALYTICS_ID"

echo "=== 1. Running Automated Tests & Production Build ==="
npm test
npm run build

echo "=== 2. Setting Active GCP Project ==="
gcloud config set project "$PROJECT_ID"

echo "=== 3. Enabling Required Google Cloud APIs ==="
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com \
  firebasehosting.googleapis.com \
  artifactregistry.googleapis.com \
  --project "$PROJECT_ID"

echo "=== 4. Setting Up Cloud Storage Bucket & CORS ==="
if ! gcloud storage buckets describe "gs://${BUCKET_NAME}" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Creating storage bucket gs://${BUCKET_NAME}..."
  gcloud storage buckets create "gs://${BUCKET_NAME}" --location="$REGION" --project "$PROJECT_ID"
fi

gcloud storage buckets update "gs://${BUCKET_NAME}" --cors-file=cors.json --project "$PROJECT_ID"

echo "=== 5. Ensuring Artifact Registry Repository Exists ==="
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Creating Artifact Registry repository ${REPO_NAME}..."
  gcloud artifacts repositories create "$REPO_NAME" --repository-format=docker --location="$REGION" --project "$PROJECT_ID"
fi


echo "=== 6. Building Container Image with Cloud Build ==="
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_IMAGE_TAG="${IMAGE_TAG}",_ADSENSE_CLIENT_ID="${ADSENSE_CLIENT_ID}",_ADSENSE_TOP_SLOT="${ADSENSE_TOP_SLOT}",_ADSENSE_BOTTOM_SLOT="${ADSENSE_BOTTOM_SLOT}",_ANALYTICS_ID="${ANALYTICS_ID}",_SITE_URL="https://convertall.site" \
  --project "$PROJECT_ID"

echo "=== 7. Deploying to Cloud Run ==="
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
  --set-env-vars "PUBLIC_SITE_URL=https://convertall.site,GCS_BUCKET_NAME=${BUCKET_NAME},NEXT_PUBLIC_ADSENSE_CLIENT_ID=${ADSENSE_CLIENT_ID},NEXT_PUBLIC_ADSENSE_TOP_SLOT=${ADSENSE_TOP_SLOT},NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT=${ADSENSE_BOTTOM_SLOT},NEXT_PUBLIC_ANALYTICS_ID=${ANALYTICS_ID}" \
  --project "$PROJECT_ID"

echo "=== 8. Deploying to Firebase Hosting ==="
npx -y firebase-tools@latest use "$PROJECT_ID"
npx -y firebase-tools@latest deploy --only hosting --project "$PROJECT_ID"

echo ""
echo "=========================================================="
echo " PRODUCTION BACKEND DEPLOYMENT COMPLETE FOR PROJECT: ${PROJECT_ID}"
echo "=========================================================="
