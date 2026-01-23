<?php
require __DIR__ . '/bootstrap.php';

$stmt = $pdo->query('SELECT id, name FROM drivers ORDER BY name ASC');
$drivers = $stmt->fetchAll();

respond(['drivers' => $drivers]);
