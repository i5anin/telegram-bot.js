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

$sql = "SELECT * FROM `users`";
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
    /* Your styles go here */
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
          </tr>
        </thead>
        <tbody>
          <?php
          $rowNumber = 1;  // Counter variable for row numbers
          while ($row = $result->fetch_assoc()) :
            $role_class = '';
            switch ($row['role']) {
              case 'admin':
                $role_class = 'table-danger';
                break;
              case 'test':
                $role_class = 'table-warning';
                break;
              case 'dir':
                $role_class = 'table-info';
                break;
            }
          ?>
            <tr class="<?php echo $role_class; ?>">
              <th scope="row"><?php echo $rowNumber; ?></th>
              <td class="text-cell"><?php echo $row['user_id']; ?></td>
              <td class="text-cell"><?php echo $row['fio']; ?></td>
              <td class="text-cell"><?php echo $row['username']; ?></td>
              <td class="text-cell"><?php echo $row['active']; ?></td>
              <td class="text-cell"><?php echo $row['role']; ?></td>
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
            const cellA = trA.children[headerIndex].textContent.trim();
            const cellB = trB.children[headerIndex].textContent.trim();
            if (!isNaN(cellA) && !isNaN(cellB)) {
              // Если значения являются числами, сортировать как числа
              return currentIsAscending ? cellA - cellB : cellB - cellA;
            } else {
              // Если значения являются строками, сортировать как строки
              return currentIsAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
            }
          })
          .forEach(tr => tableElement.querySelector('tbody').appendChild(tr));

        headerCell.classList.toggle('ascending', !currentIsAscending);
      });
    });
  </script>
</body>

</html>