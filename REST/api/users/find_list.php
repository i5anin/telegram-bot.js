<?php
// Устанавливаем заголовок для ответа в формате JSON
header('Content-Type: application/json');

function fetch_users($search_term) {
    $dbConfig = require 'sql_config.php';

    // Используем значения из конфига
    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    // Устанавливаем соединение с базой данных
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    // Подготавливаем запрос на выборку данных
    $query = "SELECT 
                users.user_id,
                users.fio,
                users.username,
                users.active,
                users.role,
                users.oplata,
                users.metrica,
                users.metrica_time,
                users.inn,
                users.date_reg,
                unique_payments.post  
              FROM 
                `users` 
              LEFT JOIN 
                (SELECT DISTINCT inn, post FROM payments WHERE post IS NOT NULL AND post != '') AS unique_payments 
              ON users.inn = unique_payments.inn
              WHERE 
                LOWER(unique_payments.post) LIKE LOWER('%".$search_term."%')
              ORDER BY 
                users.date_reg DESC";

    // Выполняем запрос и получаем результат
    $result = mysqli_query($mysqli, $query);

    // Проверяем результат на наличие строк
    if (!$result) {
        echo json_encode(['status' => 'Error', 'message' => 'Failed to retrieve data.']);
        http_response_code(500);
    } else {
        // Преобразуем результаты запроса в ассоциативный массив
        $users = mysqli_fetch_all($result, MYSQLI_ASSOC);
        echo json_encode(['status' => 'OK', 'data' => $users]);
        http_response_code(200);
    }

    // Освобождаем память, занятую набором результатов
    mysqli_free_result($result);

    // Закрываем соединение с базой данных
    mysqli_close($mysqli);
}

// Проверяем наличие GET-параметра 'search_term'
if (isset($_GET['search_term'])) {
    $search_term = $_GET['search_term'];
    // Вызываем функцию для получения данных о пользователях
    fetch_users($search_term);
} else {
    // Если параметр отсутствует, отправляем ошибку
    echo json_encode(['status' => 'Error', 'message' => 'Missing search term.']);
    http_response_code(400);
}
?>