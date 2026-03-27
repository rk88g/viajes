<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

try {
    require_method('POST');
    $payload = json_input();

    $fullName = trim((string) ($payload['full_name'] ?? ''));
    $email = trim((string) ($payload['email'] ?? ''));
    $phone = trim((string) ($payload['phone'] ?? ''));
    $message = trim((string) ($payload['message'] ?? ''));

    if ($fullName === '' || $email === '' || $message === '') {
        fail('Nombre, correo y mensaje son obligatorios', 422);
    }

    $stmt = db()->prepare(
        'insert into public.contact_messages (full_name, email, phone, message)
         values (:full_name, :email, :phone, :message)'
    );
    $stmt->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':phone' => $phone !== '' ? $phone : null,
        ':message' => $message,
    ]);

    success(['message' => 'Mensaje guardado correctamente.']);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
