<?php
require __DIR__ . '/bootstrap.php';

session_destroy();
respond(['ok' => true]);
