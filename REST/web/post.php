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

    .table-container {
      width: 100%;
      height: 100vh;
      overflow: auto;
    }

    /* Новые стили для узких столбцов */
    .narrow-column {
      max-width: 50px; /* Установите желаемую максимальную ширину */
    }
  </style>
</head>

<body data-bs-theme="dark">
  <div class="container-fluid table-container">
    <table class="table table-striped">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">user_id</th>
          <th scope="col">fio</th>
          <th scope="col">username</th>
          <th scope="col" class="narrow-column">active</th>
          <th scope="col" class="narrow-column">role</th>
          <th scope="col" class="narrow-column">oplata</th>
          <th scope="col" class="narrow-column">metrica</th>
          <th scope="col" class="narrow-column">metrica_time</th>
          <th scope="col">inn</th>
          <th scope="col">date_reg</th>
          <th scope="col">post</th>
        </tr>
      </thead>
      <tbody>
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

        // Запрос к базе данных
        $sql = "SELECT
              users.user_id,
              users.fio,
              users.username,
              users.active,
              users.role,
              users.oplata,
              users.metrica,
              users.metrica_time,
              users.inn,
              users.date_reg,
              unique_payments.post
            FROM
              `users`
            LEFT JOIN
              (SELECT DISTINCT inn, post FROM payments WHERE post IS NOT NULL AND post != '') AS unique_payments
            ON users.inn = unique_payments.inn
            ORDER BY users.date_reg DESC";

        $result = $mysqli->query($sql);

        $rowNumber = 1;
        while ($row = $result->fetch_assoc()) : ?>
          <tr>
            <th scope="row"><?php echo $rowNumber; ?></th>
            <td class="text-cell"><?php echo $row['user_id']; ?></td>
            <td class="text-cell"><?php echo $row['fio']; ?></td>
            <td class="text-cell narrow-column"><?php echo $row['username']; ?></td>
            <td class="text-cell narrow-column"><?php echo $row['active']; ?></td>
            <td class="text-cell narrow-column"><?php echo $row['role']; ?></td>
            <td class="text-cell narrow-column"><?php echo $row['oplata']; ?></td>
            <td class="text-cell narrow-column"><?php echo $row['metrica']; ?></td>
            <td class="text-cell narrow-column"><?php echo $row['metrica_time']; ?></td>
            <td class="text-cell"><?php echo $row['inn']; ?></td>
            <td class="text-cell"><?php echo $row['date_reg']; ?></td>
            <td class="text-cell"><?php echo $row['post']; ?></td>
          </tr>
        <?php
          $rowNumber++;
        endwhile;

        $mysqli->close();
        ?>
      </tbody>
    </table>
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