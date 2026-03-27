<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

handle_cors();

load_env_file(dirname(__DIR__) . '/.env');
load_env_file(dirname(__DIR__) . '/.env.local');

if (ob_get_level() === 0) {
    ob_start();
}

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }

    throw new ErrorException($message, 0, $severity, $file, $line);
});

register_shutdown_function(static function (): void {
    $error = error_get_last();

    if (!$error || !in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        return;
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    if (headers_sent() === false) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode(
        [
            'ok' => false,
            'error' => sprintf('Error interno del servidor: %s', $error['message']),
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
});

function env_value(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

function handle_cors(): void
{
    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '') {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } else {
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');

    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function load_env_file(string $path): void
{
    static $loaded = [];

    if (isset($loaded[$path]) || !is_file($path) || !is_readable($path)) {
        return;
    }

    $loaded[$path] = true;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        if (str_starts_with($trimmed, 'export ')) {
            $trimmed = trim(substr($trimmed, 7));
        }

        $parts = explode('=', $trimmed, 2);
        if (count($parts) !== 2) {
            continue;
        }

        $name = trim($parts[0]);
        if ($name === '' || getenv($name) !== false) {
            continue;
        }

        $value = trim($parts[1]);
        if ($value !== '') {
            $quote = $value[0];
            if (($quote === '"' || $quote === "'") && substr($value, -1) === $quote) {
                $value = substr($value, 1, -1);
            }
        }

        putenv(sprintf('%s=%s', $name, $value));
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsnUrl = env_value('SUPABASE_DATABASE_URL', env_value('DATABASE_URL'));

    if ($dsnUrl) {
        $parts = parse_url($dsnUrl);
        if ($parts === false) {
            throw new RuntimeException('DATABASE_URL invalida');
        }

        $host = $parts['host'] ?? '';
        $port = (int) ($parts['port'] ?? 5432);
        $dbName = ltrim($parts['path'] ?? '/postgres', '/');
        $user = isset($parts['user']) ? rawurldecode((string) $parts['user']) : '';
        $pass = isset($parts['pass']) ? rawurldecode((string) $parts['pass']) : '';
    } else {
        $host = env_value('SUPABASE_DB_HOST', '');
        $port = (int) env_value('SUPABASE_DB_PORT', '5432');
        $dbName = env_value('SUPABASE_DB_NAME', 'postgres');
        $user = env_value('SUPABASE_DB_USER', 'postgres');
        $pass = env_value('SUPABASE_DB_PASSWORD', 'UZDk2DsL8zBeX0Wb');
    }

    if ($host === '' || $user === '' || $pass === '') {
        throw new RuntimeException('Faltan variables de entorno para conectar a Supabase Postgres');
    }

    $pdo = new PDO(
        sprintf('pgsql:host=%s;port=%d;dbname=%s;sslmode=require', $host, $port, $dbName),
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    return $pdo;
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('JSON invalido');
    }

    return $decoded;
}

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function success(array $payload = [], int $status = 200): never
{
    respond(['ok' => true] + $payload, $status);
}

function fail(string $message, int $status = 400, array $extra = []): never
{
    respond(['ok' => false, 'error' => $message] + $extra, $status);
}

function require_method(string $method): void
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== strtoupper($method)) {
        fail('Metodo no permitido', 405);
    }
}

function init_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_name('jr_admin_session');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 8,
        'path' => '/',
        'domain' => '',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function current_admin(): ?array
{
    $tokenAdmin = current_admin_from_token();
    if ($tokenAdmin !== null) {
        return $tokenAdmin;
    }

    init_session();
    return isset($_SESSION['admin']) && is_array($_SESSION['admin']) ? $_SESSION['admin'] : null;
}

function require_admin(): array
{
    $admin = current_admin();
    if (!$admin) {
        fail('No autorizado', 401);
    }

    return $admin;
}

function admin_credentials(): array
{
    $email = env_value('ADMIN_EMAIL');
    $plainPassword = env_value('ADMIN_PASSWORD');
    $passwordHash = env_value('ADMIN_PASSWORD_HASH');

    if (!$email || (!$plainPassword && !$passwordHash)) {
        throw new RuntimeException('Configura ADMIN_EMAIL y ADMIN_PASSWORD o ADMIN_PASSWORD_HASH en Railway');
    }

    return [
        'email' => $email,
        'plainPassword' => $plainPassword,
        'passwordHash' => $passwordHash,
    ];
}

function authenticate_admin(string $email, string $password): bool
{
    $credentials = admin_credentials();

    if (strtolower(trim($email)) !== strtolower(trim($credentials['email']))) {
        return false;
    }

    if (!empty($credentials['passwordHash'])) {
        return password_verify($password, $credentials['passwordHash']);
    }

    return hash_equals((string) $credentials['plainPassword'], $password);
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64url_decode(string $value): string
{
    $padding = strlen($value) % 4;
    if ($padding > 0) {
        $value .= str_repeat('=', 4 - $padding);
    }

    $decoded = base64_decode(strtr($value, '-_', '+/'), true);
    if ($decoded === false) {
        throw new RuntimeException('Token invalido');
    }

    return $decoded;
}

function admin_token_secret(): string
{
    $credentials = admin_credentials();
    $secretSource = !empty($credentials['passwordHash'])
        ? (string) $credentials['passwordHash']
        : 'plain:' . (string) ($credentials['plainPassword'] ?? '');

    return hash('sha256', strtolower(trim((string) $credentials['email'])) . '|' . $secretSource);
}

function read_bearer_token(): ?string
{
    $header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($header === '' || stripos($header, 'Bearer ') !== 0) {
        return null;
    }

    $token = trim(substr($header, 7));
    return $token !== '' ? $token : null;
}

function create_admin_token(string $email): string
{
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_UNESCAPED_SLASHES));
    $payload = base64url_encode(json_encode([
        'email' => strtolower(trim($email)),
        'iat' => time(),
        'exp' => time() + (60 * 60 * 8),
    ], JSON_UNESCAPED_SLASHES));

    $signature = base64url_encode(hash_hmac('sha256', $header . '.' . $payload, admin_token_secret(), true));
    return $header . '.' . $payload . '.' . $signature;
}

function current_admin_from_token(): ?array
{
    $token = read_bearer_token();
    if ($token === null) {
        return null;
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$header, $payload, $signature] = $parts;
    $expectedSignature = base64url_encode(hash_hmac('sha256', $header . '.' . $payload, admin_token_secret(), true));

    if (!hash_equals($expectedSignature, $signature)) {
        return null;
    }

    $decodedPayload = json_decode(base64url_decode($payload), true);
    if (!is_array($decodedPayload)) {
        return null;
    }

    $email = strtolower(trim((string) ($decodedPayload['email'] ?? '')));
    $expiresAt = (int) ($decodedPayload['exp'] ?? 0);
    $credentials = admin_credentials();
    $expectedEmail = strtolower(trim((string) $credentials['email']));

    if ($email === '' || $email !== $expectedEmail || $expiresAt < time()) {
        return null;
    }

    return [
        'email' => $email,
        'logged_in_at' => isset($decodedPayload['iat']) ? gmdate('c', (int) $decodedPayload['iat']) : gmdate('c'),
        'auth_mode' => 'token',
    ];
}

function normalize_jsonb($value): array
{
    if (is_array($value)) {
        return $value;
    }

    if ($value === null || $value === '') {
        return [];
    }

    $decoded = json_decode((string) $value, true);
    return is_array($decoded) ? $decoded : [];
}

function map_trip(array $row): array
{
    $row['includes'] = normalize_jsonb($row['includes'] ?? []);
    $row['itinerary'] = normalize_jsonb($row['itinerary'] ?? []);
    $row['tags'] = normalize_jsonb($row['tags'] ?? []);
    $row['featured'] = (bool) ($row['featured'] ?? false);
    $row['published'] = (bool) ($row['published'] ?? false);
    return $row;
}

function map_departure(array $row): array
{
    foreach (['capacity', 'booked_count', 'trip_id', 'id'] as $field) {
        if (isset($row[$field])) {
            $row[$field] = (int) $row[$field];
        }
    }

    if (isset($row['promo_price']) && $row['promo_price'] !== null) {
        $row['promo_price'] = (float) $row['promo_price'];
    }

    if (isset($row['trip']) && is_string($row['trip'])) {
        $decoded = json_decode($row['trip'], true);
        $row['trip'] = is_array($decoded) ? $decoded : null;
    }

    return $row;
}

function map_income_entry(array $row): array
{
    foreach (['id'] as $field) {
        if (isset($row[$field])) {
            $row[$field] = (int) $row[$field];
        }
    }

    if (isset($row['amount']) && $row['amount'] !== null) {
        $row['amount'] = (float) $row['amount'];
    }

    return $row;
}

function map_expense_entry(array $row): array
{
    foreach (['id'] as $field) {
        if (isset($row[$field])) {
            $row[$field] = (int) $row[$field];
        }
    }

    if (isset($row['amount']) && $row['amount'] !== null) {
        $row['amount'] = (float) $row['amount'];
    }

    return $row;
}

function detect_browser_name(string $userAgent): string
{
    $ua = strtolower($userAgent);

    if ($ua === '') {
        return 'Navegador no identificado';
    }

    if (str_contains($ua, 'edg/')) {
        return 'Microsoft Edge';
    }
    if (str_contains($ua, 'opr/') || str_contains($ua, 'opera')) {
        return 'Opera';
    }
    if (str_contains($ua, 'chrome/') && !str_contains($ua, 'edg/')) {
        return 'Google Chrome';
    }
    if (str_contains($ua, 'firefox/')) {
        return 'Mozilla Firefox';
    }
    if ((str_contains($ua, 'safari/') && str_contains($ua, 'version/')) && !str_contains($ua, 'chrome/')) {
        return 'Safari';
    }

    return 'Navegador no identificado';
}

function detect_os_name(string $userAgent): string
{
    $ua = strtolower($userAgent);

    if ($ua === '') {
        return 'Sistema no identificado';
    }

    if (str_contains($ua, 'windows')) {
        return 'Windows';
    }
    if (str_contains($ua, 'android')) {
        return 'Android';
    }
    if (str_contains($ua, 'iphone') || str_contains($ua, 'ipad') || str_contains($ua, 'ios')) {
        return 'iOS';
    }
    if (str_contains($ua, 'mac os') || str_contains($ua, 'macintosh')) {
        return 'macOS';
    }
    if (str_contains($ua, 'linux')) {
        return 'Linux';
    }

    return 'Sistema no identificado';
}

function detect_device_type(string $userAgent): string
{
    $ua = strtolower($userAgent);

    if ($ua === '') {
        return 'Dispositivo no identificado';
    }

    if (str_contains($ua, 'tablet') || str_contains($ua, 'ipad')) {
        return 'Tablet';
    }
    if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
        return 'Movil';
    }

    return 'Escritorio';
}

function map_site_visit(array $row): array
{
    foreach (['id', 'visit_count'] as $field) {
        if (isset($row[$field])) {
            $row[$field] = (int) $row[$field];
        }
    }

    $userAgent = trim((string) ($row['user_agent'] ?? ''));
    $row['browser_name'] = detect_browser_name($userAgent);
    $row['os_name'] = detect_os_name($userAgent);
    $row['device_type'] = detect_device_type($userAgent);

    return $row;
}

function read_visitor_token(): ?string
{
    $token = trim((string) ($_SERVER['HTTP_X_VISITOR_TOKEN'] ?? $_GET['visitor_token'] ?? ''));
    if ($token === '') {
        return null;
    }

    if (!preg_match('/^[a-zA-Z0-9-]{16,120}$/', $token)) {
        return null;
    }

    return $token;
}

function register_site_visit(PDO $pdo, ?string $visitorToken): array
{
    $token = $visitorToken;
    if ($token === null || $token === '') {
        $token = bin2hex(random_bytes(16));
    }

    $existingStmt = $pdo->prepare(
        'select id, visit_count
         from public.site_visitors
         where visitor_token = :visitor_token
         limit 1'
    );
    $existingStmt->execute([':visitor_token' => $token]);
    $existing = $existingStmt->fetch();

    if ($existing) {
        $updateStmt = $pdo->prepare(
            "update public.site_visitors
             set visit_count = visit_count + 1,
                 last_seen_at = timezone('utc', now()),
                 user_agent = :user_agent,
                 ip_address = :ip_address
             where id = :id"
        );
        $updateStmt->execute([
            ':user_agent' => trim((string) ($_SERVER['HTTP_USER_AGENT'] ?? '')) ?: null,
            ':ip_address' => trim((string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '')) ?: null,
            ':id' => (int) $existing['id'],
        ]);

        return [
            'token' => $token,
            'visitor_number' => (int) $existing['id'],
            'visit_count' => ((int) ($existing['visit_count'] ?? 0)) + 1,
            'is_new_visitor' => false,
        ];
    }

    $insertStmt = $pdo->prepare(
        'insert into public.site_visitors (visitor_token, visit_count, user_agent, ip_address)
         values (:visitor_token, 1, :user_agent, :ip_address)
         returning id, visit_count'
    );
    $insertStmt->execute([
        ':visitor_token' => $token,
        ':user_agent' => trim((string) ($_SERVER['HTTP_USER_AGENT'] ?? '')) ?: null,
        ':ip_address' => trim((string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '')) ?: null,
    ]);
    $created = $insertStmt->fetch() ?: ['id' => 0, 'visit_count' => 1];

    return [
        'token' => $token,
        'visitor_number' => (int) ($created['id'] ?? 0),
        'visit_count' => (int) ($created['visit_count'] ?? 1),
        'is_new_visitor' => true,
    ];
}

function sync_booking_income_entry(PDO $pdo, string $bookingId, string $incomeStatus): void
{
    $bookingStmt = $pdo->prepare(
        'select id, trip_title_snapshot, customer_name, total_amount, departure_date_snapshot, paid_at, stripe_payment_intent
         from public.bookings
         where id = :id
         limit 1'
    );
    $bookingStmt->execute([':id' => $bookingId]);
    $booking = $bookingStmt->fetch();

    if (!$booking) {
        throw new RuntimeException('Reserva no encontrada para generar ingreso.');
    }

    $paymentDate = null;
    if (!empty($booking['paid_at'])) {
        $paymentDate = gmdate('Y-m-d', strtotime((string) $booking['paid_at']));
    }

    if (!$paymentDate) {
        $paymentDate = gmdate('Y-m-d');
    }

    $stmt = $pdo->prepare(
        'insert into public.income_entries
         (concept, category, customer_name, amount, currency, status, payment_date, payment_method, reference_code, source_type, booking_id, notes)
         values
         (:concept, :category, :customer_name, :amount, :currency, :status, :payment_date, :payment_method, :reference_code, :source_type, :booking_id, :notes)
         on conflict (booking_id) do update set
           concept = excluded.concept,
           category = excluded.category,
           customer_name = excluded.customer_name,
           amount = excluded.amount,
           currency = excluded.currency,
           status = excluded.status,
           payment_date = excluded.payment_date,
           payment_method = excluded.payment_method,
           reference_code = excluded.reference_code,
           notes = excluded.notes'
    );
    $stmt->execute([
        ':concept' => 'Reserva pagada: ' . (string) ($booking['trip_title_snapshot'] ?? 'Viaje'),
        ':category' => 'Reservas',
        ':customer_name' => (string) ($booking['customer_name'] ?? ''),
        ':amount' => (float) ($booking['total_amount'] ?? 0),
        ':currency' => 'MXN',
        ':status' => $incomeStatus,
        ':payment_date' => $paymentDate,
        ':payment_method' => 'Stripe / Confirmacion manual',
        ':reference_code' => (string) ($booking['stripe_payment_intent'] ?? ''),
        ':source_type' => 'booking',
        ':booking_id' => $bookingId,
        ':notes' => 'Generado automaticamente desde la reserva del ' . (string) ($booking['departure_date_snapshot'] ?? ''),
    ]);
}

function request_scheme(): string
{
    $forwarded = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    if ($forwarded !== '') {
        return explode(',', $forwarded)[0] === 'https' ? 'https' : 'http';
    }

    $https = strtolower((string) ($_SERVER['HTTPS'] ?? ''));
    return ($https !== '' && $https !== 'off') ? 'https' : 'http';
}

function request_host(): string
{
    $forwarded = trim((string) ($_SERVER['HTTP_X_FORWARDED_HOST'] ?? ''));
    if ($forwarded !== '') {
        return trim(explode(',', $forwarded)[0]);
    }

    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host !== '') {
        return $host;
    }

    $serverName = trim((string) ($_SERVER['SERVER_NAME'] ?? 'localhost'));
    $serverPort = trim((string) ($_SERVER['SERVER_PORT'] ?? ''));

    if ($serverPort !== '' && !in_array($serverPort, ['80', '443'], true)) {
        return $serverName . ':' . $serverPort;
    }

    return $serverName;
}

