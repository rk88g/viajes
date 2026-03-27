<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    require_method('GET');
    $admin = current_admin();

    success([
        'authenticated' => $admin !== null,
        'admin' => $admin,
    ]);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
