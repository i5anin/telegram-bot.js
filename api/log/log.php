<?php

require_once 'sql_config.php';

// Функция для отправки JSON ответа
function sendJsonResponse($status, $message, $exit = true) {
    http_response_code($status);
    echo json_encode(['error' => $status !== 200, 'message' => $message]);
    if ($exit) {
        exit();
    }
}

// Логирование сообщения в файл
function logMessage($message) {
    file_put_contents('log.txt', date('Y-m-d H:i:s') . ' - ' . $message . "\n", FILE_APPEND);
}

$mysqli = new mysqli($dbConfig['server'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['db']);

if ($mysqli->connect_error) {
    logMessage("Ошибка подключения к базе данных: " . $mysqli->connect_error);
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
    logMessage('Отсутствуют обязательные поля');
    sendJsonResponse(400, 'Отсутствуют обязательные поля');
}

$query = "INSERT INTO `log` (`user_id`, `date_time_event`, `text`, `error`, `ok`, `type`, `info`) VALUES (?, NOW(), ?, ?, ?, ?, ?)";

if ($stmt = $mysqli->prepare($query)) {
    if (!$stmt->bind_param('isisss', $userID, $text, $error, $ok, $type, $info)) {
        logMessage("Ошибка bind_param: " . $stmt->error);
    }
    if (!$stmt->execute()) {
        logMessage("Ошибка добавления записи лога: " . $stmt->error);
        sendJsonResponse(500, "Ошибка добавления записи лога: " . $stmt->error);
    } else {
        logMessage("Запись лога добавлена успешно");
        sendJsonResponse(200, "Запись лога добавлена успешно");
    }
    $stmt->close();
} else {
    logMessage("Ошибка подготовки SQL запроса: " . $mysqli->error);
    sendJsonResponse(500, "Ошибка подготовки SQL запроса: " . $mysqli->error);
}

$mysqli->close();
?>