FROM gradle:8.8-jdk21 AS build
WORKDIR /workspace
COPY . .

WORKDIR /workspace/services/ai-interaction-service
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew && ./gradlew bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/services/ai-interaction-service/build/libs/*.jar app.jar

EXPOSE 8090
ENTRYPOINT ["java","-jar","/app/app.jar"]
