<?php
function get_sk_comment_by_id($id_task)
{
    $dbConfig = require 'sql_config.php';

    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "SELECT `id_task`, `user_id`, `date`, `name`, `description` FROM `sk_comment` WHERE `id_task` = ? AND `completed` = 0");
    mysqli_stmt_bind_param($stmt, 'i', $id_task);

    if (!mysqli_stmt_execute($stmt)) {
        return json_encode(['error' => 'Ошибка: ' . mysqli_stmt_error($stmt)]);
    }

    $result = mysqli_stmt_get_result($stmt);
    $comment = mysqli_fetch_assoc($result);

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);

    return $comment;
}

if (isset($_GET['id_task'])) {
    $id_task = intval($_GET['id_task']);
    $comment = get_sk_comment_by_id($id_task);

    if (isset($comment['error'])) {
        echo json_encode(['error' => $comment['error']]);
    } elseif (!empty($comment)) {
        echo json_encode(['comment' => $comment]);
    } else {
        echo json_encode(['error' => 'Comment not found']);
    }
} else {
    echo json_encode(['error' => 'ID not provided']);
}
<?php
function get_sk_comment_by_id($id_task)
{
    $dbConfig = require 'sql_config.php';

    $server = $dbConfig['server'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $db = $dbConfig['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = mysqli_connect($server, $user, $pass, $db);
    mysqli_set_charset($mysqli, 'utf8mb4');

    $stmt = mysqli_prepare($mysqli, "SELECT `id_task`, `user_id`, `date`, `name`, `description` FROM `sk_comment` WHERE `id_task` = ? AND `completed` = 0");
    mysqli_stmt_bind_param($stmt, 'i', $id_task);

    if (!mysqli_stmt_execute($stmt)) {
        return json_encode(['error' => 'Ошибка: ' . mysqli_stmt_error($stmt)]);
    }

    $result = mysqli_stmt_get_result($stmt);
    $comment = mysqli_fetch_assoc($result);

    mysqli_stmt_close($stmt);
    mysqli_close($mysqli);

    return $comment;
}

if (isset($_GET['id_task'])) {
    $id_task = intval($_GET['id_task']);
    $comment = get_sk_comment_by_id($id_task);

    if (isset($comment['error'])) {
        echo json_encode(['error' => $comment['error']]);
    } elseif (!empty($comment)) {
        echo json_encode(['comment' => $comment]);
    } else {
        echo json_encode(['error' => 'Comment not found']);
    }
} else {
    echo json_encode(['error' => 'ID not provided']);
}
