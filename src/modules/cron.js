// cronJobs.js
const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/notify')  // Уведомления пользователя
const { oplataNotification } = require('#src/modules/oplata') // Добавлени

function initCronJobs() {
    // Уведомлять о сообщениях каждые 60 мин
    cron.schedule('0 7-20 * * *', async (ctx) => {
        console.log('Оповещение. Running a task every hour from 7 to 20')
        await notifyAllUsers(ctx)
    })

    // !!! Уведомлять об ОПЛАТЕ каждые 6 мин
    cron.schedule('*/6 * * * *', async () => {
        // console.log('Оплата. Running a task every 6 minutes');
        await oplataNotification()
    })
}

module.exports = { initCronJobs }


