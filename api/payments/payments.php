<?php

// Получаем сегодняшнюю дату
// $today = date("Y-m-d"); // Закомментировано для отключения проверки даты

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
$query = "SELECT * FROM `payments` WHERE `user_id` = ?"; // Изменено: Удалена проверка даты

if ($stmt = $mysqli->prepare($query)) {
    $stmt->bind_param('s', $userID); // Изменено: Удалена привязка даты
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