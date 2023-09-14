// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')

// Импорт модулей
const { handleTextCommand } = require('#src/modules/text')
const { handleRegComment } = require('#src/modules/reg')
const { notifyUsers } = require('#src/modules/notify')
const { handleAddComment } = require('#src/modules/comment')
const { handleStatusCommand } = require('#src/utils/log')
const { handleHelpCommand } = require('#src/modules/help') // Добавлени
const { morningNotification, initCronJobs } = require('#src/modules/cron') // Добавлени

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
global.USER_API = 'https://bot.pf-forum.ru/api/users'
global.COMMENT_API = 'https://bot.pf-forum.ru/api/comment'
global.OPLATA_API = 'https://bot.pf-forum.ru/api/oplata'
global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID
global.SECRET_KEY = process.env.SECRET_KEY
global.bot = bot
global.stateCounter = {
    my: 0,
    message: 0,
    cronMessage: 0,
}


// Случайный номер экземпляра
const instanceNumber = Math.floor(Math.random() * 100) + 1
console.log('instanceNumber : ' + instanceNumber)

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
bot.command('status', (ctx) => handleStatusCommand(ctx, instanceNumber))
bot.command('help', handleHelpCommand)

bot.command('oplata', morningNotification)


// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {
    await handleTextCommand(ctx)
    await handleAddComment(ctx)
})

// Запуск бота
bot.launch()
    .catch((err) => {
        console.error('Error while launching the bot:', err)
    })

// Инициализация cron-заданий
initCronJobs()
