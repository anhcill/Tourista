#!/bin/bash
set -e

echo "===== Tourista on Railway ====="

# Build backend if JAR not present
if [ ! -f backend/target/backend-1.0.0.jar ]; then
  echo "Building backend..."
  cd backend
  ./mvnw package -DskipTests -q
  cd ..
fi

# Build frontend if not built
if [ ! -d frontend/.next ]; then
  echo "Building frontend..."
  cd frontend
  npm install
  npm run build
  cd ..
fi

# Start backend (port 8080)
echo "Starting backend on :8080..."
cd backend
java -jar target/backend-1.0.0.jar &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
echo "Waiting for backend to start..."
sleep 15

# Start frontend (port 3000)
echo "Starting frontend on :3000..."
cd frontend
PORT=3000 npm start &
FRONTEND_PID=$!

# Keep container alive, forward signals
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" SIGTERM SIGINT
wait $BACKEND_PID $FRONTEND_PID
wait $FRONTEND_PID
