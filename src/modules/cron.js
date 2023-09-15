// cronJobs.js
const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/notify')  // Уведомления пользователя
const { morningNotification } = require('#src/modules/oplata') // Добавлени

function initCronJobs() {
    // Уведомлять каждые 2 минуты
    cron.schedule('*/5 * * * *', async () => {
        console.log('Running a task every 2 minutes')
        await notifyAllUsers()
    })

    // Уведомлять каждый день в 7:30
    cron.schedule('30 7 * * *', async () => {
        console.log('Running a task at 7:30 every day')
        await morningNotification()
    })
}




module.exports = { initCronJobs }


