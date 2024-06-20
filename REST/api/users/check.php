<?php
// Включение отображения ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Устанавливаем заголовок для ответа в формате JSON
header('Content-Type: application/json');

function db_connect() {
    $dbConfig = require 'sql_config.php';
    $mysqli = new mysqli($dbConfig['server'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['db']);

    if ($mysqli->connect_error) {
        exit(json_encode(['error' => 'Database connection failed: ' . $mysqli->connect_error]));
    }

    $mysqli->set_charset('utf8mb4');
    return $mysqli;
}

function check_user_id_exists($mysqli, $user_id) {
    $stmt = $mysqli->prepare("SELECT COUNT(*), `fio`, `role` FROM `users` WHERE `user_id` = ?");

    if (!$stmt) {
        exit(json_encode(['error' => 'Prepare failed: ' . $mysqli->error]));
    }

    $stmt->bind_param('i', $user_id);

    if (!$stmt->execute()) {
        exit(json_encode(['error' => 'Execute failed: ' . $stmt->error]));
    }

    $stmt->bind_result($count, $fio, $role);
    $stmt->fetch();
    $stmt->close();

    return $count > 0 ? ['exists' => true, 'fio' => $fio, 'role' => $role] : ['exists' => false];
}

if (isset($_GET['id']) && isset($_GET['key'])) {
    $user_id = intval($_GET['id']);
    $provided_key = $_GET['key'];

    $dbConfig = require 'sql_config.php';
    $SECRET_KEY = $dbConfig['key'] ?? null;

    if ($provided_key === $SECRET_KEY) {
        $mysqli = db_connect();
        $result = check_user_id_exists($mysqli, $user_id);
        $mysqli->close();
        echo json_encode($result);
    } else {
        echo json_encode(['error' => 'Invalid secret key']);
    }
} else {
    echo json_encode(['error' => 'ID or key not provided']);
}
?>
