// cronJobs.js
const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/notify')  // Уведомления пользователя
const { morningNotification } = require('#src/modules/oplata') // Добавлени

function initCronJobs() {
    // Уведомлять каждые 5 минуты
    cron.schedule('*/5 * * * *', async () => {
        console.log('Running a task every 5 minutes')
        await notifyAllUsers()
    })

    // Уведомлять каждые 15 мин
    cron.schedule('*/6 * * * *', async () => {
        console.log('Running a task every 6 minutes');
        await morningNotification()
    })
}




module.exports = { initCronJobs }


