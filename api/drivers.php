<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_any_role();
    $stmt = $pdo->query('SELECT id, name, created_at FROM drivers ORDER BY created_at DESC');
    $drivers = $stmt->fetchAll();

    $latestStmt = $pdo->prepare('SELECT * FROM fuel_entries WHERE driver_id = ? ORDER BY entry_date DESC, created_at DESC LIMIT 1');
    foreach ($drivers as &$driver) {
        $latestStmt->execute([$driver['id']]);
        $driver['latestFuel'] = $latestStmt->fetch() ?: null;
    }

    respond(['drivers' => $drivers]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_role('admin');
    $input = json_input();
    $name = trim($input['name'] ?? '');
    if ($name === '') {
        respond(['error' => 'Name is required'], 400);
    }
    $stmt = $pdo->prepare('INSERT INTO drivers (name) VALUES (?)');
    $stmt->execute([$name]);
    $driverId = $pdo->lastInsertId();
    respond(['id' => $driverId, 'name' => $name]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    require_role('admin');
    parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
    $driverId = $params['id'] ?? null;
    if (!$driverId) {
        respond(['error' => 'Driver id required'], 400);
    }
    $stmt = $pdo->prepare('DELETE FROM drivers WHERE id = ?');
    $stmt->execute([$driverId]);
    respond(['deleted' => true]);
}

respond(['error' => 'Method not allowed'], 405);
