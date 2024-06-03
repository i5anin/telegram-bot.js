// const moment = require('moment')
const {
  fetchMetrics,
  checkUser,
  getMetricsMaster,
  getMetricsNach
} = require('#src/api/index')
const { sendToLog } = require('#src/utils/log')
const {
  formatMetricsMessage,
  formatMetricsMessageNach,
  formatMetricsVoronca
} = require('#src/utils/ru_lang')
const { formatNumber, getUserLinkById } = require('#src/utils/helpers')
const moment = require('moment')
const { Markup } = require('telegraf')

function getMaxCharacters(latestMetrics) {
  const percentageValues = [
    latestMetrics.prod,
    latestMetrics.cumulative_brak_month,
    latestMetrics.cumulative_manager_month,
    latestMetrics.sles,
    latestMetrics.otk,
    latestMetrics.upk
  ]
  let maxCharacters = 0
  for (let value of percentageValues) {
    let characters = formatNumber(value).length + 1 // +1 для знака процента
    if (characters > maxCharacters) maxCharacters = characters
  }
  return maxCharacters
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// DIR_METRIC 7:30
// DIR_OPLATA 7:00

async function metricsNotificationDirector(ctx = null, index = 0, userId) {
  try {
    // Извлеч данные метрик
    const metrics = await fetchMetrics()
    if (metrics.length === 0 || !metrics[index])
      throw new Error('No metrics data available')

    // Обработайте полученные показатели
    const latestMetrics = metrics[index]
    const maxCharacters = getMaxCharacters(latestMetrics)
    const message = formatMetricsMessage(latestMetrics, maxCharacters)

    // Создаем кнопку с ссылкой на бота
    const botLinkButton = Markup.button.url(
      'Web метрики',
      'https://t.me/pfforum_bot/metrics'
    )

    // Логика для случаев, когда индекс равен 1
    if (index === 1) {
      // Send logs if necessary
      await sendToLog(ctx)
      const chatId = ctx.chat.id // Retrieve chatId from the context
      const userCheck = await checkUser(chatId) // Check the user

      // Проверка разрешений пользователя
      if (
        !userCheck.exists ||
        (userCheck.role !== 'admin' && userCheck.role !== 'dir')
      ) {
        console.error(`Пользователь ${chatId} не имеет необходимых разрешений.`)
        return // Return early if the user lacks necessary permissions
      }

      // Отправьте ответ пользователю и зарегистрируйте действие
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[botLinkButton]] // Добавляем кнопку в разметку сообщения
        }
      })
      await bot.telegram.sendMessage(
        LOG_CHANNEL_ID,
        (await getUserLinkById(ctx.chat.id)) + '\n' + message,
        { parse_mode: 'HTML' }
      )
    } else {
      // Отправить сообщение непосредственно указанному идентификатору пользователя
      try {
        await bot.telegram.sendMessage(userId, message, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[botLinkButton]] // Добавляем кнопку в разметку сообщения
          }
        })
        await bot.telegram.sendMessage(
          LOG_CHANNEL_ID,
          (await getUserLinkById(userId)) + '\n' + message,
          { parse_mode: 'HTML' }
        )
        console.log('Metrics Message sent successfully to userId:', userId)
      } catch (error) {
        console.error(
          'Failed to send message to userId:',
          userId,
          'Error:',
          error
        )
        await bot.telegram.sendMessage(
          LOG_CHANNEL_ID,
          `Failed to send message <code>${userId}</code>\n<code>${error}</code>`,
          { parse_mode: 'HTML' }
        )
      }
    }
  } catch (error) {
    // Handle any errors in the process
    console.error('Error fetching or sending metrics:', error)
    await bot.telegram.sendMessage(
      LOG_CHANNEL_ID,
      `Error fetching or sending metrics\n<code>${error}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

function getPeriod(date_from, date_to) {
  const from = moment(date_from, 'YYYY-MM-DD HH:mm:ss')
  const to = moment(date_to, 'YYYY-MM-DD HH:mm:ss')

  if (from.isSame(to, 'day')) {
    return 'день'
  } else if (from.isSame(to.clone().subtract(1, 'day'), 'day')) {
    return 'ночь'
  } else {
    return 'месяц'
  }
}

async function sendMetricsMessagesNach() {
  try {
    const metricsNachData = await getMetricsNach()
    console.log('Metrics nach data:', metricsNachData)

    if (!Array.isArray(metricsNachData.metrics_nach)) {
      throw new Error('Metrics nach data is not an array')
    }

    // Объединяем данные по user_id
    const metricsById = metricsNachData.metrics_nach.reduce((acc, metrics) => {
      if (!acc[metrics.user_id]) {
        acc[metrics.user_id] = []
      }
      acc[metrics.user_id].push(metrics)
      return acc
    }, {})

    for (const [userId, userMetrics] of Object.entries(metricsById)) {
      const userCheck = await checkUser(userId) // replace 'SecretKey' with your actual secret key

      if (!userCheck.exists) {
        console.error(`User ${userId} does not exist.`)
        continue
      }

      let messages = []
      switch (userCheck.role) {
        case 'nach_frez':
        case 'nach_toc':
          // Обрабатываем все метрики для данного user_id
          for (const metrics of userMetrics) {
            const period = getPeriod(metrics.date_from, metrics.date_to)
            const message = formatMetricsMessageNach(metrics, period)
            messages.push(message)
          }
          break
        default:
          console.error(
            `User ${userId} has an unsupported role: ${userCheck.role}`
          )
          continue
      }

      await sleep(1000)

      try {
        // Объединяем все сообщения в одно и отправляем его
        const combinedMessage = messages.join('\n\n')
        const metrics = await fetchMetrics()
        if (metrics.length === 0 || !metrics[0])
          throw new Error('No metrics data available')
        const latestMetrics = metrics[0]
        const maxCharacters = 4 // безопасный отступ для процентов
        const message =
          combinedMessage +
          '\n\n' +
          formatMetricsVoronca(latestMetrics, maxCharacters)
        await bot.telegram.sendMessage(userId, combinedMessage, {
          parse_mode: 'HTML'
        }) // TODO: отправка пользовтелю
        await bot.telegram.sendMessage(
          LOG_CHANNEL_ID,
          (await getUserLinkById(userId)) + '\n' + message,
          { parse_mode: 'HTML' }
        )
        console.log('Metrics message sent successfully to userId:', userId)
      } catch (error) {
        console.error(
          'Failed to send message to userId:',
          userId,
          'Error:',
          error
        )
        await bot.telegram.sendMessage(
          LOG_CHANNEL_ID,
          `Не удалось отправить сообщение <code>${userId}</code>\n<code>${error}</code>`,
          { parse_mode: 'HTML' }
        )
      }
    }
  } catch (error) {
    console.error('Error in sendMetricsMessagesNach:', error)
    throw error
  }
}

// Функция для отправки сообщений начальникам производства
async function metricsNotificationProiz() {
  await sendMetricsMessagesNach()
  await formatMetricsMessageMaster()
}

async function formatMetricsMessageMaster() {
  try {
    const metricsMasterData = await getMetricsMaster()

    console.log('Metrics master data:', metricsMasterData)

    if (!Array.isArray(metricsMasterData.metrics_master)) {
      throw new Error('Metrics master data is not an array')
    }

    for (const metrics of metricsMasterData.metrics_master) {
      let brakInfo = ''
      if (metrics.kpi_brak === 0) {
        brakInfo = 'отсутствует'
      } else if (metrics.kpi_brak > 0 && metrics.kpi_brak < 0.01) {
        brakInfo = 'меньше 0.01'
      } else {
        brakInfo = `${metrics.kpi_brak.toFixed(2)}`
      }

      const medalEmoji = getMedalEmoji(metrics.rating_pos) // Получаем медальку
      const message =
        `Смена: ${metrics.smena}\n` +
        `${medalEmoji} <u><b>Место в рейтинге: ${metrics.rating_pos}</b></u>\n` + // Добавляем медальку к сообщению
        `<b>ЦКП:</b> <code>${metrics.kpi.toFixed(2)}</code>\n` +
        `<b>Брак:</b> <code>${brakInfo}</code>`

      await sleep(1000)

      try {
        // if (medalEmoji !== '•') await bot.telegram.sendMessage(metrics.user_id, medalEmoji, { disable_notification: true }) //user
        await bot.telegram.sendMessage(metrics.user_id, message, {
          parse_mode: 'HTML'
        }) // TODO: отправка пользовтелю

        // if (medalEmoji !== '•') await bot.telegram.sendMessage(LOG_CHANNEL_ID, medalEmoji, { disable_notification: true }) //log
        await bot.telegram.sendMessage(
          LOG_CHANNEL_ID,
          (await getUserLinkById(metrics.user_id)) + '\n' + message,
          { parse_mode: 'HTML' }
        ) //log

        console.log(
          'Metrics message sent successfully to userId:',
          metrics.user_id
        )
      } catch (error) {
        console.error(
          'Failed to send message to userId:',
          metrics.user_id,
          'Error:',
          error
        )
        await bot.telegram.sendMessage(
          LOG_CHANNEL_ID,
          `Не удалось отправить сообщение <code>${metrics.user_id}</code>\n<code>${error}</code>`,
          { parse_mode: 'HTML' }
        )
      }
    }
  } catch (error) {
    console.error('Error formatting metrics master message:', error)
    return 'Error formatting metrics master message'
  }
}

function getMedalEmoji(position) {
  switch (position) {
    case 1:
      return emoji.rating_1 // Золотая медаль
    case 2:
      return emoji.rating_2 // Серебряная медаль
    case 3:
      return emoji.rating_3 // Бронзовая медаль
    default:
      return emoji.point // Маркер списка
  }
}

module.exports = {
  metricsNotificationDirector,
  metricsNotificationProiz,
  formatMetricsMessageMaster,
  sendMetricsMessagesNach
}
