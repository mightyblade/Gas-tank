<?php
require __DIR__ . '/bootstrap.php';

require_role('admin');
$input = json_input();
$driverId = $input['driverId'] ?? null;
$password = trim($input['password'] ?? '');

if (!$driverId || $password === '') {
    respond(['error' => 'Driver and password are required'], 400);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE drivers SET password_hash = ? WHERE id = ?');
$stmt->execute([$hash, $driverId]);

respond(['ok' => true]);
