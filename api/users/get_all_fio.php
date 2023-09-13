<?php
// Получаем конфигурацию из файла 'sql_config.php'


function get_users_data()
{
    $dbConfig = require 'sql_config.php';
    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "SELECT `user_id`, `fio` FROM `users`");

    if (!mysqli_stmt_execute($stmt)) {
        return json_encode(['error' => 'Ошибка: ' . mysqli_stmt_error($stmt)]);
    }

    $result = mysqli_stmt_get_result($stmt);
    $users_data = array();

    while ($row = mysqli_fetch_assoc($result)) {
        $users_data[] = [
            'user_id' => $row['user_id'],
            'fio' => $row['fio']
        ];
    }

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);

    return $users_data;
}

// Получение всех данных пользователей из базы данных
$users_data = get_users_data();

if ($users_data) {
    // Если нет ошибок и массив не пуст, преобразуем его в JSON
    echo json_encode(['users_data' => $users_data]);
} else {
    // Если произошла ошибка или массив пуст, возвращаем JSON с сообщением об ошибке
    echo json_encode(['error' => 'ОШИБКА!']);
}
