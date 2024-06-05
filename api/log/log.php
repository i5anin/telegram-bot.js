<?php

// Подключаем конфигурационный файл с данными БД
$dbConfig = require 'sql_config.php';

// Параметры для подключения к БД
$server = $dbConfig['server'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$db = $dbConfig['db'];

// Создаем соединение
try {
    $mysqli = new mysqli($server, $user, $pass, $db);
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $e->getMessage()]);
    exit;
}

// Устанавливаем временную зону Москвы
date_default_timezone_set('Europe/Moscow');

// Получаем текущую дату и время в Московской временной зоне
$currentDateTime = date('Y-m-d H:i:s');

$mysqli->set_charset('utf8mb4');

// Получаем и декодируем JSON тело POST запроса
$data = json_decode(file_get_contents('php://input'), true);

// Извлекаем данные из $data, присваиваем null, если данных нет
$userID = $data['user_id'] ?? 0;
$groupID = $data['group_id'] ?? 0;
$text = $data['text'] ?? '';
$error = $data['error'] ?? 0;
$ok = $data['ok'] ?? 0;
$type = $data['type'] ?? '';
$fio = $data['fio'] ?? '';// Тоже убираем значение по умолчанию
$groupName = $data['group_name'] ?? '';
$test = $data['test'] ?? 1;

// Выводим полученные данные для проверки
echo json_encode([
    'user_id' => $userID,
    'group_id' => $groupID,
    'text' => $text,
    'error' => $error,
    'ok' => $ok,
    'type' => $type,
    'fio' => $fio,
    'group_name' => $groupName,
    'test' => $test
]);

$query = "INSERT INTO `log` (date_time_event, user_id, group_id, text, error, ok, type, fio, group_name, test) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

if ($stmt = $mysqli->prepare($query)) {
    // Привязываем параметры к маркерам в подготовленном запросе, используем значения из $data
    $stmt->bind_param('sisssssssi',
        $currentDateTime,
        $userID,
        $groupID,
        $text,
        $error,
        $ok,
        $type,
        $fio,
        $groupName,
        $test);

    // Выполняем запрос
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Log entry added successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add log entry: ' . $stmt->error]); // Ошибка
    }

    $stmt->close();
} else {
    http_response_code(500);
    echo json_encode(['error' => "SQL query preparation failed: " . $mysqli->error]);
}

$mysqli->close();

?>