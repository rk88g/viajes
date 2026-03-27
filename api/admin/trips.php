<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    require_admin();
    $pdo = db();

    if ($method === 'POST') {
        $payload = json_input();
        $tripId = isset($payload['id']) && $payload['id'] !== '' ? (int) $payload['id'] : null;
        $data = [
            ':slug' => trim((string) ($payload['slug'] ?? '')),
            ':title' => trim((string) ($payload['title'] ?? '')),
            ':destination' => trim((string) ($payload['destination'] ?? '')),
            ':meeting_point' => trim((string) ($payload['meeting_point'] ?? '')),
            ':duration_text' => trim((string) ($payload['duration_text'] ?? '')),
            ':price' => (float) ($payload['price'] ?? 0),
            ':hero_image_url' => trim((string) ($payload['hero_image_url'] ?? '')) ?: null,
            ':short_description' => trim((string) ($payload['short_description'] ?? '')),
            ':description' => trim((string) ($payload['description'] ?? '')),
            ':includes' => json_encode($payload['includes'] ?? [], JSON_UNESCAPED_UNICODE),
            ':itinerary' => json_encode($payload['itinerary'] ?? [], JSON_UNESCAPED_UNICODE),
            ':tags' => json_encode($payload['tags'] ?? [], JSON_UNESCAPED_UNICODE),
            ':featured' => !empty($payload['featured']),
            ':published' => !empty($payload['published']),
        ];

        if ($data[':slug'] === '' || $data[':title'] === '' || $data[':destination'] === '') {
            fail('Completa slug, titulo y destino', 422);
        }

        if ($tripId) {
            $stmt = $pdo->prepare(
                'update public.trips
                 set slug = :slug,
                     title = :title,
                     destination = :destination,
                     meeting_point = :meeting_point,
                     duration_text = :duration_text,
                     price = :price,
                     hero_image_url = :hero_image_url,
                     short_description = :short_description,
                     description = :description,
                     includes = cast(:includes as jsonb),
                     itinerary = cast(:itinerary as jsonb),
                     tags = cast(:tags as jsonb),
                     featured = :featured,
                     published = :published
                 where id = :id'
            );
            $data[':id'] = $tripId;
            $stmt->execute($data);
        } else {
            $stmt = $pdo->prepare(
                'insert into public.trips
                 (slug, title, destination, meeting_point, duration_text, price, hero_image_url, short_description, description, includes, itinerary, tags, featured, published)
                 values
                 (:slug, :title, :destination, :meeting_point, :duration_text, :price, :hero_image_url, :short_description, :description, cast(:includes as jsonb), cast(:itinerary as jsonb), cast(:tags as jsonb), :featured, :published)'
            );
            $stmt->execute($data);
        }

        success(['message' => 'Viaje guardado correctamente']);
    }

    if ($method === 'DELETE') {
        $payload = json_input();
        $tripId = (int) ($payload['id'] ?? 0);
        if ($tripId <= 0) {
            fail('ID invalido', 422);
        }

        $stmt = $pdo->prepare('delete from public.trips where id = :id');
        $stmt->execute([':id' => $tripId]);
        success(['message' => 'Viaje eliminado']);
    }

    fail('Metodo no permitido', 405);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
