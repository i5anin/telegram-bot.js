<?php
// Проверяем наличие параметра key в GET-запросе
if (isset($_GET['key'])) {
    $provided_key = $_GET['key'];

    // Получаем секретный ключ из конфигурации
    $dbConfig = require 'sql_config.php';
    $SECRET_KEY = $dbConfig['key'] ?? null;

    // Получаем текущее время в часах
    $currentHour = (int) date('H');

    // Проверяем секретный ключ и текущее время
    if ($provided_key !== $SECRET_KEY . $currentHour) {
        echo json_encode(['error' => 'Invalid secret key or time']);
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
$sql = "SELECT u.*,
            p.date,
            p.fio,
            p.operator_type,
            p.base,
            p.grade,
            p.work_hours,
            p.tabel_hours,
            p.payment,
            p.inn AS payment_inn,
            p.vvp,
            p.kpi_good,
            p.rating_good,
            p.kpi_brak,
            p.rating_brak,
            p.group_count,
            p.color,
            p.post,
            p.grade_info,
            IF(u.`inn` <> '', 'true', 'false') AS `inn_filled`
        FROM `users` u
        LEFT JOIN `payments` p ON u.`user_id` = p.`user_id`
        WHERE u.`user_id` >= 0
        AND DATE_FORMAT(p.`date`, '%d.%m.%y') = '" . $targetDate->format('d.m.y') . "'";

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

      .table td {
        white-space: nowrap; /* Запрет переноса внутри ячеек */
      }
    </style>
  </head>

  <body data-bs-theme="dark">
    <div >
      <div class="table-responsive">
        <table class="table" id="usersTable">
          <thead>
            <tr>
              <th scope="col">#</th>

              <th scope="col">fio</th>
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

                // Форматирование base, payment, vvp
                $formattedBase = number_format($row['base'], 0, ',', ' ') . ' ₽';
                $formattedPayment = number_format($row['payment'], 0, ',', ' ') . ' ₽';
                $formattedVvp = number_format($row['vvp'], 0, ',', ' ') . ' ₽';

                // Форматирование даты (оставляем без изменений)
                $formattedDate = $row['date'];

            ?>
            <tr class="<?= $colorClass; ?>">
                <th scope="row"><?= $rowNumber; ?></th>
                <td><?= $row['fio']; ?></td>
             <td><?= date('d.m.y', strtotime($row['date'])); ?></td>  <!-- Выводим дату в формате, который приходит из базы данных -->
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

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.4/js/dataTables.bootstrap5.min.js"></script>
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.4/css/dataTables.bootstrap5.min.css">
    <script>
      $(document).ready(function () {
        $('#usersTable').DataTable({
          "language": {
            "url": "//cdn.datatables.net/plug-ins/1.10.16/i18n/Russian.json"
          }
        });
      });
    </script>
  </body>
</html>