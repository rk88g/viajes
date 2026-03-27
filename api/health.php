<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

try {
    require_method('GET');

    $pdo = db();
    $counts = [
        'trips' => (int) $pdo->query('select count(*) from public.trips')->fetchColumn(),
        'departures' => (int) $pdo->query('select count(*) from public.departures')->fetchColumn(),
        'bookings' => (int) $pdo->query('select count(*) from public.bookings')->fetchColumn(),
        'messages' => (int) $pdo->query('select count(*) from public.contact_messages')->fetchColumn(),
    ];

    success([
        'environment' => [
            'database_connected' => true,
            'stripe_checkout_configured' => stripe_is_configured(),
            'stripe_webhook_configured' => stripe_webhook_is_configured(),
            'public_site_url' => public_site_url(),
        ],
        'counts' => $counts,
    ]);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
