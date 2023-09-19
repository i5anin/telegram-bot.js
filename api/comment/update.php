<?php

header('Content-Type: application/json');

$dbConfig = require 'sql_config.php';

if (!isset($_GET["id_task"]) || !isset($_GET["comments_op"]) || !isset($_GET["access_key"])) {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Missing parameters.']);
    exit;
}

$id_task = $_GET["id_task"];
$comment = $_GET["comments_op"];
$key = $_GET["access_key"];

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

    if (!$mysqli) {
        die('Ошибка подключения к базе данных: ' . mysqli_connect_error());
    }

    $check_stmt = mysqli_prepare($mysqli, "SELECT * FROM `sk_comments` WHERE `id_task` = ?");
    if ($check_stmt === false) {
        die('Ошибка подготовки SQL-запроса: ' . mysqli_error($mysqli));
    }

    mysqli_stmt_bind_param($check_stmt, "i", $id);
    mysqli_stmt_execute($check_stmt);
    $result = mysqli_stmt_get_result($check_stmt);

    if (mysqli_num_rows($result) === 0) {
        return false;
    }

    $stmt = mysqli_prepare($mysqli, "UPDATE `sk_comments` SET `comments_op` = ?, `completed` = 1 WHERE `id_task` = ?");
    if ($stmt === false) {
        die('Ошибка подготовки SQL-запроса: ' . mysqli_error($mysqli));
    }

    mysqli_stmt_bind_param($stmt, "si", $comment, $id);

    if (!mysqli_stmt_execute($stmt)) {
        die('Ошибка выполнения SQL-запроса: ' . mysqli_stmt_error($stmt));
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
