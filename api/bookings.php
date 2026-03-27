<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

try {
    require_method('POST');

    $payload = json_input();
    $departureId = (int) ($payload['departure_id'] ?? 0);
    $seats = (int) ($payload['seats_reserved'] ?? 0);
    $customerName = trim((string) ($payload['customer_name'] ?? ''));
    $customerEmail = trim((string) ($payload['customer_email'] ?? ''));
    $customerPhone = trim((string) ($payload['customer_phone'] ?? ''));

    if ($departureId <= 0 || $seats <= 0) {
        fail('Selecciona una salida valida y al menos un lugar.', 422);
    }

    if ($customerName === '' || $customerEmail === '' || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
        fail('Completa nombre y correo con datos validos.', 422);
    }

    $pdo = db();
    $departureStmt = $pdo->prepare(
        'select
            d.id,
            d.trip_id,
            d.departure_date,
            d.capacity,
            d.booked_count,
            d.promo_price,
            d.status,
            json_build_object(
              ''id'', t.id,
              ''title'', t.title,
              ''price'', t.price,
              ''meeting_point'', t.meeting_point
            ) as trip
         from public.departures d
         inner join public.trips t on t.id = d.trip_id
         where d.id = :id
           and t.published = true
         limit 1'
    );
    $departureStmt->execute([':id' => $departureId]);
    $departure = map_departure($departureStmt->fetch() ?: []);

    if ($departure === []) {
        fail('La salida solicitada no existe.', 404);
    }

    if (($departure['status'] ?? '') !== 'open') {
        fail('La salida ya no esta disponible.', 409);
    }

    $availableSeats = max(((int) ($departure['capacity'] ?? 0)) - ((int) ($departure['booked_count'] ?? 0)), 0);
    if ($seats > $availableSeats) {
        fail('No hay suficiente cupo disponible para completar el apartado.', 409);
    }

    $trip = $departure['trip'] ?? [];
    $unitPrice = (float) ($departure['promo_price'] ?? ($trip['price'] ?? 0));
    $totalAmount = $unitPrice * $seats;

    $pdo->beginTransaction();

    try {
        $bookingStmt = $pdo->prepare(
            'insert into public.bookings
             (trip_id, departure_id, trip_title_snapshot, departure_date_snapshot, customer_name, customer_email, customer_phone, seats_reserved, total_amount, status, payment_status, checkout_payload)
             values
             (:trip_id, :departure_id, :trip_title_snapshot, :departure_date_snapshot, :customer_name, :customer_email, :customer_phone, :seats_reserved, :total_amount, :status, :payment_status, cast(:checkout_payload as jsonb))
             returning id'
        );
        $bookingStmt->execute([
            ':trip_id' => (int) ($departure['trip_id'] ?? ($trip['id'] ?? 0)),
            ':departure_id' => (int) $departure['id'],
            ':trip_title_snapshot' => (string) ($trip['title'] ?? 'Viaje'),
            ':departure_date_snapshot' => (string) ($departure['departure_date'] ?? ''),
            ':customer_name' => $customerName,
            ':customer_email' => $customerEmail,
            ':customer_phone' => $customerPhone !== '' ? $customerPhone : null,
            ':seats_reserved' => $seats,
            ':total_amount' => $totalAmount,
            ':status' => 'pending_payment',
            ':payment_status' => 'unpaid',
            ':checkout_payload' => json_encode([
                'source' => 'railway-php',
                'created_from' => 'website',
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
        $bookingId = (string) $bookingStmt->fetchColumn();

        if ($bookingId === '') {
            throw new RuntimeException('No se pudo crear la reserva.');
        }

        $booking = ['id' => $bookingId];
        $customer = [
            'name' => $customerName,
            'email' => $customerEmail,
            'phone' => $customerPhone,
        ];

        if (stripe_is_configured()) {
            $session = create_stripe_checkout_session($booking, $departure, $seats, $unitPrice, $customer);
            if (empty($session['id']) || empty($session['url'])) {
                throw new RuntimeException('Stripe no devolvio una sesion valida de checkout.');
            }

            $updateStmt = $pdo->prepare(
                'update public.bookings
                 set stripe_session_id = :stripe_session_id,
                     checkout_payload = cast(:checkout_payload as jsonb)
                 where id = :id'
            );
            $updateStmt->execute([
                ':stripe_session_id' => (string) ($session['id'] ?? ''),
                ':checkout_payload' => json_encode($session, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ':id' => $bookingId,
            ]);

            $pdo->commit();

            success([
                'booking_id' => $bookingId,
                'checkout_url' => $session['url'] ?? null,
                'payment_mode' => 'stripe',
            ]);
        }

        $pdo->commit();

        success([
            'booking_id' => $bookingId,
            'payment_mode' => 'manual',
            'whatsapp_url' => booking_whatsapp_url($departure, $customer, $seats),
            'message' => 'Stripe aun no esta configurado en Railway. La reserva quedo registrada y seguimos por WhatsApp.',
        ]);
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        throw $exception;
    }
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
