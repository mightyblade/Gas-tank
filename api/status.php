<?php
require __DIR__ . '/bootstrap.php';

$role = $_SESSION['role'] ?? null;
respond(['role' => $role]);
