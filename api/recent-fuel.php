<?php
require __DIR__ . '/bootstrap.php';

require_any_role();

$stmt = $pdo->query('SELECT fuel_entries.id, fuel_entries.amount, fuel_entries.entry_date, fuel_entries.price_per_unit, drivers.name AS driver_name FROM fuel_entries JOIN drivers ON fuel_entries.driver_id = drivers.id ORDER BY fuel_entries.entry_date DESC, fuel_entries.created_at DESC LIMIT 10');
$entries = $stmt->fetchAll();

respond(['entries' => $entries]);
