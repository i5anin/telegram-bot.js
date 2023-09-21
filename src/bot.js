// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')

// Импорт модулей
const { initCronJobs } = require('#src/modules/cron')
const { handleRegComment } = require('#src/modules/reg')
const { handleTextCommand } = require('#src/modules/text')
const { handleHelpCommand } = require('#src/modules/help')
const { oplataNotification } = require('#src/modules/oplata')
const { notifyUsers, notifyAllUsers } = require('#src/modules/notify')
const { handleStatusCommand, handleMsgCommand } = require('#src/utils/admin')
const { logNewChatMembers, logLeftChatMember } = require('#src/utils/log')
const { handleGetGroupInfoCommand } = require('#src/utils/csv')

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
    ctx.session.isUserInitiated = false
}


// Глобальные переменные
global.WEB_API = 'https://bot.pf-forum.ru/api'
global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID
global.SECRET_KEY = process.env.SECRET_KEY
global.DIR_OPLATA = process.env.DIR_OPLATA
global.OPLATA_GROUP = process.env.OPLATA_GROUP
global.OPLATA_REPORT_ACTIVE = process.env.OPLATA_REPORT_ACTIVE //OPLATA_REPORT_ACTIVE = true;
global.emoji = {
    x: '&#10060;', ok: '&#9989;',  //❌ //✅
    error: '&#10071;', warning: '&#x26A0;', //❗ //⚠️
}
global.bot = bot
global.stateCounter = {
    my: 0,
    message: 0,
    cronMessage: 0,
}


// Случайный номер экземпляра
const instanceNumber = Math.floor(Math.random() * 9000) + 1000
const currentDateTime = new Date().toLocaleString()
console.log(`! Номер запущенного экземпляра : ${instanceNumber} Время запуска [${currentDateTime}]`)
console.log('OPLATA_REPORT_ACTIVE =', OPLATA_REPORT_ACTIVE)
bot.telegram.sendMessage(LOG_CHANNEL_ID, `Запуск бота!\nНомер запущенного экземпляра: <code>${instanceNumber}</code>\nВремя запуска: <code>${currentDateTime}</code>`, { parse_mode: 'HTML' })

// Обработчики команд
bot.command(['start', 'reg'], async (ctx) => {
    resetFlags(ctx)
    await handleRegComment(ctx, ctx.session.isAwaitFio = true)
})

bot.command('new_comment', async (ctx) => {
    resetFlags(ctx)
    await notifyUsers(ctx, ctx.session.isUserInitiated = true)
})
bot.command('new_comment_all', async (ctx) => {
    resetFlags(ctx)
    await notifyAllUsers(ctx)
})

bot.command('help', handleHelpCommand)
bot.command('oplata', oplataNotification)
bot.command('msg', async (ctx) => handleMsgCommand(ctx))
bot.command('status', (ctx) => handleStatusCommand(ctx, instanceNumber, currentDateTime))
bot.command('get_group_info', handleGetGroupInfoCommand)


// Обработчик текстовых сообщений
bot.on('text', handleTextCommand)

bot.on('new_chat_members', logNewChatMembers)
bot.on('left_chat_member', logLeftChatMember)

// Запуск бота
bot.launch().catch((err) => console.error('Fatal Error! Error while launching the bot:', err))

// Инициализация cron-заданий
initCronJobs()
