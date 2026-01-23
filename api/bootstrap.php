<?php
header('Content-Type: application/json');

$configPath = __DIR__ . '/../config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Missing config.php. Copy config.php.example and fill in credentials.']);
    exit;
}

$config = require $configPath;

try {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']);
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed.']);
    exit;
}

session_start();

function json_input() {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    return json_decode($raw, true) ?? [];
}

function respond($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function require_role($role) {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== $role) {
        respond(['error' => 'Unauthorized'], 401);
    }
}

function require_any_role() {
    if (!isset($_SESSION['role'])) {
        respond(['error' => 'Unauthorized'], 401);
    }
}

function get_setting($pdo, $key) {
    $stmt = $pdo->prepare('SELECT value FROM settings WHERE `key` = ? LIMIT 1');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? $row['value'] : null;
}

function set_setting($pdo, $key, $value) {
    $stmt = $pdo->prepare('INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)');
    $stmt->execute([$key, $value]);
}
