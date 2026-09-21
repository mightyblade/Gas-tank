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

$fuelStmt = $pdo->prepare('SELECT id, vehicle_id, amount, entry_date, price_per_unit FROM fuel_entries WHERE driver_id = ? ORDER BY entry_date DESC, created_at DESC');
$fuelStmt->execute([$driverId]);
$fuelEntries = $fuelStmt->fetchAll();

$paymentStmt = $pdo->prepare('SELECT id, amount, entry_date FROM payments WHERE driver_id = ? ORDER BY entry_date DESC, created_at DESC');
$paymentStmt->execute([$driverId]);
$payments = $paymentStmt->fetchAll();

$vehicleStmt = $pdo->prepare('SELECT id, driver_id, name, created_at FROM vehicles WHERE driver_id = ? ORDER BY name ASC');
$vehicleStmt->execute([$driverId]);
$vehicles = $vehicleStmt->fetchAll();

$currentYear = date('Y');
$currentMonth = date('n');
$lastMonth = $currentMonth == 1 ? 12 : $currentMonth - 1;
$lastMonthYear = $currentMonth == 1 ? $currentYear - 1 : $currentYear;

foreach ($vehicles as &$vehicle) {
    $vehicleId = $vehicle['id'];
    
    $totalStmt = $pdo->prepare('
        SELECT SUM(amount) as total_amount, SUM(amount * price_per_unit) as total_cost
        FROM fuel_entries 
        WHERE driver_id = ? AND vehicle_id = ?
    ');
    $totalStmt->execute([$driverId, $vehicleId]);
    $total = $totalStmt->fetch();
    
    $currentMonthStmt = $pdo->prepare('
        SELECT SUM(amount) as total_amount, SUM(amount * price_per_unit) as total_cost
        FROM fuel_entries 
        WHERE driver_id = ? AND vehicle_id = ? AND YEAR(entry_date) = ? AND MONTH(entry_date) = ?
    ');
    $currentMonthStmt->execute([$driverId, $vehicleId, $currentYear, $currentMonth]);
    $currentMonthData = $currentMonthStmt->fetch();
    
    $lastMonthStmt = $pdo->prepare('
        SELECT SUM(amount) as total_amount, SUM(amount * price_per_unit) as total_cost
        FROM fuel_entries 
        WHERE driver_id = ? AND vehicle_id = ? AND YEAR(entry_date) = ? AND MONTH(entry_date) = ?
    ');
    $lastMonthStmt->execute([$driverId, $vehicleId, $lastMonthYear, $lastMonth]);
    $lastMonthData = $lastMonthStmt->fetch();
    
    $currentYearStmt = $pdo->prepare('
        SELECT SUM(amount) as total_amount, SUM(amount * price_per_unit) as total_cost
        FROM fuel_entries 
        WHERE driver_id = ? AND vehicle_id = ? AND YEAR(entry_date) = ?
    ');
    $currentYearStmt->execute([$driverId, $vehicleId, $currentYear]);
    $currentYearData = $currentYearStmt->fetch();
    
    $lastYearStmt = $pdo->prepare('
        SELECT SUM(amount) as total_amount, SUM(amount * price_per_unit) as total_cost
        FROM fuel_entries 
        WHERE driver_id = ? AND vehicle_id = ? AND YEAR(entry_date) = ?
    ');
    $lastYearStmt->execute([$driverId, $vehicleId, $currentYear - 1]);
    $lastYearData = $lastYearStmt->fetch();
    
    $vehicle['stats'] = [
        'total' => [
            'amount' => floatval($total['total_amount'] ?? 0),
            'cost' => floatval($total['total_cost'] ?? 0)
        ],
        'currentMonth' => [
            'amount' => floatval($currentMonthData['total_amount'] ?? 0),
            'cost' => floatval($currentMonthData['total_cost'] ?? 0)
        ],
        'lastMonth' => [
            'amount' => floatval($lastMonthData['total_amount'] ?? 0),
            'cost' => floatval($lastMonthData['total_cost'] ?? 0)
        ],
        'currentYear' => [
            'amount' => floatval($currentYearData['total_amount'] ?? 0),
            'cost' => floatval($currentYearData['total_cost'] ?? 0)
        ],
        'lastYear' => [
            'amount' => floatval($lastYearData['total_amount'] ?? 0),
            'cost' => floatval($lastYearData['total_cost'] ?? 0)
        ]
    ];
}
unset($vehicle);

respond([
    'driver' => $driver,
    'fuelEntries' => $fuelEntries,
    'payments' => $payments,
    'vehicles' => $vehicles,
]);
