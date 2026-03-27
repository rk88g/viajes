<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    require_method('GET');
    require_admin();

    $pdo = db();

    $settings = $pdo->query('select * from public.site_settings where id = 1 limit 1')->fetch() ?: null;

    $tripsStmt = $pdo->query('select * from public.trips order by created_at desc');
    $trips = array_map(static fn(array $row): array => map_trip($row), $tripsStmt->fetchAll());

    $departuresStmt = $pdo->query(
        'select
            d.id,
            d.trip_id,
            d.departure_date,
            d.return_date,
            d.capacity,
            d.booked_count,
            d.promo_price,
            d.status,
            d.notes,
            json_build_object(''title'', t.title, ''destination'', t.destination, ''price'', t.price) as trip
         from public.departures d
         inner join public.trips t on t.id = d.trip_id
         order by d.departure_date asc'
    );
    $departures = array_map(static fn(array $row): array => map_departure($row), $departuresStmt->fetchAll());

    $bookingsStmt = $pdo->query(
        'select id, customer_name, customer_email, customer_phone, seats_reserved, total_amount, status, payment_status, trip_title_snapshot, departure_date_snapshot
         from public.bookings
         order by created_at desc
         limit 20'
    );
    $bookings = $bookingsStmt->fetchAll();

    $messagesStmt = $pdo->query(
        'select id, full_name, email, phone, message, status
         from public.contact_messages
         order by created_at desc
         limit 20'
    );
    $messages = $messagesStmt->fetchAll();

    success([
        'settings' => $settings,
        'trips' => $trips,
        'departures' => $departures,
        'bookings' => $bookings,
        'messages' => $messages,
    ]);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
