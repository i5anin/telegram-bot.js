1. **Проверка и обновление данных бота:**

    - `GET ${WEB_API}/bot/check.php?key=${SECRET_KEY}`
        - Проверяет текущее состояние бота.
    - `GET ${WEB_API}/bot/update.php?key=${SECRET_KEY}&date=${formattedDateTime}&random_key=${instanceNumber}`
        - Обновляет данные бота.
2. **Получение всех пользователей:**

    - `GET ${WEB_API}/users/get_all_fio.php`
        - Возвращает список всех пользователей.
3. **Работа с комментариями:**

    - `GET ${WEB_API}/comment/get_all.php?key=${SECRET_KEY}`
        - Получает все комментарии.
    - `GET ${WEB_API}/comment/update.php?id_task=${id_task}&sent=1&access_key=${SECRET_KEY}`
        - Обновляет статус отправленных комментариев по задаче.
4. **Работа с платежами:**

    - `GET ${WEB_API}/oplata/get_all.php?key=${SECRET_KEY}`
        - Получает все платежи.
    - `GET ${WEB_API}/oplata/update.php?key=${SECRET_KEY}&sent_ids=${sentIds.join(',')}`
        - Обновляет статус отправленных платежей.
5. **Работа с пользователями:**

    - `GET ${WEB_API}/users/get.php?id=${chatId}`
        - Получает информацию о конкретном пользователе по ID чата.
    - `POST ${WEB_API}/users/add.php`
        - Добавляет нового пользователя с переданными параметрами: id, fio, username, active.