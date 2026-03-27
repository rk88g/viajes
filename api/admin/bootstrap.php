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

    $expenseEntriesStmt = $pdo->query(
        'select id, concept, category, vendor_name, amount, currency, status, expense_date, due_date, payment_method, reference_code, notes
         from public.expense_entries
         order by expense_date desc, created_at desc
         limit 50'
    );
    $expenseEntries = array_map(static fn(array $row): array => map_expense_entry($row), $expenseEntriesStmt->fetchAll());

    $incomeSummaryStmt = $pdo->query(
        "with income_months as (
            select
              date_trunc('month', payment_date)::date as month_start,
              coalesce(sum(case when status = 'received' then amount else 0 end), 0) as received_total,
              coalesce(sum(case when status = 'pending' then amount else 0 end), 0) as pending_total,
              coalesce(sum(case when status = 'refunded' then amount else 0 end), 0) as refunded_total,
              count(*) as income_entries_count
            from public.income_entries
            group by 1
          ),
          expense_months as (
            select
              date_trunc('month', expense_date)::date as month_start,
              coalesce(sum(case when status = 'paid' then amount else 0 end), 0) as expense_total,
              count(*) as expense_entries_count
            from public.expense_entries
            group by 1
          ),
          months as (
            select month_start from income_months
            union
            select month_start from expense_months
          )
          select
            to_char(months.month_start, 'YYYY-MM') as month_key,
            months.month_start,
            coalesce(income_months.received_total, 0) as received_total,
            coalesce(income_months.pending_total, 0) as pending_total,
            coalesce(income_months.refunded_total, 0) as refunded_total,
            coalesce(expense_months.expense_total, 0) as expense_total,
            coalesce(income_months.received_total, 0) - coalesce(expense_months.expense_total, 0) as net_total,
            coalesce(income_months.income_entries_count, 0) + coalesce(expense_months.expense_entries_count, 0) as entries_count
          from months
          left join income_months on income_months.month_start = months.month_start
          left join expense_months on expense_months.month_start = months.month_start
          order by months.month_start desc
          limit 12"
    );
    $incomeSummary = array_map(
        static function (array $row): array {
            $row['received_total'] = (float) ($row['received_total'] ?? 0);
            $row['pending_total'] = (float) ($row['pending_total'] ?? 0);
            $row['refunded_total'] = (float) ($row['refunded_total'] ?? 0);
            $row['expense_total'] = (float) ($row['expense_total'] ?? 0);
            $row['net_total'] = (float) ($row['net_total'] ?? 0);
            $row['entries_count'] = (int) ($row['entries_count'] ?? 0);
            return $row;
        },
        $incomeSummaryStmt->fetchAll()
    );

    $visitsStmt = $pdo->query(
        'select id, visitor_token, visit_count, user_agent, ip_address, first_seen_at, last_seen_at
         from public.site_visitors
         order by last_seen_at desc
         limit 80'
    );
    $siteVisits = array_map(static fn(array $row): array => map_site_visit($row), $visitsStmt->fetchAll());

    success([
        'settings' => $settings,
        'trips' => $trips,
        'departures' => $departures,
        'bookings' => $bookings,
        'messages' => $messages,
        'income_entries' => $incomeEntries,
        'expense_entries' => $expenseEntries,
        'income_summary' => $incomeSummary,
        'site_visits' => $siteVisits,
    ]);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
