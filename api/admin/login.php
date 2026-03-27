<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    require_method('POST');
    $payload = json_input();
    $email = trim((string) ($payload['email'] ?? ''));
    $password = (string) ($payload['password'] ?? '');

    if ($email === '' || $password === '') {
        fail('Correo y contrasena obligatorios', 422);
    }

    if (!authenticate_admin($email, $password)) {
        fail('Credenciales invalidas', 401);
    }

    init_session();
    session_regenerate_id(true);
    $_SESSION['admin'] = [
        'email' => $email,
        'logged_in_at' => gmdate('c'),
    ];

    success([
        'admin' => $_SESSION['admin'],
        'token' => create_admin_token($email),
    ]);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
