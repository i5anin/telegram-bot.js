<?php
header('Content-Type: application/json');

// Функция для вставки данных в таблицу photo_otk
function insert_into_photo_otk($user_id, $party, $comments_otk, $location)
{
    if (!is_numeric($user_id)) return false;
    if (!strlen($party)) return false; // проверка party
    if (!strlen($comments_otk)) return false;
    if (!strlen($location)) return false;

    $dbConfig = require 'sql_config.php';

    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "INSERT INTO `photo_otk` (`user_id`, `party`, `comments_otk`, `location`) VALUES (?,?,?,?)");
    mysqli_stmt_bind_param($stmt, "isss", $user_id, $party, $comments_otk, $location);

    if (!mysqli_stmt_execute($stmt)) {
        echo json_encode(['status' => 'Error', 'message' => mysqli_stmt_error($stmt)]);
        return false;
    }

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);
    return true;
}

// Проверяем наличие параметра key в GET-запросе
if (!isset($_GET['key'])) {
    echo json_encode(['status' => 'Error', 'message' => 'Key not provided']);
    http_response_code(400);
    exit;
}

$provided_key = $_GET['key'];

// Получаем секретный ключ из конфигурации
$dbConfig = require 'sql_config.php';
$SECRET_KEY = $dbConfig['key'] ?? null;

if ($provided_key !== $SECRET_KEY) {
    echo json_encode(['status' => 'Error', 'message' => 'Invalid secret key']);
    http_response_code(403);
    exit;
}

// Получение данных из GET-запроса
$user_id = isset($_GET["user_id"]) ? $_GET["user_id"] : null;
$party = isset($_GET["party"]) ? $_GET["party"] : null; // party
$comments_otk = isset($_GET["comments_otk"]) ? $_GET["comments_otk"] : null;
$location = isset($_GET["location"]) ? $_GET["location"] : null;

$res = insert_into_photo_otk($user_id, $party, $comments_otk, $location); // передача party

if ($res) {
    echo json_encode(['status' => 'OK', 'message' => 'Data successfully inserted.']);
    http_response_code(200);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Failed to insert data.']);
}
