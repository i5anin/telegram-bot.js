// cron_oplata.js
const cron = require('node-cron')
const { oplataNotification } = require('#src/modules/oplata/oplata')

function initOplataCron() {
    // Уведомлять об ОПЛАТЕ каждые 8 мин
    cron.schedule('*/15 * * * *', async () => {
        await oplataNotification()
        console.log('Running oplataNotification()')
    })
}

module.exports = { initOplataCron }