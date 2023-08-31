<?php

// https://bot.pf-forum.ru/web_servise/update_comment.php?id_task=42&comment=%D0%9D%D0%BE%D0%B2%D1%8B%D0%B9%20%D1%8B%D0%B2%D0%B0%D0%BF%D0%BC%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D1%80%D0%B8%D0%B9123qwe
// https://bot.pf-forum.ru/web_servise/update_comment.php?id_task=5&comment=Новый%20комментарий&access_key=ВАШ_КЛЮЧ_ДОСТУПА

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

// Получение данных из GET-запроса
$id_task = $_GET["id_task"];
$comment = $_GET["comment"];

$res = update_sk_comment($id_task, $comment);

if ($res) {
    echo json_encode(['status' => 'OK', 'message' => 'Data successfully updated.']); // Данные успешно обновлены
    http_response_code(200);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Failed to update data.']); // Не удалось обновить данные
}

/*
// Получение данных из GET-запроса
$id = $_GET["id"];
$comment = $_GET["comment"];
$access_key = $_GET["access_key"];

// Проверка ключа доступа
$expected_key = "PFF77FORUM28378"; // Этот ключ должен быть хранится в надежном месте, например, в переменной окружения.

if ($access_key !== $expected_key) {
    http_response_code(401); // Unauthorized
    echo json_encode(['status' => 'Error', 'message' => 'Invalid access key.']);
    exit();
}

$res = update_sk_comment($id, $comment);

if ($res) {
    echo json_encode(['status' => 'OK', 'message' => 'Data successfully updated.']); // Данные успешно обновлены
    http_response_code(200);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Failed to update data.']); // Не удалось обновить данные
}*/
