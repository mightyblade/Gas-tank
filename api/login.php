<?php
require __DIR__ . '/bootstrap.php';

$input = json_input();
$role = $input['role'] ?? '';
$password = trim($input['password'] ?? '');

if (!in_array($role, ['user', 'admin'], true)) {
    respond(['error' => 'Invalid role'], 400);
}

$key = $role === 'admin' ? 'admin_password_hash' : 'user_password_hash';
$hash = get_setting($pdo, $key);

if (!$hash) {
    if ($role === 'admin') {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        set_setting($pdo, $key, $hash);
    } else {
        respond(['error' => 'User password not set. Ask admin to set it.'], 400);
    }
}

if (!password_verify($password, $hash)) {
    respond(['error' => 'Invalid password'], 401);
}

$_SESSION['role'] = $role;
respond(['role' => $role]);
