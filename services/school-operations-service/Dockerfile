FROM gradle:8.8-jdk21 AS builder
WORKDIR /workspace
COPY . .
# Build school-operations-service (resolves sms-common via includeBuild in settings.gradle)

WORKDIR /workspace/services/school-operations-service
RUN gradle bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /workspace/services/school-operations-service/build/libs/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
