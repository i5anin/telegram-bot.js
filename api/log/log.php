<?php

// Подключаем конфигурационный файл с данными БД
$dbConfig = require 'sql_config.php';

// Параметры для подключения к БД
$server = $dbConfig['server'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$db = $dbConfig['db'];

// Создаем соединение
$mysqli = new mysqli($server, $user, $pass, $db);

// Устанавливаем временную зону Москвы
date_default_timezone_set('Europe/Moscow');

// Получаем текущую дату и время в Московской временной зоне
$currentDateTime = date('Y-m-d H:i:s');

// Проверяем соединение
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $mysqli->connect_error]); // Сообщение об ошибке
    exit;
}

$mysqli->set_charset('utf8mb4');

// Получаем и декодируем JSON тело POST запроса
$data = json_decode(file_get_contents('php://input'), true);

// Извлекаем необходимые данные из $data
$userID = $data['user_id'] ?? null;
$groupID = $data['group_id'] ?? null;
$text = $data['text'] ?? null;
$error = $data['error'] ?? null;
$ok = $data['ok'] ?? null;
$type = $data['type'] ?? null;
$fio = $data['fio'] ?? null; // Изменили 'info' на 'fio'
$groupName = $data['group_name'] ?? null; // Добавили поле 'group_name'
$test = $data['test'] ?? 1;

// Проверяем, были ли предоставлены необходимые данные
if (!$userID || !$groupID || !$text || !isset($error) || !isset($ok) || !isset($type) || !isset($fio) || $groupName === null) { // Проверка всех полей
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields`']);
    exit;
}

// Выводим полученные данные
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

// Если всё в порядке, то добавляем запись в БД
// Подготавливаем SQL запрос, добавляем новое поле `test`
$query = "INSERT INTO `log` (date_time_event, user_id, group_id, text, error, ok, type, fio, group_name, test) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

if($stmt = $mysqli->prepare($query)) {
    $testVal = (int) $test; // Преобразуем boolean в int
    // Привязываем 'date_time_event', 'group_id' и другие параметры к маркерам в подготовленном запросе, включая `test`
    $stmt->bind_param('siissssssi',
        $currentDateTime,
        $userID,
        $groupID,
        $text,
        $error,
        $ok,
        $type,
        $fio,  //  Тип данных должен быть "i" (целое число)
        $groupName, //  Тип данных должен быть "s" (строка)
        $testVal); // Тип данных должен быть "i" (целое число)

    // Выполняем запрос
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Log entry added successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add log entry']);
    }

    // Закрываем запрос
    $stmt->close();
} else {
    http_response_code(500);
    echo json_encode(['error' => "SQL query preparation failed: " . $mysqli->error]);
}

// Закрываем соединение
$mysqli->close();

?>