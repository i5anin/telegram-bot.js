// cronJobs.js
const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/notify')  // Уведомления пользователя
const { oplataNotification } = require('#src/modules/oplata') // Добавлени

function initCronJobs() {
    // Уведомлять о сообщениях каждые 5 мин
    cron.schedule('*/5 * * * *', async () => {
        console.log('Running a task every 5 minutes')
        await notifyAllUsers()
    })

    // Уведомлять об оплате каждые 15 мин
    cron.schedule('*/6 * * * *', async () => {
        console.log('Running a task every 6 minutes');
        await oplataNotification()
    })
}

module.exports = { initCronJobs }


