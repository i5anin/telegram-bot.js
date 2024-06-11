// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
const io = require('@pm2/io')
const puppeteer = require('puppeteer')

// включить отслеживание транзакций
// включить метрики веб-сервера (необязательно)
io.init({ transactions: true, http: true })

// Импорт модулей
const { initCronJobs } = require('#src/modules/cron')
const { handleRegComment } = require('#src/modules/reg')
const { payments } = require('#src/modules/payments')
const { handleTextCommand } = require('#src/modules/text')
// const { pingService } = require('#src/modules/pingService')
const { handleDocsCommand } = require('#src/modules/links/docs/docs')
const { handleHelpCommand } = require('#src/modules/help/help')
const { handleOperatorCommand } = require('#src/modules/links/oper/oper')
const { tableMetrics } = require('#src/modules/metrics/metrics_btn')
const { oplataNotification } = require('#src/modules/oplata')
const { notifyUsers, notifyAllUsers } = require('#src/modules/notify')
const { handleStatusCommand, handleMsgCommand } = require('#src/utils/admin')
const { logNewChatMembers, logLeftChatMember } = require('#src/utils/log')
const { handleGetGroupInfoCommand } = require('#src/utils/csv')
const { runBot } = require('#src/modules/runBot')
const { handleForwardedMessage, whoCommand } = require('#src/modules/who')
const { createMetric } = require('#src/utils/metricPM2')
const {
  metricsNotificationDirector,
  formatMetricsMessageMaster,
  sendMetricsMessagesNach
} = require('#src/modules/metrics/director/metrics')
const { handlePhoto } = require('#src/modules/photo')
const { checkingGroup } = require('#src/modules/checkingGroup/checkingGroup')
const { sendLogData } = require('#src/api/index')

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

// bot.on('message', (ctx) => {
//   console.log('message')
//   // Получение информации о группе или канале
//   const chatId = ctx.chat.id
//
//   // Получение количества пользователей
//   fetch(
//     `https://api.telegram.org/bot${BOT_TOKEN}/getChatMembersCount?chat_id=${chatId}`
//   )
//     .then((response) => response.json())
//     .then((data) => {
//       if (data.ok) {
//         const count = data.result
//
//         // Получение названия группы
//         fetch(
//           `https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${chatId}`
//         )
//           .then((response) => response.json())
//           .then((data) => {
//             if (data.ok) {
//               const title = data.result.title
//               console.log(
//                 `Название группы: ${title}, Количество пользователей: ${count}`
//               )
//             } else {
//               console.error('Ошибка получения названия группы', data)
//             }
//           })
//           .catch((error) => {
//             console.error('Ошибка запроса:', error)
//           })
//       } else {
//         console.error('Ошибка получения количества пользователей', data)
//       }
//     })
//     .catch((error) => {
//       console.error('Ошибка запроса:', error)
//     })
//
//   // Вызов обработчика текста, если это нужно
//   handleTextCommand(ctx)
// })

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
bot.command('pay', (ctx) => payments(ctx))

// bot.command('pay', (ctx) => onMaintenance(ctx))
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

bot.command('list', (ctx) => {
  const searchTerm = ctx.message.text.split(' ')[1]
  // Проверка наличия поискового запроса
  if (!searchTerm) {
    ctx.reply('Введите поисковый запрос после команды /list')
    return
  }

  fetch(`${WEB_API}/users/find_list.php?search_term=${searchTerm}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'OK') {
        // Обработка результатов поиска
        const users = data.data
        if (users.length === 0) {
          ctx.reply('Пользователей не найдено.')
        } else {
          // Разбиваем пользователей на группы по 50
          const chunks = chunkArray(users, 50)

          // Отправляем сообщения с пользователями
          chunks.forEach((chunk, index) => {
            // Формирование сообщения
            let message = `Найденные пользователи (часть ${index + 1}):\n`
            chunk.forEach((user) => {
              message += `\n<a href='tg://user?id=${user.user_id}'>${user.fio}</a> ${user.username ? `(@${user.username})` : ''} - ${user.post}`
            })

            // Отправка сообщения
            ctx.reply(message, { parse_mode: 'HTML' })
          })
        }
      } else {
        ctx.reply('Ошибка поиска.')
      }
    })
    .catch((error) => {
      console.error('Ошибка запроса:', error)
      ctx.reply('Произошла ошибка. Попробуйте позже.')
    })
})

bot.command('list_test_otk_marh', (ctx) => checkingGroup(ctx))

bot.command('get_website_screenshot', async (ctx) => {
  try {
    const websiteUrl = ctx.message.text.split(' ')[1] // Получаем URL сайта из сообщения
    if (!websiteUrl) {
      ctx.reply('Введите URL сайта после команды /get_website_screenshot')
      return
    }

    const browser = await puppeteer.launch() // Запускаем браузер
    const page = await browser.newPage() // Создаем новую вкладку
    await page.goto(websiteUrl) // Открываем сайт
    await page.setViewport({ width: 1920, height: 1080 }) // Устанавливаем размер области скриншота
    const screenshot = await page.screenshot({ type: 'png', fullPage: true }) // Делаем скриншот
    await browser.close() // Закрываем браузер

    await ctx.replyWithPhoto({ source: screenshot }) // Отправляем скриншот
  } catch (error) {
    console.error('Ошибка при получении скриншота:', error)
    ctx.reply('Произошла ошибка. Попробуйте позже.')
  }
})

bot.command('mbth', async (ctx) => tableMetrics(ctx))

bot.command('mjpg', async (ctx) => {
  try {
    const websiteUrl = `${WEB_API}metrics/web.php?key=SecretKeyPFForum23`

    const browser = await puppeteer.launch() // Запускаем браузер
    const page = await browser.newPage() // Создаем новую вкладку
    await page.goto(websiteUrl) // Открываем сайт
    await page.setViewport({ width: 438, height: 667 }) // Устанавливаем размер области скриншота
    console.log('before waiting')
    await delay(4000) // Ожидание 4 секунд
    console.log('after waiting')
    const screenshot = await page.screenshot({ type: 'png', fullPage: true }) // Делаем скриншот
    await browser.close() // Закрываем браузер

    await ctx.replyWithPhoto({ source: screenshot }) // Отправляем скриншот
  } catch (error) {
    console.error('Ошибка при получении скриншота:', error)
    ctx.reply('Произошла ошибка. Попробуйте позже.')
  }
})

// Функция для разбивки массива на части
function chunkArray(array, chunkSize) {
  const result = []
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize))
  }
  return result
}

function onMaintenance(ctx) {
  // Отправляем пользователю сообщение
  ctx.reply('❌ Функция временно недоступна и находится на доработке.')
}

// bot.command('ping_test', pingService);

bot.on('message', (ctx) => handleTextCommand(ctx))
bot.on('text', (ctx) => handleTextCommand(ctx)) // особо не нужна но пусть будет

// Обработчик текстовых сообщений
bot.on('new_chat_members', logNewChatMembers)
bot.on('left_chat_member', logLeftChatMember)

// Запуск бота
bot.launch().catch(async (err) => {
  console.error('Fatal Error! Error while launching the bot:', err)
  const logMessageToSend = {
    user_id: '',
    text: err.toString(),
    error: 1,
    ok: 0,
    test: process.env.NODE_ENV === 'build' ? 0 : 1
  }
  await sendLogData(logMessageToSend)
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
