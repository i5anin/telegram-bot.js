<?php
include __DIR__ . "/../config.php"; // Убедитесь, что $token определен в этом файле

function get_users()
{
    $dbConfig = require 'sql_config.php';

    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "SELECT `user_id`, `fio` FROM `users`");

    if (!mysqli_stmt_execute($stmt)) {
        return json_encode(['error' => 'Ошибка: ' . mysqli_stmt_error($stmt)]);
    }

    $result = mysqli_stmt_get_result($stmt);
    $users = array();

    while ($row = mysqli_fetch_assoc($result)) {
        $users[] = $row;
    }

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);

    return $users;
}

$users = get_users();

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

$output = [];

foreach ($users as $user) {
    $user_id = $user['user_id'];
    $groupId = '-1001880477192';
    $custom_title = $user['fio'];

    $output[$user_id] = []; // Инициализируем подмассив для каждого пользователя

    $message = "Обновлено $user_id ->  $custom_title";
    $output[$user_id]['update'] = $message;

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
        $message = "Пользователь $user_id успешно продвигается.";
        $output[$user_id]['promotion_status'] = $message;

        $params = [
            'chat_id' => $groupId,
            'user_id' => $user_id,
            'custom_title' => $custom_title
        ];

        $response = requestToTelegram($token, 'setChatAdministratorCustomTitle', $params);

        if ($response['ok']) {
            $message = "Пользователь $user_id успешно продвигается.";
            $output[$user_id]['promotion_status'] = $message;
        } else {
            $message = "Не удалось установить пользовательский заголовок для $user_id.";
            $output[$user_id]['custom_title_status'] = $message;
            $output[$user_id]['error'] = json_encode($response);
        }
    } else {
        $message = "Не удалось продвинуть пользователя $user_id.";
        $output[$user_id]['promotion_status'] = $message;
        $output[$user_id]['error'] = json_encode($response);
    }
}
echo json_encode(['users' => $output]); // Преобразуем все сообщения в JSON и выводим