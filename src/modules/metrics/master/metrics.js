const { getMetricsMaster } = require('#src/api')
const { getUserLinkById } = require('#src/utils/helpers')
const { sendLogData } = require('#src/api')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
    const logMessageToSend = {
      user_id: '',
      text: error.toString(),
      error: 1,
      ok: 0,
      test: process.env.NODE_ENV === 'build' ? 0 : 1
    }
    await sendLogData(logMessageToSend)
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
  formatMetricsMessageMaster
}
