<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_any_role();
    $input = json_input();
    $driverId = $input['driverId'] ?? null;
    $amount = $input['amount'] ?? null;
    $date = $input['date'] ?? null;
    $price = $input['pricePerUnit'] ?? null;

    if (!$driverId || !is_numeric($amount) || !$date || !is_numeric($price)) {
        respond(['error' => 'Invalid input'], 400);
    }

    $stmt = $pdo->prepare('INSERT INTO fuel_entries (driver_id, amount, entry_date, price_per_unit) VALUES (?, ?, ?, ?)');
    $stmt->execute([$driverId, $amount, $date, $price]);
    respond(['id' => $pdo->lastInsertId()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    require_role('admin');
    parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
    $entryId = $params['id'] ?? null;
    if (!$entryId) {
        respond(['error' => 'Entry id required'], 400);
    }
    $stmt = $pdo->prepare('DELETE FROM fuel_entries WHERE id = ?');
    $stmt->execute([$entryId]);
    respond(['deleted' => true]);
}

respond(['error' => 'Method not allowed'], 405);
