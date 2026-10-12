# Static jubilee calendar (HTML + vanilla JS) served by the PHP built-in web server.
#
# Build:  docker build -t anniversary-calendar .
# Run:    docker run --rm -p 8080:8080 anniversary-calendar
# Open:   http://localhost:8080/

FROM php:8.4-cli

WORKDIR /app

COPY public/ /app/

EXPOSE 8080

CMD ["php", "-S", "0.0.0.0:8080", "-t", "/app"]
