// master

const cron = require('node-cron')
const { formatMetricsMessageMaster } = require('#src/modules/metrics/master/metrics')

// Отправлять отчет мастеру каждые 10 часов
async function cronMaster() {
    cron.schedule('0 10 * * *', async () => {
        await formatMetricsMessageMaster()
        console.log('Running formatMetricsMessageMaster() at 10:00 AM every day')
    })
}

module.exports = { cronMaster }