#!/bin/sh
set -eu

PORT_VALUE="${PORT:-80}"

# Railway only needs one active MPM. The official PHP Apache image uses prefork.
rm -f /etc/apache2/mods-enabled/mpm_event.conf /etc/apache2/mods-enabled/mpm_event.load
rm -f /etc/apache2/mods-enabled/mpm_worker.conf /etc/apache2/mods-enabled/mpm_worker.load

if [ ! -f /etc/apache2/mods-enabled/mpm_prefork.load ] && [ -f /etc/apache2/mods-available/mpm_prefork.load ]; then
    ln -s /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load
fi

if [ ! -f /etc/apache2/mods-enabled/mpm_prefork.conf ] && [ -f /etc/apache2/mods-available/mpm_prefork.conf ]; then
    ln -s /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf
fi

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

apache2ctl -t
exec apache2-foreground
