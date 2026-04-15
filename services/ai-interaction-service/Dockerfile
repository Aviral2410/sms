FROM gradle:8.8-jdk21 AS build
WORKDIR /workspace
COPY . .
      
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/build/libs/*.jar app.jar

EXPOSE 8090
ENTRYPOINT ["java","-jar","/app/app.jar"]
