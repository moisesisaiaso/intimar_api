#Documentation
---
## Guía de instalación

### Requerimientos:

    Node
    Git
    Docker y docker-compose
    Una cuenta AWS
    Un bucket en AWS
    Una base de datos Postgresql
    
### Instalación local
    
>Ejecutaremos los siguientes comandos

    git clone https://github.com/Jacko-TF/INTIMAR_BACKEND_2023_2.git app
    cd app 
    npm install

>Antes de ejecutar nuestra aplicación debemos crear un archivo .env en el directorio app con el siguiente contenido, podemos usar como ejemplo el archivo .env.example

    PORT=
    DBPORT=
    HOST=
    USER=
    DATABASE=
    PASSWORD=
    SECRET_KEY=
    TWILIO_ACCOUNT_SID=
    TWILIO_AUTH_TOKEN=
    TWILIO_NUMBER=
    MY_ACCESS_KEY_ID=
    MY_SECRET_ACCESS_KEY=
    S3_REGION=
    BUCKET_NAME=

>Ahora podemos ejecutar el comando

    npm start

>Veremos nuestra aplicación desde http://localhost:${PORT}/

---
### Instalación en Docker - Instancia EC2 de AWS
>Para instalacion en docker necesitaremos crear un archivo Dockerfile, para ello nos conectamos a una instancia de EC2 de Ubuntu y luego de instalar Docker y docker-compose vamos a ejecutar

    mkdir app
    cd app
    vi Dockerfile
    
>En la línea de comandos de vi podemos editar colocando i , copiamos el siguiente contenido:

    FROM node:18.16
    RUN apt-get update && apt-get install -y nodejs npm
    RUN git clone -q https://github.com/Jacko-TF/INTIMAR_BACKEND_2023_2.git backend
    WORKDIR backend
    RUN npm install > /dev/null
    EXPOSE 8000
    CMD ["npm","start"]

> Luego regresamos al directorio raiz y crearemos un arhivo compose.yml

    cd ..
    vi docker-compose.yml
    
> Vamos a colocar el siguiente contenidor:

    version: '3.9'

    services:
      node:
        build: ./app
        ports:
          - "8000:8000"
        environment:
          - PORT=
          - DBPORT=
          - HOST=
          - USER=
          - DATABASE=
          - PASSWORD=
          - SECRET_KEY=
          - TWILIO_ACCOUNT_SID=
          - TWILIO_AUTH_TOKEN=
          - TWILIO_NUMBER=
          - MY_ACCESS_KEY_ID=
          - MY_SECRET_ACCESS_KEY=
          - S3_REGION=
          - BUCKET_NAME=
          - RESEND_API_KEY=
          - RESEND_EMAIL=
--- 
> Para ejecutar nuestro docker-compose usamos:

    docker-compose up --build
    
>De esta manera tendremos un crud de contactos ejecutandose en una instancia EC2 de AWS, con una base de datos RDS postgresql.
