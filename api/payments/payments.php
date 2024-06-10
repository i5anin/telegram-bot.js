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

// Получаем дату из параметров запроса (если она передана)
$date = $_GET['date'] ?? $today; // По умолчанию используем сегодняшний день

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

// Подготовленный запрос для получения данных по userID за указанную дату
$query = "SELECT * FROM `payments` WHERE `user_id` = ? AND `date` = ?";

// TABLE payments ПОКАЗАТЬ ВСЕ ПОЛЯ
// добавь TABLE `metrics`  2 поле   `payments_diff` float DEFAULT NULL,  `prod_diff`
// СВЯЗАТЬ ИХ НЕЛЬЗЯ ВПРИНЦИПЕ ОНО ЗНАЧЕЕНИЕ ВСЕГДА АКТУАЛЬНОЕ 2  LEFT JOIN `metrics` m ON p.`date` = m.`date`

if ($stmt = $mysqli->prepare($query)) {
    $stmt->bind_param('ss', $userID, $date);
    $stmt->execute();
    $result = $stmt->get_result();

    $payments = [];
    while ($row = $result->fetch_assoc()) {
        $payments[] = $row;
    }

    $stmt->close();
    $mysqli->close();

    echo json_encode(['payments' => $payments]);
} else {
    $mysqli->close();
    http_response_code(500);
    echo json_encode(['error' => 'SQL query preparation failed']);
}

?>