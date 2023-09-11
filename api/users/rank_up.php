<?php
include __DIR__ . "/config.php"; // Включаем файл конфигурации с токеном

function get_id_fio_user($id, $fio)
{
    if (!is_numeric($id)) return false;
    if (!preg_match('/^[А-Яа-яёЁ]+\s[А-Яа-яёЁ]\.[А-Яа-яёЁ]\.$/u', $fio)) return false;
    return true;
}

if (!isset($_GET['id_user'], $_GET['fio'])) {
    exit(json_encode(['success' => false, 'messages' => 'Missing query parameters.']));
}


$id = $_GET['id_user'];
$fio = $_GET['fio'];

if (!get_id_fio_user($id, $fio)) {
    exit(json_encode(['success' => false, 'messages' => 'Invalid query parameters.']));
}

$response_messages = [
    'id' => $id,
    'user' => $fio,
];


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

$groupId = '-1001967174143';
$params = [
    'chat_id' => $groupId,
    'user_id' => $id,
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

// Здесь начинается новый фрагмент кода
$response = requestToTelegram($token, 'promoteChatMember', $params);

$success = true; // переменная, чтобы отслеживать успешность всех операций

if ($response['ok']) {
    $response_messages['promoted'] = 'successful';

    $params['custom_title'] = $fio;
    $response = requestToTelegram($token, 'setChatAdministratorCustomTitle', $params);

    if ($response['ok']) {
        $response_messages['custom_title'] = 'successful';
    } else {
        $success = false;
        $response_messages['custom_title'] = 'failed';
        $response_messages['custom_title_error'] = $response['description'] ?? 'Unknown error';
    }
} else {
    $success = false;
    $response_messages['promoted'] = 'failed';
    $response_messages['promoted_error'] = $response['description'] ?? 'Unknown error';
    $response_messages['custom_title'] = 'failed';
    $response_messages['custom_title_error'] = 'Skipped due to previous error';
}

// Здесь заканчивается новый фрагмент кода
file_put_contents("telegram_response.log", json_encode($response));
header('Content-Type: application/json');
echo json_encode(['success' => $success, 'messages' => $response_messages]);
