<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    require_method('POST');
    require_admin();
    $payload = json_input();

    $stmt = db()->prepare(
        'insert into public.site_settings
         (id, company_name, hero_badge, hero_title, hero_subtitle, support_email, support_phone, whatsapp_number, whatsapp_message, chatbot_enabled, chatbot_embed_code)
         values
         (1, :company_name, :hero_badge, :hero_title, :hero_subtitle, :support_email, :support_phone, :whatsapp_number, :whatsapp_message, :chatbot_enabled, :chatbot_embed_code)
         on conflict (id) do update set
           company_name = excluded.company_name,
           hero_badge = excluded.hero_badge,
           hero_title = excluded.hero_title,
           hero_subtitle = excluded.hero_subtitle,
           support_email = excluded.support_email,
           support_phone = excluded.support_phone,
           whatsapp_number = excluded.whatsapp_number,
           whatsapp_message = excluded.whatsapp_message,
           chatbot_enabled = excluded.chatbot_enabled,
           chatbot_embed_code = excluded.chatbot_embed_code'
    );

    $stmt->execute([
        ':company_name' => trim((string) ($payload['company_name'] ?? 'Jalisco Rutas')),
        ':hero_badge' => trim((string) ($payload['hero_badge'] ?? 'Salidas semanales desde Guadalajara y ZMG')),
        ':hero_title' => trim((string) ($payload['hero_title'] ?? '')),
        ':hero_subtitle' => trim((string) ($payload['hero_subtitle'] ?? '')),
        ':support_email' => trim((string) ($payload['support_email'] ?? 'hola@jalisconrutas.com')),
        ':support_phone' => trim((string) ($payload['support_phone'] ?? '+52 33 1246 9036')),
        ':whatsapp_number' => trim((string) ($payload['whatsapp_number'] ?? '523312469036')),
        ':whatsapp_message' => trim((string) ($payload['whatsapp_message'] ?? '')),
        ':chatbot_enabled' => !empty($payload['chatbot_enabled']),
        ':chatbot_embed_code' => (string) ($payload['chatbot_embed_code'] ?? ''),
    ]);

    success(['message' => 'Configuracion guardada correctamente']);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
