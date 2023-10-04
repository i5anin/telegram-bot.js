<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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

// Подготавливаем и выполняем запрос к БД
$query = "
    SELECT `name`, `date`, `post`, `gender`
    FROM `birth`
    WHERE MONTH(`date`) = MONTH(CURDATE())
    AND DAY(`date`) = DAY(CURDATE())
";

if ($stmt = $mysqli->prepare($query)) {
    $stmt->execute();
    $stmt->bind_result($name, $date, $post, $gender);

    $employees = [];
    while ($stmt->fetch()) {
        $employees[] = [
            'name' => $name,
            'date' => $date,
            'post' => $post,
            'gender' => $gender
        ];
    }

    $stmt->close();
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query: ' . $mysqli->error]);
    exit;
}

$mysqli->close();

// Выводим сотрудников, у которых сегодня день рождения, в формате JSON
echo json_encode($employees);
