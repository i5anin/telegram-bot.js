// nachalnik.js
const cron = require('node-cron')
const { sendMetricsMessagesNach } = require('#src/modules/metrics/hachalnik/metrics')

async function cronNach() {
// Отправлять отчет начальнику в 10:00 часов
    cron.schedule('0 10 * * *', async () => {
        await sendMetricsMessagesNach()
        console.log('Running sendMetricsMessagesNach() at 10:00 AM every day')
    })
}

module.exports = { cronNach } // Пустой экспорт, чтобы не было ошибок