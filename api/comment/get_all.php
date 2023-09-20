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

if ($stmt = $mysqli->prepare("SELECT `id_task`, `user_id`, `date`, `specs_nom_id`, `det_name`, `type`, `kolvo_brak`, `comments_otk`, `comments_op`, `sent` FROM `sk_comments` WHERE `answered` = 0")) {
    $stmt->execute();
    $stmt->bind_result($id_task, $user_id, $date, $specs_nom_id, $det_name, $type, $kolvo_brak, $comments_otk, $comments_op, $sent);

    $comments = [];
    while ($stmt->fetch()) {
        $comments[] = [
            'id_task' => $id_task,
            'user_id' => $user_id,
            'date' => $date,
            'specs_nom_id' => $specs_nom_id,
            'det_name' => $det_name,
            'type' => $type,
            'kolvo_brak' => $kolvo_brak,
            'comments_otk' => $comments_otk,
            'comments_op' => $comments_op,
            'sent' => $sent,
        ];
    }

    $stmt->close();

    if (!empty($comments)) {
        echo json_encode(['comments' => $comments]);
    } else {
        echo json_encode(['error' => 'Comments not found']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query']);
}

$mysqli->close();
