#!/bin/bash
set -e

echo "===== Tourista on Railway ====="

# Load .env variables into environment
set -a
if [ -f backend/.env ]; then
    source backend/.env
elif [ -f backend/.env.production ]; then
    source backend/.env.production
else
    echo "WARNING: No .env file found in backend/"
fi
set +a

# JAR is pre-built and copied to ./backend/app.jar
# .next is pre-built and copied to ./.next

# Start backend (port 8080) with env vars
echo "Starting backend on :8080..."
cd backend
java \
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
