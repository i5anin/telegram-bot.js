const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)

// Подключаем сессионное хранилище
const localSession = new LocalSession({ database: 'session_db.json' })
bot.use(localSession.middleware())

// Инициализация сессии
bot.use((ctx, next) => {
    ctx.session = ctx.session || { counter: 0 }
    return next()
})

const MESSAGES = {
    INIT: 'Счетчик инициализирован',
    ADD: 'Счетчик увеличен:',
    SUBTRACT: 'Счетчик уменьшен:',
    GET: 'Текущее значение счетчика:',
}

// Инициализируем состояние при старте диалога
bot.command('start', (ctx) => {
    ctx.session.counter = 0
    ctx.reply(MESSAGES.INIT)
})

// Используем состояние в обработчиках
bot.command('add', (ctx) => {
    ctx.session.counter++
    ctx.reply(`${MESSAGES.ADD} ${ctx.session.counter}`)
})

bot.command('subtract', (ctx) => {
    ctx.session.counter--
    ctx.reply(`${MESSAGES.SUBTRACT} ${ctx.session.counter}`)
})

bot.command('get', (ctx) => {
    ctx.reply(`${MESSAGES.GET} ${ctx.session.counter}`)
})

bot.launch()
