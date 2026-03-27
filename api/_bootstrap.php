<?php
declare(strict_types=1);

header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

function env_value(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
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
        $user = $parts['user'] ?? '';
        $pass = $parts['pass'] ?? '';
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

