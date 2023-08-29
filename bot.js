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

// Вспомогательные функции
/**
 * Отправляет новый комментарий на сервер.
 * @param {number} id - ID комментария.
 * @param {string} comment - Текст комментария.
 */
async function sendNewComment(id, comment) {
    const params = {
        id: id,
        comment: comment,
    }
    return await fetchData(WEB_SERVICE_URL + '/add_comment.php', params)
}

/**
 * Изменяет существующий комментарий на сервере.
 * @param {number} id - ID комментария.
 * @param {string} newComment - Новый текст комментария.
 */
async function updateComment(id, newComment) {
    const params = {
        id: id,
        new_comment: newComment,
    }
    return await fetchData(WEB_SERVICE_URL + '/update_comment.php', params)
}

// Основной код
async function handleAddComment(ctx) {
    // Запросить текст комментария от пользователя
    ctx.reply('Пожалуйста, введите ваш комментарий.')
    bot.on('text', async (ctx) => {
        const comment = ctx.message.text
        const id = 1 // Получите этот ID из нужного источника
        const response = await sendNewComment(id, comment)
        if (response && response.success) {
            ctx.reply('Комментарий успешно добавлен.')
        } else {
            ctx.reply('Не удалось добавить комментарий.')
        }
    })
}

async function handleRefComment(ctx) {
    // Запросить новый текст комментария от пользователя
    ctx.reply('Пожалуйста, введите ваш новый комментарий.')
    bot.on('text', async (ctx) => {
        const newComment = ctx.message.text
        const id = 1 // Получите этот ID из нужного источника
        const response = await updateComment(id, newComment)
        if (response && response.success) {
            ctx.reply('Комментарий успешно обновлен.')
        } else {
            ctx.reply('Не удалось обновить комментарий.')
        }
    })
}

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN)

bot.command('add_comment', handleAddComment)
bot.command('ref_comment', handleRefComment)

bot.command('start', handleStartCommand)
bot.command('reg', (ctx) =>
    ctx.reply(messages.enterData, { parse_mode: 'HTML' })
)
bot.on('text', handleTextCommand)

bot.launch()
