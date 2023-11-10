<?php
header('Content-Type: application/json');

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

if ($stmt = $mysqli->prepare("SELECT 
    `date`, 
    `prod_price_mzp`, 
    `prod_price_sles`, 
    `prod_price_otk`, `prod_price_upk`, 
    `prod_price_dorabotka`, `prod_price_dorabotka_sles`, 
    `prod_price_sogl`, 
    `prod_price`, `prod`, 
    `sles`, 
    `otk`, 
    `upk`, 
    `cumulative_brak_month`, 
    `cumulative_sklad_month`, 
    `cumulative_manager_month`, 
    `productivity`, 
    `get_sum_otgr`,
    `get_sum_otgr_prod`, 
    `predoplata`, `total_price`, 
    `total_sklad_gp` FROM `metrics`")) {
    $stmt->execute();
    $stmt->bind_result(
        $date,
        $prod_price_mzp,
        $prod_price_sles,
        $prod_price_otk,
        $prod_price_upk,
        $prod_price_dorabotka,
        $prod_price_dorabotka_sles,
        $prod_price_sogl,
        $prod_price,
        $prod,
        $sles,
        $otk,
        $upk,
        $cumulative_brak_month,
        $cumulative_sklad_month,
        $cumulative_manager_month,
        $productivity,
        $get_sum_otgr,
        $get_sum_otgr_prod,
        $predoplata,
        $total_price,
        $total_sklad_gp
    );

    $metrics = [];
    while ($stmt->fetch()) {
        $metrics[] = [
            'date' => $date,
            'prod_price_mzp' => round($prod_price_mzp, 2),
            'prod_price_sles' => round($prod_price_sles, 2),
            'prod_price_otk' => round($prod_price_otk, 2),
            'prod_price_upk' => round($prod_price_upk, 2),
            'prod_price_dorabotka' => round($prod_price_dorabotka, 2),
            'prod_price_dorabotka_sles' => round($prod_price_dorabotka_sles, 2),
            'prod_price_sogl' => round($prod_price_sogl, 2),
            'prod_price' => round($prod_price, 2),
            'prod' => round($prod, 2),
            'sles' => round($sles, 2),
            'otk' => round($otk, 2),
            'upk' => round($upk, 2),
            'cumulative_brak_month' => round($cumulative_brak_month, 2),
            'cumulative_sklad_month' => round($cumulative_sklad_month, 2),
            'cumulative_manager_month' => round($cumulative_manager_month, 2),
            'productivity' => round($productivity, 2),
            'get_sum_otgr' => round($get_sum_otgr, 2),
            'get_sum_otgr_prod' => round($get_sum_otgr_prod, 2),
            'predoplata' => round($predoplata, 2),
            'total_price' => round($total_price, 2),
            'total_sklad_gp' => round($total_sklad_gp, 2),
        ];
    }

    $stmt->close();

    if (!empty($metrics)) {
        echo json_encode(['metrics' => $metrics], JSON_NUMERIC_CHECK);
    } else {
        echo json_encode(['error' => 'Data not found']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare SQL query for data']);
}

$mysqli->close();
?>
