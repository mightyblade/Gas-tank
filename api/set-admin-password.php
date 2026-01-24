<?php
require __DIR__ . '/bootstrap.php';

require_role('admin');
$input = json_input();
$password = trim($input['password'] ?? '');
if ($password === '') {
    respond(['error' => 'Password required'], 400);
}

set_setting($pdo, 'admin_password_hash', password_hash($password, PASSWORD_DEFAULT));
respond(['ok' => true]);
