<?php

// Подключаем конфигурационный файл
$dbConfig = require 'sql_config.php';

// Извлекаем секретный ключ из конфигурации
$SECRET_KEY = $dbConfig['key'] ?? null;

if ($SECRET_KEY === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Secret key not configured']);
    exit;
}

// Получаем ключ из GET-параметров
$provided_key = $_GET['key'] ?? null;

if ($provided_key === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Key not provided']);
    exit;
}

if ($provided_key !== $SECRET_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid secret key']);
    exit;
}

// Параметры для подключения к БД
$server = $dbConfig['server'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$db = $dbConfig['db'];

$mysqli = new mysqli($server, $user, $pass, $db);

if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset('utf8mb4');

// Обновленный SQL-запрос для получения пользователей с oplata = 1
if ($stmt = $mysqli->prepare("SELECT `user_id` FROM `users` WHERE `oplata` = 1")) {
    $stmt->execute();
    $stmt->bind_result($user_id);

    $users = [];
    while ($stmt->fetch()) {
        $users[] = $user_id;  // Добавляем user_id в массив
    }

    $stmt->close();

    if (!empty($users)) {
        echo json_encode(['user_ids' => $users]);
    } else {
        echo json_encode(['error' => 'No users with payment found']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query']);
}

$mysqli->close();
