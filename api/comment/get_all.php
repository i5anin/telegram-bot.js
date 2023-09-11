<?php

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

// Проверка секретного ключа
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

// Подключение к БД
$mysqli = new mysqli($server, $user, $pass, $db);

// Проверка подключения
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $mysqli->connect_error]);
    exit;
}

// Устанавливаем кодировку
$mysqli->set_charset('utf8mb4');

// Подготавливаем запрос на выборку всех незавершенных комментариев
if ($stmt = $mysqli->prepare("SELECT `id_task`, `user_id`, `date`, `name`, `description` FROM `sk_comment` WHERE `completed` = 0")) {

    // Выполняем запрос
    $stmt->execute();

    // Привязываем результаты к переменным
    $stmt->bind_result($id_task, $user_id, $date, $name, $description);

    // Инициализируем массив для хранения результатов
    $comments = [];

    // Получаем и сохраняем все строки результата
    while ($stmt->fetch()) {
        $comments[] = [
            'id_task' => $id_task,
            'user_id' => $user_id,
            'date' => $date,
            'name' => $name,
            'description' => $description,
        ];
    }

    // Закрываем запрос
    $stmt->close();

    // Проверяем, нашлись ли какие-то результаты
    if (!empty($comments)) {
        echo json_encode(['comments' => $comments]);
    } else {
        echo json_encode(['error' => 'Comments not found']);
    }
} else {
    echo json_encode(['error' => 'Failed to prepare SQL query']);
}

// Закрываем подключение к БД
$mysqli->close();
