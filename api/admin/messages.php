<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    require_method('POST');
    require_admin();

    $payload = json_input();
    $messageId = (int) ($payload['id'] ?? 0);
    $status = trim((string) ($payload['status'] ?? ''));

    if ($messageId <= 0 || $status === '') {
        fail('Mensaje y estatus son obligatorios.', 422);
    }

    $allowedStatuses = ['new', 'contacted', 'closed'];
    if (!in_array($status, $allowedStatuses, true)) {
        fail('Estatus de mensaje no valido.', 422);
    }

    $stmt = db()->prepare(
        "update public.contact_messages
         set status = :status,
             updated_at = timezone('utc', now())
         where id = :id"
    );
    $stmt->execute([
        ':status' => $status,
        ':id' => $messageId,
    ]);

    success(['message' => 'Mensaje actualizado correctamente.']);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
