const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)

// Подключаем сессионное хранилище
const localSession = new LocalSession({ database: 'session_db.json' })
bot.use(localSession.middleware())

// Инициализируем состояние при старте диалога
bot.command('start', (ctx) => {
    ctx.session = ctx.session || {}
    ctx.session.counter = 0
    ctx.reply('Счетчик инициализирован')
})

// Используем состояние в обработчиках
bot.command('add', (ctx) => {
    ctx.session = ctx.session || {}
    ctx.session.counter++
    ctx.reply(`Счетчик увеличен: ${ctx.session.counter}`)
})

bot.command('subtract', (ctx) => {
    ctx.session = ctx.session || {}
    ctx.session.counter--
    ctx.reply(`Счетчик уменьшен: ${ctx.session.counter}`)
})

bot.command('get', (ctx) => {
    ctx.session = ctx.session || {}
    ctx.reply(`Текущее значение счетчика: ${ctx.session.counter}`)
})

bot.launch()
