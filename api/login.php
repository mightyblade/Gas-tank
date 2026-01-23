<?php
require __DIR__ . '/bootstrap.php';

$input = json_input();
$role = $input['role'] ?? '';
$password = trim($input['password'] ?? '');
$driverId = $input['driverId'] ?? null;

if (!in_array($role, ['user', 'admin'], true)) {
    respond(['error' => 'Invalid role'], 400);
}

if ($role === 'admin') {
    $key = 'admin_password_hash';
    $hash = get_setting($pdo, $key);

    if (!$hash) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        set_setting($pdo, $key, $hash);
    }

    if (!password_verify($password, $hash)) {
        respond(['error' => 'Invalid password'], 401);
    }

    $_SESSION['role'] = 'admin';
    respond(['role' => 'admin']);
}

if (!$driverId) {
    respond(['error' => 'Driver selection required'], 400);
}

$stmt = $pdo->prepare('SELECT password_hash FROM drivers WHERE id = ?');
$stmt->execute([$driverId]);
$row = $stmt->fetch();

if (!$row || !$row['password_hash']) {
    respond(['error' => 'Driver password not set. Ask admin to set it.'], 400);
}

if (!password_verify($password, $row['password_hash'])) {
    respond(['error' => 'Invalid password'], 401);
}

$_SESSION['role'] = 'user';
$_SESSION['driver_id'] = $driverId;
respond(['role' => 'user', 'driverId' => $driverId]);
