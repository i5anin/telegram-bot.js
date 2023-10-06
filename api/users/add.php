<?php
header('Content-Type: application/json');  // Устанавливаем заголовок для ответа в формате JSON

function insert_into_user($id, $fio, $username, $active)
{
    if (!is_numeric($id)) return false;
    if (!strlen($fio)) return false;
    if ($username !== null && !strlen($username)) return false;
    if (!is_numeric($active)) return false;

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

    // Добавьте этот блок кода здесь для проверки на дубликаты
    $check_stmt = mysqli_prepare($mysqli, "SELECT * FROM `users` WHERE `user_id` = ?");
    mysqli_stmt_bind_param($check_stmt, "i", $id);
    mysqli_stmt_execute($check_stmt);
    $result = mysqli_stmt_get_result($check_stmt);
    if (mysqli_num_rows($result) > 0) {
        mysqli_stmt_close($check_stmt);
        return "duplicate";
    }
    mysqli_stmt_close($check_stmt);
    // Конец блока кода для проверки на дубликаты

    $stmt = mysqli_prepare($mysqli, "INSERT INTO `users` (`user_id`, `fio`, `username`, `active`) VALUES (?,?,?,?)");
    mysqli_stmt_bind_param($stmt, "issi", $id, $fio, $username, $active);

    if (!mysqli_stmt_execute($stmt)) {
        echo "Ошибка: " . mysqli_stmt_error($stmt);
        return false;
    }

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);
    return true;
}

// Получение данных из GET-запроса
$fio = isset($_GET["fio"]) && $_GET["fio"] !== '' ? $_GET["fio"] : null;
$username = isset($_GET["username"]) && $_GET["username"] !== '' ? $_GET["username"] : null;
$active = isset($_GET["active"]) ? $_GET["active"] : null;
$id = isset($_GET["id"]) ? $_GET["id"] : null;

$res = insert_into_user($id, $fio, $username, $active);

if ($res === "duplicate") {
    http_response_code(208);
    echo json_encode(['status' => 'Error', 'message' => 'Record already exists.']); //Запись уже существует.
} elseif ($res) {
    echo json_encode(['status' => 'OK', 'message' => 'Data successfully inserted.']); //Данные успешно вставлены
    http_response_code(200);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Failed to insert data.']); //Не удалось вставить данные.
}
