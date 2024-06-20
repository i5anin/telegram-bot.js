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

// Подготавливаем запрос
if ($stmt = $mysqli->prepare("SELECT `user_id`, `fio`, `role` FROM `users` WHERE `role` IS NOT NULL AND `role` != ''")) {
    $stmt->execute(); // Выполняем запрос
    $result = $stmt->get_result(); // Получаем результат
    $groupedUsers = [];

    // Извлекаем данные пользователей и группируем их по ролям
    while ($row = $result->fetch_assoc()) {
        $role = $row['role'];
        unset($row['role']);
        $groupedUsers[$role][] = $row;
    }

    $stmt->close(); // Закрываем запрос

    // Возвращаем результат в формате JSON
    if (!empty($groupedUsers)) {
        echo json_encode($groupedUsers);
    } else {
        echo json_encode(['error' =>
            'No users with a role found']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query for users data']);
}

$mysqli->close(); // Закрываем соединение с БД
?>
