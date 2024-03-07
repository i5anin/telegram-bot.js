<?php
header('Content-Type: application/json'); // Устанавливаем заголовок для ответа в формате JSON

// Подключаем конфигурационный файл
$dbConfig = require 'sql_config.php';

// Подключаемся к БД
$mysqli = new mysqli($dbConfig['server'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['db']);

if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset('utf8mb4');

// Формируем SQL запрос
$query = "SELECT `user_id`, `fio`, `role`, `metrica`, `metrica_time` FROM `users` WHERE `role` IS NOT NULL AND `role` != ''";

// Пытаемся подготовить SQL запрос
if ($stmt = $mysqli->prepare($query)) {
    $stmt->execute(); // Выполняем запрос
    $result = $stmt->get_result(); // Получаем результат
    $groupedUsers = [];

    // Обрабатываем полученные данные
    while ($row = $result->fetch_assoc()) {
        if (!empty($row['metrica_time']) && strpos($row['metrica_time'], ':') !== false) {
            list($hours, $minutes) = explode(':', $row['metrica_time']);
            $row['metrica_time_h'] = $hours;
            $row['metrica_time_m'] = $minutes;

            unset($row['role'], $row['metrica_time']); // Удаляем ненужные поля

            $row = array_filter($row, function($value) {
                return ($value !== null && $value !== '');
            });

            $groupedUsers[] = $row; // Добавляем пользователя без роли в итоговый массив
        }
    }

    $stmt->close(); // Закрываем запрос

    if (!empty($groupedUsers)) {
        echo json_encode($groupedUsers);
    } else {
        echo json_encode(['error' => 'No users with metrica_time found']);
    }
} else {
    // Логируем ошибку подготовки запроса и выводим в JSON
    $errorMsg = "Error preparing query: " . $mysqli->error;
    error_log($errorMsg);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query for users data', 'debug' => $errorMsg]);
}

$mysqli->close(); // Закрываем соединение с БД
?>
