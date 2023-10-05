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

$sql = "SELECT * FROM `sk_comments` WHERE `sent` = 1";
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
    .centered-image {
      display: flex;
      justify-content: center;
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
            <tr>
              <th scope="row"><?php echo $rowNumber; ?></th>
              <td><?php echo $row['id_task']; ?></td>
              <td><?php echo $row['comments_op']; ?></td>
              <td><?php echo $row['completed']; ?></td>
              <td><?php echo $row['date']; ?></td>
              <td><?php echo $row['smena_id']; ?></td>
              <td><?php echo $row['specs_nom_id']; ?></td>
              <td><?php echo $row['det_name']; ?></td>
              <td><?php echo $row['user_id']; ?></td>
              <td><?php echo $row['type']; ?></td>
              <td><?php echo $row['kolvo_brak']; ?></td>
              <td><?php echo $row['comments_otk']; ?></td>
              <td><?php echo $row['sent']; ?></td>
              <td><?php echo $row['answered']; ?></td>
              <td><?php echo $row['user_id_master']; ?></td>
            </tr>
          <?php
            $rowNumber++;  // Increment the row number after each row
          endwhile; ?>
        </tbody>
      </table>
    </div>
  </div>
</body>

</html>