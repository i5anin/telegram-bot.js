require('dotenv').config() // загрузить переменные среды из файла .env
const { Telegraf, Markup, session } = require('telegraf')
const axios = require('axios')
const messages = require('./messages')

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN

// Инициализация bot
const bot = new Telegraf(BOT_TOKEN)

// Теперь можно использовать bot
bot.use(session())

// Функция для выполнения GET-запросов
async function fetchData(url, params) {
    try {
        return (await axios.get(url, { params })).data
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

// Добавлено состояние сессии
// bot.use(session())

async function notifyUsers() {
    const comments = await fetchComments()
    if (!comments) return

    for (const comment of comments) {
        const chatId = comment.user_id

        // Проверяем, отправляли ли мы уже сообщение этому пользователю
        if (!bot.session[chatId]) {
            bot.session[chatId] = { waitingForReply: false }
        }

        // Если ждем ответа от пользователя, пропускаем итерацию
        if (bot.session[chatId].waitingForReply) {
            continue
        }

        const message = // формирование сообщения
            `Пожалуйста, прокомментируйте следующую операцию:\n` +
            `Название: ${comment.name}\n` +
            `Описание: ${comment.description}\n` +
            `Дата: ${comment.date}`

        await bot.telegram
            .sendMessage(chatId, message, { parse_mode: 'HTML' })
            .catch((err) =>
                console.error(`Error sending message to chatId ${chatId}:`, err)
            )

        // Отмечаем, что ждем ответа от пользователя
        bot.session[chatId].waitingForReply = true
    }
}

// Обработчик для текстовых сообщений
bot.on('text', async (ctx) => {
    const chatId = ctx.message.chat.id

    // Если получили ответ от пользователя, снимаем флаг ожидания и обрабатываем ответ
    if (bot.session[chatId] && bot.session[chatId].waitingForReply) {
        const userReply = ctx.message.text
        // Обработка userReply
        console.log('User replied:', userReply)
        bot.session[chatId].waitingForReply = false
    }
})

// Функция для обработки команды /start
async function handleStartCommand(ctx) {
    const userId = ctx.message.chat.id
    const isRegistered = await checkRegistration(userId)
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
        const data = await fetchData(WEB_SERVICE_URL + '/user.php', params)
        if (data) handleApiResponse(ctx, data)
    } else {
        ctx.reply(messages.invalidData)
    }
}

// Функция для проверки регистрации пользователя
async function checkRegistration(chatId) {
    const data = await fetchData(WEB_SERVICE_URL + '/get_user_id.php')
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

// Инициализация бота
// const bot = new Telegraf(BOT_TOKEN)

bot.command('add_comment', handleAddComment)
bot.command('ref_comment', handleRefComment)

bot.command('start', handleStartCommand)
bot.command('reg', (ctx) =>
    ctx.reply(messages.enterData, { parse_mode: 'HTML' })
)
bot.on('text', handleTextCommand)

bot.command('add_comment', async (ctx) => {
    ctx.session.state = 'ADDING_COMMENT'
    ctx.reply('Пожалуйста, введите ваш комментарий.')
})

bot.command('ref_comment', async (ctx) => {
    ctx.session.state = 'REF_COMMENT'
    ctx.reply('Пожалуйста, введите ваш новый комментарий.')
})

bot.command('start', handleStartCommand)
bot.command('reg', (ctx) =>
    ctx.reply(messages.enterData, { parse_mode: 'HTML' })
)

bot.on('text', async (ctx) => {
    const text = ctx.message.text

    if (ctx.session.state === 'ADDING_COMMENT') {
        const id = 1
        const response = await sendNewComment(id, text)
        if (response && response.success) {
            ctx.reply(
                'Комментарий успешно добавлен.',
                Markup.inlineKeyboard([
                    Markup.button.callback('Принять', 'approve'),
                    Markup.button.callback('Отклонить', 'reject'),
                ])
            )
            ctx.session.state = 'AWAITING_APPROVAL'
        } else {
            ctx.reply('Не удалось добавить комментарий.')
        }
    } else if (ctx.session.state === 'REF_COMMENT') {
        const id = 1
        const response = await updateComment(id, text)
        if (response && response.success) {
            ctx.reply(
                'Комментарий успешно обновлен.',
                Markup.inlineKeyboard([
                    Markup.button.callback('Принять', 'approve'),
                    Markup.button.callback('Отклонить', 'reject'),
                ])
            )
            ctx.session.state = 'AWAITING_APPROVAL'
        } else {
            ctx.reply('Не удалось обновить комментарий.')
        }
    } else {
        handleTextCommand(ctx)
    }
})

bot.action('approve', (ctx) => {
    ctx.reply('Комментарий принят.')
    ctx.session.state = null
})

bot.action('reject', (ctx) => {
    ctx.reply('Комментарий отклонен.')
    ctx.session.state = null
})

bot.launch()

setInterval(notifyUsers, 10000)
