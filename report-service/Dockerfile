FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .

COPY report-service/ report-service/

RUN --mount=type=cache,target=/root/.m2 \
    mvn -f pom.xml -N install && \
    mvn -f report-service/pom.xml -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/report-service/target/report-service.jar /app/app.jar

EXPOSE 8083
ENTRYPOINT ["java", "-jar", "/app/app.jar"]