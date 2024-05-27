<?php
// Устанавливаем заголовок для ответа в формате JSON
header('Content-Type: application/json');

function fetch_users() {
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
    $query = "SELECT * FROM `users` ORDER BY `date_reg` DESC";

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

// Вызываем функцию для получения данных о пользователях
fetch_users();
?>