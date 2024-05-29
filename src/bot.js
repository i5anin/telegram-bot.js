// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
const { setupCommands } = require('./commands')
const io = require('@pm2/io')

// включить отслеживание транзакций
// включить метрики веб-сервера (необязательно)
io.init({ transactions: true, http: true })

// Импорт модулей
const { initCronJobs } = require('#src/modules/cron')

// const { pingService } = require('#src/modules/pingService')

const { runBot } = require('#src/modules/runBot')
const { handleForwardedMessage } = require('#src/modules/who')
const { createMetric } = require('#src/utils/metricPM2')

const { setupGloal } = require('#src/globals')

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
    isUserInitiated: false
  }
  return next()
})

global.bot = bot
global.stateCounter = {
  bot_update: 0,
  bot_check: 0,

  user_get_all: 0,
  users_get: 0,
  users_get_all_fio: 0,
  users_add: 0,

  comment_get_all: 0,
  comment_update: 0,

  oplata_get_all: 0,
  oplata_update: 0,

  instanceNumber: 0 // для метрики
}

setupGloal()

module.exports = { stateCounter }

// Случайный номер экземпляра
const instanceNumber = Math.floor(Math.random() * 9000) + 1000
const currentDateTime = new Date()
stateCounter.instanceNumber = instanceNumber // для метрики

bot.use((ctx, next) => {
  if (ctx.message) {
    if (ctx.message.forward_from) {
      handleForwardedMessage(ctx, ctx.message.forward_from.id) // Если сообщение переслано и sender разрешил связывание
      return
    }
    if (ctx.message.forward_sender_name) {
      handleForwardedMessage(ctx, ctx.message.forward_sender_name) // Если сообщение переслано, но sender запретил связывание
      return
    }
  }
  return next() // Если сообщение не переслано или не содержит команды, передаем обработку следующему middleware
})

runBot(instanceNumber, currentDateTime)

setupCommands(bot)

// Запуск бота
bot.launch().catch((err) => {
  console.error('Fatal Error! Error while launching the bot:', err)
  setTimeout(() => bot.launch(), 30000) // Попробовать перезапустить через 30 секунд
})

createMetric('bot_check', stateCounter, 'bot_check')
createMetric('user_get_all', stateCounter, 'user_get_all')
createMetric('users_get_all_fio', stateCounter, 'users_get_all_fio')
createMetric('user_add', stateCounter, 'user_add')
createMetric('users_get', stateCounter, 'users_get')
createMetric('comment_get_all', stateCounter, 'comment_get_all')
createMetric('comment_update', stateCounter, 'comment_update')
createMetric('oplata_get_all', stateCounter, 'oplata_get_all')
createMetric('oplata_update', stateCounter, 'oplata_update')
createMetric('instanceNumber', stateCounter, 'instanceNumber')

// Инициализация cron-заданий
initCronJobs(currentDateTime, instanceNumber)
