// cron_master.js
const cron = require('node-cron')
const { formatMetricsMessageMaster } = require('#src/modules/metrics/master/metrics')

function initMasterCron() {
    // Schedule for formatMetricsMessageMaster at 10:00 AM every day
    cron.schedule('0 10 * * *', async () => {
        await formatMetricsMessageMaster()
        console.log('Running formatMetricsMessageMaster() at 10:00 AM every day')
    })
}

module.exports = { initMasterCron }