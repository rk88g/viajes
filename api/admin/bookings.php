<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    require_method('POST');
    require_admin();

    $payload = json_input();
    $bookingId = trim((string) ($payload['id'] ?? ''));
    $action = trim((string) ($payload['action'] ?? ''));

    if ($bookingId === '' || $action === '') {
        fail('Reserva y accion son obligatorias.', 422);
    }

    $pdo = db();
    $pdo->beginTransaction();

    try {
        if ($action === 'mark_paid') {
            confirm_booking_payment($pdo, $bookingId, null, [
                'source' => 'admin',
                'manually_confirmed' => true,
            ]);
        } elseif ($action === 'cancel') {
            cancel_unpaid_booking($pdo, $bookingId);
        } elseif ($action === 'refund') {
            refund_booking($pdo, $bookingId);
        } else {
            fail('Accion no soportada.', 422);
        }

        $pdo->commit();
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        throw $exception;
    }

    success(['message' => 'Reserva actualizada correctamente.']);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
