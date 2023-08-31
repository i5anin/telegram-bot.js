<?php
// https://bot.pf-forum.ru/web_servise/update_comment.php?id=5&comment=Новый%20комментарий

header('Content-Type: application/json');  // Устанавливаем заголовок для ответа в формате JSON

function update_sk_comment($id, $comment)
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

    try {
        $mysqli = mysqli_connect($server, $user, $pass, $db);
        mysqli_set_charset($mysqli, 'utf8mb4');

        $stmt = mysqli_prepare($mysqli, "UPDATE `sk_comment` SET `comment` = ?, `completed` = 1 WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "si", $comment, $id);

        if (!mysqli_stmt_execute($stmt)) {
            return false;
        }

        mysqli_stmt_close($stmt);
        mysqli_close($mysqli);
    } catch (Exception $e) {
        return false;
    }

    return true;
}

try {
    $id = $_GET["id"] ?? null;
    $comment = $_GET["comment"] ?? null;

    $res = update_sk_comment($id, $comment);

    if ($res) {
        http_response_code(200);
        echo json_encode(['status' => 'OK', 'message' => 'Data successfully updated.']);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'Error', 'message' => 'Failed to update data.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'Error', 'message' => 'Internal Server Error']);
}
