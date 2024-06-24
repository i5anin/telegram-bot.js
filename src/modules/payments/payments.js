const axios = require('axios')
const ruLang = require('./payments_ru_lang') // Локализация сообщений
const { checkUser, sendLogData } = require('#src/api/api')

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

function getDateForRequest() {
  const today = new Date()
  const day = today.getDate()
  let dateForRequest =
    day >= 10
      ? today.toISOString().slice(0, 10)
      : new Date(today.getFullYear(), today.getMonth(), 1) // 1 последний день 0 предпоследний
          .toISOString()
          .slice(0, 10) // Получаем последний день предыдущего месяца
  return dateForRequest
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

    const paymentData = await getLastPaymentForUser(userId, getDateForRequest())

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

    // Добавляем кнопку "Показать формулу"
    const keyboard = [
      [
        {
          text: 'Показать формулу',
          callback_data: 'show_formula'
        }
      ]
    ]
    // Отправляем сообщение напрямую пользователю
    await ctx.telegram.sendMessage(userId, message, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard }
    })
    await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, {
      parse_mode: 'HTML'
    })
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

// Обработчик нажатия на кнопку "Показать формулу"
async function handleFormulaButton(ctx) {
  try {
    const userId = ctx.update.callback_query.from.id // Получаем userId вызвавшего пользователя
    const paymentData = await getLastPaymentForUser(userId, getDateForRequest()) // Получаем данные о последнем платеже

    if (paymentData) {
      // Выводим формулу с paymentData в скобках
      await ctx.telegram.sendMessage(userId, ruLang.formula(paymentData), {
        parse_mode: 'HTML'
      })
      console.log(LOG_CHANNEL_ID)
      // Отправляем формулу в лог-канал
      await ctx.telegram.sendMessage(
        LOG_CHANNEL_ID,
        ruLang.formula(paymentData),
        { parse_mode: 'HTML' }
      )
    } else {
      await ctx.telegram.sendMessage(
        userId,
        'Информация о зарплате недоступна.'
      )
    }
  } catch (error) {
    const logMessageToSend = {
      user_id: ctx.update.callback_query.from.id.toString(),
      text: JSON.stringify(error),
      error: 1,
      ok: 0,
      test: process.env.NODE_ENV === 'build' ? 0 : 1
    }
    await sendLogData(logMessageToSend)
    await ctx.telegram.sendMessage(
      ctx.update.callback_query.from.id,
      `Произошла ошибка при отображении формулы: ${error}`
    )
    console.error(`Внутренняя ошибка сервера: ${error}`)
  }
}

module.exports = { payments, handleFormulaButton }
