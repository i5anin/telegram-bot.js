<?php

function insert_into_bot($id, $time, $user_id, $text)
{
  if (!is_numeric($id)) return false;
  if (!is_numeric($time)) return false;
  if (!is_numeric($user_id)) return false;
  if (!strlen($text)) return false;
  date_default_timezone_set("Asia/Baghdad");

  $dbConfig = require 'sql_config.php';

  // Используем значения из конфига
  $server = $dbConfig['server'];
  $user = $dbConfig['user'];
  $pass = $dbConfig['pass'];
  $db = $dbConfig['db'];

  mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
  $mysqli = mysqli_connect($server, $user, $pass, $db);
  mysqli_set_charset($mysqli, 'utf8mb4');
  $stmt = mysqli_prepare(
    $mysqli,
    "INSERT IGNORE INTO bot (id, time, user, text) VALUES (?,?,?,?)"
  );
  mysqli_stmt_bind_param($stmt, "ssss", $val1, $val2, $val3, $val4);
  $val1 = $id; //123;
  $val2 = date("Y-m-d H:i:s", intval($time)); //"2023-07-18 12:55:01";
  $val3 = $user_id; //9876546654;
  $val4 = $text; //sample text";
  mysqli_stmt_execute($stmt);
  mysqli_stmt_close($stmt);
  mysqli_close($mysqli);
  return true;
}

function insert_into_sk($id, $time, $user_id, $date, $brak_type, $control_type, $specs_nom_id, $memo = "")
{
  if (!is_numeric($id)) return false;
  if (!is_numeric($time)) return false;
  if (!is_numeric($user_id)) return false;
  if (!strlen($date)) return false;
  if (!is_numeric($brak_type)) return false;
  if (!is_numeric($control_type)) return false;
  if (!is_numeric($specs_nom_id)) return false;
  date_default_timezone_set("Asia/Baghdad");
  $dbConfig = require 'sql_config.php';

  // Используем значения из конфига
  $server = $dbConfig['server'];
  $user = $dbConfig['user'];
  $pass = $dbConfig['pass'];
  $db = $dbConfig['db'];

  mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
  $mysqli = mysqli_connect($server, $user, $pass, $db);
  mysqli_set_charset($mysqli, 'utf8mb4');
  $stmt = mysqli_prepare($mysqli, "INSERT IGNORE INTO sk (id, time, user,"
    . " date, brak_type, control_type, specs_nom_id, memo) VALUES (?,?,?,?,?,?,?,?)");
  mysqli_stmt_bind_param(
    $stmt,
    "ssssssss",
    $val1,
    $val2,
    $val3,
    $val4,
    $val5,
    $val6,
    $val7,
    $val8
  );
  $val1 = $id; //123;
  $val2 = date("Y-m-d H:i:s", intval($time)); //"2023-07-18 12:55:01";
  $val3 = $user_id; //9876546654;
  $val4 = date("Y-m-d", strtotime($date));
  $val5 = $brak_type;
  $val6 = $control_type;
  $val7 = $specs_nom_id;
  $val8 = $memo;
  mysqli_stmt_execute($stmt);
  mysqli_stmt_close($stmt);
  mysqli_close($mysqli);
  return true;
}

$res = false;
if ((isset($_GET["id"]))
  && (isset($_GET["time"]))
  && (isset($_GET["user"]))
  && (isset($_GET["text"]))
)
  $res = insert_into_bot($_GET["id"], $_GET["time"], $_GET["user"], $_GET["text"]);

if ((isset($_GET["id"]))
  && (isset($_GET["time"]))
  && (isset($_GET["user"]))
  && (isset($_GET["date"]))
  && (isset($_GET["brak_type"]))
  && (isset($_GET["control_type"]))
  && (isset($_GET["specs_nom_id"]))
  && (isset($_GET["memo"]))
)
  $res = insert_into_sk(
    $_GET["id"],
    $_GET["time"],
    $_GET["user"],
    $_GET["date"],
    $_GET["brak_type"],
    $_GET["control_type"],
    $_GET["specs_nom_id"],
    $_GET["memo"]
  );

if ($res) echo "<h1>OK</h1>";
else echo "<h1>ERROR!</h1>";
