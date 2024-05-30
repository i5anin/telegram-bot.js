// Загрузка переменных среды из .env файла
import 'dotenv/config'
import { Telegraf } from 'telegraf'
import LocalSession from 'telegraf-session-local'
import io from '@pm2/io'

// включить отслеживание транзакций
// включить метрики веб-сервера (необязательно)
io.init({ transactions: true, http: true })

// Импорт модулей
import { initCronJobs } from '#src/modules/cron'
import { handleRegComment } from '#src/modules/reg'
import { payments } from '#src/modules/payments'
import { handleTextCommand } from '#src/modules/text'
// import { pingService } from '#src/modules/pingService';
import {
  handleHelpCommand,
  handleDocsCommand,
  handleOperatorCommand
} from '#src/modules/help'
import { oplataNotification } from '#src/modules/oplata'
import { notifyUsers, notifyAllUsers } from '#src/modules/notify'
import { handleStatusCommand, handleMsgCommand } from '#src/utils/admin'
import { logNewChatMembers, logLeftChatMember } from '#src/utils/log'
import { handleGetGroupInfoCommand } from '#src/utils/csv'
import { runBot } from '#src/modules/runBot'
import { handleForwardedMessage, whoCommand } from '#src/modules/who'
import { createMetric } from '#src/utils/metricPM2'
import {
  metricsNotificationDirector,
  formatMetricsMessageMaster,
  sendMetricsMessagesNach
} from '#src/modules/metrics'
import { handlePhoto } from '#src/modules/photo'

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

// Глобальные переменные
global.SECRET_KEY = process.env.SECRET_KEY
global.WEB_API = process.env.WEB_API

global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID

global.DIR_OPLATA = process.env.DIR_OPLATA
global.DIR_METRIC = process.env.DIR_METRIC
global.KISELEV = process.env.KISELEV

global.DIR_TEST_GROUP = process.env.DIR_TEST_GROUP
global.ADMIN_DB = process.env.ADMIN_DB

global.OPLATA_REPORT_ACTIVE = process.env.OPLATA_REPORT_ACTIVE // OPLATA_REPORT_ACTIVE = true;
global.METRICS_REPORT_ACTIVE = process.env.METRICS_REPORT_ACTIVE // METRICS_REPORT_ACTIVE = true;

global.MODE = process.env.NODE_ENV || 'development' // Если NODE_ENV не определен, по умолчанию используется 'development'
global.emoji = {
  x: '&#10060;',
  ok: '&#9989;',
  error: '&#10071;',
  warning: '&#x26A0;',
  bot: '&#129302;',
  star: '&#11088;',
  tech: '&#9881;',
  rating_1: '🥇',
  rating_2: '🥈',
  rating_3: '🥉',
  point: '&#183;'
  // point: '&#8226;', // •
  // min_point: '&#183;', // ·
} // ❌ //✅ //❗ //⚠ //🤖 //⭐ //⚙️ // 🥇 // 🥈 // 🥉 // • // ·

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

// Обработчик для фото с подписью
bot.on('photo', (ctx) => handlePhoto(ctx))

// Обработчики команд
bot.command(['start', 'reg'], (ctx) =>
  handleRegComment(ctx, (ctx.session.isAwaitFio = true))
) // ['start', 'reg']
bot.command('pay', (ctx) => payments(ctx)) // ['start', 'reg']
bot.command('new_comment', (ctx) =>
  notifyUsers(ctx, (ctx.session.isUserInitiated = true))
)
bot.command('new_comment_all', notifyAllUsers)
bot.command('help', handleHelpCommand)
bot.command('oplata', oplataNotification)
bot.command('msg', handleMsgCommand)
bot.command('status', (ctx) =>
  handleStatusCommand(ctx, instanceNumber, currentDateTime)
)
bot.command('get_group_info', (ctx) => handleGetGroupInfoCommand(ctx))
bot.command('who', (ctx) => whoCommand(ctx))
bot.command(['m', 'metrics'], (ctx) => metricsNotificationDirector(ctx, 1))
bot.command('metrics_director_notification', (ctx) =>
  metricsNotificationDirector(ctx, 0)
)
bot.command('metrics_nachalnic_notification', () => sendMetricsMessagesNach())
bot.command('metrics_master_notification', () => formatMetricsMessageMaster())
// bot.command('metrics_2', (ctx) => metricsNotificationProiz(ctx, 0))
// bot.command('metrics_old', metricsNotification)
bot.command('docs', (ctx) => handleDocsCommand(ctx))
bot.command('oper', (ctx) => handleOperatorCommand(ctx))

// bot.command('ping_test', pingService);

bot.on('message', (ctx) => handleTextCommand(ctx))
bot.on('text', (ctx) => handleTextCommand(ctx)) // особо не нужна но пусть будет

// Обработчик текстовых сообщений
bot.on('new_chat_members', logNewChatMembers)
bot.on('left_chat_member', logLeftChatMember)

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
