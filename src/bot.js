// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')

// Импорт модулей
const axios = require('axios')
const { handleTextCommand } = require('#src/modules/text')
const { handleRegComment } = require('#src/modules/reg')
const { notifyUsers, notifyAllUsers } = require('#src/modules/notify')
const { handleAddComment } = require('#src/modules/comment')
const { handleStatusCommand, handleMsgCommand } = require('#src/utils/admin')
const { handleHelpCommand } = require('#src/modules/help') // Добавлени
const { initCronJobs } = require('#src/modules/cron') // Добавлени
const { oplataNotification } = require('#src/modules/oplata') // Добавлени

// Конфигурационные переменные
const { BOT_TOKEN } = process.env

// Инициализация Telegraf бота
const bot = new Telegraf(BOT_TOKEN)

// Инициализация сессии
const localSession = new LocalSession({ database: 'session_db.json' })
bot.use(localSession.middleware())

// Сессионный middleware
bot.use((ctx, next) => {
    ctx.session = ctx.session || {
        isAwaitFio: false,
        isAwaitComment: false,
        userInitiated: false,
    }
    return next()
})

// Функция для сброса флагов сессии
function resetFlags(ctx) {
    ctx.session.isAwaitFio = false
    ctx.session.isAwaitComment = false
    ctx.session.userInitiated = false
}


// Глобальные переменные
global.WEB_API = 'https://bot.pf-forum.ru/api'
global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID
global.SECRET_KEY = process.env.SECRET_KEY
global.DIR_OPLATA = process.env.DIR_OPLATA
global.bot = bot
global.stateCounter = {
    my: 0,
    message: 0,
    cronMessage: 0,
}


// Случайный номер экземпляра
const instanceNumber = Math.floor(Math.random() * 100) + 1
console.log('! Номер запущенного экземпляра : ' + instanceNumber)

// Обработчики команд
bot.command(['start', 'reg'], async (ctx) => {
    try {
        resetFlags(ctx)
        await handleRegComment(ctx, ctx.session.isAwaitFio = true)
    } catch (error) {
        console.error('Error in handleRegComment:', error)
    }
})

bot.command('new_comment', async (ctx) => {
    resetFlags(ctx)
    await notifyUsers(ctx)
})
bot.command('new_comment_all', async (ctx) => {
    resetFlags(ctx)
    // Здесь загрузка всех сессий из вашего хранилища
    const allSessions = localSession.DB  // Этот код нужно адаптировать

    // console.log('Type of allSessions:', typeof allSessions);
    // console.log('allSessions:', allSessions);

    if (allSessions && Array.isArray(allSessions.sessions)) {
        // Обновление флага для каждой сессии
        for (const session of allSessions.sessions) {
            session.data.isAwaitComment = true
        }
        // Сохранение изменений в хранилище (если это необходимо)
        await notifyAllUsers(ctx)
    } else {
        console.error('Sessions are not available or not iterable.')
    }
})

bot.command('status', (ctx) => handleStatusCommand(ctx, instanceNumber))
bot.command('help', handleHelpCommand)
bot.command('oplata', oplataNotification)
bot.command('msg', async (ctx) => handleMsgCommand(ctx))

const getExternalUsers = async () => {
    try {
        const response = await axios.get('https://bot.pf-forum.ru/api/users/get_all_fio.php')
        return response.data.users_data
    } catch (error) {
        console.error('Ошибка при получении данных с внешнего API:', error)
        return []
    }
}

async function sendMessage(ctx, chatId, messageText) {
    if (!messageText || messageText.trim() === '') {
        console.warn('Cannot send empty message')
        return
    }

    try {
        await ctx.telegram.sendMessage(chatId, messageText)
    } catch (error) {
        console.error(`Error sending message to chat_id: ${chatId}`, error)
    }
}

async function generateReport(ctx, chatId) {
    const chatInfo = await ctx.telegram.getChat(chatId)
    const externalUsers = await getExternalUsers()

    await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Отчет для группы <code>${chatInfo.title}</code> (ID: ${chatId})`, { parse_mode: 'HTML' })

    let counter = 0
    let inGroupCounter = 0
    let absentCounter = 0
    let reportBatch = []
    let absentUsersBatch = []

    for (const user of externalUsers) {
        counter++
        try {
            const telegramUser = await ctx.telegram.getChatMember(chatId, user.user_id)
            inGroupCounter++

            const userInfo = `${inGroupCounter}. username: ${'@' + telegramUser.user.username || ''}\n` +
                `id: <code>${telegramUser.user.id}</code>\n` +
                `firstname: <code>${telegramUser.user.first_name}</code>\n` +
                `lastname: <code>${telegramUser.user.last_name || ''}</code>\n` +
                `---\n`

            reportBatch.push(userInfo)
        } catch (error) {
            absentCounter++
            absentUsersBatch.push(`${absentCounter}. id <code>${user.user_id}</code> <code>${user.fio}</code> - отсутствует`)
        }

        // Send every 10 present users
        if (reportBatch.length === 10) {
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, reportBatch.join(''), { parse_mode: 'HTML' })
            reportBatch = []
        }

        // Send every 10 absent users
        if (absentUsersBatch.length === 10) {
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Отчет об отсутствующих пользователях:\n` + absentUsersBatch.join('\n-----------------\n'), { parse_mode: 'HTML' })
            absentUsersBatch = []
        }
    }

    // Send remaining users if any
    if (reportBatch.length > 0) {
        await bot.telegram.sendMessage(LOG_CHANNEL_ID, reportBatch.join(''), { parse_mode: 'HTML' })
    }
    if (absentUsersBatch.length > 0) {
        await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Отчет об отсутствующих пользователях:\n` + absentUsersBatch.join('\n-----------------\n'), { parse_mode: 'HTML' })
    }
}


bot.command('get_group_info', async (ctx) => {
    if (ctx.from.id.toString() !== GRAND_ADMIN) {
        return ctx.reply('Только GRAND_ADMIN может использовать данную команду.')
    }

    const input = ctx.message.text.split(' ')

    if (input.length !== 2) {
        return ctx.reply('Использование: /get_group_info [chat_id]')
    }

    const chatId = input[1]
    await generateReport(ctx, chatId)
})


// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {

    await handleTextCommand(ctx)
    // await handleAddComment(ctx)
})

// Запуск бота
bot.launch()
    .catch((err) => {
        console.error('Fatal Error! Error while launching the bot:', err)
    })

// Инициализация cron-заданий
initCronJobs()
