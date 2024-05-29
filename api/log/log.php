<?php

// Подключаем конфигурационный файл с данными БД
$dbConfig = require 'sql_config.php';

// Параметры для подключения к БД
$server = $dbConfig['server'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$db = $dbConfig['db'];

// Создаем соединение
$mysqli = new mysqli($server, $user, $pass, $db);

// Проверяем соединение
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset('utf8mb4');

// Получаем и декодируем JSON тело POST запроса
$data = json_decode(file_get_contents('php://input'), true);

// Извлекаем необходимые данные из $data
$userID = $data['user_id'] ?? null;
$text = $data['text'] ?? null;
$error = $data['error'] ?? null;
$ok = $data['ok'] ?? null;
$type = $data['type'] ?? null;
$info = $data['info'] ?? null;

// Проверяем, были ли предоставлены необходимые данные
if (!$userID || !$text || !isset($error) || !isset($ok) || !$type || !$info) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Подготавливаем SQL запрос
$query = "INSERT INTO `log` (user_id, text, error, ok, type, info) VALUES (?, ?, ?, ?, ?, ?)";

if($stmt = $mysqli->prepare($query)) {
    // Привязываем параметры к маркерам в подготовленном запросе
    $stmt->bind_param('isisss', $userID, $text, $error, $ok, $type, $info);

    // Выполняем запрос
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Log entry added successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add log entry']);
    }

    // Закрываем запрос
    $stmt->close();
} else {
    http_response_code(500);
    echo json_encode(['error' => "SQL query preparation failed: " . $mysqli->error]);
}

// Закрываем соединение
$mysqli->close();

?>