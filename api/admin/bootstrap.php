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
        "select
            d.id,
            d.trip_id,
            d.departure_date,
            d.return_date,
            d.capacity,
            d.booked_count,
            d.promo_price,
            d.status,
            d.notes,
            json_build_object('title', t.title, 'destination', t.destination, 'price', t.price) as trip
         from public.departures d
         inner join public.trips t on t.id = d.trip_id
         order by d.departure_date asc"
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
        'select id, full_name, email, phone, message, admin_notes, status
         from public.contact_messages
         order by created_at desc
         limit 20'
    );
    $messages = $messagesStmt->fetchAll();

    $incomeEntriesStmt = $pdo->query(
        'select id, concept, category, customer_name, amount, currency, status, payment_date, due_date, payment_method, reference_code, source_type, booking_id, notes
         from public.income_entries
         order by payment_date desc, created_at desc
         limit 50'
    );
    $incomeEntries = array_map(static fn(array $row): array => map_income_entry($row), $incomeEntriesStmt->fetchAll());

    $incomeSummaryStmt = $pdo->query(
        "select
            to_char(date_trunc('month', payment_date), 'YYYY-MM') as month_key,
            date_trunc('month', payment_date)::date as month_start,
            coalesce(sum(case when status = 'received' then amount else 0 end), 0) as received_total,
            coalesce(sum(case when status = 'pending' then amount else 0 end), 0) as pending_total,
            coalesce(sum(case when status = 'refunded' then amount else 0 end), 0) as refunded_total,
            count(*) as entries_count
         from public.income_entries
         group by 1, 2
         order by month_start desc
         limit 12"
    );
    $incomeSummary = array_map(
        static function (array $row): array {
            $row['received_total'] = (float) ($row['received_total'] ?? 0);
            $row['pending_total'] = (float) ($row['pending_total'] ?? 0);
            $row['refunded_total'] = (float) ($row['refunded_total'] ?? 0);
            $row['entries_count'] = (int) ($row['entries_count'] ?? 0);
            return $row;
        },
        $incomeSummaryStmt->fetchAll()
    );

    success([
        'settings' => $settings,
        'trips' => $trips,
        'departures' => $departures,
        'bookings' => $bookings,
        'messages' => $messages,
        'income_entries' => $incomeEntries,
        'income_summary' => $incomeSummary,
    ]);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
