<?php

// Подключаем конфигурационный файл
$dbConfig = require 'sql_config.php';

// Извлекаем секретный ключ из конфигурации
$SECRET_KEY = $dbConfig['key'] ?? null;

if ($SECRET_KEY === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Secret key not configured']);
    exit;
}

// Получаем ключ из GET-параметров
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

// Параметры для подключения к БД
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

if ($stmt = $mysqli->prepare("SELECT `date`, `prod_price_mzp`, `prod_price_sles`, `prod_price_otk`, `prod_price_upk`, `prod_price_dorabotka`, `prod_price_dorabotka_sles`, `prod_price_sogl`, `prod_price`, `prod`, `sles`, `otk`, `upk`, `cumulative_brak_month`, `cumulative_sklad_month`, `cumulative_manager_month`, `productivity`, `get_sum_otgr` FROM `metrics`")) {
    $stmt->execute();
    $stmt->bind_result($date, $prod_price_mzp, $prod_price_sles, $prod_price_otk, $prod_price_upk, $prod_price_dorabotka, $prod_price_dorabotka_sles, $prod_price_sogl, $prod_price, $prod, $sles, $otk, $upk, $cumulative_brak_month, $cumulative_sklad_month, $cumulative_manager_month, $productivity, $get_sum_otgr);

    $metrics = [];
    while ($stmt->fetch()) {
        $metrics[] = [
            'date' => $date,
            'prod_price_mzp' => $prod_price_mzp,
            'prod_price_sles' => $prod_price_sles,
            'prod_price_otk' => $prod_price_otk,
            'prod_price_upk' => $prod_price_upk,
            'prod_price_dorabotka' => $prod_price_dorabotka,
            'prod_price_dorabotka_sles' => $prod_price_dorabotka_sles,
            'prod_price_sogl' => $prod_price_sogl,
            'prod_price' => $prod_price,
            'prod' => $prod,
            'sles' => $sles,
            'otk' => $otk,
            'upk' => $upk,
            'cumulative_brak_month' => $cumulative_brak_month,
            'cumulative_sklad_month' => $cumulative_sklad_month,
            'cumulative_manager_month' => $cumulative_manager_month,
            'productivity' => $productivity,
            'get_sum_otgr' => $get_sum_otgr,
        ];
    }

    $stmt->close();

    if (!empty($metrics)) {
        echo json_encode(['metrics' => $metrics]);
    } else {
        echo json_encode(['error' => 'Data not found']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query for data']);
}

$mysqli->close();
