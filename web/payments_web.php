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

// Получаем текущую дату
$today = new DateTime();
$currentDay = (int) $today->format('d');

// Определяем, нужно ли показывать данные за 31.05.24
if ($currentDay >= 1 && $currentDay <= 10) {
    $targetDate = new DateTime('2024-05-31');
    $targetDateString = $targetDate->format('Y-m-d');
} else {
    $targetDate = new DateTime('2024-06-05');
    $targetDateString = $targetDate->format('Y-m-d');
}

// Обновленный SQL запрос с учетом параметра inn и условия даты
$sql = "SELECT u.*, p.date, p.fio, p.operator_type, p.base, p.grade, p.work_hours, p.tabel_hours, p.payment, p.inn AS payment_inn, p.vvp, p.kpi_good, p.rating_good, p.kpi_brak, p.rating_brak, p.group_count, p.color, p.post, p.grade_info, IF(u.`inn` <> '', 'true', 'false') AS `inn_filled`
FROM `users` u
LEFT JOIN `payments` p ON u.`user_id` = p.`user_id`
WHERE u.`user_id` >= 0 AND p.`date` = '" . $targetDateString . "'";

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
      body {
        margin: 0;
        padding: 0;
      }

      .container {
        width: 100%;
        padding: 0;
      }

      .table-responsive {
        overflow-x: auto; /* Добавляем горизонтальную прокрутку, если нужно */
      }

      .table-danger {
        background-color: #f8d7da; /* Красный */
      }

      .table-primary {
        background-color: #cfe2ff; /* Синий */
      }

      .table-success {
        background-color: #d4edda; /* Зеленый */
      }

      .table-warning {
        background-color: #fff3cd; /* Желтый */
      }

      .table-info {
        background-color: #e0ffff; /* Голубой */
      }

      /* Добавьте стили для других цветов по аналогии */
    </style>
  </head>

  <body data-bs-theme="dark">
    <div >
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
              <th scope="col">vvp</th>
              <th scope="col">kpi_good</th>
              <th scope="col">rating_good</th>
              <th scope="col">kpi_brak</th>
              <th scope="col">rating_brak</th>
              <th scope="col">group_count</th>
              <th scope="col">color</th>
              <th scope="col">post</th>
              <th scope="col">grade_info</th>
            </tr>
          </thead>
          <tbody>
            <?php
            $rowNumber = 1;
            while ($row = $result->fetch_assoc()):
                // Определяем класс для строки в зависимости от цвета
                $colorClass = '';
                switch ($row['color']) {
                    case 'red':
                        $colorClass = 'table-danger';
                        break;
                    case 'blue':
                        $colorClass = 'table-primary';
                        break;
                    case 'white':
                        $colorClass = 'table-secondary';
                        break;
                    case 'green':
                        $colorClass = 'table-success';
                        break;
                    // Добавьте другие цвета по аналогии
                }

                // Определяем класс для ячейки с INN
                $innClass = $row['inn_filled'] === 'true' ? '' : 'table-non-active';

                // Форматирование base, payment, vvp
                $formattedBase = number_format($row['base'] , 0, ',', ' ') . ' ₽';
                $formattedPayment = number_format($row['payment'] , 0, ',', ' ') . ' ₽';
                $formattedVvp = number_format($row['vvp'] , 0, ',', ' ') . ' ₽';
            ?>
            <tr class="<?= $colorClass; ?>">
                <th scope="row"><?= $rowNumber; ?></th>
                <td><?= $row['user_id']; ?></td>
                <td><?= $row['fio']; ?></td>
                <td <?= $innClass; ?>><?= $row['inn_filled']; ?></td>
                <td><?= $row['date']; ?></td>
                <td><?= $row['operator_type']; ?></td>
                <td><?= $formattedBase; ?></td>
                <td><?= $row['grade']; ?></td>
                <td><?= $row['work_hours']; ?></td>
                <td><?= $row['tabel_hours']; ?></td>
                <td><?= $formattedPayment; ?></td>
                <td><?= $formattedVvp; ?></td>
                <td><?= $row['kpi_good']; ?></td>
                <td><?= $row['rating_good']; ?></td>
                <td><?= $row['kpi_brak']; ?></td>
                <td><?= $row['rating_brak']; ?></td>
                <td><?= $row['group_count']; ?></td>
                <td><?= $row['color']; ?></td>
                <td><?= $row['post']; ?></td>
                <td><?= $row['grade_info']; ?></td>
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