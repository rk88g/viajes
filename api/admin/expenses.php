<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    require_admin();
    $pdo = db();

    if ($method === 'POST') {
        $payload = json_input();
        $expenseId = isset($payload['id']) && $payload['id'] !== '' ? (int) $payload['id'] : null;
        $data = [
            ':concept' => trim((string) ($payload['concept'] ?? '')),
            ':category' => trim((string) ($payload['category'] ?? 'Operacion')) ?: 'Operacion',
            ':vendor_name' => trim((string) ($payload['vendor_name'] ?? '')) ?: null,
            ':amount' => (float) ($payload['amount'] ?? 0),
            ':status' => trim((string) ($payload['status'] ?? 'paid')) ?: 'paid',
            ':expense_date' => trim((string) ($payload['expense_date'] ?? '')),
            ':due_date' => trim((string) ($payload['due_date'] ?? '')) ?: null,
            ':payment_method' => trim((string) ($payload['payment_method'] ?? '')) ?: null,
            ':reference_code' => trim((string) ($payload['reference_code'] ?? '')) ?: null,
            ':notes' => trim((string) ($payload['notes'] ?? '')),
        ];

        $allowedStatuses = ['planned', 'paid', 'cancelled', 'refunded'];
        if ($data[':concept'] === '' || $data[':expense_date'] === '' || $data[':amount'] < 0) {
            fail('Completa concepto, fecha del gasto y cantidad valida.', 422);
        }

        if (!in_array($data[':status'], $allowedStatuses, true)) {
            fail('Estatus de gasto no valido.', 422);
        }

        if ($expenseId) {
            $stmt = $pdo->prepare(
                'update public.expense_entries
                 set concept = :concept,
                     category = :category,
                     vendor_name = :vendor_name,
                     amount = :amount,
                     status = :status,
                     expense_date = :expense_date,
                     due_date = :due_date,
                     payment_method = :payment_method,
                     reference_code = :reference_code,
                     notes = :notes
                 where id = :id'
            );
            $data[':id'] = $expenseId;
            $stmt->execute($data);
        } else {
            $stmt = $pdo->prepare(
                'insert into public.expense_entries
                 (concept, category, vendor_name, amount, currency, status, expense_date, due_date, payment_method, reference_code, notes)
                 values
                 (:concept, :category, :vendor_name, :amount, :currency, :status, :expense_date, :due_date, :payment_method, :reference_code, :notes)'
            );
            $data[':currency'] = 'MXN';
            $stmt->execute($data);
        }

        success(['message' => 'Gasto guardado correctamente.']);
    }

    if ($method === 'DELETE') {
        $payload = json_input();
        $expenseId = (int) ($payload['id'] ?? 0);
        if ($expenseId <= 0) {
            fail('ID invalido.', 422);
        }

        $stmt = $pdo->prepare('delete from public.expense_entries where id = :id');
        $stmt->execute([':id' => $expenseId]);
        success(['message' => 'Gasto eliminado.']);
    }

    fail('Metodo no permitido', 405);
} catch (Throwable $exception) {
    fail($exception->getMessage(), 500);
}
