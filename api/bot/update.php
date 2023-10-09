<?php
header('Content-Type: application/json');  // Устанавливаем заголовок для ответа в формате JSON

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

// Получаем дату и random_key из GET-параметров
$provided_date = $_GET['date'] ?? null;
$provided_random_key = $_GET['random_key'] ?? null;

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

// Добавляем запись, если предоставлены нужные параметры
if ($provided_date && $provided_random_key) {
    if ($insert_stmt = $mysqli->prepare("INSERT INTO `bot_start` (`date`, `random_key`) VALUES (?, ?)")) {
        $insert_stmt->bind_param('si', $provided_date, $provided_random_key);
        if ($insert_stmt->execute()) {
            echo json_encode(['success' => 'Data inserted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to insert data']);
        }
        $insert_stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to prepare INSERT query']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Date or random_key not provided']);
}

$mysqli->close();
