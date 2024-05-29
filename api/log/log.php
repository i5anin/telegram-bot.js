<?php

require_once 'sql_config.php';

function sendJsonResponse($status, $message, $exit = true) {
    http_response_code($status);
    echo json_encode(['error' => $status !== 200, 'message' => $message]);
    if ($exit) {
        exit();
    }
}

$mysqli = new mysqli($dbConfig['server'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['db']);

if ($mysqli->connect_error) {
    sendJsonResponse(500, "Ошибка подключения к базе данных: " . $mysqli->connect_error);
}

$mysqli->set_charset('utf8mb4');

$data = json_decode(file_get_contents('php://input'), true);

$userID = $data['user_id'] ?? null;
$text = $data['text'] ?? null;
$error = $data['error'] ?? null;
$ok = $data['ok'] ?? null;
$type = $data['type'] ?? null;
$info = $data['info'] ?? null;

if (!$userID || !$text || $error === null || $ok === null || !$type || !$info) {
    sendJsonResponse(400, 'Отсутствуют обязательные поля');
}

// Добавьте сюда имя вашего поля timestamp вместо `timestamp`
$query = "INSERT INTO `log` (`user_id`, `timestamp`, `text`, `error`, `ok`, `type`, `info`) VALUES (?, NOW(), ?, ?, ?, ?, ?)";

if ($stmt = $mysqli->prepare($query)) {
    // В bind_param убираем timestamp, так как мы используем NOW() в SQL запросе для автоматического заполнения
    $stmt->bind_param('isisss', $userID, $text, $error, $ok, $type, $info);
    if (!$stmt->execute()) {
        sendJsonResponse(500, "Ошибка добавления записи лога: " . $stmt->error);
    }
    $stmt->close();
    sendJsonResponse(200, "Запись лога добавлена успешно");
} else {
    sendJsonResponse(500, "Ошибка подготовки SQL запроса: " . $mysqli->error);
}

$mysqli->close();
?>