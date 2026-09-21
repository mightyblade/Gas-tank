<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_role('admin');

    $fuelStmt = $pdo->query('
        SELECT
            SUM(amount * price_per_unit) as total_fuel_cost,
            SUM(amount) as total_liters
        FROM fuel_entries
    ');
    $fuelData = $fuelStmt->fetch();

    $paymentStmt = $pdo->query('SELECT SUM(amount) as total_payments FROM payments');
    $paymentData = $paymentStmt->fetch();

    // Aggregate fuel and payments in separate subqueries before joining to
    // drivers, so a driver with multiple fuel entries AND multiple payments
    // doesn't get their totals multiplied together by the join.
    $driverFuelStmt = $pdo->query('
        SELECT
            d.id,
            d.name,
            COALESCE(f.total_fuel_cost, 0) as total_fuel_cost,
            COALESCE(f.total_liters, 0) as total_liters,
            COALESCE(p.total_paid, 0) as total_paid
        FROM drivers d
        LEFT JOIN (
            SELECT driver_id, SUM(amount * price_per_unit) as total_fuel_cost, SUM(amount) as total_liters
            FROM fuel_entries
            GROUP BY driver_id
        ) f ON f.driver_id = d.id
        LEFT JOIN (
            SELECT driver_id, SUM(amount) as total_paid
            FROM payments
            GROUP BY driver_id
        ) p ON p.driver_id = d.id
        ORDER BY d.name
    ');
    $driverFuelData = $driverFuelStmt->fetchAll();

    respond([
        'totalFuelCost' => floatval($fuelData['total_fuel_cost'] ?? 0),
        'totalLiters' => floatval($fuelData['total_liters'] ?? 0),
        'totalPayments' => floatval($paymentData['total_payments'] ?? 0),
        'drivers' => $driverFuelData
    ]);
}

respond(['error' => 'Method not allowed'], 405);
