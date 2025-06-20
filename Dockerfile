FROM mysql:8.4.5


ENV MYSQL_ROOT_PASSWORD=rootpassword
ENV MYSQL_DATABASE=library

COPY db/ /docker-entrypoint-initdb.d/

EXPOSE 3306
