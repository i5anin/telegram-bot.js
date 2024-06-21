// cron_master.js
const cron = require('node-cron')
const { formatMetricsMessageMaster } = require('#src/modules/metrics/master/metrics')
const { sendMetricsMessagesNach } = require('#src/modules/metrics/hachalnik/metrics')

function initNachCron() {
    // Schedule for formatMetricsMessageMaster at 10:00 AM every day
    cron.schedule('0 10 * * *', async () => {
        await sendMetricsMessagesNach()
        console.log('Running sendMetricsMessagesNach() at 10:00 AM every day')
    })
}

module.exports = { initNachCron }