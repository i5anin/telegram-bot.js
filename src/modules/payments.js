const axios = require('axios')
const { format, endOfDay, subDays } = require('date-fns')
const { pathOr } = require('ramda')
const ruLang = require('#src/utils/ru_lang') // Локализация сообщений
const { checkUser } = require('#src/api/index')
const api = require('#src/api/api')

async function getLastPaymentForUser(userId, date) {
  // В предположении, что api.getPaymentForUser возвращает необработанный список платежей, такой же, как и data.payments
  const payments = await api.getPaymentForUser(userId, date)
  return payments.pop() || null
}

async function payments(ctx) {
  try {
    const userId = pathOr(null, ['from', 'id'], ctx)

    if (!userId) {
      console.log('Не удалось получить userId')
      return
    }

    const user = await checkUser(userId)
    if (!user || !user.exists) {
      await ctx.reply(ruLang.userNotFound)
      return
    }

    const today = new Date()
    const day = today.getDate()
    let dateForRequest = format(today, 'yyyy-MM-dd')

    if (day < 10) {
      const lastDayOfPreviousMonth = endOfDay(
        subDays(new Date(today.getFullYear(), today.getMonth(), 1), 1)
      )
      dateForRequest = format(lastDayOfPreviousMonth, 'yyyy-MM-dd')
    }

    const paymentData = await getLastPaymentForUser(userId, dateForRequest)

    if (!paymentData) {
      await ctx.reply('Информация о зарплате недоступна.')
      return
    }

    const messageKey = paymentData.operator_type
      ? 'paymentsOperator'
      : 'payments'
    const message = ruLang[messageKey](paymentData)

    await ctx.reply(message, { parse_mode: 'HTML' })
  } catch (error) {
    console.error(`Произошла ошибка в команде /pay: ${error}`)
    await ctx.reply(`Произошла ошибка в команде /pay: ${error}`)
  }
}

module.exports = { payments }
