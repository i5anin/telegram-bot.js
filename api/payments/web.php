<?php
// Проверяем наличие параметра key в GET-запросе
if (isset($_GET['key'])) {
    $provided_key = $_GET['key'];

    // Получаем секретный ключ из конфигурации
    $dbConfig = require 'sql_config.php';
    $SECRET_KEY = $dbConfig['key'] ?? null;

    if ($provided_key !== $SECRET_KEY) {
        echo json_encode(['error' => 'Invalid secret key']);
        exit;
    }
} else {
    echo json_encode(['error' => 'Key not provided']);
    exit;
}

// Подключаемся к БД
$mysqli = new mysqli($dbConfig['server'], $dbConfig['user'], $dbConfig['pass'], $dbConfig['db']);

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

$mysqli->set_charset('utf8mb4');

// Проверяем наличие параметра inn
$innFilter = $_GET['inn'] ?? null;

// Обновленный SQL запрос с учетом параметра inn и условия user_id >= 0
$sql = "SELECT u.*, p.date, p.fio, p.operator_type, p.base, p.grade, p.work_hours, p.tabel_hours, p.payment, p.inn AS payment_inn, p.vvp, p.kpi_good, p.rating_good, p.kpi_brak, p.rating_brak, p.group_count, p.color, p.post, p.grade_info, IF(u.`inn` <> '', 'true', 'false') AS `inn_filled`
FROM `users` u
LEFT JOIN `payments` p ON u.`user_id` = p.`user_id`
WHERE u.`user_id` >= 0";

if ($innFilter === 'false') {
    $sql .= " AND (u.`inn` = '' OR u.`inn` IS NULL)";
}

$sql .= " ORDER BY u.`date_reg` DESC";
$result = $mysqli->query($sql);

$mysqli->close();

?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Users Table</title>
    <link rel="icon" type="image/png" href="assets/favicon.svg">
    <link href="css/bootstrap.css" rel="stylesheet">
    <style>
      .text-cell {
        /* Стили для ячеек текстового типа */
      }

      .table-non-active {
        background-color: #f8d7da; /* Светло-красный цвет для неактивных пользователей */
      }

      /* Дополнительные стили */
    </style>
  </head>

  <body data-bs-theme="dark">
    <div class="container">
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">user_id</th>
              <th scope="col">fio</th>
              <th scope="col">inn</th>
              <!-- Другие колонки -->
              <th scope="col">date</th>
              <th scope="col">operator_type</th>
              <th scope="col">base</th>
              <th scope="col">grade</th>
              <th scope="col">work_hours</th>
              <th scope="col">tabel_hours</th>
              <th scope="col">payment</th>
              <th scope="col">payment_inn</th>
              <th scope="col">vvp</th>
              <th scope="col">kpi_good</th>
              <th scope="col">rating_good</th>
              <th scope="col">kpi_brak</th>
              <th scope="col">rating_brak</th>
              <th scope="col">group_count</th>
              <th scope="col">color</th>
              <th scope="col">post</th>
              <th scope="col">grade_info</th>
              <th scope="col">oplata</th>
              <th scope="col">metrica</th>
              <th scope="col">metrica_time</th>
              <th scope="col">date_reg</th>
            </tr>
          </thead>
          <tbody>
            <?php
            $rowNumber = 1;
            while ($row = $result->fetch_assoc()) :
                $inn_class = ($row['inn_filled'] === 'false') ? 'class="table-danger"' : '';
                $username = $row['username'];
                $userId = $row['user_id'];
                $tgLink = "https://t.me/$username";
            ?>
            <tr class="<?= $active_class; ?>">
                <th scope="row"><?= $rowNumber; ?></th>
                <td><?= $row['user_id']; ?></td>
                <td><?= $row['fio']; ?></td>
                <td <?= $inn_class; ?>><?= $row['inn_filled']; ?></td>
                <td><?= $row['date']; ?></td>
                <td><?= $row['operator_type']; ?></td>
                <td><?= $row['base']; ?></td>
                <td><?= $row['grade']; ?></td>
                <td><?= $row['work_hours']; ?></td>
                <td><?= $row['tabel_hours']; ?></td>
                <td><?= $row['payment']; ?></td>
                <td><?= $row['payment_inn']; ?></td>
                <td><?= $row['vvp']; ?></td>
                <td><?= $row['kpi_good']; ?></td>
                <td><?= $row['rating_good']; ?></td>
                <td><?= $row['kpi_brak']; ?></td>
                <td><?= $row['rating_brak']; ?></td>
                <td><?= $row['group_count']; ?></td>
                <td><?= $row['color']; ?></td>
                <td><?= $row['post']; ?></td>
                <td><?= $row['grade_info']; ?></td>
                <td><?= $row['oplata']; ?></td>
                <td><?= $row['metrica']; ?></td>
                <td><?= $row['metrica_time']; ?></td>
                <td><?= $row['date_reg']; ?></td>
            </tr>
            <?php
                $rowNumber++;
            endwhile;
            ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Скрипт для сортировки, если нужно -->
  </body>
</html>