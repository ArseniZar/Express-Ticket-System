FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .

COPY inventory-service/ inventory-service/

RUN --mount=type=cache,target=/root/.m2 \
    mvn -f pom.xml -N install && \
    mvn -f inventory-service/pom.xml -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/inventory-service/target/inventory-service.jar /app/app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]