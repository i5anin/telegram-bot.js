<?php

// https://bot.pf-forum.ru/web_servise/update_comment.php?id=5&comment=Новый%20комментарий
header('Content-Type: application/json');  // Устанавливаем заголовок для ответа в формате JSON

function update_sk_comment($id, $comment)
{
    if (!is_numeric($id)) return false;
    if (!strlen($comment)) return false;

    date_default_timezone_set("Asia/Baghdad");

    $dbConfig = require 'sql_config.php';

    // Используем значения из конфига
    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "UPDATE `sk_comment` SET `comment` = ?, `completed` = 1 WHERE `id` = ?");
    mysqli_stmt_bind_param($stmt, "si", $comment, $id);

    if (!mysqli_stmt_execute($stmt)) {
        echo "Ошибка: " . mysqli_stmt_error($stmt);
        return false;
    }

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);
    return true;
}

// Получение данных из GET-запроса
$id = $_GET["id"];
$comment = $_GET["comment"];

$res = update_sk_comment($id, $comment);

if ($res) {
    echo json_encode(['status' => 'OK', 'message' => 'Data successfully updated.']); // Данные успешно обновлены
    http_response_code(200);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Failed to update data.']); // Не удалось обновить данные
}
