### Comment

1. **Get All Comments**

    - URL: `https://bot.pf-forum.ru/api/comment/get_all.php`
    - Method: GET
    - Parameters: `key`
2. **Update Comment**

    - URL: `https://bot.pf-forum.ru/api/comment/update.php`
    - Method: GET
    - Parameters: `id_task`, `sent`, `access_key`

### Users

1. **Get All Users**

    - URL: `https://bot.pf-forum.ru/api/users/get_all_fio.php`
    - Method: GET
2. **Get User**

    - URL: `https://bot.pf-forum.ru/api/users/get.php`
    - Method: GET
    - Parameters: `id`
3. **Add User**

    - URL: `https://bot.pf-forum.ru/api/users/add.php`
    - Method: POST
    - Parameters: `id`, `fio`, `username`, `active`

### Oplata

1. **Get All Payments**

    - URL: `https://bot.pf-forum.ru/api/oplata/get_all.php`
    - Method: GET
    - Parameters: `key`
2. **Update Payment**

    - URL: `https://bot.pf-forum.ru/api/oplata/update.php`
    - Method: GET
    - Parameters: `key`, `sent_ids`

### Bot

1. **Check Bot Data**

    - URL: `https://bot.pf-forum.ru/api/bot/check.php`
    - Method: GET
    - Parameters: `key`, `date`, `random_key`
2. **Update Bot Data**

    - URL: `https://bot.pf-forum.ru/api/bot/update.php`
    - Method: GET
    - Parameters: `key`, `date`, `random_key`