<?php

// Получаем сегодняшнюю дату
$today = date("Y-m-d");

// Извлекаем userID из параметров запроса
$userID = $_GET['user_id'] ?? null;

// Проверяем, был ли предоставлен userID
if (!$userID) {
    http_response_code(400);
    echo json_encode(['error' => 'No user ID provided']);
    exit;
}

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

// Подготовленный запрос для получения данных по userID за сегодняшнюю дату
$query = "SELECT `id`, `date`, `fio`, `user_id`, `base`, `grade`, `work_hours`, `tabel_hours`, `payment`, `inn` FROM `payments` WHERE `user_id` = ? AND `date` = ?";

if ($stmt = $mysqli->prepare($query)) {
    $stmt->bind_param('ss', $userID, $today);
    $stmt->execute();
    $result = $stmt->get_result();

    $payments = [];
    while ($row = $result->fetch_assoc()) {
        $payments[] = $row;
    }

    $stmt->close();
    $mysqli->close();

    if (!empty($payments)) {
        echo json_encode(['payments' => $payments]);
    } else {
        echo json_encode(['message' => "No payments found for user ID " . htmlspecialchars($userID) . " on " . $today]);
    }
} else {
    $mysqli->close();
    http_response_code(500);
    echo json_encode(['error' => 'SQL query preparation failed']);
}

?>