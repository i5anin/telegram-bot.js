const axios = require('axios')
const ruLang = require('#src/utils/ru_lang') // Локализация сообщений
const { checkUser } = require('#src/api/index')
const { sendLogData } = require('#src/api')

async function getLastPaymentForUser(userId, date) {
  try {
    const response = await axios.get(
      `${WEB_API}/payments/payments.php?user_id=${userId}&date=${date}`
    )
    const { payments } = response.data
    return payments[payments.length - 1] || null
  } catch (error) {
    const logMessageToSend = {
      user_id: '',
      text: error,
      error: 1,
      ok: 0,
      test: process.env.NODE_ENV === 'build' ? 0 : 1
    }
    await sendLogData(logMessageToSend)
    console.log(`Ошибка при запросе к API: ${error}`)
    return null
  }
}

async function payments(ctx) {
  try {
    const userId = ctx?.from?.id //ctx?.from?.id //487054792 //5173203456

    if (!userId) return console.log('Не удалось получить userId')

    const user = await checkUser(userId)
    if (!user || !user.exists) {
      await ctx.reply(ruLang.userNotFound)
      return
    }

    // Задаем демонстрационную дату
    // const todayStr = new Date().toISOString().slice(0, 10) // Устанавливает сегодняшнюю дату
    // console.log(todayStr)

    const today = new Date() //new Date('2024-05-01')
    const day = today.getDate()
    let dateForRequest // Убрано значение по умолчанию ''

    if (day >= 10) {
      dateForRequest = today.toISOString().slice(0, 10) // Используем текущую дату, так как число больше или равно 10
    } else {
      // Если текущий день меньше 10, используем последний день предыдущего месяца
      const lastDayOfPreviousMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
      dateForRequest = lastDayOfPreviousMonth.toISOString().slice(0, 10)
    }

    const paymentData = await getLastPaymentForUser(userId, dateForRequest)
    // console.log('paymentData=', paymentData)

    if (!paymentData)
      return await ctx.reply('Информация о зарплате недоступна.')

    let message
    if (!paymentData.operator_type) {
      message = ruLang.payments(paymentData)
    } else {
      message = ruLang.paymentsOperator(paymentData)
    }

    // Составляем сообщение для ответа

    await ctx.reply(message, { parse_mode: 'HTML' })
  } catch (error) {
    const logMessageToSend = {
      user_id: '',
      text: error,
      error: 1,
      ok: 0,
      test: process.env.NODE_ENV === 'build' ? 0 : 1
    }
    await sendLogData(logMessageToSend)
    await ctx.reply(`Произошла ошибка в команде /pay: ${error}`)
  }
}

module.exports = { payments }
