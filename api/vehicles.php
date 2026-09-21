<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_any_role();
    $driverId = $_GET['driver_id'] ?? null;
    if (!$driverId) {
        respond(['error' => 'Driver id required'], 400);
    }
    if ($_SESSION['role'] !== 'admin' && $_SESSION['driver_id'] != $driverId) {
        respond(['error' => 'Unauthorized'], 401);
    }

    $stmt = $pdo->prepare('SELECT id, driver_id, name, created_at FROM vehicles WHERE driver_id = ? ORDER BY name ASC');
    $stmt->execute([$driverId]);
    $vehicles = $stmt->fetchAll();

    respond(['vehicles' => $vehicles]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_any_role();
    $input = json_input();
    $driverId = $input['driverId'] ?? null;
    $name = $input['name'] ?? null;

    if (!$driverId || !$name) {
        respond(['error' => 'Driver id and name required'], 400);
    }
    if ($_SESSION['role'] !== 'admin' && $_SESSION['driver_id'] != $driverId) {
        respond(['error' => 'Unauthorized'], 401);
    }

    $stmt = $pdo->prepare('INSERT INTO vehicles (driver_id, name) VALUES (?, ?)');
    $stmt->execute([$driverId, $name]);
    respond(['id' => $pdo->lastInsertId()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    require_any_role();
    parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
    $vehicleId = $params['id'] ?? null;
    $input = json_input();
    $name = $input['name'] ?? null;

    if (!$vehicleId || !$name) {
        respond(['error' => 'Vehicle id and name required'], 400);
    }

    $stmt = $pdo->prepare('SELECT driver_id FROM vehicles WHERE id = ?');
    $stmt->execute([$vehicleId]);
    $vehicle = $stmt->fetch();

    if (!$vehicle) {
        respond(['error' => 'Vehicle not found'], 404);
    }
    if ($_SESSION['role'] !== 'admin' && $_SESSION['driver_id'] != $vehicle['driver_id']) {
        respond(['error' => 'Unauthorized'], 401);
    }

    $stmt = $pdo->prepare('UPDATE vehicles SET name = ? WHERE id = ?');
    $stmt->execute([$name, $vehicleId]);
    respond(['updated' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    require_any_role();
    parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
    $vehicleId = $params['id'] ?? null;
    if (!$vehicleId) {
        respond(['error' => 'Vehicle id required'], 400);
    }

    $stmt = $pdo->prepare('SELECT driver_id FROM vehicles WHERE id = ?');
    $stmt->execute([$vehicleId]);
    $vehicle = $stmt->fetch();

    if (!$vehicle) {
        respond(['error' => 'Vehicle not found'], 404);
    }
    if ($_SESSION['role'] !== 'admin' && $_SESSION['driver_id'] != $vehicle['driver_id']) {
        respond(['error' => 'Unauthorized'], 401);
    }

    $stmt = $pdo->prepare('DELETE FROM vehicles WHERE id = ?');
    $stmt->execute([$vehicleId]);
    respond(['deleted' => true]);
}

respond(['error' => 'Method not allowed'], 405);
