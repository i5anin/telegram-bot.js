require('dotenv').config() // загрузить переменные среды из файла .env
const { Telegraf, Markup } = require('telegraf')
const axios = require('axios')

const messages = require('./messages')

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN

// Вспомогательные функции

// Функция для выполнения GET-запросов
async function fetchData(url, params) {
    try {
        const response = await axios.get(url, { params })
        return response.data
    } catch (error) {
        console.error(messages.serverError, error)
        return null
    }
}

// Функция для выполнения GET-запросов
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

let sentNotifications = {}
// Функция для уведомления пользователей о комментариях
async function notifyUsers() {
    const comments = await fetchComments()
    if (!comments) return

    const notifications = {}

    for (const comment of comments) {
        const userId = comment.user_id

        if (!sentNotifications[userId]) {
            sentNotifications[userId] = new Set()
        }

        if (sentNotifications[userId].has(comment.id)) {
            continue
        }

        sentNotifications[userId].add(comment.id)
        notifications[userId] = (notifications[userId] || 0) + 1

        const numCommentsForUser = comments.filter(
            (c) => c.user_id === userId
        ).length
        const message = `Пожалуйста, прокомментируйте следующую операцию(${notifications[userId]}/${numCommentsForUser}):\nНазвание: ${comment.name}\nОписание: ${comment.description}\nДата: ${comment.date}`

        await bot.telegram
            .sendMessage(userId, message, { parse_mode: 'HTML' })
            .catch((e) =>
                console.error(`Error sending message to chatId ${userId}:`, e)
            )
        await new Promise((resolve) => setTimeout(resolve, 500))
    }
}

// Функция для обработки команды /start
async function handleStartCommand(ctx) {
    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)
    ctx.reply(
        isRegistered ? messages.alreadyRegistered : messages.notRegistered,
        { parse_mode: 'HTML' }
    )
}
// Функция для обработки текстовых команд
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

// Функция для проверки регистрации пользователя
async function checkRegistration(chatId) {
    const data = await fetchData(WEB_SERVICE_URL + `/get_user_id.php`)
    return data ? data.user_ids.includes(chatId) : false
}

// Функция для отправки нового комментария
async function sendNewComment(id, comment) {
    const params = {
        id: id,
        comment: comment,
    }
    return await fetchData(WEB_SERVICE_URL + '/add_comment.php', params)
}

// Функция для обновления комментария
async function updateComment(id, newComment) {
    const params = {
        id: id,
        new_comment: newComment,
    }
    return await fetchData(WEB_SERVICE_URL + '/update_comment.php', params)
}

// Функция для добавления комментария
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

// Функция для обновления комментария
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

async function handleRegComment(ctx) {
    ctx.reply(messages.enterData, { parse_mode: 'HTML' })
}

const bot = new Telegraf(BOT_TOKEN)

bot.command('add_comment', handleAddComment)
bot.command('ref_comment', handleRefComment)
bot.command('start', handleStartCommand)
bot.command('reg', handleRegComment)

bot.on('text', handleTextCommand)

bot.launch()

setInterval(notifyUsers, 10000)
