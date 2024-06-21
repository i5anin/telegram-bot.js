// cron_sk.js
const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/sk_operator/notify')

function initSkCommentsCron() {
    // Уведомлять о сообщениях каждые 15 мин
    cron.schedule('*/17 8-23 * * *', async () => {
        console.log('notifyAllUsers Running a task every 15 minutes')
        await notifyAllUsers()
    })
}

module.exports = { initSkCommentsCron }