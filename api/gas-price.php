<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_any_role();
    $price = get_setting($pdo, 'gas_price');
    respond(['gasPrice' => $price ? (float) $price : 0]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_role('admin');
    $input = json_input();
    $price = $input['gasPrice'] ?? null;
    if (!is_numeric($price)) {
        respond(['error' => 'Invalid gas price'], 400);
    }
    set_setting($pdo, 'gas_price', (string) $price);
    respond(['gasPrice' => (float) $price]);
}

respond(['error' => 'Method not allowed'], 405);