function public_site_url(): string
{
    $configured = trim((string) env_value('PUBLIC_SITE_URL', ''));
    if ($configured !== '') {
        return rtrim($configured, '/');
    }

    return sprintf('%s://%s', request_scheme(), request_host());
}

function stripe_is_configured(): bool
{
    return trim((string) env_value('STRIPE_SECRET_KEY', '')) !== '';
}

function stripe_webhook_is_configured(): bool
{
    return stripe_is_configured() && trim((string) env_value('STRIPE_WEBHOOK_SECRET', '')) !== '';
}

function booking_whatsapp_url(array $departure, array $customer, int $seats): string
{
    $settings = db()->query('select whatsapp_number, whatsapp_message from public.site_settings where id = 1 limit 1')->fetch() ?: [];
    $whatsappNumber = preg_replace('/\D+/', '', (string) ($settings['whatsapp_number'] ?? env_value('WHATSAPP_NUMBER', '523312469036')));
    $message = implode("\n", [
        'Hola, quiero apartar un viaje.',
        'Viaje: ' . (string) ($departure['trip']['title'] ?? 'Ruta turistica'),
        'Fecha: ' . (string) ($departure['departure_date'] ?? ''),
        'Lugares: ' . $seats,
        'Cliente: ' . (string) ($customer['name'] ?? ''),
        'Correo: ' . (string) ($customer['email'] ?? ''),
        'Telefono: ' . (string) ($customer['phone'] ?? 'No especificado'),
    ]);

    return 'https://wa.me/' . $whatsappNumber . '?text=' . rawurlencode($message);
}

