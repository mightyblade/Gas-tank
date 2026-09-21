<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_any_role();
    $input = json_input();
    $driverId = $input['driverId'] ?? null;
    $amount = $input['amount'] ?? null;
    $date = $input['date'] ?? null;
    $price = $input['pricePerUnit'] ?? null;
    $vehicleId = $input['vehicleId'] ?? null;

    if (!$driverId || !is_numeric($amount) || !$date || !is_numeric($price)) {
        respond(['error' => 'Invalid input'], 400);
    }

    $stmt = $pdo->prepare('INSERT INTO fuel_entries (driver_id, vehicle_id, amount, entry_date, price_per_unit) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$driverId, $vehicleId ? $vehicleId : null, $amount, $date, $price]);
    
    $currentFuelLevel = get_setting($pdo, 'current_fuel_level');
    if ($currentFuelLevel !== null) {
        $newLevel = floatval($currentFuelLevel) - floatval($amount);
        set_setting($pdo, 'current_fuel_level', $newLevel);
    }
    
    respond(['id' => $pdo->lastInsertId()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    require_any_role();
    parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
    $entryId = $params['id'] ?? null;
    if (!$entryId) {
        respond(['error' => 'Entry id required'], 400);
    }
    
    $stmt = $pdo->prepare('SELECT driver_id FROM fuel_entries WHERE id = ?');
    $stmt->execute([$entryId]);
    $entry = $stmt->fetch();
    
    if (!$entry) {
        respond(['error' => 'Entry not found'], 404);
    }
    
    if ($_SESSION['role'] !== 'admin' && $_SESSION['driver_id'] != $entry['driver_id']) {
        respond(['error' => 'Unauthorized'], 401);
    }
    
    $stmt = $pdo->prepare('DELETE FROM fuel_entries WHERE id = ?');
    $stmt->execute([$entryId]);
    respond(['deleted' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    require_any_role();
    parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
    $entryId = $params['id'] ?? null;
    $input = json_input();
    $amount = $input['amount'] ?? null;
    $date = $input['date'] ?? null;
    $price = $input['pricePerUnit'] ?? null;
    $vehicleId = $input['vehicleId'] ?? null;

    if (!$entryId || !is_numeric($amount) || !$date || !is_numeric($price)) {
        respond(['error' => 'Invalid input'], 400);
    }
    
    $stmt = $pdo->prepare('SELECT driver_id FROM fuel_entries WHERE id = ?');
    $stmt->execute([$entryId]);
    $entry = $stmt->fetch();
    
    if (!$entry) {
        respond(['error' => 'Entry not found'], 404);
    }
    
    if ($_SESSION['role'] !== 'admin' && $_SESSION['driver_id'] != $entry['driver_id']) {
        respond(['error' => 'Unauthorized'], 401);
    }

    $stmt = $pdo->prepare('UPDATE fuel_entries SET amount = ?, entry_date = ?, price_per_unit = ?, vehicle_id = ? WHERE id = ?');
    $stmt->execute([$amount, $date, $price, $vehicleId ? $vehicleId : null, $entryId]);
    respond(['updated' => true]);
}

respond(['error' => 'Method not allowed'], 405);
