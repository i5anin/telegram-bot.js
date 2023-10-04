<?php

$target_url = 'http://soft.pfforum';

// Соединяем целевой URL с путем и строкой запроса из текущего запроса
$url = $target_url . $_SERVER['REQUEST_URI'];

// Используем cURL для выполнения запроса
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);

// Если это POST-запрос, копируем данные POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

// Выполняем запрос
$response = curl_exec($ch);
if($response === false) {
    die('Error: ' . curl_error($ch));
}

// Копируем заголовки ответа
$headers = curl_getinfo($ch);
header('Content-Type: ' . $headers['content_type']);

// Закрываем cURL
curl_close($ch);

// Отправляем ответ обратно клиенту
echo $response;
