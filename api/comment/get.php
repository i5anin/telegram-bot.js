<?php
$dbConfig = require 'sql_config.php';
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
    if ($stmt = $mysqli->prepare("SELECT `id_task`, `user_id`, `date`, `specs_nom_id`, `det_name`,`type` FROM `sk_comment` WHERE `user_id` = ? AND `completed` = 0")) {
        $stmt->bind_param("i", $_GET['user_id']);
        $stmt->execute();
        $stmt->bind_result($id_task, $user_id, $date, $specs_nom_id, $det_name, $type);

        $comments = [];
        while ($stmt->fetch()) {
            $comments[] = [
                'id_task' => $id_task,
                'user_id' => $user_id,
                'date' => $date,
                'specs_nom_id' => $specs_nom_id,
                'det_name' => $det_name,
                'type' => $type
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
?>
