// Функция для выполнения GET-запросов
const axios = require('axios')
const ruLang = require('#src/utils/ru_lang')


// Функция для сброса флагов сессии
function resetFlags(ctx) {
    ctx.session.isAwaitFio = false
    ctx.session.isAwaitComment = false
    ctx.session.isUserInitiated = false
}

function formatPaymentDate(payment) {
    const [year, month, day] = payment.date.split('-')
    const formattedDate = `${day}.${month}.${year}`

    return { formattedDate }
}

module.exports = { resetFlags, formatPaymentDate }
