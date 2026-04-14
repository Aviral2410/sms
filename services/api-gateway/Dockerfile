FROM gradle:8.8-jdk21 AS builder
WORKDIR /workspace
COPY . .
WORKDIR /workspace/services/api-gateway
RUN gradle bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /workspace/services/api-gateway/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
