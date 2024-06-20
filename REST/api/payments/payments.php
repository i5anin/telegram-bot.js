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
$query = "SELECT 
    payments.id,
    payments.date,
    payments.fio,
    payments.user_id,
    payments.operator_type,
    payments.base,
    payments.grade,
    payments.work_hours,
    payments.tabel_hours,
    payments.payment,
    payments.inn,
    payments.vvp,
    payments.kpi_good,
    payments.rating_good,
    payments.part,
    payments.kpi_brak,
    payments.part_sum,
    payments.rating_brak,
    payments.group_count,
    payments.color,
    payments.post,
    payments.grade_info,
    payments.smena,
    (SELECT DISTINCT payments_diff 
     FROM payment_stats
     WHERE date = ? 
) AS payments_diff,
    ps.prod_diff, 
    ps.rating_pos, 
    ps.kpi 
FROM 
    `payments`
LEFT JOIN 
    `payment_stats` ps ON payments.`date` = ps.`date` AND payments.`smena` = ps.`smena` AND payments.`operator_type` = ps.`type`
WHERE 
    payments.`user_id` = ? AND payments.`date` = ?";

if ($stmt = $mysqli->prepare($query)) {
    $stmt->bind_param('sss', $date, $userID, $date); // Обратите внимание, мы передаем $date три раза!
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