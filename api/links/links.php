<?php

// Получаем тип из параметров запроса
$type = $_GET['type'] ?? null;

// Проверяем, был ли предоставлен тип
if (!$type) {
    http_response_code(400);
    echo json_encode(['error' => 'No type provided']);
    exit;
}

// Получаем label из параметров запроса (если она передана)
$label = $_GET['label'] ?? null;

// Подключаем конфигурационный файл
$dbConfig = require 'sql_config.php';

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

// Подготовленный запрос для получения данных по типу
$query = "SELECT
    links.id,
    links.type,
    links.links,
    links.tiitle
FROM
    `links`
WHERE
    links.`type` = ?";

// Добавляем условие для label, если оно передано
if ($label !== null) {
    $query .= " AND links.`tiitle` LIKE ?";
}

if ($stmt = $mysqli->prepare($query)) {
    if ($label !== null) {
        $stmt->bind_param('ss', $type, $label);
    } else {
        $stmt->bind_param('s', $type);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $links = [];
    while ($row = $result->fetch_assoc()) {
        $links[] = $row;
    }

    $stmt->close();
    $mysqli->close();

    echo json_encode(['links' => $links]);
} else {
    $mysqli->close();
    http_response_code(500);
    echo json_encode(['error' => 'SQL query preparation failed']);
}

?>