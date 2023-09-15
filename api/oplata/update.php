<?php

// Подключаем конфигурационный файл
$dbConfig = require 'sql_config.php';

// Извлекаем секретный ключ из конфигурации
$SECRET_KEY = $dbConfig['key'] ?? null;

// Получаем ключ из GET-параметров
$provided_key = $_GET['key'] ?? null;
$sent_ids = $_GET['sent_ids'] ?? null;

if ($provided_key === null || $sent_ids === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Key or IDs not provided']);
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

// Разбиваем строку ID на массив
$idsArray = explode(',', $sent_ids);

// Санитизация ID
$sanitizedIds = array_map(function($id) use ($mysqli) {
    return $mysqli->real_escape_string($id);
}, $idsArray);

$idsStr = implode(',', $sanitizedIds);

// Обновляем статус на 1 для всех найденных записей
if ($stmt = $mysqli->prepare("UPDATE `oplata` SET `status` = 1 WHERE `id` IN ($idsStr)")) {
    $stmt->execute();
    $stmt->close();
    echo json_encode(['update' => 'Messages sent, status updated']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query']);
}

$mysqli->close();
