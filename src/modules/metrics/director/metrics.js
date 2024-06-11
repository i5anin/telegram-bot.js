const { fetchMetrics, checkUser } = require('#src/api/api')
const { sendToLog } = require('#src/utils/log')
const { formatMetricsMessage } = require('#src/utils/ru_lang')
const {
  formatNumber,
  getUserLinkById
} = require('#src/modules/sk_operator/helpers')

const { Markup } = require('telegraf')
const { sendLogData } = require('#src/api/api')

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
          `Failed to send message <code>${userId}</code>\n<code>${error}</code>`,
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
    // Handle any errors in the process
    console.error('Error fetching or sending metrics:', error)
    await bot.telegram.sendMessage(
      LOG_CHANNEL_ID,
      `Error fetching or sending metrics\n<code>${error}</code>`,
      { parse_mode: 'HTML' }
    )
  }
}

module.exports = {
  metricsNotificationDirector
}
