<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    require_method('POST');
    require_admin();

    $payload = json_input();
    $messageId = (int) ($payload['id'] ?? 0);
    $status = trim((string) ($payload['status'] ?? ''));
    $adminNotes = array_key_exists('admin_notes', $payload) ? trim((string) ($payload['admin_notes'] ?? '')) : null;

    if ($messageId <= 0) {
        fail('Mensaje invalido.', 422);
    }

    $allowedStatuses = ['new', 'contacted', 'closed'];
    if ($status !== '' && !in_array($status, $allowedStatuses, true)) {
        fail('Estatus de mensaje no valido.', 422);
    }

    $fields = [];
    $params = [':id' => $messageId];

    if ($status !== '') {
        $fields[] = 'status = :status';
        $params[':status'] = $status;
    }

    if ($adminNotes !== null) {
        $fields[] = 'admin_notes = :admin_notes';
        $params[':admin_notes'] = $adminNotes;
    }

    if ($fields === []) {
        fail('No hay cambios para guardar.', 422);
    }

    $fields[] = "updated_at = timezone('utc', now())";

    $stmt = db()->prepare(
        'update public.contact_messages
         set ' . implode(', ', $fields) . '
         where id = :id'
    );
    $stmt->execute($params);

    success(['message' => 'Mensaje actualizado correctamente.']);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
