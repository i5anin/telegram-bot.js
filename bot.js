require('dotenv').config()
const { Telegraf, Markup } = require('telegraf')
const axios = require('axios')
const messages = require('./messages')
const LocalSession = require('telegraf-session-local')

const BOT_TOKEN = process.env.BOT_TOKEN
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'

const bot = new Telegraf(BOT_TOKEN)

const localSession = new LocalSession({ database: 'session_db.json' })
bot.use(localSession.middleware())

// Удаляем следующую строку, так как она заменена telegraf-session-local
// bot.use(Telegraf.session())

async function fetchData(url, params) {
    try {
        const response = await axios.get(url, { params })
        return response.data
    } catch (error) {
        console.error(messages.serverError, error)
        return null
    }
}

async function fetchComments() {
    try {
        const response = await axios.get(
            `${WEB_SERVICE_URL}/get_sk_comments.php`
        )
        return response.data.comments
    } catch (error) {
        console.error('Error fetching comments:', error)
        return null
    }
}

bot.start(async (ctx) => {
    const chatId = ctx.message.chat.id
    const isRegistered = await fetchData(`${WEB_SERVICE_URL}/get_user_id.php`, {
        chatId,
    })
    ctx.reply(
        isRegistered ? messages.alreadyRegistered : messages.notRegistered,
        { parse_mode: 'HTML' }
    )
})

bot.command('reg', (ctx) => {
    ctx.reply(messages.enterData, { parse_mode: 'HTML' })
})

bot.command('add_comment', (ctx) => {
    ctx.session.state = 'ADDING_COMMENT'
    ctx.reply('Пожалуйста, введите ваш комментарий.')
})

bot.command('ref_comment', (ctx) => {
    ctx.session.state = 'REF_COMMENT'
    ctx.reply('Пожалуйста, введите ваш новый комментарий.')
})

bot.on('text', async (ctx) => {
    const { text } = ctx.message

    if (ctx.session.state === 'ADDING_COMMENT') {
        const response = await fetchData(`${WEB_SERVICE_URL}/add_comment.php`, {
            comment: text,
        })
        ctx.reply(
            response
                ? 'Комментарий успешно добавлен.'
                : 'Не удалось добавить комментарий.'
        )
        ctx.session.state = null
    } else if (ctx.session.state === 'REF_COMMENT') {
        const response = await fetchData(
            `${WEB_SERVICE_URL}/update_comment.php`,
            { new_comment: text }
        )
        ctx.reply(
            response
                ? 'Комментарий успешно обновлен.'
                : 'Не удалось обновить комментарий.'
        )
        ctx.session.state = null
    } else {
        // Другая логика обработки текстовых сообщений
    }
})

bot.launch()

async function notifyUsers() {
    const comments = await fetchComments()
    if (!comments) return

    for (const comment of comments) {
        const chatId = comment.user_id
        const message =
            `Пожалуйста, прокомментируйте следующую операцию` +
            `<code>(${userMessageCounts[chatId]}/${totalMessagesForUser})</code>:\n` +
            `Название: <code>${comment.name}</code>\n` +
            `Описание: <code>${comment.description}</code>\n` +
            `Дата: <code>${comment.date}</code>`
        await bot.telegram
            .sendMessage(chatId, message)
            .catch((err) => console.error(`Error: ${err}`))
        await new Promise((resolve) => setTimeout(resolve, 500))
    }
}

setInterval(notifyUsers, 10000)
