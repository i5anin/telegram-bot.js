<?php
function check_user_id_exists($user_id)
{
    $dbConfig = require 'sql_config.php';
    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "SELECT COUNT(*) FROM `users` WHERE `user_id` = ?");
    mysqli_stmt_bind_param($stmt, 'i', $user_id);

    if (!mysqli_stmt_execute($stmt)) {
        return ['error' => 'Ошибка: ' . mysqli_stmt_error($stmt)];
    }

    mysqli_stmt_bind_result($stmt, $count);
    mysqli_stmt_fetch($stmt);

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);

    return $count > 0;
}

// Если GET-параметр id установлен, проверяем его наличие в базе данных
if (isset($_GET['id'])) {
    $user_id = intval($_GET['id']);
    $exists = check_user_id_exists($user_id);

    if (isset($exists['error'])) {
        echo json_encode(['error' => $exists['error']]);
    } else {
        echo json_encode(['exists' => $exists]);
    }
} else {
    echo json_encode(['error' => 'ID не предоставлен']);
}
