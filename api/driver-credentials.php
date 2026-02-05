<?php
require __DIR__ . '/bootstrap.php';

require_role('admin');
$input = json_input();
$driverId = $input['driverId'] ?? null;
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if (!$driverId || $username === '' || $password === '') {
    respond(['error' => 'Driver, username, and password are required'], 400);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE drivers SET username = ?, password_hash = ? WHERE id = ?');
$stmt->execute([$username, $hash, $driverId]);

respond(['ok' => true]);
