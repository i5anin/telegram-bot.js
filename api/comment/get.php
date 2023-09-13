<?php
// Подключаем конфигурационный файл
$dbConfig = require 'sql_config.php';

// Получаем параметры для подключения к БД
$server = $dbConfig['server'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$db = $dbConfig['db'];

// Подключаемся к БД
$mysqli = new mysqli($server, $user, $pass, $db);

// Проверяем успешность подключения
if ($mysqli->connect_error) {
    die(json_encode(['error' => "Connection failed: " . $mysqli->connect_error]));
}

// Устанавливаем кодировку
$mysqli->set_charset('utf8mb4');

// Подготавливаем запрос
if ($stmt = $mysqli->prepare("SELECT `id_task`, `user_id`, `date`, `specs_nom_id`, `det_name`,`type` FROM `sk_comment` WHERE `user_id` = ? AND `completed` = 0")) {

    // Привязываем параметры
    $stmt->bind_param("i", $_GET['user_id']);

    // Выполняем запрос
    $stmt->execute();

    // Привязываем результаты к переменным
    $stmt->bind_result($id_task, $user_id, $date, $specs_nom_id, $det_name, $type);


    // Инициализируем массив для хранения результатов
    $comments = [];

    // Получаем и сохраняем все строки результата
    while ($stmt->fetch()) {
        $comments[] = [
            `id_task` => $id_task,
            `user_id` => $user_id,
            `date` => $date,
            `specs_nom_id` => $specs_nom_id,
            `det_name` => $det_name,
            `type` => $type,
            `smena_id` => $smena_id
        ];
    }

    // Закрываем запрос
    $stmt->close();

    // Проверяем, нашлись ли какие-то результаты
    if (!empty($comments)) {
        echo json_encode(['comments' => $comments]);
    } else {
        echo json_encode(['error' => 'Comments not found', 'debug' => ['GET' => $_GET]]);
    }
} else {
    echo json_encode(['error' => 'User ID not provided', 'debug' => ['GET' => $_GET]]);
}

// Закрываем подключение к БД
$mysqli->close();
