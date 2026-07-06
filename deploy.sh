#!/bin/bash
# ==========================================
# Deployment Script for Jakarta Pulse v2
# Google Cloud Run (Frontend & Backend)
# ==========================================

# Set your variables
PROJECT_ID="smooth-reason-491707-f6"
REGION="asia-southeast2" # Jakarta
BACKEND_SERVICE_NAME="jakarta-pulse-backend"
FRONTEND_SERVICE_NAME="jakarta-pulse-frontend"

echo "Deploying Backend to Cloud Run..."
cd backend
gcloud run deploy $BACKEND_SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="ENV=production"

# Capture the backend URL automatically
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)
echo "Backend deployed at: $BACKEND_URL"

echo "Deploying Frontend to Cloud Run..."
cd ../frontend
gcloud run deploy $FRONTEND_SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="BACKEND_URL=$BACKEND_URL"

echo "✅ Deployment Complete!"
echo "Frontend is live. It is connected to $BACKEND_URL."
