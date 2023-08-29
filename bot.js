require('dotenv').config() // загрузить переменные среды из файла .env
const { Telegraf, Markup } = require('telegraf')
const axios = require('axios')

const messages = require('./messages')

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN

// Вспомогательные функции

/**
 * Выполняет HTTP GET запрос к указанному URL с заданными параметрами.
 * @param {string} url - URL-адрес для выполнения GET запроса.
 * @param {Object} params - Параметры для GET запроса.
 * @returns {Object|null} Возвращает ответ сервера в форме объекта или null в случае ошибки.
 */
async function fetchData(url, params) {
    try {
        const response = await axios.get(url, { params })
        return response.data
    } catch (error) {
        console.error(messages.serverError, error)
        return null
    }
}

// Основной код
async function handleStartCommand(ctx) {
    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)
    ctx.reply(
        isRegistered ? messages.alreadyRegistered : messages.notRegistered,
        { parse_mode: 'HTML' }
    )
}
// Обработка текстовой команды
async function handleTextCommand(ctx) {
    const { text, chat, from } = ctx.message
    if (/^[А-Яа-я]+\s[А-Яа-я]\.[А-Яа-я]\.$/.test(text)) {
        // Проверяет Иванов И.И.
        const params = {
            id: chat.id,
            fio: text,
            username: from.username,
            active: 1,
        }
        const data = await fetchData(WEB_SERVICE_URL + `/user.php`, params)
        if (data) handleApiResponse(ctx, data)
    } else {
        ctx.reply(messages.invalidData)
    }
}

async function checkRegistration(chatId) {
    const data = await fetchData(WEB_SERVICE_URL + `/get_user_id.php`)
    return data ? data.user_ids.includes(chatId) : false
}

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN)

bot.command('start', handleStartCommand)
bot.command('reg', (ctx) =>
    ctx.reply(messages.enterData, { parse_mode: 'HTML' })
)
bot.on('text', handleTextCommand)

bot.launch()
