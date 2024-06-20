<?php
// Подключаем конфигурационный файл
$dbConfig = require 'sql_config.php';

// Параметры для подключения к БД
$server = $dbConfig['server'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];
$db = $dbConfig['db'];

$mysqli = new mysqli($server, $user, $pass, $db);

if ($mysqli->connect_error) {
  die("Connection failed: " . $mysqli->connect_error);
}

$mysqli->set_charset('utf8mb4');

// Вычисляем дату начала последнего месяца
$dateOneMonthAgo = new DateTime('-2 month');
$dateOneMonthAgo = $dateOneMonthAgo->format('Y-m-d');

// Проверяем наличие параметров в URL
if (!isset($_GET['all'])) {
    // Если параметр отсутствует, выбираем только строки, где sent == 0 и user_id == 0
    $sql = "SELECT * FROM `sk_comments` WHERE (`sent` = 0 OR `user_id` = 0) AND `date` >= '".$dateOneMonthAgo."'";
} else {
    // Иначе выбираем все строки за последний месяц
    $sql = "SELECT * FROM `sk_comments` WHERE `date` >= '".$dateOneMonthAgo."'";
}

$result = $mysqli->query($sql);

$mysqli->close();
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BOT</title>
  <link rel="icon" type="image/png" href="assets/favicon.svg">
  <link href="css/bootstrap.css" rel="stylesheet">
  <style>
    .text-cell {
      max-width: 150px;
      /* Максимальная ширина ячейки */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .table-responsive {
      height: 100vh;
      overflow-y: auto;
    }

    thead th {
      position: sticky;
      top: 0;
      background-color: #f8f9fa;
      cursor: pointer;
    }
  </style>
</head>

<body data-bs-theme="dark">
  <div class="container">
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">id_task</th>
            <th scope="col">comments_op</th>
            <th scope="col">completed</th>
            <th scope="col">date</th>
            <th scope="col">smena_id</th>
            <th scope="col">specs_nom_id</th>
            <th scope="col">det_name</th>
            <th scope="col">user_id</th>
            <th scope="col">type</th>
            <th scope="col">kolvo_brak</th>
            <th scope="col">comments_otk</th>
            <th scope="col">sent</th>
            <th scope="col">answered</th>
            <th scope="col">user_id_master</th>
          </tr>
        </thead>
        <tbody>
          <?php
          $rowNumber = 1;  // Counter variable for row numbers
          while ($row = $result->fetch_assoc()) : ?>
            <tr <?php if ($row['user_id'] == 0) echo 'class="table-danger"';
                elseif ($row['sent'] == 0) echo 'class="table-primary"'; ?>>
              <th scope="row"><?php echo $rowNumber; ?></th>
              <td class="text-cell"><?php echo $row['id_task']; ?></td>
              <td class="text-cell"><?php echo $row['comments_op']; ?></td>
              <td class="text-cell"><?php echo $row['completed']; ?></td>
              <td class="text-cell"><?php echo $row['date']; ?></td>
              <td class="text-cell"><?php echo $row['smena_id']; ?></td>
              <td class="text-cell"><?php echo $row['specs_nom_id']; ?></td>
              <td class="text-cell"><?php echo $row['det_name']; ?></td>
              <td class="text-cell"><?php echo $row['user_id']; ?></td>
              <td class="text-cell"><?php echo $row['type']; ?></td>
              <td class="text-cell"><?php echo $row['kolvo_brak']; ?></td>
              <td class="text-cell"><?php echo $row['comments_otk']; ?></td>
              <td class="text-cell"><?php echo $row['sent']; ?></td>
              <td class="text-cell"><?php echo $row['answered']; ?></td>
              <td class="text-cell"><?php echo $row['user_id_master']; ?></td>
            </tr>
          <?php
            $rowNumber++;  // Increment the row number after each row
          endwhile; ?>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    document.querySelectorAll('thead th').forEach(headerCell => {
      headerCell.addEventListener('click', () => {
        const tableElement = headerCell.closest('table');
        const headerIndex = Array.prototype.indexOf.call(headerCell.parentElement.children, headerCell);
        const currentIsAscending = headerCell.classList.contains('ascending');

        Array.from(tableElement.querySelectorAll('tbody tr'))
          .sort((trA, trB) => {
            const cellA = parseInt(trA.children[headerIndex].textContent, 10);
            const cellB = parseInt(trB.children[headerIndex].textContent, 10);
            return currentIsAscending ? cellA - cellB : cellB - cellA;
          })
          .forEach(tr => tableElement.querySelector('tbody').appendChild(tr));

        headerCell.classList.toggle('ascending', !currentIsAscending);
      });
    });
  </script>
</body>

</html>