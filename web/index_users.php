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

// Обновлённый SQL запрос с сортировкой по убыванию даты регистрации
$sql = "SELECT *, IF(`inn` <> '', 'true', 'false') AS `inn_filled` FROM `users` ORDER BY `date_reg` DESC";
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
              <th scope="col">username</th>
              <th scope="col">active</th>
              <th scope="col">role</th>
              <!-- Другие колонки -->
              <th scope="col">oplata</th>
              <th scope="col">metrica</th>
              <th scope="col">metrica_time</th>
              <th scope="col">date_reg</th>
            </tr>
          </thead>
          <tbody>
            <?php
            $rowNumber = 1; // Номер строки для отображения
            while ($row = $result->fetch_assoc()) :
              $active_class = $row['active'] == 'false' ? 'table-non-active' : '';
            ?>
              <tr class="<?= $active_class; ?>">
                <th scope="row"><?= $rowNumber; ?></th>
                <td><?= $row['user_id']; ?></td>
                <td><?= $row['fio']; ?></td>
                <td><?= $row['username']; ?></td>
                <td><?= $row['active']; ?></td>
                <td><?= $row['role']; ?></td>
                <!-- Вывод других полей -->
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