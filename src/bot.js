// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
const axios = require('axios')

// Импорт модулей
const { initCronJobs } = require('#src/modules/cron')
const { handleRegComment } = require('#src/modules/reg')
const { handleTextCommand } = require('#src/modules/text')
const { handleHelpCommand } = require('#src/modules/help')
const { oplataNotification } = require('#src/modules/oplata')
const { notifyUsers, notifyAllUsers } = require('#src/modules/notify')
const { handleStatusCommand, handleMsgCommand } = require('#src/utils/admin')
const { logNewChatMembers, logLeftChatMember, sendToLog } = require('#src/utils/log')
const { handleGetGroupInfoCommand } = require('#src/utils/csv')
const { runBot } = require('#src/modules/run')
const { handleForwardedMessage, whoCommand } = require('#src/modules/who')

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


// Глобальные переменные
global.WEB_API = 'https://bot.pf-forum.ru/api'
global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID
global.SECRET_KEY = process.env.SECRET_KEY
global.DIR_OPLATA = process.env.DIR_OPLATA
global.OPLATA_GROUP = process.env.OPLATA_GROUP
global.OPLATA_REPORT_ACTIVE = process.env.OPLATA_REPORT_ACTIVE //OPLATA_REPORT_ACTIVE = true;
global.MODE = process.env.NODE_ENV || 'development'  // Если NODE_ENV не определен, по умолчанию используется 'development'
global.emoji = {
    x: '&#10060;', ok: '&#9989;',  //❌ //✅
    error: '&#10071;', warning: '&#x26A0;', //❗ //⚠️
    bot: '&#129302;',
}
global.bot = bot
global.stateCounter = {
    bot_update: 0,
    bot_check: 0,

    user_get_all: 0,
    user_get_all_fio: 0,
    user_add: 0,  // user_update: 0,

    comment_get_all: 0,
    comment_update: 0,

    oplata_get_all: 0,
    oplata_update: 0,
}

// Случайный номер экземпляра
const instanceNumber = Math.floor(Math.random() * 9000) + 1000
const currentDateTime = new Date()

runBot(instanceNumber, currentDateTime)
// Обработчики команд
bot.command(['start', 'reg'], (ctx) => handleRegComment(ctx, ctx.session.isAwaitFio = true))
bot.command('new_comment', (ctx) => notifyUsers(ctx))
bot.command('new_comment_all', notifyAllUsers)
bot.command('help', handleHelpCommand)
bot.command('oplata', oplataNotification)
bot.command('msg', handleMsgCommand)
bot.command('status', (ctx) => handleStatusCommand(ctx, instanceNumber, currentDateTime))
bot.command('get_group_info', (ctx) => handleGetGroupInfoCommand(ctx))
bot.command('who', (ctx) => whoCommand(ctx))

bot.on('text', (ctx) => handleTextCommand(ctx))
bot.on('message', (ctx) => handleForwardedMessage(ctx))

// Обработчик текстовых сообщений

bot.on('new_chat_members', logNewChatMembers)
bot.on('left_chat_member', logLeftChatMember)

// Запуск бота
bot.launch().catch((err) => {
    console.error('Fatal Error! Error while launching the bot:', err)
    setTimeout(() => bot.launch(), 30000) // Попробовать перезапустить через 30 секунд
})

// Инициализация cron-заданий
initCronJobs(currentDateTime, instanceNumber)
