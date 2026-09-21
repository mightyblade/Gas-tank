<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_any_role();
    
    $tankSize = get_setting($pdo, 'tank_size');
    $currentFuelLevel = get_setting($pdo, 'current_fuel_level');
    $startingFuelLevel = get_setting($pdo, 'starting_fuel_level');
    
    respond([
        'tank_size' => $tankSize ? floatval($tankSize) : null,
        'current_fuel_level' => $currentFuelLevel ? floatval($currentFuelLevel) : null,
        'starting_fuel_level' => $startingFuelLevel ? floatval($startingFuelLevel) : null,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    require_role('admin');
    $input = json_input();
    
    $tankSize = $input['tankSize'] ?? null;
    $startingFuelLevel = $input['startingFuelLevel'] ?? null;
    $currentFuelLevel = $input['currentFuelLevel'] ?? null;
    
    if ($tankSize !== null && $tankSize !== '' && $tankSize !== 'null') {
        set_setting($pdo, 'tank_size', floatval($tankSize));
    }
    if ($startingFuelLevel !== null && $startingFuelLevel !== '' && $startingFuelLevel !== 'null') {
        set_setting($pdo, 'starting_fuel_level', floatval($startingFuelLevel));
    }
    if ($currentFuelLevel !== null && $currentFuelLevel !== '' && $currentFuelLevel !== 'null') {
        set_setting($pdo, 'current_fuel_level', floatval($currentFuelLevel));
    }
    
    respond(['updated' => true, 'received' => ['tankSize' => $tankSize, 'currentFuelLevel' => $currentFuelLevel]]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_role('admin');
    $input = json_input();
    $litersAdded = floatval($input['litersAdded'] ?? 0);
    
    $currentFuelLevel = get_setting($pdo, 'current_fuel_level');
    $newLevel = floatval($currentFuelLevel) + $litersAdded;
    set_setting($pdo, 'current_fuel_level', $newLevel);
    
    respond(['current_fuel_level' => $newLevel]);
}

respond(['error' => 'Method not allowed'], 405);
