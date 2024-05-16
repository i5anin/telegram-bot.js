// Подключаем необходимые модули и переменные
const axios = require('axios')
const ruLang = require('#src/utils/ru_lang')  // Локализация сообщений
const { sendToLog } = require('#src/utils/log') // Добавление лога
const { resetFlags } = require('#src/utils/helpers')
const { checkUser } = require('#src/api/index')

// Функция для отправки запроса в API и получения последних данных о платежах пользователя
async function getLastPaymentForUser(userId) {
    try {
        const response = await axios.get(`https://api.pf-forum.ru/api/payments/payments.php?user_id=${userId}`)
        const payments = response.data.payments
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
        const userId = ctx?.from?.id;
        // const userId = 6174005112

        if (!userId) {
            console.log('Не удалось получить userId')
            return
        }

        // Пример использования функции проверки зарегистрированного пользователя, если понадобится в будущем
        const user = await checkUser(userId);
        if (!user || !user.exists) {
            await ctx.reply(ruLang.userNotFound);
            return;
        }

        const paymentData = await getLastPaymentForUser(userId)
        console.log('paymentData=', paymentData)
        if (!paymentData) {
            await ctx.reply(ruLang.paymentDataNotAvailable || 'Информация о платежах недоступна.')
            return
        }

        const message = ruLang.payments(paymentData)

        await ctx.reply(message, { parse_mode: 'HTML' })

    } catch (error) {
        console.error(`Ошибка в команде /pay: ${error}`)
        await ctx.reply(`Произошла ошибка: ${error}`)
    }
}

module.exports = { payments }