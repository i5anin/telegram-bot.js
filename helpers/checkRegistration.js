// Импортируем fetchData из его расположения
const fetchData = require('./path/to/fetchData')
// Импортируем константы из файла конфигурации
const { WEB_SERVICE_URL } = require('./config')

async function checkRegistration(chatId) {
    // Вызываем функцию fetchData для получения данных о пользователе
    const data = await fetchData(WEB_SERVICE_URL + '/get_user_id.php')
    // Проверяем, есть ли chatId среди зарегистрированных пользователей
    return data ? data.user_ids.includes(chatId) : false
}

// Экспортируем функцию для использования в других модулях
module.exports = checkRegistration
