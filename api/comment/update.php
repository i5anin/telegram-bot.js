<?php

header('Content-Type: application/json');

$dbConfig = require 'sql_config.php';

$key = $_GET["key"] ?? null;

if ($key !== $dbConfig['key']) {
    http_response_code(403);
    echo json_encode(['status' => 'Error', 'message' => 'Invalid access key.']);
    exit;
}

$mysqli = mysqli_connect($dbConfig['server'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['db']);
mysqli_set_charset($mysqli, 'utf8mb4');

if (!$mysqli) {
    die('Ошибка подключения к базе данных: ' . mysqli_connect_error());
}

if (isset($_GET["sent"]) && isset($_GET["id_task"])) {
    $id_task = $_GET["id_task"];
    
    $stmt = mysqli_prepare($mysqli, "UPDATE `sk_comments` SET `sent` = 1 WHERE `id_task` = ?");
    mysqli_stmt_bind_param($stmt, "i", $id_task);
    
    if (!mysqli_stmt_execute($stmt)) {
        die('Ошибка выполнения SQL-запроса: ' . mysqli_stmt_error($stmt));
    }
    
    mysqli_stmt_close($stmt);

    echo json_encode(['status' => 'OK', 'message' => 'sent operation completed.']);
    http_response_code(200);
    exit;
    
} elseif (isset($_GET["id_task"]) && isset($_GET["comments_op"])) {
    $id_task = $_GET["id_task"];
    $comment = $_GET["comments_op"];
    
    $stmt = mysqli_prepare($mysqli, "UPDATE `sk_comments` SET `comments_op` = ?, `answered` = 1 WHERE `id_task` = ?");
    mysqli_stmt_bind_param($stmt, "si", $comment, $id_task);
    
    if (!mysqli_stmt_execute($stmt)) {
        die('Ошибка выполнения SQL-запроса: ' . mysqli_stmt_error($stmt));
    }

    mysqli_stmt_close($stmt);
    
    echo json_encode(['status' => 'OK', 'message' => 'Data successfully updated.']);
    http_response_code(200);
    
} else {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Missing parameters.']);
}

mysqli_close($mysqli);
exit;
