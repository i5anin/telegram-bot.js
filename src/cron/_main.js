// src/bot.js (главный файл)
const { cronSkComment } = require('#src/cron/sk_operator')
const { cronOplata } = require('#src/cron/oplata')
const { cronMaster } = require('#src/cron/master')
const { cronNach } = require('#src/cron/nachalnik')
const { cronMetricsSchedules } = require('#src/cron/dir')
const { cronBot } = require('#src/cron/cron_bot')

async function initCronJobs(currentDateTime, instanceNumber) {
    // Запускаем cron-задачи в порядке приоритета (по вашему усмотрению)
    await cronNach()
    await cronSkComment()
    await cronOplata()
    await cronMaster()
    await cronMetricsSchedules()
    await cronBot(currentDateTime, instanceNumber) //  Проверку экземпляра лучше запускать последней
}

module.exports = { initCronJobs }