const axios = require('axios')
const ruLang = require('#src/utils/ru_lang') // Локализация сообщений
const { checkUser } = require('#src/api/index')
const { sendLogData } = require('#src/api/index')

// Функция для получения последнего платежа пользователя
async function getLastPaymentForUser(userId, date) {
  try {
    const response = await axios.get(
      `${WEB_API}/payments/payments.php?user_id=${userId}&date=${date}`
    )
    const { payments } = response.data
    return payments[payments.length - 1] || null
  } catch (error) {
    const logMessageToSend = {
      user_id: userId.toString(),
      text: error.toString(),
      error: 1,
      ok: 0,
      test: process.env.NODE_ENV === 'build' ? 0 : 1
    }
    await sendLogData(logMessageToSend)
    console.error(`Ошибка при запросе к API: ${error}`)
    return null
  }
}

// Основная функция для обработки команды
async function payments(ctx) {
  try {
    const userId = ctx.message.from.id // Получаем userId вызвавшего пользователя

    if (!userId) {
      console.error('Не удалось получить userId')
      return
    }

    const user = await checkUser(userId)
    if (!user || !user.exists) {
      // В случае ошибки отправляем сообщение напрямую пользователю
      await ctx.telegram.sendMessage(userId, ruLang.userNotFound)
      return
    }

    const today = new Date()
    const day = today.getDate()
    let dateForRequest =
      day >= 10
        ? today.toISOString().slice(0, 10)
        : new Date(today.getFullYear(), today.getMonth(), 1) // 1 последний день 0 предпоследний
            .toISOString()
            .slice(0, 10) // Получаем последний день предыдущего месяца

    const paymentData = await getLastPaymentForUser(userId, dateForRequest)

    if (!paymentData) {
      await ctx.telegram.sendMessage(
        userId,
        'Информация о зарплате недоступна.'
      )
      return
    }

    let message = paymentData.operator_type
      ? ruLang.paymentsOperator(paymentData)
      : ruLang.payments(paymentData)

    // Отправляем сообщение напрямую пользователю
    await ctx.telegram.sendMessage(userId, message, { parse_mode: 'HTML' })
  } catch (error) {
    const logMessageToSend = {
      user_id: ctx.message.from.id.toString(),
      text: JSON.stringify(error),
      error: 1,
      ok: 0,
      test: process.env.NODE_ENV === 'build' ? 0 : 1
    }
    await sendLogData(logMessageToSend)
    await ctx.telegram.sendMessage(
      ctx.message.from.id,
      `Произошла ошибка в команде /pay: ${error}`
    )
    console.error(`Внутренняя ошибка сервера: ${error}`)
  }
}

module.exports = { payments }
