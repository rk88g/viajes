FROM php:8.2-apache

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends libpq-dev; \
    docker-php-ext-install pdo pdo_pgsql pgsql; \
    a2dismod mpm_event || true; \
    a2dismod mpm_worker || true; \
    a2enmod mpm_prefork; \
    a2enmod rewrite headers; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY . /var/www/html/
COPY docker/apache-entrypoint.sh /usr/local/bin/apache-entrypoint.sh

RUN chmod +x /usr/local/bin/apache-entrypoint.sh && \
    chown -R www-data:www-data /var/www/html

EXPOSE 80
CMD ["/usr/local/bin/apache-entrypoint.sh"]
