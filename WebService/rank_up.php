<?php
include __DIR__ . "/config.php"; // Убедитесь, что $token определен в этом файле

function get_id_fio_user($id, $fio)
{
    if (!is_numeric($id)) return false;

    // Регулярное выражение для проверки формата ФИО
    if (!preg_match('/^[А-Яа-яёЁ]+\s[А-Яа-яёЁ]\.[А-Яа-яёЁ]\.$/u', $fio)) return false;

    return true;
}

// Извлечение параметров из GET-запроса
$id = $_GET['id_user'];
$fio = $_GET['fio'];

$isValid = get_id_fio_user($id, $fio);

$response_messages = [];

if (!$isValid) {
    $response_messages[] = "Неверные параметры запроса.";
    exit;
}

function requestToTelegram($token, $method, $params = [], $post = true)
{
    $url = "https://api.telegram.org/bot$token/$method";

    if (!$post && !empty($params)) {
        $url .= '?' . http_build_query($params);
    }

    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => $post ? 'POST' : 'GET',
            'content' => http_build_query($params)
        ]
    ];

    $context = stream_context_create($options);

    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        return ['ok' => false, 'error_code' => 500, 'description' => 'Internal server error'];
    }
    return json_decode($response, true);
}



$user_id = $_GET['id_user'];
$custom_title = $_GET['fio'];
$groupId = '-1001967174143';

$response_messages[] = "Обновлено $user_id ->  $custom_title";

$params = [
    'chat_id' => $groupId,
    'user_id' => $user_id,
    'can_manage_chat' => true, // администратор может получить доступ к журналу событий чата, статистике чата, статистике сообщений в каналах, видеть участников канала, видеть анонимных администраторов в супергруппах и игнорировать режим замедления.
    'can_post_messages' => false, // администратор может создавать посты в канале. Только для каналов.
    'can_edit_messages' => false, // администратор может редактировать сообщения других пользователей и закреплять сообщения. Только для каналов.
    'can_delete_messages' => false, // администратор может удалять сообщения других пользователей.
    'can_manage_video_chats' => true, // администратор может управлять видеочатами.
    'can_restrict_members' => false, // администратор может ограничивать, блокировать или разблокировать участников чата.
    'can_promote_members' => false,      // администратор может добавлять новых администраторов с подмножеством своих привилегий или понижать администраторов, которых он повысил, непосредственно или косвенно.
    'can_change_info' => false,   // администратор может изменять название чата, фото и другие настройки.
    'can_invite_users' => false, // администратор может приглашать новых пользователей в чат.
    'can_pin_messages' => false,  // администратор может закреплять сообщения. Только для супергрупп.
    'can_manage_topics' => false // пользователь может создавать, переименовывать, закрывать и повторно открывать темы на форуме. Только для супергрупп.
];

$response = requestToTelegram($token, 'promoteChatMember', $params);

if ($response['ok']) {
    $response_messages[] = "OК The user $user_id is successfully promoted.";

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
