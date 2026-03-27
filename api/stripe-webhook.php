<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

try {
    require_method('POST');

    $secret = trim((string) env_value('STRIPE_WEBHOOK_SECRET', ''));
    $signature = (string) ($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');
    $payload = file_get_contents('php://input');

    if ($payload === false || $payload === '') {
        fail('Payload vacio', 400);
    }

    if ($secret === '' || $signature === '') {
        fail('Webhook de Stripe no configurado.', 400);
    }

    if (!verify_stripe_signature($payload, $signature, $secret)) {
        fail('Firma invalida de Stripe.', 400);
    }

    $event = json_decode($payload, true);
    if (!is_array($event)) {
        fail('Evento invalido', 400);
    }

    if (($event['type'] ?? '') !== 'checkout.session.completed') {
        success(['received' => true]);
    }

    $session = $event['data']['object'] ?? null;
    $bookingId = is_array($session) ? (string) ($session['metadata']['bookingId'] ?? '') : '';

    if ($bookingId === '') {
        fail('El webhook no contiene bookingId.', 400);
    }

    $pdo = db();
    $pdo->beginTransaction();

    try {
        confirm_booking_payment(
            $pdo,
            $bookingId,
            isset($session['payment_intent']) && is_string($session['payment_intent']) ? $session['payment_intent'] : null,
            is_array($session) ? $session : []
        );
        $pdo->commit();
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        throw $exception;
    }

    success(['received' => true]);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 400);
}
