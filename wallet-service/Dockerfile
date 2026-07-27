FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .

COPY common-grpc/ common-grpc/
COPY wallet-service/ wallet-service/

RUN --mount=type=cache,target=/root/.m2 \
    mvn -f pom.xml -N install && \
    mvn -f common-grpc/pom.xml clean install && \
    mvn -f wallet-service/pom.xml -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/wallet-service/target/wallet-service.jar /app/app.jar
EXPOSE 8084 9090

ENTRYPOINT ["java", "-jar", "/app/app.jar"]