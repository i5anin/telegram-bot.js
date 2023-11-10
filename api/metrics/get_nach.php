<?php

header('Content-Type: application/json');

$dbConfig = require 'sql_config.php';

$SECRET_KEY = $dbConfig['key'] ?? null;

if ($SECRET_KEY === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Secret key not configured']);
    exit;
}

$provided_key = $_GET['key'] ?? null;

if ($provided_key === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Key not provided']);
    exit;
}

if ($provided_key !== $SECRET_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid secret key']);
    exit;
}

$server = $dbConfig['server'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$db = $dbConfig['db'];

$mysqli = new mysqli($server, $user, $pass, $db);

if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset('utf8mb4');

if ($stmt = $mysqli->prepare("SELECT user_id, load_t_day, load_f_day, load_t_night, load_f_night, load_t_month, load_f_month FROM metrics_nach")) {
    $stmt->execute();
    $stmt->bind_result($user_id, $load_t_day, $load_f_day, $load_t_night, $load_f_night, $load_t_month, $load_f_month);

    $metricsNach = [];
    while ($stmt->fetch()) {
        $metricsNach[] = [
            'user_id' => $user_id,
            'load_t_day' => $load_t_day,
            'load_f_day' => $load_f_day,
            'load_t_night' => $load_t_night,
            'load_f_night' => $load_f_night,
            'load_t_month' => $load_t_month,
            'load_f_month' => $load_f_month,
        ];
    }

    $stmt->close();

    if (!empty($metricsNach)) {
        echo json_encode(['metrics_nach' => $metricsNach]);
    } else {
        echo json_encode(['error' => 'Data not found']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query for data']);
}

$mysqli->close();
?>