function stripe_api_request(string $method, string $path, array $formPayload): array
{
    $secretKey = trim((string) env_value('STRIPE_SECRET_KEY', ''));
    if ($secretKey === '') {
        throw new RuntimeException('Stripe no esta configurado en el backend.');
    }

    $url = 'https://api.stripe.com/v1/' . ltrim($path, '/');
    $body = http_build_query($formPayload, '', '&', PHP_QUERY_RFC3986);
    $headers = [
        'Authorization: Bearer ' . $secretKey,
        'Content-Type: application/x-www-form-urlencoded',
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch === false) {
            throw new RuntimeException('No se pudo inicializar cURL para Stripe.');
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
        ]);

        $raw = curl_exec($ch);
        if ($raw === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('Error al conectar con Stripe: ' . $error);
        }

        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => strtoupper($method),
                'header' => implode("\r\n", $headers),
                'content' => $body,
                'ignore_errors' => true,
                'timeout' => 30,
            ],
        ]);

        $raw = file_get_contents($url, false, $context);
        if ($raw === false) {
            throw new RuntimeException('Error al conectar con Stripe.');
        }

        $statusLine = $http_response_header[0] ?? '';
        preg_match('/\s(\d{3})\s/', $statusLine, $matches);
        $status = isset($matches[1]) ? (int) $matches[1] : 500;
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Stripe devolvio una respuesta invalida.');
    }

    if ($status >= 400) {
        $message = $decoded['error']['message'] ?? 'Stripe devolvio un error.';
        throw new RuntimeException($message);
    }

    return $decoded;
}

