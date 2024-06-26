<?php
header('Content-Type: application/json');

// Подключаем конфигурационный файл
$dbConfig = require 'sql_config.php';

// Подключаемся к БД
$mysqli = new mysqli($dbConfig['server'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['db']);

if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset('utf8mb4');

// Функция для получения данных пользователя от Telegram API используя cURL
function getUserDataFromTelegram($userId, $tgToken, $chatId) {
    $url = "https://api.telegram.org/bot$tgToken/getChatMember?chat_id=$userId&user_id=$userId";

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);

    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($httpcode == 200) {
        $data = json_decode($response, true);
        return $data;
    } else {
        return false;
    }
}

// Функция для вставки или обновления данных пользователя в базу данных
function insertOrUpdateUser($id, $first_name, $last_name, $username) {
    global $mysqli;

    $stmt = $mysqli->prepare("INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `username`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `first_name` = ?, `last_name` = ?, `username` = ?");
    $stmt->bind_param("issssss", $id, $first_name, $last_name, $username, $first_name, $last_name, $username);
    if (!$stmt->execute()) {
        echo "Ошибка при вставке/обновлении: " . $stmt->error;
        return false;
    }
    return true;
}

//  Получаем токен и ID чата из `sql_config.php`
$tgToken = $dbConfig['tg_token'];
$chatId = $dbConfig['chat_id'];

$result = $mysqli->query("SELECT `user_id` FROM `users`");
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $userId = $row["user_id"];
        $userData = getUserDataFromTelegram($userId, $tgToken, $chatId);

        if ($userData && $userData['ok']) {
            $user = $userData['result']['user'];
            $last_name = isset($user['last_name']) ? $user['last_name'] : '';
            $username = isset($user['username']) ? $user['username'] : '';

            if (insertOrUpdateUser($user['id'], $user['first_name'], $last_name, $username)) {
                echo "Данные пользователя с user_id = $userId успешно обновлены.\n";
            }
        } else {
            echo "Ошибка при получении данных пользователя $userId из Telegram.\n";
        }

        usleep(100000); // 100 миллисекунд
    }
} else {
    echo "В таблице нет пользователей.\n";
}

$mysqli->close();
?>