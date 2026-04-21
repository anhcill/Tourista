#!/bin/bash
set -e

echo "===== Tourista on Railway ====="

# Load .env variables into environment
set -a
source backend/.env
set +a

# JAR is pre-built and copied to ./backend/app.jar
# .next is pre-built and copied to ./.next

# Start backend (port 8080) with env vars
echo "Starting backend on :8080..."
cd backend
java \
  -DDB_URL="${DB_URL}" \
  -DDB_USERNAME="${DB_USERNAME}" \
  -DDB_PASSWORD="${DB_PASSWORD}" \
  -DJWT_SECRET="${JWT_SECRET}" \
  -DMAIL_USERNAME="${MAIL_USERNAME}" \
  -DMAIL_PASSWORD="${MAIL_PASSWORD}" \
  -DGOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
  -DGOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}" \
  -DFRONTEND_URL="${FRONTEND_URL}" \
  -DAPP_CORS_ALLOWED_ORIGINS="${APP_CORS_ALLOWED_ORIGINS}" \
  -DVNPAY_TMN_CODE="${VNPAY_TMN_CODE}" \
  -DVNPAY_HASH_SECRET="${VNPAY_HASH_SECRET}" \
  -DVNPAY_PAY_URL="${VNPAY_PAY_URL}" \
  -DVNPAY_RETURN_URL="${VNPAY_RETURN_URL}" \
  -DGEMINI_API_KEY="${GEMINI_API_KEY}" \
  -jar app.jar &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
echo "Waiting for backend to start..."
sleep 15

# Start frontend (port 3000)
echo "Starting frontend on :3000..."
PORT=3000 npm start &
FRONTEND_PID=$!

# Keep container alive, forward signals
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" SIGTERM SIGINT
wait $BACKEND_PID $FRONTEND_PID
wait $FRONTEND_PID
