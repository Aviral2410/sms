FROM gradle:8.8-jdk21 AS builder
WORKDIR /workspace
COPY . .
WORKDIR /workspace/services/school-onboarding-service
RUN gradle bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /workspace/services/school-onboarding-service/build/libs/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
