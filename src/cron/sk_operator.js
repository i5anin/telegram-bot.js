// sk_operator.js
const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/sk_operator/notify')

// Уведомлять о сообщениях каждые 17 мин
async function cronSkComment() {
    cron.schedule('*/17 8-23 * * *', async () => {
        console.log('notifyAllUsers Running a task every 15 minutes')
        await notifyAllUsers()
    })
}
module.exports = {cronSkComment} // Пустой экспорт, чтобы не было ошибок