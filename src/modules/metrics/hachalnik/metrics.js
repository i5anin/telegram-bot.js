const { fetchMetrics, checkUser, getMetricsNach } = require('#src/api')
const {
  formatMetricsMessageNach,
  formatMetricsVoronca
} = require('#src/utils/ru_lang')
const { getUserLinkById } = require('#src/utils/helpers')
const moment = require('moment')

const { sendLogData } = require('#src/api')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
        const logMessageToSend = {
          user_id: '',
          text: error.toString(),
          error: 1,
          ok: 0,
          test: process.env.NODE_ENV === 'build' ? 0 : 1
        }
        await sendLogData(logMessageToSend)
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
    const logMessageToSend = {
      user_id: '',
      text: error.toString(),
      error: 1,
      ok: 0,
      test: process.env.NODE_ENV === 'build' ? 0 : 1
    }
    await sendLogData(logMessageToSend)
    console.error('Error in sendMetricsMessagesNach:', error)
    throw error
  }
}

module.exports = {
  sendMetricsMessagesNach
}
