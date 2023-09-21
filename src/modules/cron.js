// cronJobs.js
const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/notify')  // Уведомления пользователя
const { oplataNotification } = require('#src/modules/oplata') // Добавлени

function initCronJobs() {
    // Уведомлять о сообщениях каждые 15 мин
    cron.schedule('*/15 * * * *', async (ctx) => {
        console.log('notifyAllUsers Running a task every 15 minutes');
        await notifyAllUsers(ctx)
    })

    // !!! Уведомлять об ОПЛАТЕ каждые 6 мин
    cron.schedule('*/6 * * * *', async () => {
        // console.log('Оплата. oplataNotification Running a task every 6 minutes');
        await oplataNotification()
    })
}

module.exports = { initCronJobs }


