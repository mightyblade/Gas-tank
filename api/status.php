<?php
require __DIR__ . '/bootstrap.php';

$role = $_SESSION['role'] ?? null;
$driverId = $_SESSION['driver_id'] ?? null;
respond(['role' => $role, 'driverId' => $driverId]);
