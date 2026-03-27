#!/bin/sh
set -eu

PORT_VALUE="${PORT:-80}"

cat <<EOF >/etc/apache2/ports.conf
Listen ${PORT_VALUE}

<IfModule ssl_module>
    Listen 443
</IfModule>

<IfModule mod_gnutls.c>
    Listen 443
</IfModule>
EOF

cat <<EOF >/etc/apache2/sites-available/000-default.conf
<VirtualHost *:${PORT_VALUE}>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined

    <Directory /var/www/html>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
EOF

exec apache2-foreground
