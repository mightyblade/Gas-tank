<?php
require __DIR__ . '/bootstrap.php';

require_any_role();
parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
$driverId = $params['id'] ?? null;
if (!$driverId) {
    respond(['error' => 'Driver id required'], 400);
}

$stmt = $pdo->prepare('SELECT id, name FROM drivers WHERE id = ?');
$stmt->execute([$driverId]);
$driver = $stmt->fetch();
if (!$driver) {
    respond(['error' => 'Driver not found'], 404);
}

$fuelStmt = $pdo->prepare('SELECT id, amount, entry_date, price_per_unit FROM fuel_entries WHERE driver_id = ? ORDER BY entry_date DESC, created_at DESC');
$fuelStmt->execute([$driverId]);
$fuelEntries = $fuelStmt->fetchAll();

$paymentStmt = $pdo->prepare('SELECT id, amount, entry_date FROM payments WHERE driver_id = ? ORDER BY entry_date DESC, created_at DESC');
$paymentStmt->execute([$driverId]);
$payments = $paymentStmt->fetchAll();

respond([
    'driver' => $driver,
    'fuelEntries' => $fuelEntries,
    'payments' => $payments,
]);
