# ============================================================
# Tourista Backend - Railway Deployment
# ============================================================
FROM eclipse-temurin:21-jdk-alpine AS builder

RUN apk add --no-cache maven

WORKDIR /app

COPY pom.xml ./
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -q

# Final stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/backend-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
