<?php
include __DIR__ . "/config.php"; // Включаем файл конфигурации с токеном

function get_id_fio_user($id, $fio)
{
    if (!is_numeric($id)) return false; // Проверяем, что ID является числом
    if (!preg_match('/^[А-Яа-яёЁ]+\s[А-Яа-яёЁ]\.[А-Яа-яёЁ]\.$/u', $fio)) return false; // Регулярное выражение для проверки формата ФИО
    return true;
}

// Извлекаем параметры из GET-запроса
$id = $_GET['id_user']; // Получаем ID пользователя
$fio = $_GET['fio'];    // Получаем ФИО пользователя

$isValid = get_id_fio_user($id, $fio); // Проверяем валидность параметров

$response_messages = []; // Массив для сообщений об ответе

if (!$isValid) {
    // Добавляем сообщение об ошибке и завершаем выполнение скрипта
    $response_messages[] = "Invalid query parameters."; // Неверные параметры запроса
    exit;
}

// Функция для отправки запроса к Telegram API
function requestToTelegram($token, $method, $params = [], $post = true)
{
    $url = "https://api.telegram.org/bot$token/$method"; // Формируем URL для запроса

    if (!$post && !empty($params)) {
        $url .= '?' . http_build_query($params); // Добавляем параметры запроса, если не используем POST
    }

    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => $post ? 'POST' : 'GET',
            'content' => http_build_query($params)
        ]
    ];

    $context = stream_context_create($options); // Создаем контекст запроса

    $response = @file_get_contents($url, false, $context); // Отправляем запрос к API Telegram
    if ($response === false) {
        return ['ok' => false, 'error_code' => 500, 'description' => 'Internal server error'];
    }
    return json_decode($response, true);
}



$user_id = $_GET['id_user']; // Получаем ID пользователя из GET-параметров
$custom_title = $_GET['fio']; // Получаем ФИО пользователя из GET-параметров
$groupId = '-1001967174143'; // Задаем ID редактируемой группы

// Добавляем сообщение о начале выполнения
$response_messages[] = "Updated $user_id ->  $custom_title";

$params = [
    'chat_id' => $groupId,
    'user_id' => $user_id,
    'can_manage_chat' => true, // получить доступ к журналу событий чата, статистике чата, статистике сообщений в каналах, видеть участников канала, видеть анонимных администраторов в супергруппах и игнорировать режим замедления.
    'can_post_messages' => false, // создавать посты в канале. Только для каналов.
    'can_edit_messages' => false, // редактировать сообщения других пользователей и закреплять сообщения. Только для каналов.
    'can_delete_messages' => false, // удалять сообщения других пользователей.
    'can_manage_video_chats' => true, // управлять видеочатами.
    'can_restrict_members' => false, // ограничивать, блокировать или разблокировать участников чата.
    'can_promote_members' => false,      // добавлять новых администраторов с подмножеством своих привилегий или понижать администраторов, которых он повысил, непосредственно или косвенно.
    'can_change_info' => false,   // изменять название чата, фото и другие настройки.
    'can_invite_users' => false, // приглашать новых пользователей в чат.
    'can_pin_messages' => false,  // закреплять сообщения. Только для супергрупп.
    'can_manage_topics' => false // пользователь может создавать, переименовывать, закрывать и повторно открывать темы на форуме. Только для супергрупп.
];

$response = requestToTelegram($token, 'promoteChatMember', $params);

if ($response['ok']) {
    $response_messages[] = "OK The user $user_id is successfully promoted.";

    $params = [
        'chat_id' => $groupId,
        'user_id' => $user_id,
        'custom_title' => $custom_title
    ];

    $response = requestToTelegram($token, 'setChatAdministratorCustomTitle', $params);

    if ($response['ok']) {
        $response_messages[] = "OK The custom title for $user_id is set successfully.";
    } else {
        $response_messages[] = "Failed to set a custom header for $user_id.";
        $response_messages[] = json_encode($response);
    }
} else {
    $response_messages[] = "Failed to set a custom header for $user_id.";
    $response_messages[] = json_encode($response);
}
header('Content-Type: application/json');
echo json_encode(['messages' => $response_messages]);
