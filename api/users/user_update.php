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

// Функция для получения данных пользователя от Telegram API
function getUserDataFromTelegram($userId, $tgToken, $chatId) {
    $url = "https://api.telegram.org/bot$tgToken/getChatMember?chat_id=$chatId&user_id=$userId";
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    return $data;
}

// Функция для вставки или обновления данных пользователя в базу данных
function insertOrUpdateUser($id, $first_name, $last_name, $username) {
    global $mysqli; // Добавляем `global $mysqli;` чтобы использовать глобальную переменную $mysqli внутри функции

    $stmt = $mysqli->prepare("INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `username`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `first_name` = ?, `last_name` = ?, `username` = ?");
    $stmt->bind_param("issssss", $id, $first_name, $last_name, $username, $first_name, $last_name, $username);
    if (!$stmt->execute()) {
        echo "Ошибка при вставке/обновлении: " . $stmt->error;
        return false;
    }
    return true;
}

// Основной код
// Замените 'your_telegram_bot_token' на ваш токен бота и 'your_chat_id' на идентификатор чата
$tgToken = '6387629342:AAFRPGYusy4vz8Ok1msaytA0457iQMRvHLA';
$chatId = '-1002011411761';

$result = $mysqli->query("SELECT `user_id` FROM `users`");
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $userId = $row["user_id"];
        $userData = getUserDataFromTelegram($userId, $tgToken, $chatId);

        if ($userData && $userData['ok']) {
            $user = $userData['result']['user'];
            $last_name = isset($user['last_name']) ? $user['last_name'] : ''; // Проверяем наличие поля 'last_name'
            if (insertOrUpdateUser($user['id'], $user['first_name'], $last_name, $user['username'])) { // Используем $last_name
                echo "Данные пользователя с user_id = $userId успешно обновлены.\n";
            }
        } else {
            echo "Ошибка при получении данных пользователя $userId из Telegram.\n";
        }
        // Пауза между запросами
        sleep(1);
    }
} else {
    echo "В таблице нет пользователей.\n";
}

$mysqli->close();
?>