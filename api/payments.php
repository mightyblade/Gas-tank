<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_any_role();
    $input = json_input();
    $driverId = $input['driverId'] ?? null;
    $amount = $input['amount'] ?? null;
    $date = $input['date'] ?? null;

    if (!$driverId || !is_numeric($amount) || !$date) {
        respond(['error' => 'Invalid input'], 400);
    }

    $stmt = $pdo->prepare('INSERT INTO payments (driver_id, amount, entry_date) VALUES (?, ?, ?)');
    $stmt->execute([$driverId, $amount, $date]);
    respond(['id' => $pdo->lastInsertId()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    require_role('admin');
    parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
    $paymentId = $params['id'] ?? null;
    if (!$paymentId) {
        respond(['error' => 'Payment id required'], 400);
    }
    $stmt = $pdo->prepare('DELETE FROM payments WHERE id = ?');
    $stmt->execute([$paymentId]);
    respond(['deleted' => true]);
}

respond(['error' => 'Method not allowed'], 405);
