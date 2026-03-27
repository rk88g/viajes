<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    require_admin();
    $pdo = db();

    if ($method === 'POST') {
        $payload = json_input();
        $departureId = isset($payload['id']) && $payload['id'] !== '' ? (int) $payload['id'] : null;
        $data = [
            ':trip_id' => (int) ($payload['trip_id'] ?? 0),
            ':departure_date' => (string) ($payload['departure_date'] ?? ''),
            ':return_date' => ($payload['return_date'] ?? '') !== '' ? (string) $payload['return_date'] : null,
            ':capacity' => (int) ($payload['capacity'] ?? 0),
            ':booked_count' => (int) ($payload['booked_count'] ?? 0),
            ':promo_price' => ($payload['promo_price'] ?? '') !== '' ? (float) $payload['promo_price'] : null,
            ':status' => (string) ($payload['status'] ?? 'open'),
            ':notes' => trim((string) ($payload['notes'] ?? '')) ?: null,
        ];

        if ($data[':trip_id'] <= 0 || $data[':departure_date'] === '' || $data[':capacity'] <= 0) {
            fail('Completa viaje, fecha y cupo', 422);
        }

        if ($departureId) {
            $stmt = $pdo->prepare(
                'update public.departures
                 set trip_id = :trip_id,
                     departure_date = :departure_date,
                     return_date = :return_date,
                     capacity = :capacity,
                     booked_count = :booked_count,
                     promo_price = :promo_price,
                     status = :status,
                     notes = :notes
                 where id = :id'
            );
            $data[':id'] = $departureId;
            $stmt->execute($data);
        } else {
            $stmt = $pdo->prepare(
                'insert into public.departures
                 (trip_id, departure_date, return_date, capacity, booked_count, promo_price, status, notes)
                 values
                 (:trip_id, :departure_date, :return_date, :capacity, :booked_count, :promo_price, :status, :notes)'
            );
            $stmt->execute($data);
        }

        success(['message' => 'Salida guardada correctamente']);
    }

    if ($method === 'DELETE') {
        $payload = json_input();
        $departureId = (int) ($payload['id'] ?? 0);
        if ($departureId <= 0) {
            fail('ID invalido', 422);
        }

        $stmt = $pdo->prepare('delete from public.departures where id = :id');
        $stmt->execute([':id' => $departureId]);
        success(['message' => 'Salida eliminada']);
    }

    fail('Metodo no permitido', 405);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
