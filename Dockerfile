# ============================================================
# Tourista — Root Dockerfile for Railway (monorepo)
# Stage 1: Build backend (Java/Maven)
# Stage 2: Build frontend (Node.js)
# Stage 3: Run both services
# ============================================================

# ---------- Stage 1: Backend ----------
FROM eclipse-temurin:21-jdk-alpine AS backend-builder

RUN apk add --no-cache maven

WORKDIR /app

# Download dependencies (cached if pom.xml unchanged)
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B

# Build
COPY backend/src ./src
RUN mvn package -DskipTests -q

# ---------- Stage 2: Frontend ----------
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files first for dependency caching
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ---------- Stage 3: Run ----------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install curl for health checks and Node for frontend
RUN apk add --no-cache bash curl nodejs npm

# Copy backend JAR
COPY --from=backend-builder /app/target/backend-1.0.0.jar ./backend/app.jar

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Copy built frontend
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package.json ./

# Expose both ports
EXPOSE 8080 3000

# Run via start.sh (no exec shell so trap works on PID 1)
ENTRYPOINT ["./start.sh"]
