FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/backend-1.0.0.jar app.jar

# Railway sets environment variables automatically
# No need to EXPOSE unless you want a custom port
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
