# Usamos una imagen oficial que ya tiene Java 17 y Maven instalados
FROM maven:3.9-eclipse-temurin-17

# Nos movemos a la carpeta /app dentro del servidor
WORKDIR /app

# Copiamos todo el código de ligasync-backend al servidor
COPY . .

# Le damos permisos a tu Maven Wrapper y compilamos tu código
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# Exponemos el puerto 8080
EXPOSE 8080

# Arrancamos el servidor (el asterisco busca el .jar sin importar la versión exacta)
CMD ["sh", "-c", "java -jar target/*.jar"]