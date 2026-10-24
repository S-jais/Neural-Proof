FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /app

COPY .mvn .mvn
COPY mvnw.cmd pom.xml ./
COPY src src

RUN apt-get update && apt-get install -y maven && mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
