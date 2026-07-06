#!/bin/bash
# ==========================================
# Deployment Script for Jakarta Pulse v2
# Google Cloud Run (Frontend & Backend)
# ==========================================

# Set your variables
PROJECT_ID="smooth-reason-491707-f6"
REGION="us-central1"
BACKEND_SERVICE_NAME="elnino-sistem-backend"
FRONTEND_SERVICE_NAME="elnino-sistem-frontend"

# Masukkan API Key Gemini Anda di bawah ini:
GEMINI_API_KEY="PASTE_KODE_API_GEMINI_ANDA_DISINI"

echo "Deploying Backend to Cloud Run..."
cd backend
gcloud run deploy $BACKEND_SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="ENV=production,GEMINI_API_KEY=$GEMINI_API_KEY"

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
  --set-env-vars="BACKEND_URL=$BACKEND_URL,GEMINI_API_KEY=$GEMINI_API_KEY"

echo "✅ Deployment Complete!"
echo "Frontend is live. It is connected to $BACKEND_URL."
