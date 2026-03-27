<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    require_admin();
    $pdo = db();

    if ($method === 'POST') {
        $payload = json_input();
        $incomeId = isset($payload['id']) && $payload['id'] !== '' ? (int) $payload['id'] : null;
        $sourceType = trim((string) ($payload['source_type'] ?? 'manual')) ?: 'manual';
        $data = [
            ':concept' => trim((string) ($payload['concept'] ?? '')),
            ':category' => trim((string) ($payload['category'] ?? 'General')) ?: 'General',
            ':customer_name' => trim((string) ($payload['customer_name'] ?? '')) ?: null,
            ':amount' => (float) ($payload['amount'] ?? 0),
            ':status' => trim((string) ($payload['status'] ?? 'received')) ?: 'received',
            ':payment_date' => trim((string) ($payload['payment_date'] ?? '')),
            ':due_date' => trim((string) ($payload['due_date'] ?? '')) ?: null,
            ':payment_method' => trim((string) ($payload['payment_method'] ?? '')) ?: null,
            ':reference_code' => trim((string) ($payload['reference_code'] ?? '')) ?: null,
            ':notes' => trim((string) ($payload['notes'] ?? '')),
            ':source_type' => $sourceType,
        ];

        $allowedStatuses = ['pending', 'received', 'refunded', 'cancelled'];
        if ($data[':concept'] === '' || $data[':payment_date'] === '' || $data[':amount'] < 0) {
            fail('Completa concepto, fecha de pago y cantidad valida.', 422);
        }

        if (!in_array($data[':status'], $allowedStatuses, true)) {
            fail('Estatus de ingreso no valido.', 422);
        }

        if ($incomeId) {
            $existingStmt = $pdo->prepare('select source_type from public.income_entries where id = :id limit 1');
            $existingStmt->execute([':id' => $incomeId]);
            $existing = $existingStmt->fetch();

            if (!$existing) {
                fail('Ingreso no encontrado.', 404);
            }

            if (($existing['source_type'] ?? 'manual') !== 'manual') {
                fail('Los ingresos generados por reservas no se editan manualmente.', 409);
            }

            $stmt = $pdo->prepare(
                'update public.income_entries
                 set concept = :concept,
                     category = :category,
                     customer_name = :customer_name,
                     amount = :amount,
                     status = :status,
                     payment_date = :payment_date,
                     due_date = :due_date,
                     payment_method = :payment_method,
                     reference_code = :reference_code,
                     notes = :notes
                 where id = :id'
            );
            $data[':id'] = $incomeId;
            $stmt->execute($data);
        } else {
            $stmt = $pdo->prepare(
                'insert into public.income_entries
                 (concept, category, customer_name, amount, currency, status, payment_date, due_date, payment_method, reference_code, source_type, notes)
                 values
                 (:concept, :category, :customer_name, :amount, :currency, :status, :payment_date, :due_date, :payment_method, :reference_code, :source_type, :notes)'
            );
            $data[':currency'] = 'MXN';
            $stmt->execute($data);
        }

        success(['message' => 'Ingreso guardado correctamente.']);
    }

    if ($method === 'DELETE') {
        $payload = json_input();
        $incomeId = (int) ($payload['id'] ?? 0);
        if ($incomeId <= 0) {
            fail('ID invalido.', 422);
        }

        $existingStmt = $pdo->prepare('select source_type from public.income_entries where id = :id limit 1');
        $existingStmt->execute([':id' => $incomeId]);
        $existing = $existingStmt->fetch();

        if (!$existing) {
            fail('Ingreso no encontrado.', 404);
        }

        if (($existing['source_type'] ?? 'manual') !== 'manual') {
            fail('Los ingresos ligados a reservas no se eliminan manualmente.', 409);
        }

        $stmt = $pdo->prepare('delete from public.income_entries where id = :id');
        $stmt->execute([':id' => $incomeId]);
        success(['message' => 'Ingreso eliminado.']);
    }

    fail('Metodo no permitido', 405);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
