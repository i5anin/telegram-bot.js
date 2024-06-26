<?php
function get_user_ids()
{
    $server = "localhost";
    $user = "u1213820_bot";
    $pass = "fE0xX8qM6nhS3vC9";
    $db = "u1213820_elem";

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "SELECT `user_id` FROM `users`");

    if (!mysqli_stmt_execute($stmt)) {
        return json_encode(['error' => 'Ошибка: ' . mysqli_stmt_error($stmt)]);
    }

    $result = mysqli_stmt_get_result($stmt);
    $user_ids = array();

    while ($row = mysqli_fetch_assoc($result)) {
        $user_ids[] = $row['user_id'];
    }

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);

    return $user_ids;
}

// Получение всех user_id из базы данных
$user_ids = get_user_ids();

if ($user_ids) {
    // Если нет ошибок и массив не пуст, преобразуем его в JSON
    echo json_encode(['user_ids' => $user_ids]);
} else {
    // Если произошла ошибка или массив пуст, возвращаем JSON с сообщением об ошибке
    echo json_encode(['error' => 'ОШИБКА!']);
}
