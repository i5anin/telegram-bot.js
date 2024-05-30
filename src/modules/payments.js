// Подключаем необходимые модули и переменные
const axios = require('axios')
const ruLang = require('#src/utils/ru_lang') // Локализация сообщений
const { checkUser } = require('#src/api/index')

// Функция для отправки запроса в API и получения последних данных о платежах пользователя
async function getLastPaymentForUser(userId) {
  try {
    const response = await axios.get(
      `${WEB_API}/payments/payments.php?user_id=${userId}`
    )
    const { payments } = response.data
    return payments[payments.length - 1] || null
  } catch (error) {
    console.log(`Ошибка при запросе к API: ${error}`) // Изменено на console.log для избежания асинхронности в блоке catch
    return null
  }
}

// Функция обработчика команды `/pay`
async function payments(ctx) {
  try {
    // Безопасное извлечение userId из ctx
    const userId = ctx?.from?.id

    // const userId = 5173203456 // no op
    // const userId = 487054792 // op

    if (!userId) {
      console.log('Не удалось получить userId')
      return
    }

    // Пример использования функции проверки зарегистрированного пользователя, если понадобится в будущем
    const user = await checkUser(userId)
    if (!user || !user.exists) {
      await ctx.reply(ruLang.userNotFound)
      return
    }

    const paymentData = await getLastPaymentForUser(userId)
    console.log('paymentData=', paymentData)
    if (!paymentData) {
      await ctx.reply(
        ruLang.paymentDataNotAvailable || 'Информация о зарплате недоступна.'
      )
      return
    }

    let message = ''
    console.log(paymentData.operator_type)
    if (paymentData.operator_type === null) {
      message = ruLang.payments(paymentData) //if true
    } else {
      message = ruLang.paymentsOperator(paymentData) //if null false
    }

    await ctx.reply(message, { parse_mode: 'HTML' })
  } catch (error) {
    console.error(`Ошибка в команде /pay: ${error}`)
    await ctx.reply(`Произошла ошибка: ${error}`)
  }
}

module.exports = { payments }
