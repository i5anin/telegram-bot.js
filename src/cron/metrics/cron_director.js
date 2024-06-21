// director_cron.js
const cron = require('node-cron')
const { metricsNotificationDirector } = require('#src/modules/metrics/director/metrics')

function initDirectorCron() {

    // Schedule for GRAND_ADMIN at 7:30 AM every day
    cron.schedule('10 8 * * *', async () => {
        await metricsNotificationDirector(null, 0, GRAND_ADMIN)
        console.log('Running GRAND_ADMIN at 8:10 AM every day')
    })

    // Schedule for DIR_J at 7:00 AM every day
    cron.schedule('0 7 * * *', async () => {
        await metricsNotificationDirector(null, 0, DIR_J)
        console.log('Running metricsNotificationDirector() for DIR_J at 7:00 AM every day')
    })

    // Schedule for DIR_F at 7:30 AM every day
    cron.schedule('30 7 * * *', async () => {
        await metricsNotificationDirector(null, 0, DIR_F)
        console.log('Running metricsNotificationDirector() for DIR_F at 7:30 AM every day')
    })

    // Schedule for DIR_K at 7:30 AM every day
    cron.schedule('30 7 * * *', async () => {
        await metricsNotificationDirector(null, 0, DIR_K)
        console.log('Running metricsNotificationDirector() for DIR_K at 7:30 AM every day')
    })
}

module.exports = { initDirectorCron }