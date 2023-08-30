<?php
header('Content-Type: application/json');

function update_comment($id, $comment)
{
    if (!is_numeric($id) || !strlen($comment)) {
        return false;
    }

    date_default_timezone_set("Asia/Baghdad");

    $dbConfig = require 'sql_config.php';

    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "UPDATE `comments` SET `comment` = ?, `completed` = 1 WHERE `id` = ?");
    mysqli_stmt_bind_param($stmt, "si", $comment, $id);

    if (!mysqli_stmt_execute($stmt)) {
        echo "Ошибка: " . mysqli_stmt_error($stmt);
        return false;
    }

    $affected_rows = mysqli_stmt_affected_rows($stmt);
    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);

    return $affected_rows > 0;
}

$id = $_GET["id"];
$comment = $_GET["comment"];

$res = update_comment($id, $comment);

if ($res) {
    echo json_encode(['status' => 'OK', 'message' => 'Comment successfully updated.']);
    http_response_code(200);
} else {
    echo json_encode(['status' => 'Error', 'message' => 'Failed to update comment.']);
    http_response_code(400);
}
