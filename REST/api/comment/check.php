<?php
header('Content-Type: application/json');  // Устанавливаем заголовок для ответа в формате JSON

// Проверяем наличие параметра key в GET-запросе
if (!isset($_GET['key'])) {
    echo json_encode(['error' => 'Key not provided']);
    http_response_code(400);
    exit;
}

$provided_key = $_GET['key'];

// Получаем секретный ключ из конфигурации
$dbConfig = require 'sql_config.php';
$SECRET_KEY = $dbConfig['key'] ?? null;

if ($provided_key !== $SECRET_KEY) {
    echo json_encode(['error' => 'Invalid secret key']);
    http_response_code(403);
    exit;
}

$server = $dbConfig['server'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$db = $dbConfig['db'];
$mysqli = new mysqli($server, $user, $pass, $db);

if ($mysqli->connect_error) {
    die(json_encode(['error' => "Connection failed: " . $mysqli->connect_error]));
}

$mysqli->set_charset('utf8mb4');

if (isset($_GET['user_id']) && is_numeric($_GET['user_id'])) {
    if ($stmt = $mysqli->prepare("SELECT `id_task`, `user_id`, `date`, `specs_nom_id`, `det_name`,`type`, `kolvo_brak`, `comments_otk`, `comments_op` FROM `sk_comments` WHERE `user_id` = ? AND `sent` = 0")) {
        $stmt->bind_param("i", $_GET['user_id']);
        $stmt->execute();
        $stmt->bind_result($id_task, $user_id, $date, $specs_nom_id, $det_name, $type, $kolvo_brak, $comments_otk, $comments_op); // Добавлено

        $comments = [];
        while ($stmt->fetch()) {
            $comments[] = [
                'id_task' => $id_task,
                'user_id' => $user_id,
                'date' => $date,
                'specs_nom_id' => $specs_nom_id,
                'det_name' => $det_name,
                'type' => $type,
                'kolvo_brak' => $kolvo_brak,  // добавлено
                'comments_otk' => $comments_otk,  // добавлено
                'comments_op' => $comments_op  // добавлено
            ];
        }
        $stmt->close();

        if (!empty($comments)) {
            echo json_encode(['comments' => $comments]);
        } else {
            echo json_encode(['error' => 'Comments not found']);
        }
    } else {
        echo json_encode(['error' => 'Could not prepare SQL statement']);
    }
} else {
    echo json_encode(['error' => 'User ID not provided']);
}

$mysqli->close();
