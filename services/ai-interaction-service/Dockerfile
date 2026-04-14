FROM gradle:8.8-jdk21 AS build
WORKDIR /app

COPY services/ai-interaction-service /app
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8090
ENTRYPOINT ["java","-jar","/app/app.jar"]
