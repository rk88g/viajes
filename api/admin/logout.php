<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    require_method('POST');
    init_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
    }
    session_destroy();

    success(['message' => 'Sesion cerrada']);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
