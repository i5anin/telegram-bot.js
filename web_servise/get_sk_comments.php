<?php
function get_sk_comments()
{
    $dbConfig = require 'sql_config.php';

    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "SELECT `id_task`,`user_id`, `date`,  `name`, `description` FROM `sk_comment` WHERE `completed` = 0");

    if (!mysqli_stmt_execute($stmt)) {
        return json_encode(['error' => 'Ошибка: ' . mysqli_stmt_error($stmt)]);
    }

    $result = mysqli_stmt_get_result($stmt);
    $comments = array();

    while ($row = mysqli_fetch_assoc($result)) {
        $comments[] = $row;
    }

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);

    return $comments;
}

$comments = get_sk_comments();

if (isset($comments['error'])) {
    echo json_encode(['error' => $comments['error']]);
} elseif (!empty($comments)) {
    echo json_encode(['comments' => $comments]);
} else {
    echo json_encode(['error' => 'Комментарии не найдены']);
}
