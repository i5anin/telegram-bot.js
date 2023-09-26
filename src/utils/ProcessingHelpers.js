// Функция для выполнения GET-запросов
const axios = require('axios')
const ruLang = require('#src/utils/ru_lang')

async function fetchData(url, params, method = 'GET') {
    try {
        const response = await axios({
            url,
            method,
            params: method === 'GET' ? params : {},
            data: method === 'POST' ? params : {},
        })
        if (!response.data) {
            console.log('Сервер ответил без данных. GET-запрос\n') //Сервер ответил без данных
            return null
        }
        return response.data
    } catch (error) {
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `\n<code>${error}</code>`,
            { parse_mode: 'HTML' },
        )
        console.log('ruLang.serverError=', ruLang.serverError, error) //Ошибка сервера
        return null
    }
}

// Функция для сброса флагов сессии
function resetFlags(ctx) {
    ctx.session.isAwaitFio = false
    ctx.session.isAwaitComment = false
    ctx.session.userInitiated = false
    ctx.session.isUserInitiated = false
}

function formatPaymentDate(payment) {
    const [year, month, day] = payment.date.split('-')
    const formattedDate = `${day}.${month}.${year}`

    return { formattedDate }
}

module.exports = { fetchData, resetFlags, formatPaymentDate }