function create_stripe_checkout_session(array $booking, array $departure, int $seats, float $unitPrice, array $customer): array
{
    $trip = $departure['trip'] ?? [];
    $siteUrl = public_site_url();

    return stripe_api_request('POST', 'checkout/sessions', [
        'mode' => 'payment',
        'locale' => 'es',
        'success_url' => $siteUrl . '/?checkout=success&booking=' . urlencode((string) $booking['id']),
        'cancel_url' => $siteUrl . '/?checkout=cancelled&booking=' . urlencode((string) $booking['id']),
        'customer_email' => (string) ($customer['email'] ?? ''),
        'phone_number_collection[enabled]' => 'true',
        'metadata[bookingId]' => (string) $booking['id'],
        'metadata[departureId]' => (string) ($departure['id'] ?? ''),
        'metadata[tripId]' => (string) ($trip['id'] ?? ''),
        'metadata[seats]' => (string) $seats,
        'line_items[0][quantity]' => (string) $seats,
        'line_items[0][price_data][currency]' => 'mxn',
        'line_items[0][price_data][unit_amount]' => (string) (int) round($unitPrice * 100),
        'line_items[0][price_data][product_data][name]' => sprintf(
            '%s | %s',
            (string) ($trip['title'] ?? 'Viaje'),
            (string) ($departure['departure_date'] ?? '')
        ),
        'line_items[0][price_data][product_data][description]' => 'Salida desde ' . (string) ($trip['meeting_point'] ?? 'Guadalajara'),
    ]);
}

