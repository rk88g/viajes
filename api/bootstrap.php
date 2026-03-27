<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

try {
    require_method('GET');

    $pdo = db();

    $settingsStmt = $pdo->query('select * from public.site_settings where id = 1 limit 1');
    $settings = $settingsStmt->fetch() ?: null;

    $catalogStmt = $pdo->prepare(
        "select
            d.id as departure_id,
            d.departure_date,
            d.return_date,
            d.capacity,
            d.booked_count,
            d.status,
            d.promo_price,
            json_build_object(
              'id', t.id,
              'slug', t.slug,
              'title', t.title,
              'destination', t.destination,
              'meeting_point', t.meeting_point,
              'duration_text', t.duration_text,
              'price', t.price,
              'featured', t.featured,
              'hero_image_url', t.hero_image_url,
              'short_description', t.short_description,
              'description', t.description,
              'includes', t.includes,
              'itinerary', t.itinerary,
              'tags', t.tags
            ) as trip
         from public.departures d
         inner join public.trips t on t.id = d.trip_id
         where d.status = 'open'
           and t.published = true
           and d.departure_date >= current_date
         order by d.departure_date asc"
    );
    $catalogStmt->execute();

    $catalog = array_map(
        static fn(array $row): array => map_departure($row),
        $catalogStmt->fetchAll()
    );

    success([
        'settings' => $settings,
        'catalog' => $catalog,
    ]);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
