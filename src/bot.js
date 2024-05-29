//bot.js главный фаил как app или index
// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
const { setupCommands } = require('./commands')
const io = require('@pm2/io')

io.init({ transactions: true, http: true })
const { runBot } = require('#src/modules/runBot')
const { setupGlobal } = require('#src/globals')

// Конфигурационные переменные
const { BOT_TOKEN } = process.env

// Инициализация Telegraf бота
const bot = new Telegraf(BOT_TOKEN)

// Инициализация сессии
const localSession = new LocalSession({ database: 'session.json' })
bot.use(localSession.middleware())

// Сессионный middleware
bot.use((ctx, next) => {
  ctx.session = ctx.session || {
    isAwaitFio: false,
    isAwaitComment: false,
    isUserInitiated: false
  }
  return next()
})

setupGlobal()
runBot(stateCounter)
setupCommands(bot)

// Запуск бота
bot.launch().catch((err) => {
  console.error('Fatal Error! Error while launching the bot:', err)
  setTimeout(() => bot.launch(), 30000) // Попробовать перезапустить через 30 секунд
})
