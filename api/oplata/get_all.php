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

if ($stmt = $mysqli->prepare("SELECT `id`, `client_name`, `sum`, `info`, `status`, `date` FROM `oplata`")) {
    $stmt->execute();
    $stmt->bind_result($id, $client_name, $sum, $info, $status, $date);

    $payments = [];
    while ($stmt->fetch()) {
        if ($status == 0) {  // Проверяем, равен ли статус нулю
            $payments[] = [
                'id' => $id,
                'client_name' => $client_name,
                'sum' => $sum,
                'info' => $info,
                'date' => $date
            ];
        }
    }

    $stmt->close();

    if (!empty($payments)) {
        echo json_encode(['payments' => $payments]);
    } else {
        echo json_encode(['error' => 'Payments not found']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query']);
}

$mysqli->close();
