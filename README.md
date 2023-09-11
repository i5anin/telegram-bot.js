# pfforum bot

## WEB_SERVICE_URL

### [/get_sk_comments.php](https://bot.pf-forum.ru/web_servise/get_sk_comments.php)

**FIXIT:** отправляем id 390895078 принимаем comments от него

```json
{
    "comments": [
        {
            "id_task": 42,
            "user_id": 390895078,
            "date": "2023-08-02",
            "name": "Тест 1: Оптимизация процесса выплавки стали",
            "description": "Какие изменения в процессе выплавки могут улучшить качество стали без значительного увеличения затрат?"
        }
    ]
}
```

### [/rank_up.php](https://bot.pf-forum.ru/web_servise/rank_up.php?id_user=5804836711&fio=%D0%94%D1%80%D0%B0%D0%B3%D1%83%D0%BD%20%D0%94.%D0%92.) и /rank_up2.php

-   **id_user:** `userId`
-   **fio:** `encodedFio`

### /get_user_id.php

**FIXIT:** на проверку на true и показать его ФИО (для лога)

```json
{
    "user_ids": [
        344800068, 372756606, 390895078, 407683031, 409541442, 476175118,
        487054792, 587379201, 628069211, 700831100, 755420969, 916611738,
        1107003647, 1164924330, 1188016536, 1273125651, 1317131152, 1401573636,
        1793690841, 1855007335, 2063026920, 2088248160, 5193574970, 5195514455,
        5207181631, 5220456657, 5243881866, 5251680866, 5804836711, 5860662134,
        6038160691, 6230752380, 6234662820
    ]
}
```

### /update_comment.php

-   **id_task:** `userState.taskId`,
-   **comment:** `userComment`,

## 1. уведомления всех пользователей

```js
async function notifyAllUsers() {}
```

## 2. выполнения GET-запросов

```js
async function fetchData(url, params) {}
```

## 3. Проверка комминтариев

```js
async function fetchComments() {}
```

## 4. уведомления пользователей о комментариях

```js
async function notifyUsers(ctx, userInitiated) {}
```

## 5. проверки регистрации пользователя на Сервере

```js
async function checkRegistration(chatId) {}
```

## 6. Создание метрик

```js
function createMetric(name, counterObject, key) {}
```

## 7. обработка команды /reg

```js
async function handleRegComment(ctx) {}
```

## 8. отправки сообщения в лог

```js
async function sendToLog(ctx) {}
```

## 9. бработка текстовых команд ФИО /add_user

```js
async function handleTextCommand(ctx) {}
```
