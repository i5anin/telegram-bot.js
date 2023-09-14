// Функция для выполнения GET-запросов
const axios = require('axios')
const ruLang = require('#src/utils/ru_lang')

module.exports = async function fetchData(url, params, method = 'GET') {
    try {
        const response = await axios({
            url,
            method,
            params: method === 'GET' ? params : {},
            data: method === 'POST' ? params : {},
        });
        if (!response.data) {
            console.log('Сервер ответил без данных. GET-запрос\n'); //Сервер ответил без данных
            return null
        }
        return response.data
    } catch (error) {
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `\n<code>${error}</code>`,
            { parse_mode: 'HTML' }
        );
        console.log(ruLang.serverError, error); //Ошибка сервера
        return null
    }
}
