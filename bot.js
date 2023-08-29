require('dotenv').config() // загрузить переменные среды из файла .env
const { Telegraf, Markup } = require('telegraf')
const axios = require('axios')
const messages = require('./messages')

const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN

const bot = new Telegraf(BOT_TOKEN) // Инициализация бота

async function fetchData(url, params) {
    try {
        const response = await axios.get(url, { params })
        return response.data
    } catch (error) {
        console.error(messages.serverError, error)
        return null
    }
}

async function checkRegistration(chatId) {
    const data = await fetchData(`${WEB_SERVICE_URL}/get_user_id.php`)
    return data ? data.user_ids.includes(chatId) : false
}

async function sendNewComment(id, comment) {
    const params = {
        id,
        comment,
    }
    return await fetchData(`${WEB_SERVICE_URL}/add_comment.php`, params)
}

async function updateComment(id, newComment) {
    const params = {
        id,
        new_comment: newComment,
    }
    return await fetchData(`${WEB_SERVICE_URL}/update_sk_comment.php`, params)
}

async function handleStartCommand(ctx) {
    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)
    ctx.reply(
        isRegistered ? messages.alreadyRegistered : messages.notRegistered,
        { parse_mode: 'HTML' }
    )
}

async function handleTextCommand(ctx) {
    const { text, chat, from } = ctx.message
    if (/^[А-Яа-я]+\s[А-Яа-я]\.[А-Яа-я]\.$/.test(text)) {
        const params = {
            id: chat.id,
            fio: text,
            username: from.username,
            active: 1,
        }
        const data = await fetchData(`${WEB_SERVICE_URL}/user.php`, params)
        if (data) handleApiResponse(ctx, data)
    } else {
        ctx.reply(messages.invalidData)
    }
}

async function handleAddComment(ctx) {
    ctx.reply('Пожалуйста, введите ваш комментарий.')
}

async function handleRefComment(ctx) {
    ctx.reply('Пожалуйста, введите ваш новый комментарий.')
}

// Установка обработчиков команд
bot.command('add_comment', handleAddComment)
bot.command('ref_comment', handleRefComment)
bot.command('start', handleStartCommand)
bot.command('reg', (ctx) =>
    ctx.reply(messages.enterData, { parse_mode: 'HTML' })
)

bot.on('text', async (ctx) => {
    // Здесь будет ваш код для обработки обычных текстовых сообщений.
    // Например, если вы хотите отложенно обработать комментарии:
    handleTextCommand(ctx)
})

bot.launch()
