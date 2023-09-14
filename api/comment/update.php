<?php

header('Content-Type: application/json');

$dbConfig = require 'sql_config.php';

// Проверка наличия всех необходимых параметров
if (!isset($_GET["id_task"]) || !isset($_GET["comment"]) || !isset($_GET["access_key"]) || !isset($dbConfig['key'])) {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Missing parameters or SECRET_KEY.']);
    exit;
}

$id_task = $_GET["id_task"];
$comment = $_GET["comment"];
$key = $_GET["access_key"];  // Изменено с "key" на "access_key"

// Проверка ключа доступа
if ($key !== $dbConfig['key']) {
    http_response_code(403);
    echo json_encode(['status' => 'Error', 'message' => 'Invalid access key.']);
    exit;
}


function update_sk_comment($id, $comment, $dbConfig)
{
    if (!is_numeric($id)) return false;
    if (!strlen($comment)) return false;

    date_default_timezone_set("Asia/Baghdad");

    $mysqli = mysqli_connect($dbConfig['server'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['db']);
    mysqli_set_charset($mysqli, 'utf8mb4');

    // Проверяем, существует ли такая запись
    $check_stmt = mysqli_prepare($mysqli, "SELECT * FROM `sk_comment` WHERE `id_task` = ?");
    mysqli_stmt_bind_param($check_stmt, "i", $id);
    mysqli_stmt_execute($check_stmt);
    $result = mysqli_stmt_get_result($check_stmt);

    if (mysqli_num_rows($result) == 0) {
        return false;  // Если запись не найдена, возвращаем false
    }

    $stmt = mysqli_prepare($mysqli, "UPDATE `sk_comment` SET `comment` = ?, `completed` = 1 WHERE `id_task` = ?");
    mysqli_stmt_bind_param($stmt, "si", $comment, $id);

    if (!mysqli_stmt_execute($stmt)) {
        echo "Ошибка: " . mysqli_stmt_error($stmt);
        return false;
    }

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);
    return true;
}

$res = update_sk_comment($id_task, $comment, $dbConfig);

if ($res) {
    echo json_encode(['status' => 'OK', 'message' => 'Data successfully updated.']);
    http_response_code(200);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Failed to update data.']);
}