function verify_stripe_signature(string $payload, string $signatureHeader, string $secret): bool
{
    $parts = [];
    foreach (explode(',', $signatureHeader) as $fragment) {
        $segment = explode('=', trim($fragment), 2);
        if (count($segment) === 2) {
            $parts[$segment[0]][] = $segment[1];
        }
    }

    $timestamp = $parts['t'][0] ?? null;
    $signatures = $parts['v1'] ?? [];

    if ($timestamp === null || $signatures === []) {
        return false;
    }

    $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    foreach ($signatures as $signature) {
        if (hash_equals($expected, $signature)) {
            return true;
        }
    }

    return false;
}

function confirm_booking_payment(PDO $pdo, string $bookingId, ?string $paymentIntent, array $sessionPayload = []): void
{
    $bookingStmt = $pdo->prepare(
        'select id, departure_id, seats_reserved, payment_status
         from public.bookings
         where id = :id
         for update'
    );
    $bookingStmt->execute([':id' => $bookingId]);
    $booking = $bookingStmt->fetch();

    if (!$booking) {
        throw new RuntimeException('Reserva no encontrada');
    }

    if (($booking['payment_status'] ?? '') === 'paid') {
        return;
    }

    $departureStmt = $pdo->prepare(
        'select id, capacity, booked_count, status
         from public.departures
         where id = :id
         for update'
    );
    $departureStmt->execute([':id' => $booking['departure_id']]);
    $departure = $departureStmt->fetch();

    if (!$departure || ($departure['status'] ?? '') !== 'open') {
        throw new RuntimeException('La salida ya no esta disponible para confirmar la reserva.');
    }

    $seatsReserved = (int) $booking['seats_reserved'];
    $capacity = (int) ($departure['capacity'] ?? 0);
    $bookedCount = (int) ($departure['booked_count'] ?? 0);
    $newBookedCount = $bookedCount + $seatsReserved;

    if ($newBookedCount > $capacity) {
        throw new RuntimeException('No hay cupo suficiente para confirmar esta reserva.');
    }

    $departureUpdateStmt = $pdo->prepare(
        'update public.departures
         set booked_count = :booked_count,
             status = :status
         where id = :id'
    );
    $departureUpdateStmt->execute([
        ':booked_count' => $newBookedCount,
        ':status' => $newBookedCount >= $capacity ? 'sold_out' : (string) $departure['status'],
        ':id' => $departure['id'],
    ]);

    $bookingUpdateStmt = $pdo->prepare(
        "update public.bookings
         set status = :status,
             payment_status = :payment_status,
             stripe_payment_intent = coalesce(:payment_intent, stripe_payment_intent),
             paid_at = timezone('utc', now()),
             checkout_payload = coalesce(checkout_payload, '{}'::jsonb) || cast(:session_payload as jsonb)
         where id = :id"
    );
    $bookingUpdateStmt->execute([
        ':status' => 'confirmed',
        ':payment_status' => 'paid',
        ':payment_intent' => $paymentIntent,
        ':session_payload' => json_encode(['session' => $sessionPayload], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ':id' => $bookingId,
    ]);

    sync_booking_income_entry($pdo, $bookingId, 'received');
}

function cancel_unpaid_booking(PDO $pdo, string $bookingId): void
{
    $bookingStmt = $pdo->prepare(
        'select id, payment_status
         from public.bookings
         where id = :id
         for update'
    );
    $bookingStmt->execute([':id' => $bookingId]);
    $booking = $bookingStmt->fetch();

    if (!$booking) {
        throw new RuntimeException('Reserva no encontrada');
    }

    if (($booking['payment_status'] ?? '') === 'paid') {
        throw new RuntimeException('La reserva ya esta pagada. Usa el flujo de reembolso para liberar cupo.');
    }

    $updateStmt = $pdo->prepare(
        "update public.bookings
         set status = 'cancelled',
             payment_status = 'unpaid',
             updated_at = timezone('utc', now())
         where id = :id"
    );
    $updateStmt->execute([':id' => $bookingId]);
}

function refund_booking(PDO $pdo, string $bookingId): void
{
    $bookingStmt = $pdo->prepare(
        'select id, departure_id, seats_reserved, payment_status
         from public.bookings
         where id = :id
         for update'
    );
    $bookingStmt->execute([':id' => $bookingId]);
    $booking = $bookingStmt->fetch();

    if (!$booking) {
        throw new RuntimeException('Reserva no encontrada');
    }

    if (($booking['payment_status'] ?? '') !== 'paid') {
        throw new RuntimeException('Solo puedes reembolsar reservas pagadas.');
    }

    $departureStmt = $pdo->prepare(
        'select id, capacity, booked_count, status
         from public.departures
         where id = :id
         for update'
    );
    $departureStmt->execute([':id' => $booking['departure_id']]);
    $departure = $departureStmt->fetch();

    if (!$departure) {
        throw new RuntimeException('La salida asociada ya no existe.');
    }

    $seatsReserved = (int) $booking['seats_reserved'];
    $bookedCount = (int) ($departure['booked_count'] ?? 0);
    $capacity = (int) ($departure['capacity'] ?? 0);
    $newBookedCount = max($bookedCount - $seatsReserved, 0);

    $departureStatus = (string) ($departure['status'] ?? 'open');
    if ($departureStatus !== 'cancelled') {
        $departureStatus = $newBookedCount >= $capacity ? 'sold_out' : 'open';
    }

    $departureUpdateStmt = $pdo->prepare(
        "update public.departures
         set booked_count = :booked_count,
             status = :status,
             updated_at = timezone('utc', now())
         where id = :id"
    );
    $departureUpdateStmt->execute([
        ':booked_count' => $newBookedCount,
        ':status' => $departureStatus,
        ':id' => $departure['id'],
    ]);

    $bookingUpdateStmt = $pdo->prepare(
        "update public.bookings
         set status = 'refunded',
             payment_status = 'refunded',
             updated_at = timezone('utc', now())
         where id = :id"
    );
    $bookingUpdateStmt->execute([':id' => $bookingId]);

    sync_booking_income_entry($pdo, $bookingId, 'refunded');
}
