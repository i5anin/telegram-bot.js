<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурационный файл
$dbConfig = require 'sql_config.php';

// Параметры для подключения к БД
$server = $dbConfig['server'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$db = $dbConfig['db'];

$mysqli = new mysqli($server, $user, $pass, $db);

if ($mysqli->connect_error) {
    echo "<script>console.error('Connection failed: " . $mysqli->connect_error . "');</script>";
    exit;
}

$mysqli->set_charset('utf8mb4');

// Получаем номер страницы из URL
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
$perPage = 1;  // Установите количество записей на страницу
$offset = ($page - 1) * $perPage;

// Подготавливаем и выполняем запрос к БД
$query = "
    SELECT `name`, `date`, `post`, `gender`
    FROM `birth`
    WHERE MONTH(`date`) = MONTH(CURDATE())
    AND DAY(`date`) = DAY(CURDATE())
    LIMIT $perPage OFFSET $offset
";

$employees = [];
if ($stmt = $mysqli->prepare($query)) {
    $stmt->execute();
    $stmt->bind_result($name, $date, $post, $gender);

    while ($stmt->fetch()) {
        $employees[] = [
            'name' => $name,
            'date' => $date,
            'post' => $post,
            'gender' => $gender
        ];
    }

    $stmt->close();
} else {
    echo "<script>console.error('Failed to prepare SQL query: " . $mysqli->error . "');</script>";
    exit;
}

$mysqli->close();

// Если нет дней рождения, возвращаем JSON
if (empty($employees)) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No birthdays found']);
    exit;
}

?>
<!DOCTYPE html>
<html lang="ru">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <title>С ДНЕМ РОЖДЕНИЯ</title>
    <link rel="stylesheet" href="./files/all.min.css">
    <link rel="stylesheet" href="./files/adminlte.css">
    <link rel="stylesheet" href="./files/soft.css">
    <link rel="stylesheet" href="./files/flexslider.css">
    <link rel="stylesheet" href="./files/monitor.css">
</head>

<body class="hold-transition sidebar-mini-md sidebar-collapse layout-fixed to-monitor layout-navbar-fixed">
    <div class="wrapper">
        <div>
            <div id="slider" class="flexslider">
                <ul class="slides">
                    <?php foreach ($employees as $employee) : ?>
                        <li class="birth">
                            <div class="slide-container">
                                <div class="bd_img" style="background-image: url(<?= $employee['gender'] == 'm' ? './bd_m.jpg' : './bd_f.jpg' ?>);">
                                    <div class="name-holder <?= $employee['gender'] == 'm' ? 'm' : 'f' ?>">
                                        <div class="poz">ПОЗДРАВЛЯЕМ</div>
                                        <div class="hb">С ДНЕМ РОЖДЕНИЯ</div>
                                        <div class="post"><?= $employee['post'] ?></div>
                                        <div class="name"><?= $employee['name'] ?></div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
        <footer class="main-footer">
            <strong>Все права защищены © 2022 <a href="https://pf-forum.ru/">ПФ-ФОРУМ</a>.</strong>
            Все права защищены.
        </footer>
    </div>
    <script src="files/jquery.flexslider-min.js"></script>
    <script src="files/monitor.js"></script>
</body>

</html>